import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
import { AffairsService } from '../affairs/affairs.service';
import { OfferDraftingService } from '../offer-drafting/offer-drafting.service';
import type { RequestUser } from '../common/types';

export const OPPORTUNITY_STAGES = [
  'NEW',
  'CONSULTATION',
  'OFFER_DRAFT',
  'OFFER_SENT',
  'FOLLOW_UP',
  'NEGOTIATION',
  'WON',
  'LOST',
] as const;
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

export const STAGE_LABELS: Record<OpportunityStage, string> = {
  NEW: 'Nouvelle',
  CONSULTATION: 'Consultation',
  OFFER_DRAFT: 'Offre en préparation',
  OFFER_SENT: 'Offre envoyée',
  FOLLOW_UP: 'Relance',
  NEGOTIATION: 'Négociation',
  WON: 'Gagnée',
  LOST: 'Perdue',
};

/**
 * Probabilité par défaut de chaque étape du tunnel.
 *
 * Elle sert à pondérer le pipeline : une offre envoyée ne vaut pas une
 * affaire gagnée, et une consultation encore moins. La saisie manuelle prime
 * quand le commercial connaît mieux son dossier.
 */
export const STAGE_PROBABILITY: Record<OpportunityStage, number> = {
  NEW: 10,
  CONSULTATION: 20,
  OFFER_DRAFT: 30,
  OFFER_SENT: 50,
  FOLLOW_UP: 60,
  NEGOTIATION: 75,
  WON: 100,
  LOST: 0,
};

/**
 * Causes de perte, dans l'ordre où on les rencontre.
 *
 * Un motif en texte libre ne s'additionne pas : impossible de le compter, ni
 * de le comparer d'une année sur l'autre. La catégorie se totalise — et c'est
 * ce total qui dit s'il faut revoir les prix, les délais ou les références.
 */
export const LOST_CAUSES = [
  'PRIX',
  'DELAI',
  'REFERENCES',
  'CAPACITE',
  'CONCURRENT_EN_PLACE',
  'DOSSIER_NON_CONFORME',
  'PROJET_ABANDONNE',
  'SANS_SUITE',
  'AUTRE',
] as const;
export type LostCause = (typeof LOST_CAUSES)[number];

export const LOST_CAUSE_LABELS: Record<LostCause, string> = {
  PRIX: 'Prix trop élevé',
  DELAI: 'Délai incompatible',
  REFERENCES: 'Références ou agréments insuffisants',
  CAPACITE: 'Moyens indisponibles à la date demandée',
  CONCURRENT_EN_PLACE: 'Concurrent déjà en place',
  DOSSIER_NON_CONFORME: 'Dossier écarté (pièce manquante, hors délai)',
  PROJET_ABANDONNE: 'Projet abandonné ou reporté par le client',
  SANS_SUITE: 'Sans suite malgré les relances',
  AUTRE: 'Autre',
};

/**
 * Les causes sur lesquelles I2S peut agir.
 *
 * Un projet abandonné par le client n'est pas une contre-performance
 * commerciale : les mélanger aux pertes évitables fausserait la lecture.
 */
export const ACTIONABLE_LOST_CAUSES: LostCause[] = [
  'PRIX',
  'DELAI',
  'REFERENCES',
  'CAPACITE',
  'DOSSIER_NON_CONFORME',
];

export const loseSchema = z.object({
  cause: z.enum(LOST_CAUSES, { message: 'Indiquez la cause de la perte.' }),
  reason: z
    .string()
    .trim()
    .min(3, 'Le motif est obligatoire : c’est lui qui nourrit l’analyse des pertes.')
    .max(1000),
});

export const opportunitySchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().trim().min(3, 'Décrivez l’opportunité.').max(200),
  departmentId: z.string().uuid().nullable().optional(),
  amount: z.coerce.number().min(0).nullable().optional(),
  probability: z.coerce.number().int().min(0).max(100).optional(),
  expectedCloseDate: z.coerce.date().nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
});

export const opportunityUpdateSchema = opportunitySchema.partial().omit({ clientId: true }).extend({
  stage: z.enum(OPPORTUNITY_STAGES).optional(),
});

export const tenderSchema = z.object({
  reference: z.string().trim().min(1, 'La référence de l’appel d’offres est obligatoire.').max(80),
  publisher: z.string().trim().max(160).nullable().optional(),
  submissionDeadline: z.coerce.date().nullable().optional(),
  openingDate: z.coerce.date().nullable().optional(),
  guaranteeAmount: z.coerce.number().min(0).nullable().optional(),
});

