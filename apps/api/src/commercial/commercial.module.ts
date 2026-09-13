import { Body, Controller, Get, Module, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { z } from 'zod';
import {
  ACTIONABLE_LOST_CAUSES,
  CommercialService,
  LOST_CAUSES,
  LOST_CAUSE_LABELS,
  STAGE_LABELS,
  followUpSchema,
  loseSchema,
  offerSchema,
  opportunitySchema,
  opportunityUpdateSchema,
  startOfDay,
  tenderSchema,
} from './commercial.service';
import { PrismaService } from '../prisma/prisma.service';
import { AffairsModule } from '../affairs/affairs.module';
import { OfferDraftingModule } from '../offer-drafting/offer-drafting.module';
import { OfferDraftingService } from '../offer-drafting/offer-drafting.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

const reasonSchema = z.object({
  reason: z.string().trim().min(3, 'Le motif est obligatoire.').max(1000),
});

const acceptSchema = z.object({
  poNumber: z.string().trim().max(80).nullable().optional(),
  poAmountHT: z.coerce.number().min(0).nullable().optional(),
});

function ctx(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}

@ApiTags('Commercial')
@Controller()
class CommercialController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commercial: CommercialService,
    private readonly drafting: OfferDraftingService,
  ) {}

  /**
   * Le suivi des consultations, appels d'offres compris — un seul tableau.
   *
   * Une demande de prix arrive de deux façons : le client consulte I2S
   * directement, ou il publie un appel d'offres avec une référence, une date
   * de remise et une caution. C'est la même chose commercialement — une
   * demande qui se gagne ou se perd — et les séparer en deux écrans obligeait
   * à regarder à deux endroits pour savoir où en est le portefeuille.
   *
   * Chaque ligne porte donc sa nature, son statut, et, quand elle est perdue,
   * la cause de la perte : c'est elle qui alimente l'analyse commerciale.
   */
  @Get('consultations')
  @RequirePermission('opportunity', 'VIEW')
  async consultations(@CurrentUser() user: RequestUser) {
    const rows = await this.prisma.opportunity.findMany({
      where: { deletedAt: null, client: { companyId: { in: user.companyIds } } },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        client: { select: { id: true, name: true } },
        department: { select: { code: true } },
        owner: { select: { firstName: true, lastName: true } },
        tenders: { orderBy: { submissionDeadline: 'asc' }, take: 1 },
        offers: {
          orderBy: [{ version: 'desc' }],
          take: 1,
          select: { number: true, version: true, status: true, amountHT: true, sentAt: true },
        },
        followUps: { orderBy: { date: 'desc' }, take: 1 },
        affairs: { select: { id: true, number: true } },
        _count: { select: { tenders: true, offers: true, followUps: true } },
      },
    });

    const today = startOfDay(new Date());

    const items = rows.map((o) => {
      const tender = o.tenders[0] ?? null;
      const offer = o.offers[0] ?? null;
      const affair = o.affairs[0] ?? null;
      const deadline = tender?.submissionDeadline ? startOfDay(tender.submissionDeadline) : null;
      const amount = o.amount === null ? null : Number(o.amount);

      return {
        id: o.id,
        // Ce qui distingue les deux natures : une référence et une échéance.
        nature: tender ? ('APPEL_OFFRES' as const) : ('CONSULTATION' as const),
        receivedAt: o.createdAt,
        client: o.client,
        title: o.title,
        department: o.department?.code ?? null,
        owner: o.owner ? `${o.owner.lastName.toUpperCase()} ${o.owner.firstName}` : null,
        stage: o.stage,
        stageLabel: STAGE_LABELS[o.stage as keyof typeof STAGE_LABELS] ?? o.stage,
        amount,
        probability: o.probability,
        weighted: amount === null ? 0 : Math.round(amount * (o.probability / 100)),
        expectedCloseDate: o.expectedCloseDate,

        tenderReference: tender?.reference ?? null,
        publisher: tender?.publisher ?? null,
        submissionDeadline: tender?.submissionDeadline ?? null,
        openingDate: tender?.openingDate ?? null,
        guaranteeAmount:
          tender?.guaranteeAmount === undefined || tender.guaranteeAmount === null
            ? null
            : Number(tender.guaranteeAmount),
        /** Jours restants avant la remise ; négatif une fois la date passée. */
        daysLeft: deadline
          ? Math.round((deadline.getTime() - today.getTime()) / 86_400_000)
          : null,

        offerNumber: offer ? `${offer.number} v${offer.version}` : null,
        offerAmountHT: offer ? Number(offer.amountHT) : null,
        offerStatus: offer?.status ?? null,
        offerSentAt: offer?.sentAt ?? null,
        answered: offer !== null && offer.sentAt !== null,

        lostCause: o.lostCause,
        lostCauseLabel: o.lostCause ? LOST_CAUSE_LABELS[o.lostCause] : null,
        lostReason: o.lostReason,

        affairNumber: affair?.number ?? null,
        affairId: affair?.id ?? null,
        lastFollowUp: o.followUps[0]?.date ?? null,
        nextActionDate: o.followUps[0]?.nextActionDate ?? null,
        followUpCount: o._count.followUps,
      };
    });

    const open = items.filter((i) => i.stage !== 'WON' && i.stage !== 'LOST');
    const won = items.filter((i) => i.stage === 'WON');
    const lost = items.filter((i) => i.stage === 'LOST');

    /* ── Analyse des pertes, par cause ──────────────────────────── */

    const byCause = LOST_CAUSES.map((cause) => {
      const rows = lost.filter((i) => i.lostCause === cause);
      return {
        cause,
        label: LOST_CAUSE_LABELS[cause],
        count: rows.length,
        amount: rows.reduce((s, i) => s + (i.amount ?? 0), 0),
        /** Une perte sur laquelle I2S peut agir : prix, délai, moyens, dossier. */
        actionable: ACTIONABLE_LOST_CAUSES.includes(cause),
      };
    }).filter((c) => c.count > 0);

    byCause.sort((a, b) => b.amount - a.amount || b.count - a.count);

    const lostAmount = lost.reduce((s, i) => s + (i.amount ?? 0), 0);
    const actionableLost = byCause.filter((c) => c.actionable);

    return {
      items,
      lostCauses: byCause,
      causeOptions: LOST_CAUSES.map((c) => ({ value: c, label: LOST_CAUSE_LABELS[c] })),
      totals: {
        all: items.length,
        open: open.length,
        openAmount: open.reduce((s, i) => s + (i.amount ?? 0), 0),
        weighted: open.reduce((s, i) => s + i.weighted, 0),
        // Ventilation des dossiers encore ouverts : c'est le chiffre affiché.
        consultations: open.filter((i) => i.nature === 'CONSULTATION').length,
        tenders: open.filter((i) => i.nature === 'APPEL_OFFRES').length,
        won: won.length,
        wonAmount: won.reduce((s, i) => s + (i.amount ?? 0), 0),
        lost: lost.length,
        lostAmount,
        // Taux de transformation sur les seuls dossiers tranchés.
        conversionRate:
          won.length + lost.length > 0
            ? Math.round((won.length / (won.length + lost.length)) * 1000) / 10
            : 0,
        // Ce qui échappe encore : une échéance dépassée sans offre déposée.
        missedDeadlines: open.filter((i) => !i.answered && i.daysLeft !== null && i.daysLeft < 0)
          .length,
        urgentDeadlines: open.filter(
          (i) => !i.answered && i.daysLeft !== null && i.daysLeft >= 0 && i.daysLeft <= 7,
        ).length,
        overdueFollowUps: open.filter(
          (i) => i.nextActionDate && new Date(i.nextActionDate) < new Date(),
        ).length,
        guarantees: open.reduce((s, i) => s + (i.guaranteeAmount ?? 0), 0),
        // Ce que les pertes évitables ont coûté : la part sur laquelle agir.
        actionableLostAmount: actionableLost.reduce((s, c) => s + c.amount, 0),
        actionableLostCount: actionableLost.reduce((s, c) => s + c.count, 0),
      },
    };
  }

  /** Les offres de prix, toutes versions, la plus récente d'abord. */
  @Get('offers')
  @RequirePermission('offer', 'VIEW')
  async offers(@CurrentUser() user: RequestUser) {
    const rows = await this.prisma.offer.findMany({
      where: { opportunity: { deletedAt: null, client: { companyId: { in: user.companyIds } } } },
      orderBy: [{ number: 'desc' }, { version: 'desc' }],
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            stage: true,
            client: { select: { name: true } },
            followUps: { orderBy: { date: 'desc' }, take: 1, select: { nextActionDate: true } },
          },
        },
        _count: { select: { lines: true } },
        affairs: { select: { number: true, poAmountHT: true } },
      },
    });

    const today = startOfDay(new Date());

    const items = rows.map((o) => {
      const affair = o.affairs[0] ?? null;
      const ordered = affair?.poAmountHT === null || affair === null ? null : Number(affair.poAmountHT);

      return {
        id: o.id,
        number: o.number,
        version: o.version,
        amountHT: Number(o.amountHT),
        status: o.status,
        validUntil: o.validUntil,
        sentAt: o.sentAt,
        lineCount: o._count.lines,
        opportunityId: o.opportunity.id,
        title: o.opportunity.title,
        client: o.opportunity.client.name,
        stage: o.opportunity.stage,
        affairNumber: affair?.number ?? null,
        orderedAmountHT: ordered,
        /** Écart entre ce qui a été proposé et ce qui a été commandé. */
        gap: ordered === null ? null : ordered - Number(o.amountHT),
        nextActionDate: o.opportunity.followUps[0]?.nextActionDate ?? null,
        /** Une offre envoyée dont la validité est dépassée n'engage plus I2S. */
        lapsed:
          o.status === 'SENT' && o.validUntil !== null && startOfDay(o.validUntil) < today,
      };
    });

    const sent = items.filter((i) => i.status === 'SENT');
    const accepted = items.filter((i) => i.status === 'ACCEPTED');
    const rejected = items.filter((i) => i.status === 'REJECTED');

    return {
      items,
      totals: {
        all: items.length,
        draft: items.filter((i) => i.status === 'DRAFT').length,
        sent: sent.length,
        sentAmount: sent.reduce((s, i) => s + i.amountHT, 0),
        accepted: accepted.length,
        acceptedAmount: accepted.reduce((s, i) => s + i.amountHT, 0),
        lapsed: items.filter((i) => i.lapsed).length,
        // Sur les seules offres tranchées : les offres en cours ne disent rien.
        winRate:
          accepted.length + rejected.length > 0
            ? Math.round((accepted.length / (accepted.length + rejected.length)) * 1000) / 10
            : 0,
        // Ce que la négociation a coûté sur les offres devenues commandes.
        orderGap: accepted.reduce((s, i) => s + (i.gap ?? 0), 0),
      },
    };
  }

  /** La fiche d'une consultation : son dossier, ses offres, ses relances. */
  @Get('consultations/:id')
  @RequirePermission('opportunity', 'VIEW')
  async consultation(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const o = await this.commercial.get(user, id);

    return {
      id: o.id,
      title: o.title,
      stage: o.stage,
      stageLabel: STAGE_LABELS[o.stage as keyof typeof STAGE_LABELS] ?? o.stage,
      amount: o.amount === null ? null : Number(o.amount),
      probability: o.probability,
      expectedCloseDate: o.expectedCloseDate,
      lostCause: o.lostCause,
      lostCauseLabel: o.lostCause ? LOST_CAUSE_LABELS[o.lostCause] : null,
      lostReason: o.lostReason,
      causeOptions: LOST_CAUSES.map((c) => ({ value: c, label: LOST_CAUSE_LABELS[c] })),
      description: o.description,
      client: o.client,
      department: o.department,
      owner: o.owner
        ? {
            id: o.owner.id,
            matricule: o.owner.matricule,
            name: `${o.owner.lastName.toUpperCase()} ${o.owner.firstName}`,
          }
        : null,
      tenders: o.tenders.map((t) => ({
        id: t.id,
        reference: t.reference,
        publisher: t.publisher,
        submissionDeadline: t.submissionDeadline,
        openingDate: t.openingDate,
        guaranteeAmount: t.guaranteeAmount === null ? null : Number(t.guaranteeAmount),
        status: t.status,
      })),
      /** L'assistant de rédaction est-il utilisable sur ce poste ? */
      assistant: { available: this.drafting.available, natures: this.drafting.natures },
      offers: o.offers.map((offer) => ({
        id: offer.id,
        number: offer.number,
        version: offer.version,
        amountHT: Number(offer.amountHT),
        status: offer.status,
        validUntil: offer.validUntil,
        sentAt: offer.sentAt,
        notes: offer.notes,
        draft: offer.draft ? this.drafting.present(offer.draft) : null,
        lines: offer.lines.map((l) => ({
          id: l.id,
          position: l.position,
          designation: l.designation,
          unit: l.unit,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          amountHT: Number(l.amountHT),
        })),
      })),
      followUps: o.followUps.map((f) => ({
        id: f.id,
        date: f.date,
        channel: f.channel,
        outcome: f.outcome,
        nextActionDate: f.nextActionDate,
        contact: f.contact ? `${f.contact.lastName.toUpperCase()} ${f.contact.firstName}` : null,
      })),
      affairs: o.affairs,
      /** Gestes ouverts : l'écran ne propose rien que l'API refuserait. */
      actions: {
        edit: !['WON', 'LOST'].includes(o.stage),
        offer: !['WON', 'LOST'].includes(o.stage),
        lose: !['WON', 'LOST'].includes(o.stage),
      },
    };
  }

  @Post('opportunities')
  @RequirePermission('opportunity', 'CREATE')
  createOpportunity(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(opportunitySchema)) body: z.infer<typeof opportunitySchema>,
    @Req() req: Request,
  ) {
    return this.commercial.create(user, body, ctx(req));
  }

  @Patch('opportunities/:id')
  @RequirePermission('opportunity', 'UPDATE')
  updateOpportunity(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(opportunityUpdateSchema)) body: z.infer<typeof opportunityUpdateSchema>,
    @Req() req: Request,
  ) {
    return this.commercial.update(user, id, body, ctx(req));
  }

  @Post('opportunities/:id/lose')
  @RequirePermission('opportunity', 'UPDATE')
  lose(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(loseSchema)) body: z.infer<typeof loseSchema>,
    @Req() req: Request,
  ) {
    return this.commercial.lose(user, id, body, ctx(req));
  }

  @Post('opportunities/:id/tenders')
  @RequirePermission('tender', 'CREATE')
  addTender(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(tenderSchema)) body: z.infer<typeof tenderSchema>,
    @Req() req: Request,
  ) {
    return this.commercial.addTender(user, id, body, ctx(req));
  }

  @Post('opportunities/:id/offers')
  @RequirePermission('offer', 'CREATE')
  createOffer(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(offerSchema)) body: z.infer<typeof offerSchema>,
    @Req() req: Request,
  ) {
    return this.commercial.createOffer(user, id, body, ctx(req));
  }

  @Post('opportunities/:id/follow-ups')
  @RequirePermission('opportunity', 'UPDATE')
  addFollowUp(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(followUpSchema)) body: z.infer<typeof followUpSchema>,
    @Req() req: Request,
  ) {
    return this.commercial.addFollowUp(user, id, body, ctx(req));
  }

  @Post('offers/:id/send')
  @RequirePermission('offer', 'UPDATE')
  sendOffer(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.commercial.sendOffer(user, id, ctx(req));
  }

  /** L'accord du client crée l'affaire : c'est le seul chemin. */
  @Post('offers/:id/accept')
  @RequirePermission('offer', 'UPDATE')
  acceptOffer(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(acceptSchema)) body: z.infer<typeof acceptSchema>,
    @Req() req: Request,
  ) {
    return this.commercial.acceptOffer(user, id, body, ctx(req));
  }

  @Post('offers/:id/reject')
  @RequirePermission('offer', 'UPDATE')
  rejectOffer(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reasonSchema)) body: { reason: string },
    @Req() req: Request,
  ) {
    return this.commercial.rejectOffer(user, id, body.reason, ctx(req));
  }
}

