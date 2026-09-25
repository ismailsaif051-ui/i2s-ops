import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { CheckDecision, DistributionChannel } from '@i2s/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ScopeService } from '../rbac/scope.service';
import { DocumentsService } from '../documents/documents.service';
import { renderReportPdf } from './report-pdf';
import { AssetsService } from '../assets/assets.service';
import type { RequestUser, ScopeDescriptor } from '../common/types';

/**
 * Colonnes qui portent le périmètre d'un rapport. Le département vient de la
 * mission : c'est lui qui décide qui a le droit de vérifier.
 */
export const REPORT_SCOPE: ScopeDescriptor = {
  companyPath: 'affair.companyId',
  departmentPath: 'mission.departmentId',
  ownerPath: 'authorId',
  teamPath: 'authorId',
};

export interface CheckLine {
  criterion: string;
  applicable: boolean;
  conform: boolean | null;
  comment?: string | null;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly scope: ScopeService,
    private readonly documents: DocumentsService,
    private readonly assets: AssetsService,
  ) {}

  /* ── Lecture ──────────────────────────────────────────────────── */

  async get(user: RequestUser, id: string) {
    // Le périmètre est appliqué dans la requête : un identifiant deviné ne
    // donne rien de plus qu'un identifiant légitime hors périmètre.
    const report = await this.prisma.report.findFirst({
      where: { id, ...this.scope.buildWhere(user, 'report', 'VIEW', REPORT_SCOPE) },
      include: {
        author: { select: { id: true, matricule: true, firstName: true, lastName: true } },
        checker: { select: { id: true, matricule: true, firstName: true, lastName: true } },
        template: true,
        checks: { orderBy: { checkedAt: 'asc' } },
        distributions: { orderBy: { sentAt: 'desc' } },
        inspection: {
          include: {
            template: true,
            devices: { include: { measuringDevice: true } },
            inspector: { select: { firstName: true, lastName: true } },
          },
        },
        mission: {
          select: {
            id: true,
            number: true,
            objective: true,
            reportDueDate: true,
            actualEndDate: true,
            site: { select: { name: true } },
            department: { select: { code: true } },
          },
        },
        affair: {
          select: {
            id: true,
            number: true,
            title: true,
            companyId: true,
            client: { select: { name: true } },
          },
        },
      },
    });

    if (!report) throw new NotFoundException('Rapport introuvable.');

    return report;
  }

  /* ── Prise en charge de la vérification ───────────────────────── */

  /**
   * Le vérificateur se déclare. La règle qui compte est ici : personne ne
   * vérifie son propre rapport — c'est l'indépendance du contrôle, pas une
   * question d'ergonomie.
   */
  async take(user: RequestUser, id: string, ctx: { ip?: string | null; userAgent?: string | null }) {
    const report = await this.get(user, id);

    if (!user.employeeId) {
      throw new ForbiddenException(
        'Votre compte n’est rattaché à aucun employé : impossible de viser un rapport.',
      );
    }
    if (report.authorId === user.employeeId) {
      throw new BadRequestException(
        'Un rapport ne peut pas être vérifié par son rédacteur. Confiez-le à une autre personne.',
      );
    }
    if (!['SUBMITTED', 'UNDER_CHECK'].includes(report.status)) {
      throw new BadRequestException(
        `Un rapport « ${report.status} » n’est pas en attente de vérification.`,
      );
    }
    if (report.checkerId && report.checkerId !== user.employeeId) {
      throw new BadRequestException('Ce rapport est déjà pris en charge par une autre personne.');
    }

    const updated = await this.prisma.report.update({
      where: { id },
      data: { checkerId: user.employeeId, status: 'UNDER_CHECK' },
    });

    await this.audit.record(
      {
        entity: 'report',
        entityId: id,
        action: 'TAKE_CHECK',
        before: { status: report.status, checkerId: report.checkerId },
        after: { status: updated.status, checkerId: updated.checkerId },
        companyId: report.affair.companyId,
      },
      { user, ...ctx },
    );

    return updated;
  }

  /* ── Vérification ─────────────────────────────────────────────── */

  /**
   * Enregistre la grille visée puis tranche.
   *
   * Deux refus viennent du métier :
   *   — un critère applicable sans verdict laisse le contrôle inachevé ;
   *   — un critère non conforme interdit la validation, quoi qu'en dise le
   *     vérificateur : le rapport repart en correction.
   */
  async check(
    user: RequestUser,
    id: string,
    input: { checks: CheckLine[]; decision: CheckDecision; reason?: string | null },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const report = await this.get(user, id);

    if (report.status !== 'UNDER_CHECK') {
      throw new BadRequestException(
        'Prenez d’abord le rapport en charge : la vérification s’enregistre au nom d’une personne.',
      );
    }
    if (report.checkerId !== user.employeeId) {
      throw new ForbiddenException('Seul le vérificateur en charge peut viser ce rapport.');
    }
    if (report.authorId === user.employeeId) {
      throw new BadRequestException('Un rapport ne peut pas être vérifié par son rédacteur.');
    }

    const incomplete = input.checks.filter((c) => c.applicable && c.conform === null);
    if (incomplete.length > 0) {
      throw new BadRequestException({
        message: 'La grille de vérification est incomplète.',
        errors: incomplete.map((c) => ({
          field: c.criterion,
          message: 'Critère applicable sans verdict.',
        })),
      });
    }

    const nonConform = input.checks.filter((c) => c.applicable && c.conform === false);

    if (input.decision === 'VALIDATE' && nonConform.length > 0) {
      throw new BadRequestException({
        message:
          'Un critère non conforme interdit la validation : le rapport doit repartir en correction.',
        errors: nonConform.map((c) => ({ field: c.criterion, message: 'Critère non conforme.' })),
      });
    }

    const withoutComment = nonConform.filter((c) => !c.comment?.trim());
    if (withoutComment.length > 0) {
      throw new BadRequestException({
        message:
          'Un critère non conforme doit être motivé : le rédacteur doit savoir quoi reprendre.',
        errors: withoutComment.map((c) => ({
          field: c.criterion,
          message: 'Commentaire obligatoire.',
        })),
      });
    }

    if (input.decision === 'CORRECTION' && !input.reason?.trim()) {
      throw new BadRequestException({
        message: 'Un renvoi en correction doit être motivé.',
        errors: [{ field: 'reason', message: 'Motif obligatoire.' }],
      });
    }

    const now = new Date();
    const status = input.decision === 'VALIDATE' ? 'VALIDATED' : 'CORRECTION';

    const updated = await this.prisma.$transaction(async (tx) => {
      // La grille est réécrite en entier : elle vaut pour ce passage de
      // vérification, et l'historique des passages vit dans le journal d'audit.
      await tx.reportCheck.deleteMany({ where: { reportId: id } });
      await tx.reportCheck.createMany({
        data: input.checks.map((c) => ({
          reportId: id,
          criterion: c.criterion,
          applicable: c.applicable,
          conform: c.applicable ? c.conform : null,
          comment: c.comment?.trim() || null,
          checkerId: user.employeeId,
          checkedAt: now,
        })),
      });

      const row = await tx.report.update({
        where: { id },
        data: {
          status,
          checkedAt: now,
          revisionReason: input.decision === 'CORRECTION' ? (input.reason ?? null) : null,
        },
      });

      // Renvoi en correction : la saisie doit redevenir modifiable, sinon le
      // rédacteur n'a aucun moyen de reprendre ce qu'on lui reproche.
      if (report.inspectionId) {
        await tx.inspection.update({
          where: { id: report.inspectionId },
          data: { status: input.decision === 'CORRECTION' ? 'DRAFT' : 'ACCEPTED' },
        });
      }

      return row;
    });

    await this.audit.record(
      {
        entity: 'report',
        entityId: id,
        action: input.decision === 'VALIDATE' ? 'VALIDATE' : 'RETURN_FOR_CORRECTION',
        before: { status: report.status },
        after: {
          status: updated.status,
          nonConform: nonConform.map((c) => c.criterion),
        },
        reason: input.reason ?? null,
        companyId: report.affair.companyId,
      },
      { user, ...ctx },
    );

    return updated;
  }

  /* ── Émission ─────────────────────────────────────────────────── */

  /**
   * Un rapport émis est figé : c'est la pièce qui engage I2S vis-à-vis du
   * client. Toute reprise passe par une révision, jamais par une correction
   * silencieuse.
   */
  async issue(
    user: RequestUser,
    id: string,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const report = await this.get(user, id);

    if (report.status !== 'VALIDATED') {
      throw new BadRequestException(
        'Seul un rapport validé peut être émis. Faites-le vérifier au préalable.',
      );
    }

    const issuedAt = new Date();
    const pdf = await this.buildPdf(id, issuedAt);

    const updated = await this.prisma.report.update({
      where: { id },
      data: {
        status: 'ISSUED',
        // La date d'émission est celle du premier envoi : une révision ne la
        // repousse pas, sinon le délai de remise s'effacerait à chaque reprise.
        issuedAt: report.issuedAt ?? issuedAt,
        pdfDocumentId: pdf.id,
      },
    });

    // Le contrôle est attesté : l'échéance réglementaire de l'équipement se
    // reporte d'elle-même. C'est cette échéance qui ramènera l'inspection
    // l'année prochaine.
    let nextInspectionDue: Date | null = null;
    if (report.inspection?.assetId) {
      nextInspectionDue = await this.assets.recordInspection(
        report.inspection.assetId,
        report.inspection.date,
      );
    }

    await this.audit.record(
      {
        entity: 'report',
        entityId: id,
        action: 'ISSUE',
        before: { status: report.status },
        after: {
          status: updated.status,
          issuedAt: updated.issuedAt,
          document: pdf.fileName,
          nextInspectionDue,
        },
        companyId: report.affair.companyId,
      },
      { user, ...ctx },
    );

    return updated;
  }

  /* ── Révision ─────────────────────────────────────────────────── */

  /**
   * Rouvre un rapport déjà émis.
   *
   * Un rapport émis ne se corrige pas en place : la pièce est partie chez le
   * client. On ouvre une révision — le numéro reste, l'indice avance, la
   * saisie redevient modifiable — et la version précédente reste consultable
   * à la GED. C'est ce que le système qualité appelle une maîtrise des
   * modifications.
   */
  async revise(
    user: RequestUser,
    id: string,
    input: { reason: string },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const report = await this.get(user, id);

    if (!['ISSUED', 'ARCHIVED'].includes(report.status)) {
      throw new BadRequestException(
        'Seul un rapport émis se révise. Un rapport encore dans le circuit se corrige.',
      );
    }
    if (!input.reason.trim()) {
      throw new BadRequestException({
        message: 'Une révision doit être motivée.',
        errors: [{ field: 'reason', message: 'Motif obligatoire.' }],
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // La grille du passage précédent portait sur la version remise : elle ne
      // vaut plus pour celle qu'on s'apprête à reprendre.
      await tx.reportCheck.deleteMany({ where: { reportId: id } });

      const row = await tx.report.update({
        where: { id },
        data: {
          status: 'CORRECTION',
          revision: report.revision + 1,
          revisionReason: input.reason.trim(),
          checkedAt: null,
          checkerId: null,
        },
      });

      if (report.inspectionId) {
        await tx.inspection.update({ where: { id: report.inspectionId }, data: { status: 'DRAFT' } });
      }

      return row;
    });

    await this.audit.record(
      {
        entity: 'report',
        entityId: id,
        action: 'REVISE',
        before: { status: report.status, revision: report.revision },
        after: { status: updated.status, revision: updated.revision },
        reason: input.reason,
        companyId: report.affair.companyId,
      },
      { user, ...ctx },
    );

    return updated;
  }

  /* ── Pièce remise ─────────────────────────────────────────────── */

  /**
   * Fabrique le PDF du rapport et le dépose à la GED.
   *
   * Le document est produit au moment de l'émission, pas à la demande : c'est
   * l'état du rapport à cet instant qui engage I2S. Une révision ultérieure
   * ajoutera une version, sans effacer celle qui a été remise.
   */
  private async buildPdf(id: string, issuedAt: Date) {
    const report = await this.prisma.report.findUniqueOrThrow({
      where: { id },
      include: {
        author: { select: { firstName: true, lastName: true } },
        checker: { select: { firstName: true, lastName: true } },
        template: true,
        checks: { orderBy: { checkedAt: 'asc' } },
        inspection: {
          include: { template: true, devices: { include: { measuringDevice: true } } },
        },
        mission: { select: { number: true, site: { select: { name: true } } } },
        affair: {
          select: {
            id: true,
            number: true,
            title: true,
            companyId: true,
            client: { select: { name: true } },
            company: { select: { name: true, address: true, phone: true, email: true } },
          },
        },
      },
    });

    // Les photos sont relues à la GED, pas stockées dans la saisie : c'est
    // l'émission qui fige le rapport, photos comprises.
    const photos = report.inspection
      ? await this.inspectionPhotos(report.inspection.id)
      : [];

    const content = await renderReportPdf({
      number: report.number,
      revision: report.revision,
      status: 'ISSUED',
      company: {
        name: report.affair.company.name,
        address: report.affair.company.address,
        phone: report.affair.company.phone,
        email: report.affair.company.email,
      },
      client: report.affair.client.name,
      affair: { number: report.affair.number, title: report.affair.title },
      mission: { number: report.mission.number, site: report.mission.site?.name ?? null },
      template: {
        formCode: report.template?.formCode ?? report.number.split('-').slice(0, 2).join('-'),
        version: report.inspection?.templateVersion ?? report.template?.version ?? '00',
        title: report.template?.title ?? 'Rapport d’inspection',
        titleEn: report.template?.titleEn ?? null,
      },
      inspection: report.inspection
        ? {
            date: report.inspection.date,
            data: (report.inspection.data ?? {}) as Record<string, unknown>,
            schema: report.inspection.template.schema as never,
          }
        : null,
      devices: (report.inspection?.devices ?? []).map((d) => ({
        code: d.measuringDevice.code,
        designation: [d.measuringDevice.brand, d.measuringDevice.model]
          .filter(Boolean)
          .join(' ') || d.measuringDevice.type,
        validUntil: d.calibrationValidAt,
      })),
      author: `${report.author.lastName.toUpperCase()} ${report.author.firstName}`,
      checker: report.checker
        ? `${report.checker.lastName.toUpperCase()} ${report.checker.firstName}`
        : null,
      submittedAt: report.submittedAt,
      checkedAt: report.checkedAt,
      issuedAt,
      checks: report.checks.map((c) => ({
        criterion: c.criterion,
        applicable: c.applicable,
        conform: c.conform,
        comment: c.comment,
      })),
      photos,
    });

    return this.documents.store(null, {
      companyId: report.affair.companyId,
      type: 'REPORT',
      fileName: `${report.number}.pdf`,
      mimeType: 'application/pdf',
      content,
      extension: '.pdf',
      entityType: 'report',
      entityId: report.id,
      affairId: report.affair.id,
      tags: ['rapport', report.template?.formCode ?? ''].filter(Boolean),
      comment:
        report.revision > 0 ? `Révision ${report.revision}` : 'Première émission',
    });
  }

  /**
   * Photos d'une inspection, prêtes à être imprimées. Une photo illisible
   * n'interrompt pas l'émission du rapport : elle est seulement absente, et
   * le défaut reste visible à la GED.
   */
  private async inspectionPhotos(inspectionId: string) {
    const documents = await this.prisma.document.findMany({
      where: {
        entityType: 'inspection',
        entityId: inspectionId,
        type: 'inspection_photo',
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    const photos = [];
    for (const document of documents) {
      try {
        photos.push({
          sectionKey: document.tags[0] ?? null,
          caption: document.fileName,
          mimeType: document.mimeType,
          content: await this.documents.content(document.id),
        });
      } catch (error) {
        this.logger.warn(
          `Photo ${document.id} illisible, rapport émis sans elle : ${(error as Error).message}`,
        );
      }
    }
    return photos;
  }

  /* ── Remise au client ─────────────────────────────────────────── */

  /**
   * La remise arrête le compteur du délai QMS. On enregistre le canal et la
   * date : c'est ce couple qui fera foi si le client conteste la date.
   */
  async deliver(
    user: RequestUser,
    id: string,
    input: { channel: DistributionChannel; sentAt?: Date | null },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const report = await this.get(user, id);

    if (!['ISSUED', 'ARCHIVED'].includes(report.status)) {
      throw new BadRequestException('Un rapport doit être émis avant d’être remis au client.');
    }

    const sentAt = input.sentAt ?? new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.reportDistribution.create({
        data: { reportId: id, channel: input.channel, sentAt },
      });

      // La première remise fait foi pour le délai ; une relance ne la déplace pas.
      return tx.report.update({
        where: { id },
        data: { deliveredAt: report.deliveredAt ?? sentAt },
      });
    });

    await this.audit.record(
      {
        entity: 'report',
        entityId: id,
        action: 'DELIVER',
        after: { channel: input.channel, sentAt, deliveredAt: updated.deliveredAt },
        companyId: report.affair.companyId,
      },
      { user, ...ctx },
    );

    return updated;
  }

  /* ── Délai de remise ──────────────────────────────────────────── */

  /**
   * Délai réel en jours ouvrés, du terrain à la remise. Le calendrier de la
   * société fait foi : week-ends et jours fériés marocains ne comptent pas.
   */
  async deliveryDelay(
    companyId: string,
    from: Date | null,
    to: Date | null,
  ): Promise<number | null> {
    if (!from || !to) return null;
    if (to < from) return 0;

    return this.prisma.workCalendarDay.count({
      where: {
        companyId,
        isWorkingDay: true,
        date: { gt: startOfDay(from), lte: startOfDay(to) },
      },
    });
  }
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Respect du délai QMS.
 *
 * L'échéance est une date (minuit) et la remise un instant : comparés tels
 * quels, tout rapport remis le jour de l'échéance serait déclaré en retard.
 * On compare donc des journées, pas des horodatages.
 */
export function isOnTime(deliveredAt: Date | null, dueDate: Date | null): boolean | null {
  if (!deliveredAt || !dueDate) return null;
  return startOfDay(deliveredAt) <= startOfDay(dueDate);
}
