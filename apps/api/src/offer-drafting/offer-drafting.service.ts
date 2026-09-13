import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AiService } from '../ai/ai.service';
import {
  NATURE_LABELS,
  NATURE_SECTIONS,
  type OfferBrief,
  PROMPT_VERSION,
  SECTIONS,
  parseSections,
  systemPrompt,
  userPrompt,
} from './offer-drafting.prompt';
import { buildOfferPdf } from './offer-pdf';
import type { OfferDocumentNature } from './offer-drafting.types';
import type { RequestUser } from '../common/types';

interface Ctx {
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Rédaction assistée des offres.
 *
 * L'assistant écrit les mots, jamais les chiffres. Le tableau des prix est
 * rendu à partir des lignes de l'offre en base : un modèle qui inventerait un
 * montant sur un document client serait un risque, pas une commodité.
 *
 * Et rien ne part au client sans relecture. Le texte reste « à relire » tant
 * qu'une personne ne l'a pas assumé, et l'envoi de l'offre est refusé
 * jusque-là.
 */
@Injectable()
export class OfferDraftingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly ai: AiService,
  ) {}

  /* ── Lecture ──────────────────────────────────────────────────── */

  /** L'assistant est-il utilisable ? L'écran ne propose pas ce qui échouerait. */
  get available(): boolean {
    return this.ai.configured;
  }

  get natures() {
    return Object.entries(NATURE_LABELS).map(([value, label]) => ({ value, label }));
  }

  /**
   * Le texte d'une offre, mis en forme pour l'écran.
   *
   * Prend la ligne déjà chargée par un autre service, pour éviter une requête
   * par offre sur la fiche d'une consultation.
   */
  present(draft: {
    nature: string;
    status: string;
    sections: unknown;
    model: string;
    generatedAt: Date;
    reviewedAt: Date | null;
  }) {
    const nature = draft.nature as OfferDocumentNature;

    return {
      nature,
      natureLabel: NATURE_LABELS[nature],
      status: draft.status,
      sections: this.orderedSections(nature, (draft.sections ?? {}) as Record<string, string>),
      model: draft.model,
      generatedAt: draft.generatedAt,
      reviewedAt: draft.reviewedAt,
    };
  }

  async get(user: RequestUser, offerId: string) {
    const offer = await this.readableOffer(user, offerId);

    const draft = await this.prisma.offerDraft.findUnique({
      where: { offerId },
      include: {
        generatedBy: { select: { firstName: true, lastName: true } },
        reviewedBy: { select: { firstName: true, lastName: true } },
      },
    });

    return {
      offer: { id: offer.id, number: offer.number, version: offer.version, status: offer.status },
      available: this.ai.configured,
      natures: Object.entries(NATURE_LABELS).map(([value, label]) => ({ value, label })),
      draft: draft
        ? {
            id: draft.id,
            nature: draft.nature,
            natureLabel: NATURE_LABELS[draft.nature as OfferDocumentNature],
            status: draft.status,
            sections: this.orderedSections(
              draft.nature as OfferDocumentNature,
              draft.sections as Record<string, string>,
            ),
            model: draft.model,
            promptVersion: draft.promptVersion,
            generatedAt: draft.generatedAt,
            generatedBy: draft.generatedBy
              ? `${draft.generatedBy.lastName.toUpperCase()} ${draft.generatedBy.firstName}`
              : null,
            reviewedAt: draft.reviewedAt,
            reviewedBy: draft.reviewedBy
              ? `${draft.reviewedBy.lastName.toUpperCase()} ${draft.reviewedBy.firstName}`
              : null,
          }
        : null,
    };
  }

  /* ── Rédaction ────────────────────────────────────────────────── */

  async draft(user: RequestUser, offerId: string, nature: OfferDocumentNature, ctx: Ctx) {
    const offer = await this.readableOffer(user, offerId);

    if (offer.status !== 'DRAFT') {
      throw new BadRequestException(
        `Une offre « ${offer.status} » ne se rédige plus : elle est déjà partie au client.`,
      );
    }

    const existing = await this.prisma.offerDraft.findUnique({ where: { offerId } });

    // Régénérer effacerait des corrections humaines : on ne le fait pas dans
    // le dos de celui qui les a écrites.
    if (existing?.status === 'RELU') {
      throw new BadRequestException(
        'Ce texte a été relu et assumé. Le régénérer effacerait les corrections apportées : reprenez-le à la main, ou remettez-le en relecture avant.',
      );
    }

    const brief = await this.buildBrief(offerId);

    const completion = await this.ai.complete({
      system: systemPrompt(nature),
      user: userPrompt(nature, brief),
      prefill: '{',
      maxTokens: 8000,
      temperature: 0.3,
    });

    let sections: Record<string, string>;
    try {
      sections = parseSections(completion.text, nature);
    } catch (error) {
      throw new ServiceUnavailableException(
        error instanceof Error ? error.message : 'Le modèle a renvoyé un texte inexploitable.',
      );
    }

    const draft = await this.prisma.offerDraft.upsert({
      where: { offerId },
      create: {
        offerId,
        nature,
        status: 'A_RELIRE',
        sections,
        model: completion.model,
        promptVersion: PROMPT_VERSION,
        generatedById: user.employeeId ?? null,
      },
      update: {
        nature,
        status: 'A_RELIRE',
        sections,
        model: completion.model,
        promptVersion: PROMPT_VERSION,
        generatedAt: new Date(),
        generatedById: user.employeeId ?? null,
        reviewedAt: null,
        reviewedById: null,
      },
    });

    await this.audit.record(
      {
        entity: 'offer',
        entityId: offerId,
        action: 'DRAFT',
        after: {
          nature,
          model: completion.model,
          promptVersion: PROMPT_VERSION,
          inputTokens: completion.inputTokens,
          outputTokens: completion.outputTokens,
        },
      },
      { user, ...ctx },
    );

    return {
      id: draft.id,
      nature,
      natureLabel: NATURE_LABELS[nature],
      status: draft.status,
      sections: this.orderedSections(nature, sections),
      model: completion.model,
      generatedAt: draft.generatedAt,
    };
  }

  /* ── Correction par une personne ──────────────────────────────── */

  async edit(user: RequestUser, offerId: string, sections: Record<string, string>, ctx: Ctx) {
    await this.readableOffer(user, offerId);

    const draft = await this.prisma.offerDraft.findUnique({ where: { offerId } });
    if (!draft) throw new NotFoundException('Cette offre n’a pas encore de texte rédigé.');

    const nature = draft.nature as OfferDocumentNature;
    const current = draft.sections as Record<string, string>;

    // Une section absente du document n'entre pas par la porte de derrière.
    const merged: Record<string, string> = {};
    for (const key of NATURE_SECTIONS[nature]) {
      merged[key] = (sections[key] ?? current[key] ?? '').trim();
    }

    const updated = await this.prisma.offerDraft.update({
      where: { offerId },
      data: { sections: merged },
    });

    await this.audit.record(
      { entity: 'offer', entityId: offerId, action: 'DRAFT_EDIT' },
      { user, ...ctx },
    );

    return {
      status: updated.status,
      sections: this.orderedSections(nature, merged),
    };
  }

  /* ── Relecture ────────────────────────────────────────────────── */

  async approve(user: RequestUser, offerId: string, ctx: Ctx) {
    await this.readableOffer(user, offerId);

    const draft = await this.prisma.offerDraft.findUnique({ where: { offerId } });
    if (!draft) throw new NotFoundException('Cette offre n’a pas encore de texte rédigé.');

    if (draft.status === 'RELU') {
      throw new BadRequestException('Ce texte a déjà été relu.');
    }

    const nature = draft.nature as OfferDocumentNature;
    const sections = draft.sections as Record<string, string>;

    // Une section vide veut dire que le modèle n'avait pas de quoi la rédiger.
    // L'envoyer telle quelle mettrait un blanc dans le document du client.
    const empty = NATURE_SECTIONS[nature].filter((k) => !sections[k]?.trim());
    if (empty.length > 0) {
      throw new BadRequestException({
        message: 'Relecture refusée : le document a des sections vides.',
        errors: empty.map((k) => ({
          field: k,
          message: `« ${SECTIONS[k].label} » est vide.`,
        })),
      });
    }

    // Ce qui reste à confirmer doit l'être avant que le client le lise.
    const pending = NATURE_SECTIONS[nature].filter((k) => /\[[^\]]*\]/.test(sections[k] ?? ''));
    if (pending.length > 0) {
      throw new BadRequestException({
        message: 'Relecture refusée : des mentions entre crochets restent à compléter.',
        errors: pending.map((k) => ({
          field: k,
          message: `« ${SECTIONS[k].label} » contient une mention à confirmer.`,
        })),
      });
    }

    const updated = await this.prisma.offerDraft.update({
      where: { offerId },
      data: { status: 'RELU', reviewedAt: new Date(), reviewedById: user.employeeId ?? null },
    });

    await this.audit.record(
      { entity: 'offer', entityId: offerId, action: 'DRAFT_APPROVE', after: { nature } },
      { user, ...ctx },
    );

    return { status: updated.status, reviewedAt: updated.reviewedAt };
  }

  /**
   * Le texte est-il relu ?
   *
   * Appelé avant l'envoi d'une offre : ce qui n'a pas été relu ne part pas.
   */
  async assertReviewed(offerId: string) {
    const draft = await this.prisma.offerDraft.findUnique({
      where: { offerId },
      select: { status: true },
    });

    if (draft && draft.status !== 'RELU') {
      throw new BadRequestException(
        'Le texte de cette offre a été rédigé par l’assistant mais n’a pas été relu. Relisez-le et validez-le avant de l’envoyer au client.',
      );
    }
  }

  /* ── Le document remis au client ──────────────────────────────── */

  /**
   * Assemble le PDF de l'offre.
   *
   * Le texte vient de la rédaction relue, le bordereau des prix des lignes en
   * base. Tant que le texte n'est pas relu, le document sort marqué
   * « PROJET » : il existe pour être corrigé, pas pour être envoyé.
   */
  async pdf(user: RequestUser, offerId: string) {
    const offer = await this.prisma.offer.findFirst({
      where: {
        id: offerId,
        opportunity: { deletedAt: null, client: { companyId: { in: user.companyIds } } },
      },
      include: {
        lines: { orderBy: { position: 'asc' } },
        draft: true,
        opportunity: {
          include: {
            client: { select: { name: true, city: true, address: true, companyId: true } },
            tenders: { orderBy: { submissionDeadline: 'asc' }, take: 1 },
          },
        },
      },
    });

    if (!offer) throw new NotFoundException('Offre introuvable.');
    if (!offer.draft) {
      throw new BadRequestException(
        'Cette offre n’a pas encore de texte : rédigez-la avant d’éditer le document.',
      );
    }

    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: offer.opportunity.client.companyId },
      select: {
        name: true,
        address: true,
        city: true,
        phone: true,
        email: true,
        ice: true,
        vatRate: true,
      },
    });

    const tender = offer.opportunity.tenders[0] ?? null;
    const nature = offer.draft.nature as OfferDocumentNature;

    const content = await buildOfferPdf({
      company: {
        name: company.name,
        address: company.address,
        city: company.city,
        phone: company.phone,
        email: company.email,
        ice: company.ice,
      },
      offer: {
        number: offer.number,
        version: offer.version,
        amountHT: Number(offer.amountHT),
        validUntil: offer.validUntil,
        status: offer.status,
      },
      client: {
        name: offer.opportunity.client.name,
        city: offer.opportunity.client.city,
        address: offer.opportunity.client.address,
      },
      title: offer.opportunity.title,
      tender: tender ? { reference: tender.reference, publisher: tender.publisher } : null,
      nature,
      reviewed: offer.draft.status === 'RELU',
      sections: offer.draft.sections as Record<string, string>,
      lines: offer.lines.map((l) => ({
        designation: l.designation,
        unit: l.unit,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        amountHT: Number(l.amountHT),
      })),
      vatRate: Number(company.vatRate),
    });

    const suffix = offer.draft.status === 'RELU' ? '' : '-PROJET';

    return {
      content,
      fileName: `${offer.number}-v${offer.version}${suffix}.pdf`,
    };
  }

  /* ── Le dossier remis au modèle ───────────────────────────────── */

  /** Rien que des faits tirés de la base : le modèle n'invente pas les moyens. */
  private async buildBrief(offerId: string): Promise<OfferBrief> {
    const offer = await this.prisma.offer.findUniqueOrThrow({
      where: { id: offerId },
      include: {
        lines: { orderBy: { position: 'asc' } },
        opportunity: {
          include: {
            client: { select: { name: true, sector: true, city: true, paymentTerms: true } },
            department: { select: { id: true, code: true, name: true } },
            tenders: { orderBy: { submissionDeadline: 'asc' }, take: 1 },
          },
        },
      },
    });

    const opportunity = offer.opportunity;
    const departmentId = opportunity.departmentId;
    const today = new Date();

    // Habilitations en cours de validité, agrégées par type/méthode/niveau.
    const certifications = departmentId
      ? await this.prisma.certification.groupBy({
          by: ['type', 'method', 'level'],
          where: {
            employee: { departmentId, deletedAt: null },
            OR: [{ expiresAt: null }, { expiresAt: { gte: today } }],
          },
          _count: { _all: true },
        })
      : [];

    // Instruments du service dont l'étalonnage est encore valable.
    const devices = departmentId
      ? await this.prisma.measuringDevice.groupBy({
          by: ['type'],
          where: {
            departmentId,
            deletedAt: null,
            status: { in: ['AVAILABLE', 'IN_USE'] },
            calibrationValidUntil: { gte: today },
          },
          _count: { _all: true },
        })
      : [];

    const tender = opportunity.tenders[0] ?? null;
    const iso = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);

    return {
      client: {
        name: opportunity.client.name,
        sector: opportunity.client.sector,
        city: opportunity.client.city,
      },
      title: opportunity.title,
      description: opportunity.description,
      department: opportunity.department
        ? { code: opportunity.department.code, name: opportunity.department.name }
        : null,
      tender: tender
        ? {
            reference: tender.reference,
            publisher: tender.publisher,
            submissionDeadline: iso(tender.submissionDeadline),
          }
        : null,
      lines: offer.lines.map((l) => ({
        designation: l.designation,
        unit: l.unit,
        quantity: Number(l.quantity),
      })),
      certifications: certifications.map((c) => ({
        type: c.type,
        method: c.method,
        level: c.level,
        count: c._count._all,
      })),
      devices: devices.map((d) => ({ type: d.type, count: d._count._all })),
      paymentTerms: opportunity.client.paymentTerms,
      validUntil: iso(offer.validUntil),
    };
  }

  /** Les sections dans l'ordre du document, avec leur titre. */
  orderedSections(nature: OfferDocumentNature, sections: Record<string, string>) {
    return NATURE_SECTIONS[nature].map((key) => ({
      key,
      label: SECTIONS[key].label,
      brief: SECTIONS[key].brief,
      text: sections[key] ?? '',
    }));
  }

  private async readableOffer(user: RequestUser, offerId: string) {
    const offer = await this.prisma.offer.findFirst({
      where: {
        id: offerId,
        opportunity: { deletedAt: null, client: { companyId: { in: user.companyIds } } },
      },
      select: { id: true, number: true, version: true, status: true, opportunityId: true },
    });

    if (!offer) throw new NotFoundException('Offre introuvable.');
    return offer;
  }
}
