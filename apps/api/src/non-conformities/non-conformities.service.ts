import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
import { DocumentsService } from '../documents/documents.service';
import type { RequestUser } from '../common/types';

export const SEVERITIES = ['CRITICAL', 'MAJOR', 'MINOR', 'OBSERVATION'] as const;
export type Severity = (typeof SEVERITIES)[number];

/**
 * Délai de traitement par gravité, en jours calendaires.
 *
 * Ce sont les valeurs par défaut : le paramétrage de la société les remplace
 * (`nonConformity.dueDaysCritical`, etc.). Un écart critique se traite dans la
 * semaine ; une simple observation peut attendre le trimestre.
 */
export const DEFAULT_DUE_DAYS: Record<Severity, number> = {
  CRITICAL: 7,
  MAJOR: 30,
  MINOR: 60,
  OBSERVATION: 90,
};

@Injectable()
export class NonConformitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly numbering: NumberingService,
    private readonly documents: DocumentsService,
  ) {}

  /* ── Lecture ──────────────────────────────────────────────────── */

  async get(user: RequestUser, id: string) {
    const nc = await this.prisma.nonConformity.findFirst({
      where: {
        id,
        OR: [
          { affair: { companyId: { in: user.companyIds } } },
          { affairId: null },
        ],
      },
      include: {
        affair: {
          select: {
            id: true,
            number: true,
            title: true,
            companyId: true,
            departmentId: true,
            client: { select: { name: true } },
          },
        },
        asset: { select: { id: true, tag: true, type: true, brand: true, model: true } },
        owner: { select: { id: true, matricule: true, firstName: true, lastName: true } },
        openedBy: { select: { matricule: true, firstName: true, lastName: true } },
        closedBy: { select: { matricule: true, firstName: true, lastName: true } },
        finding: {
          select: {
            reference: true,
            comment: true,
            inspection: {
              select: {
                id: true,
                date: true,
                mission: { select: { number: true } },
                report: { select: { number: true } },
              },
            },
          },
        },
      },
    });

    if (!nc) throw new NotFoundException('Non-conformité introuvable.');
    return nc;
  }

  /* ── Ouverture ────────────────────────────────────────────────── */

  /**
   * Ouvre un écart.
   *
   * L'échéance découle de la gravité : personne ne la choisit au cas par cas,
   * c'est ce qui rend le suivi comparable d'un écart à l'autre. Elle reste
   * modifiable à l'affectation, quand le responsable connaît la charge réelle.
   */
  async open(
    user: RequestUser,
    input: {
      description: string;
      severity: Severity;
      affairId?: string | null;
      assetId?: string | null;
      findingId?: string | null;
      ownerId?: string | null;
      dueDate?: Date | null;
    },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    if (!input.description.trim()) {
      throw new BadRequestException({
        message: 'Ouverture refusée.',
        errors: [{ field: 'description', message: 'La description de l’écart est obligatoire.' }],
      });
    }

    const companyId = user.companyIds[0];
    if (!companyId) throw new BadRequestException('Votre compte n’est rattaché à aucune société.');

    if (input.affairId) {
      const affair = await this.prisma.affair.findFirst({
        where: { id: input.affairId, deletedAt: null, companyId: { in: user.companyIds } },
        select: { id: true },
      });
      if (!affair) throw new BadRequestException('Affaire introuvable.');
    }

    // Une observation ne donne lieu qu'à un seul écart : la relation est unique
    // au modèle, autant le dire clairement plutôt que de heurter la contrainte.
    if (input.findingId) {
      const existing = await this.prisma.nonConformity.findUnique({
        where: { findingId: input.findingId },
        select: { number: true },
      });
      if (existing) {
        throw new BadRequestException(
          `Cette observation a déjà donné lieu à l’écart ${existing.number}.`,
        );
      }
    }

    const dueDate = input.dueDate ?? (await this.dueDateFor(companyId, input.severity));
    const number = await this.numbering.next(companyId, 'NON_CONFORMITY');

    const nc = await this.prisma.nonConformity.create({
      data: {
        number,
        description: input.description.trim(),
        severity: input.severity,
        affairId: input.affairId ?? null,
        assetId: input.assetId ?? null,
        findingId: input.findingId ?? null,
        ownerId: input.ownerId ?? null,
        openedById: user.employeeId,
        dueDate,
        status: input.ownerId ? 'ASSIGNED' : 'OPEN',
      },
    });

    await this.audit.record(
      {
        entity: 'non_conformity',
        entityId: nc.id,
        action: 'OPEN',
        after: { number: nc.number, severity: nc.severity, dueDate },
        companyId,
      },
      { user, ...ctx },
    );

    return nc;
  }

  /* ── Affectation ──────────────────────────────────────────────── */

  async assign(
    user: RequestUser,
    id: string,
    input: { ownerId: string; dueDate?: Date | null },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const nc = await this.get(user, id);

    if (['CLOSED'].includes(nc.status)) {
      throw new BadRequestException('Cet écart est clôturé : il ne se réaffecte plus.');
    }

    const owner = await this.prisma.employee.findFirst({
      where: { id: input.ownerId, deletedAt: null, companyId: { in: user.companyIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!owner) throw new BadRequestException('Responsable introuvable.');

    const updated = await this.prisma.nonConformity.update({
      where: { id },
      data: {
        ownerId: owner.id,
        dueDate: input.dueDate ?? nc.dueDate,
        status: nc.status === 'OPEN' ? 'ASSIGNED' : nc.status,
      },
    });

    await this.audit.record(
      {
        entity: 'non_conformity',
        entityId: id,
        action: 'ASSIGN',
        before: { ownerId: nc.ownerId, status: nc.status },
        after: { ownerId: owner.id, status: updated.status, dueDate: updated.dueDate },
        companyId: nc.affair?.companyId ?? null,
      },
      { user, ...ctx },
    );

    return updated;
  }

  /* ── Traitement ───────────────────────────────────────────────── */

  /** Le responsable prend l'écart en main. */
  async start(user: RequestUser, id: string, ctx: { ip?: string | null; userAgent?: string | null }) {
    const nc = await this.get(user, id);

    if (!['ASSIGNED', 'OPEN'].includes(nc.status)) {
      throw new BadRequestException(`Un écart « ${nc.status} » n’est pas à prendre en main.`);
    }
    if (!nc.ownerId) {
      throw new BadRequestException('Cet écart n’a pas de responsable : affectez-le d’abord.');
    }

    const updated = await this.prisma.nonConformity.update({
      where: { id },
      data: { status: 'IN_PROGRESS', ownerId: nc.ownerId },
    });

    await this.audit.record(
      {
        entity: 'non_conformity',
        entityId: id,
        action: 'START',
        before: { status: nc.status },
        after: { status: updated.status },
        companyId: nc.affair?.companyId ?? null,
      },
      { user, ...ctx },
    );

    return updated;
  }

  /**
   * Le responsable rend compte de l'action corrective.
   *
   * La preuve documentaire est exigée : c'est elle que le vérificateur examine,
   * et c'est elle qu'un auditeur demandera. Une action décrite sans preuve
   * n'établit rien.
   */
  async provideEvidence(
    user: RequestUser,
    id: string,
    input: {
      correctiveAction: string;
      evidence?: { fileName: string; contentBase64: string } | null;
    },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const nc = await this.get(user, id);

    if (!['ASSIGNED', 'IN_PROGRESS'].includes(nc.status)) {
      throw new BadRequestException(
        `Un écart « ${nc.status} » n’attend pas d’action corrective.`,
      );
    }
    if (nc.ownerId && nc.ownerId !== user.employeeId && !this.canApprove(user)) {
      throw new ForbiddenException('Seul le responsable de l’écart rend compte de son traitement.');
    }
    if (!input.correctiveAction.trim()) {
      throw new BadRequestException({
        message: 'Compte rendu refusé.',
        errors: [
          { field: 'correctiveAction', message: 'Décrivez l’action corrective menée.' },
        ],
      });
    }
    if (!input.evidence && !nc.evidenceDocumentId) {
      throw new BadRequestException({
        message: 'Compte rendu refusé.',
        errors: [
          {
            field: 'evidence',
            message:
              'Une preuve documentaire est obligatoire : photo, rapport de contre-visite ou attestation.',
          },
        ],
      });
    }

    let evidenceDocumentId = nc.evidenceDocumentId;
    if (input.evidence) {
      const content = Buffer.from(input.evidence.contentBase64, 'base64');
      if (content.byteLength === 0) {
        throw new BadRequestException('La preuve jointe est vide ou illisible.');
      }

      const stored = await this.documents.store(user, {
        companyId: nc.affair?.companyId ?? user.companyIds[0]!,
        type: 'NC_EVIDENCE',
        fileName: input.evidence.fileName,
        mimeType: guessMime(input.evidence.fileName),
        content,
        extension: extensionOf(input.evidence.fileName),
        entityType: 'non_conformity',
        entityId: nc.id,
        affairId: nc.affairId,
        departmentId: nc.affair?.departmentId ?? null,
        tags: ['non-conformité', nc.number],
        comment: `Preuve de levée — ${nc.number}`,
      });
      evidenceDocumentId = stored.id;
    }

    const updated = await this.prisma.nonConformity.update({
      where: { id },
      data: {
        correctiveAction: input.correctiveAction.trim(),
        evidenceDocumentId,
        status: 'EVIDENCE_PROVIDED',
        verificationComment: null,
      },
    });

    await this.audit.record(
      {
        entity: 'non_conformity',
        entityId: id,
        action: 'EVIDENCE',
        before: { status: nc.status },
        after: { status: updated.status, document: evidenceDocumentId },
        companyId: nc.affair?.companyId ?? null,
      },
      { user, ...ctx },
    );

    return updated;
  }

  /* ── Vérification ─────────────────────────────────────────────── */

  /**
   * Le vérificateur tranche.
   *
   * Il n'est jamais celui qui a traité l'écart : une levée que personne
   * d'autre n'a regardée ne vaut rien devant un auditeur.
   */
  async verify(
    user: RequestUser,
    id: string,
    input: { decision: 'CLOSE' | 'REJECT'; comment?: string | null },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const nc = await this.get(user, id);

    if (!this.canApprove(user)) {
      throw new ForbiddenException('Droit manquant : APPROVE sur non_conformity.');
    }
    if (nc.status !== 'EVIDENCE_PROVIDED') {
      throw new BadRequestException(
        'Seul un écart dont l’action corrective est justifiée se vérifie.',
      );
    }
    if (nc.ownerId && nc.ownerId === user.employeeId) {
      throw new BadRequestException(
        'Le responsable de l’écart ne vérifie pas sa propre levée. Faites-la vérifier par un tiers.',
      );
    }
    if (input.decision === 'REJECT' && !input.comment?.trim()) {
      throw new BadRequestException({
        message: 'Refus refusé.',
        errors: [
          { field: 'comment', message: 'Un refus doit dire ce qui manque à la levée.' },
        ],
      });
    }

    const closing = input.decision === 'CLOSE';

    const updated = await this.prisma.nonConformity.update({
      where: { id },
      data: {
        status: closing ? 'CLOSED' : 'IN_PROGRESS',
        verificationComment: input.comment?.trim() || null,
        closedAt: closing ? new Date() : null,
        closedById: closing ? user.employeeId : null,
      },
    });

    await this.audit.record(
      {
        entity: 'non_conformity',
        entityId: id,
        action: closing ? 'CLOSE' : 'REJECT_EVIDENCE',
        before: { status: nc.status },
        after: { status: updated.status },
        reason: input.comment ?? null,
        companyId: nc.affair?.companyId ?? null,
      },
      { user, ...ctx },
    );

    return updated;
  }

  /* ── Échéances ────────────────────────────────────────────────── */

  /** Échéance découlant de la gravité, selon le paramétrage de la société. */
  private async dueDateFor(companyId: string, severity: Severity): Promise<Date> {
    const key = `nonConformity.dueDays${severity.charAt(0)}${severity.slice(1).toLowerCase()}`;
    const setting = await this.prisma.setting.findFirst({
      where: { companyId, key },
      select: { value: true },
    });

    const days =
      typeof setting?.value === 'number' && setting.value > 0
        ? setting.value
        : DEFAULT_DUE_DAYS[severity];

    const today = new Date();
    return new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + days),
    );
  }

  private canApprove(user: RequestUser): boolean {
    return user.permissions.some(
      (p) => p.resource === 'non_conformity' && p.action === 'APPROVE',
    );
  }
}

function extensionOf(fileName: string): string {
  const match = /\.[a-z0-9]{1,5}$/i.exec(fileName);
  return match ? match[0].toLowerCase() : '.pdf';
}

function guessMime(fileName: string): string {
  const ext = extensionOf(fileName);
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'application/pdf';
}