export const offerSchema = z.object({
  validUntil: z.coerce.date().nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  lines: z
    .array(
      z.object({
        designation: z.string().trim().min(2, 'Décrivez la prestation.').max(200),
        unit: z.string().trim().max(20).optional(),
        quantity: z.coerce.number().positive('La quantité doit être positive.'),
        unitPrice: z.coerce.number().min(0),
      }),
    )
    .min(1, 'Une offre sans ligne n’a pas de montant.'),
});

export const followUpSchema = z.object({
  date: z.coerce.date().optional(),
  channel: z.enum(['EMAIL', 'PHONE', 'VISIT', 'OTHER']).optional(),
  outcome: z.string().trim().min(3, 'Notez ce que la relance a donné.').max(1000),
  contactId: z.string().uuid().nullable().optional(),
  nextActionDate: z.coerce.date().nullable().optional(),
});

export function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Tunnel commercial : de l'opportunité à l'affaire.
 *
 * C'est le suivi que le fichier « Suivi Cde Partagé » tient aujourd'hui à la
 * main. L'accord du client sur une offre **crée l'affaire** — c'est le seul
 * chemin, et c'est ce qui garantit qu'une affaire porte toujours le montant
 * qui a été proposé.
 */
@Injectable()
export class CommercialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly numbering: NumberingService,
    private readonly affairs: AffairsService,
    private readonly drafting: OfferDraftingService,
  ) {}

  /* ── Lecture ──────────────────────────────────────────────────── */

  async get(user: RequestUser, id: string) {
    const opportunity = await this.prisma.opportunity.findFirst({
      where: { id, deletedAt: null, client: { companyId: { in: user.companyIds } } },
      include: {
        client: { select: { id: true, name: true, code: true, type: true } },
        department: { select: { code: true, name: true } },
        owner: { select: { id: true, matricule: true, firstName: true, lastName: true } },
        tenders: { orderBy: { submissionDeadline: 'asc' } },
        offers: {
          orderBy: [{ number: 'asc' }, { version: 'desc' }],
          include: { lines: { orderBy: { position: 'asc' } }, draft: true },
        },
        followUps: { orderBy: { date: 'desc' }, include: { contact: { select: { firstName: true, lastName: true } } } },
        affairs: { select: { id: true, number: true, title: true, status: true } },
      },
    });

    if (!opportunity) throw new NotFoundException('Opportunité introuvable.');
    return opportunity;
  }

  /* ── Opportunité ──────────────────────────────────────────────── */

  async create(
    user: RequestUser,
    input: z.infer<typeof opportunitySchema>,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const client = await this.prisma.client.findFirst({
      where: { id: input.clientId, deletedAt: null, companyId: { in: user.companyIds } },
      select: { id: true, name: true, companyId: true },
    });
    if (!client) throw new BadRequestException('Client introuvable.');

    const opportunity = await this.prisma.opportunity.create({
      data: {
        clientId: client.id,
        title: input.title.trim(),
        departmentId: input.departmentId ?? null,
        amount: input.amount ?? null,
        probability: input.probability ?? STAGE_PROBABILITY.NEW,
        expectedCloseDate: input.expectedCloseDate ?? null,
        // Sans propriétaire désigné, c'est celui qui l'ouvre : au périmètre
        // « équipe », une opportunité sans propriétaire serait invisible à son
        // propre auteur.
        ownerId: input.ownerId ?? user.employeeId,
        description: input.description?.trim() || null,
        stage: 'NEW',
      },
    });

    await this.audit.record(
      {
        entity: 'opportunity',
        entityId: opportunity.id,
        action: 'CREATE',
        after: { client: client.name, title: opportunity.title, amount: input.amount },
        companyId: client.companyId,
      },
      { user, ...ctx },
    );

    return opportunity;
  }

  /**
   * Fait avancer l'opportunité.
   *
   * Deux étapes ne se déclarent pas à la main : « gagnée » découle de
   * l'acceptation d'une offre, « perdue » exige un motif. Le reste est du
   * suivi commercial, et le commercial en est juge.
   */
  async update(
    user: RequestUser,
    id: string,
    input: z.infer<typeof opportunityUpdateSchema>,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const opportunity = await this.get(user, id);

    if (opportunity.stage === 'WON') {
      throw new BadRequestException(
        'Cette opportunité est gagnée : elle a donné une affaire et ne se rouvre pas.',
      );
    }
    if (input.stage === 'WON') {
      throw new BadRequestException(
        'Une opportunité se gagne en acceptant une offre, pas en changeant son étape.',
      );
    }
    if (input.stage === 'LOST') {
      throw new BadRequestException(
        'Une opportunité se perd avec un motif : utilisez la déclaration de perte.',
      );
    }

    const updated = await this.prisma.opportunity.update({
      where: { id },
      data: {
        title: input.title?.trim(),
        departmentId: input.departmentId ?? undefined,
        amount: input.amount ?? undefined,
        // La probabilité suit l'étape, sauf si le commercial la fixe lui-même.
        probability:
          input.probability ??
          (input.stage ? STAGE_PROBABILITY[input.stage] : undefined),
        expectedCloseDate: input.expectedCloseDate ?? undefined,
        ownerId: input.ownerId ?? undefined,
        description: input.description ?? undefined,
        stage: input.stage,
      },
    });

    await this.audit.record(
      {
        entity: 'opportunity',
        entityId: id,
        action: 'UPDATE',
        before: { stage: opportunity.stage, amount: opportunity.amount },
        after: { stage: updated.stage, amount: updated.amount },
      },
      { user, ...ctx },
    );

    return updated;
  }

  /** Déclare la perte. Le motif alimente l'analyse des marchés perdus. */
  async lose(
    user: RequestUser,
    id: string,
    input: { cause: LostCause; reason: string },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const opportunity = await this.get(user, id);

    if (opportunity.stage === 'WON') {
      throw new BadRequestException('Cette opportunité est gagnée : elle ne se perd plus.');
    }
    if (!input.reason.trim()) {
      throw new BadRequestException({
        message: 'Déclaration refusée.',
        errors: [
          {
            field: 'reason',
            message: 'Le motif est obligatoire : c’est lui qui nourrit l’analyse des pertes.',
          },
        ],
      });
    }

    const updated = await this.prisma.opportunity.update({
      where: { id },
      data: {
        stage: 'LOST',
        probability: 0,
        lostCause: input.cause,
        lostReason: input.reason.trim(),
      },
    });

    await this.audit.record(
      {
        entity: 'opportunity',
        entityId: id,
        action: 'LOSE',
        before: { stage: opportunity.stage },
        after: { stage: updated.stage, cause: input.cause },
        reason: input.reason,
      },
      { user, ...ctx },
    );

    return updated;
  }

  /* ── Appel d'offres ───────────────────────────────────────────── */

  async addTender(
    user: RequestUser,
    id: string,
    input: z.infer<typeof tenderSchema>,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const opportunity = await this.get(user, id);

    if (
      input.submissionDeadline &&
      input.openingDate &&
      input.openingDate < input.submissionDeadline
    ) {
      throw new BadRequestException({
        message: 'Appel d’offres refusé.',
        errors: [
          {
            field: 'openingDate',
            message: 'L’ouverture des plis ne précède pas la remise des offres.',
          },
        ],
      });
    }

    const tender = await this.prisma.tender.create({
      data: {
        opportunityId: id,
        reference: input.reference.trim(),
        publisher: input.publisher?.trim() || null,
        submissionDeadline: input.submissionDeadline ?? null,
        openingDate: input.openingDate ?? null,
        guaranteeAmount: input.guaranteeAmount ?? null,
        status: 'IDENTIFIED',
      },
    });

    // Une consultation identifiée fait avancer le tunnel.
    if (opportunity.stage === 'NEW') {
      await this.prisma.opportunity.update({
        where: { id },
        data: { stage: 'CONSULTATION', probability: STAGE_PROBABILITY.CONSULTATION },
      });
    }

    await this.audit.record(
      {
        entity: 'opportunity',
        entityId: id,
        action: 'TENDER',
        after: { reference: tender.reference, deadline: tender.submissionDeadline },
      },
      { user, ...ctx },
    );

    return tender;
  }

  /* ── Offre ────────────────────────────────────────────────────── */

  /**
   * Établit une offre.
   *
   * Le montant se calcule sur les lignes : il ne se saisit pas. Une offre qui
   * ne correspond pas à son détail n'est pas défendable devant le client.
   */
  async createOffer(
    user: RequestUser,
    id: string,
    input: z.infer<typeof offerSchema>,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const opportunity = await this.get(user, id);

    if (['WON', 'LOST'].includes(opportunity.stage)) {
      throw new BadRequestException(
        `Une opportunité « ${STAGE_LABELS[opportunity.stage as OpportunityStage]} » ne reçoit plus d’offre.`,
      );
    }

    const companyId = opportunity.client.id
      ? (
          await this.prisma.client.findUniqueOrThrow({
            where: { id: opportunity.clientId },
            select: { companyId: true },
          })
        ).companyId
      : user.companyIds[0]!;

    const lines = input.lines.map((line, index) => ({
      position: index + 1,
      designation: line.designation.trim(),
      unit: line.unit?.trim() || 'vacation',
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      amountHT: Math.round(line.quantity * line.unitPrice * 100) / 100,
    }));
    const amountHT = Math.round(lines.reduce((sum, l) => sum + l.amountHT, 0) * 100) / 100;

    if (amountHT <= 0) {
      throw new BadRequestException({
        message: 'Offre refusée.',
        errors: [{ field: 'lines', message: 'Le montant total de l’offre doit être positif.' }],
      });
    }

    // Une nouvelle offre sur la même opportunité est une version de plus :
    // le client doit pouvoir suivre ce qui a changé entre deux propositions.
    const previous = opportunity.offers[0] ?? null;
    const number = previous?.number ?? (await this.numbering.next(companyId, 'OFFER'));
    const version = previous
      ? Math.max(...opportunity.offers.map((o) => o.version)) + 1
      : 1;

    const offer = await this.prisma.$transaction(async (tx) => {
      const created = await tx.offer.create({
        data: {
          opportunityId: id,
          number,
          version,
          amountHT,
          validUntil: input.validUntil ?? null,
          notes: input.notes?.trim() || null,
          status: 'DRAFT',
          lines: { create: lines },
        },
        include: { lines: true },
      });

      await tx.opportunity.update({
        where: { id },
        data: {
          stage: 'OFFER_DRAFT',
          probability: STAGE_PROBABILITY.OFFER_DRAFT,
          amount: amountHT,
        },
      });

      return created;
    });

    await this.audit.record(
      {
        entity: 'opportunity',
        entityId: id,
        action: 'OFFER_DRAFT',
        after: { offer: `${number} v${version}`, amountHT },
        companyId,
      },
      { user, ...ctx },
    );

    return offer;
  }

  async sendOffer(
    user: RequestUser,
    offerId: string,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const offer = await this.readableOffer(user, offerId);

    if (offer.status !== 'DRAFT') {
      throw new BadRequestException(`Une offre « ${offer.status} » ne s’envoie plus.`);
    }

    // Ce que l'assistant a rédigé ne part pas sans qu'une personne l'ait relu.
    await this.drafting.assertReviewed(offerId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.offer.update({
        where: { id: offerId },
        data: { status: 'SENT', sentAt: new Date() },
      });

      await tx.opportunity.update({
        where: { id: offer.opportunityId },
        data: { stage: 'OFFER_SENT', probability: STAGE_PROBABILITY.OFFER_SENT },
      });

      return row;
    });

    await this.audit.record(
      {
        entity: 'opportunity',
        entityId: offer.opportunityId,
        action: 'OFFER_SENT',
        after: { offer: `${offer.number} v${offer.version}`, sentAt: updated.sentAt },
      },
      { user, ...ctx },
    );

    return updated;
  }

  /**
   * Le client accepte : l'affaire naît.
   *
   * C'est le seul chemin vers une opportunité gagnée. L'affaire reprend le
   * client, le montant proposé et la référence de commande — elle porte donc
   * toujours ce qui a été effectivement négocié.
   */
  async acceptOffer(
    user: RequestUser,
    offerId: string,
    input: { poNumber?: string | null; poAmountHT?: number | null },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const offer = await this.readableOffer(user, offerId);

    if (!['SENT', 'DRAFT'].includes(offer.status)) {
      throw new BadRequestException(`Une offre « ${offer.status} » ne s’accepte plus.`);
    }
    if (offer.status === 'DRAFT') {
      throw new BadRequestException(
        'Cette offre n’a pas été envoyée au client : envoyez-la avant d’enregistrer son accord.',
      );
    }

    const opportunity = await this.get(user, offer.opportunityId);

    const affair = await this.affairs.create(
      user,
      {
        clientId: opportunity.clientId,
        title: opportunity.title,
        departmentId: opportunity.departmentId,
        accountManagerId: opportunity.ownerId,
        offerAmountHT: Number(offer.amountHT),
        poAmountHT: input.poAmountHT ?? null,
        poNumber: input.poNumber?.trim() || null,
        commercialStatus: 'GAGNEE',
      },
      ctx,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.offer.update({ where: { id: offerId }, data: { status: 'ACCEPTED' } });

      // Les autres versions tombent : une seule proposition fait foi.
      await tx.offer.updateMany({
        where: { opportunityId: offer.opportunityId, id: { not: offerId }, status: 'SENT' },
        data: { status: 'REJECTED' },
      });

      await tx.opportunity.update({
        where: { id: offer.opportunityId },
        data: { stage: 'WON', probability: 100 },
      });

      await tx.affair.update({
        where: { id: affair.id },
        data: { opportunityId: offer.opportunityId, offerId },
      });
    });

    await this.audit.record(
      {
        entity: 'opportunity',
        entityId: offer.opportunityId,
        action: 'WON',
        after: {
          offer: `${offer.number} v${offer.version}`,
          affair: affair.number,
          amountHT: offer.amountHT,
        },
      },
      { user, ...ctx },
    );

    return { offer: { id: offerId, number: offer.number, version: offer.version }, affair };
  }

  async rejectOffer(
    user: RequestUser,
    offerId: string,
    reason: string,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const offer = await this.readableOffer(user, offerId);

    if (offer.status === 'ACCEPTED') {
      throw new BadRequestException('Cette offre a été acceptée : elle ne se refuse plus.');
    }
    if (!reason.trim()) {
      throw new BadRequestException({
        message: 'Refus refusé.',
        errors: [{ field: 'reason', message: 'Le motif du refus est obligatoire.' }],
      });
    }

    const updated = await this.prisma.offer.update({
      where: { id: offerId },
      data: { status: 'REJECTED', notes: reason.trim() },
    });

    await this.audit.record(
      {
        entity: 'opportunity',
        entityId: offer.opportunityId,
        action: 'OFFER_REJECTED',
        after: { offer: `${offer.number} v${offer.version}` },
        reason,
      },
      { user, ...ctx },
    );

    return updated;
  }

  /* ── Relance ──────────────────────────────────────────────────── */

  async addFollowUp(
    user: RequestUser,
    id: string,
    input: z.infer<typeof followUpSchema>,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const opportunity = await this.get(user, id);

    const followUp = await this.prisma.$transaction(async (tx) => {
      const created = await tx.followUp.create({
        data: {
          opportunityId: id,
          contactId: input.contactId ?? null,
          date: input.date ?? new Date(),
          channel: input.channel ?? 'EMAIL',
          outcome: input.outcome.trim(),
          nextActionDate: input.nextActionDate ?? null,
          userId: user.id,
        },
      });

      // Une relance après envoi fait entrer l'opportunité en phase de relance.
      if (opportunity.stage === 'OFFER_SENT') {
        await tx.opportunity.update({
          where: { id },
          data: { stage: 'FOLLOW_UP', probability: STAGE_PROBABILITY.FOLLOW_UP },
        });
      }

      return created;
    });

    await this.audit.record(
      {
        entity: 'opportunity',
        entityId: id,
        action: 'FOLLOW_UP',
        after: { channel: followUp.channel, outcome: followUp.outcome },
      },
      { user, ...ctx },
    );

    return followUp;
  }

  /* ── Utilitaires ──────────────────────────────────────────────── */

  private async readableOffer(user: RequestUser, offerId: string) {
    const offer = await this.prisma.offer.findFirst({
      where: {
        id: offerId,
        opportunity: { deletedAt: null, client: { companyId: { in: user.companyIds } } },
      },
      select: {
        id: true,
        number: true,
        version: true,
        status: true,
        amountHT: true,
        opportunityId: true,
      },
    });

    if (!offer) throw new NotFoundException('Offre introuvable.');
    return offer;
  }

  /** Le commercial ne travaille que dans son périmètre. */
  assertOwner(user: RequestUser, ownerId: string | null) {
    const teamOnly = user.permissions.some(
      (p) => p.resource === 'opportunity' && p.action === 'UPDATE' && p.scope === 'TEAM',
    );
    if (!teamOnly) return;
    if (ownerId === user.employeeId || (ownerId && user.teamEmployeeIds.includes(ownerId))) return;

    throw new ForbiddenException('Cette opportunité est suivie par quelqu’un d’autre.');
  }
}