@ApiTags('Ordres de mission')
@Controller('mission-orders')
class MissionOrdersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermission('mission_order', 'VIEW')
  async list(@CurrentUser() user: RequestUser, @Query('status') status?: string) {
    const rows = await this.prisma.missionOrder.findMany({
      where: { ...(status ? { status: status as never } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        mission: {
          select: {
            number: true,
            plannedStartDate: true,
            plannedEndDate: true,
            affair: { select: { id: true, number: true, client: { select: { name: true } } } },
            site: { select: { name: true, city: true } },
            vehicle: { select: { plate: true } },
            assignments: {
              include: { employee: { select: { firstName: true, lastName: true } } },
            },
          },
        },
        approvals: { orderBy: { step: 'asc' } },
      },
    });

    return {
      items: rows.map((om) => ({
        id: om.id,
        number: om.number,
        object: om.object,
        status: om.status,
        signedAt: om.signedAt,
        /** Empreinte du PDF signé — preuve d'intégrité (docs/05, W3). */
        hasSignature: Boolean(om.signatureHash),
        signatureHash: om.signatureHash ? `${om.signatureHash.slice(0, 12)}…` : null,
        mission: {
          number: om.mission.number,
          start: om.mission.plannedStartDate,
          end: om.mission.plannedEndDate,
          site: om.mission.site?.name ?? null,
          vehicle: om.mission.vehicle?.plate ?? null,
        },
        affair: om.mission.affair,
        client: om.mission.affair.client.name,
        inspectors: om.mission.assignments.map(
          (a) => `${a.employee.lastName.toUpperCase()} ${a.employee.firstName}`,
        ),
        approvalCount: om.approvals.length,
      })),
    };
  }
}

@Module({
  imports: [AffairsModule, OfferDraftingModule],
  controllers: [CommercialController, MissionOrdersController],
  providers: [CommercialService],
  exports: [CommercialService],
})
export class CommercialModule {}
