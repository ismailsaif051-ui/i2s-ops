import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { isOverdue } from '@i2s/calc';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
import { AffairsService } from '../affairs/affairs.service';
import type { RequestUser } from '../common/types';
import { sumShares } from '../timesheets/day-split';

/** Taux de TVA par défaut au Maroc, ajustable par affaire à la facturation. */
const DEFAULT_VAT_RATE = 20;

export interface PreparedLine {
  missionId: string | null;
  missionNumber: string | null;
  designation: string;
  /** Temps réellement passé, en journées (parts comprises). */
  days: number;
  /** Unité de facturation prévue au bon de commande. */
  unit: BillingUnit;
  /** Ce qui est facturé, dans cette unité. */
  quantity: number;
  /** Pourquoi la quantité est nulle ou à confirmer — affiché à l'écran. */
  quantityNote: string | null;
  /** Prix unitaire retenu, et d'où il vient. */
  unitRate: number | null;
  rateSource: 'AFFAIR_RATE' | 'PO_UNIT_PRICE' | 'AFFAIR_DAILY_RATE' | 'MISSING';
  amountHT: number;
  timesheetDayIds: string[];
}

export const BILLING_UNITS = ['VACATION', 'INTERVENTION', 'UNIT', 'FIXED'] as const;
export type BillingUnit = (typeof BILLING_UNITS)[number];

/** Libellés des unités, tels qu'ils figurent sur l'attachement et la facture. */
export const BILLING_UNIT_LABELS: Record<BillingUnit, { name: string; unit: string }> = {
  VACATION: { name: 'À la vacation', unit: 'vacation(s)' },
  INTERVENTION: { name: 'À l’intervention', unit: 'intervention(s)' },
  UNIT: { name: 'À l’unité (équipement contrôlé)', unit: 'équipement(s)' },
  FIXED: { name: 'Au forfait', unit: 'forfait' },
};

/**
 * L'unité d'un barème d'affaire, saisie en texte libre à l'origine
 * (« vacation », « forfait »…), ramenée aux quatre unités connues.
 */
export function unitFromRate(raw: string | null | undefined): BillingUnit | null {
  const value = (raw ?? '').trim().toLowerCase();
  if (!value) return null;
  if (value.startsWith('vac') || value.startsWith('jour') || value === 'day') return 'VACATION';
  if (value.startsWith('interv')) return 'INTERVENTION';
  if (value.startsWith('unit') || value.startsWith('équip') || value.startsWith('equip')) return 'UNIT';
  if (value.startsWith('forf') || value === 'fixed') return 'FIXED';
  return null;
}

/**
 * Ce que le client paie pour une mission, selon son bon de commande.
 *
 *   - à la vacation     : les journées passées, demi-journées comprises ;
 *   - à l'intervention  : chaque jour où la mission a eu lieu compte 1 ;
 *   - à l'unité         : le nombre d'équipements contrôlés ;
 *   - au forfait        : une fois par mission, jamais deux.
 */
export function billedQuantity(
  unit: BillingUnit,
  input: { days: number; interventionDays: number; equipments: number; alreadyBilled: boolean },
): { quantity: number; note: string | null } {
  switch (unit) {
    case 'VACATION':
      return { quantity: input.days, note: null };
    case 'INTERVENTION':
      return { quantity: input.interventionDays, note: null };
    case 'UNIT':
      return input.equipments > 0
        ? { quantity: input.equipments, note: null }
        : {
            quantity: 0,
            note: 'Aucun rapport d’inspection enregistré sur la période : indiquez le nombre d’équipements contrôlés.',
          };
    case 'FIXED':
      return input.alreadyBilled
        ? { quantity: 0, note: 'Forfait déjà porté sur un attachement précédent.' }
        : { quantity: 1, note: null };
  }
}

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly numbering: NumberingService,
    private readonly affairs: AffairsService,
  ) {}

  /* ── Préparation de l'attachement ─────────────────────────────── */

  /**
   * Ce qu'il y a à facturer sur une affaire, pour une période.
   *
   * Seules les journées **visées** et **facturables** entrent : une journée
   * que personne n'a validée ne se facture pas, et une journée d'intervention
   * non facturable — reprise, geste commercial — n'a rien à faire ici.
   * Une journée déjà portée par un attachement est écartée : elle ne se
   * facture pas deux fois.
   */
  async prepare(user: RequestUser, affairId: string, from: Date, to: Date): Promise<{
    affair: { id: string; number: string; title: string; client: string; clientId: string };
    period: { from: string; to: string };
    lines: PreparedLine[];
    totalHT: number;
    missingRates: number;
  }> {
    const affair = await this.affair(user, affairId);

    const days = await this.prisma.timesheetDay.findMany({
      where: {
        affairId,
        date: { gte: from, lte: to },
        status: 'VALIDATED',
        billable: true,
        attachmentLines: { none: {} },
      },
      include: {
        mission: { select: { id: true, number: true, objective: true, serviceType: true } },
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { date: 'asc' },
    });

    const missionIds = [
      ...new Set(days.map((d) => d.missionId).filter((id): id is string => Boolean(id))),
    ];

    const [rates, inspections, billedBefore] = await Promise.all([
      this.prisma.affairRate.findMany({
        where: { affairId, validFrom: { lte: to } },
        orderBy: { validFrom: 'desc' },
      }),
      // À l'unité : un rapport d'inspection soumis = un équipement contrôlé.
      this.prisma.inspection.groupBy({
        by: ['missionId'],
        where: {
          missionId: { in: missionIds },
          date: { gte: from, lte: to },
          status: { in: ['SUBMITTED', 'ACCEPTED'] },
        },
        _count: { _all: true },
      }),
      // Au forfait : une mission déjà portée sur un attachement ne se refacture pas.
      this.prisma.attachmentLine.findMany({
        where: { missionId: { in: missionIds } },
        select: { missionId: true },
        distinct: ['missionId'],
      }),
    ]);

    const equipmentsBy = new Map(inspections.map((i) => [i.missionId, i._count._all]));
    const alreadyBilled = new Set(billedBefore.map((b) => b.missionId));
    const poUnitPrice = affair.poUnitPrice === null ? null : Number(affair.poUnitPrice);
    const dailyRate = affair.dailyRate === null ? null : Number(affair.dailyRate);

    // Une ligne par mission : c'est ce que le client reconnaît sur le terrain.
    const byMission = new Map<string, PreparedLine & { dates: Set<string> }>();

    for (const day of days) {
      const key = day.missionId ?? 'sans-mission';
      const serviceType = day.mission?.serviceType ?? null;
      const rate = serviceType ? (rates.find((r) => r.serviceType === serviceType) ?? null) : null;

      // L'unité suit le barème de la prestation s'il en fixe une, sinon le
      // bon de commande de l'affaire.
      const unit: BillingUnit = unitFromRate(rate?.unit) ?? (affair.billingUnit as BillingUnit);

      // Le prix : barème de la prestation, puis prix unitaire du BC, puis —
      // à la vacation seulement — l'ancien taux journalier de l'affaire.
      const unitRate = rate
        ? Number(rate.unitPrice)
        : poUnitPrice !== null
          ? poUnitPrice
          : unit === 'VACATION'
            ? dailyRate
            : null;
      const rateSource: PreparedLine['rateSource'] = rate
        ? 'AFFAIR_RATE'
        : poUnitPrice !== null
          ? 'PO_UNIT_PRICE'
          : unit === 'VACATION' && dailyRate !== null
            ? 'AFFAIR_DAILY_RATE'
            : 'MISSING';

      const line =
        byMission.get(key) ??
        {
          missionId: day.missionId,
          missionNumber: day.mission?.number ?? null,
          designation: day.mission
            ? `${day.mission.number} — ${day.mission.objective ?? 'intervention'}`
            : 'Journées rattachées à l’affaire',
          days: 0,
          unit,
          quantity: 0,
          quantityNote: null,
          unitRate,
          rateSource,
          amountHT: 0,
          timesheetDayIds: [],
          dates: new Set<string>(),
        };

      // Une journée partagée entre plusieurs interventions n'apporte que sa part.
      line.days = sumShares([line.days, Number(day.share)]);
      line.dates.add(iso(day.date));
      line.timesheetDayIds.push(day.id);
      byMission.set(key, line);
    }

    for (const line of byMission.values()) {
      const { quantity, note } = billedQuantity(line.unit, {
        days: line.days,
        interventionDays: line.dates.size,
        equipments: line.missionId ? (equipmentsBy.get(line.missionId) ?? 0) : 0,
        alreadyBilled: line.missionId ? alreadyBilled.has(line.missionId) : false,
      });
      line.quantity = quantity;
      line.quantityNote = note;
      line.amountHT = line.unitRate === null ? 0 : round(quantity * line.unitRate);
    }

    const lines: PreparedLine[] = [...byMission.values()]
      .map(({ dates: _dates, ...line }) => line)
      .sort((a, b) =>
      (a.missionNumber ?? '').localeCompare(b.missionNumber ?? ''),
    );

    return {
      affair: {
        id: affair.id,
        number: affair.number,
        title: affair.title,
        client: affair.client.name,
        clientId: affair.clientId,
      },
      period: { from: iso(from), to: iso(to) },
      lines,
      totalHT: round(lines.reduce((sum, l) => sum + l.amountHT, 0)),
      missingRates: lines.filter((l) => l.rateSource === 'MISSING').length,
    };
  }

  /* ── Création de l'attachement ────────────────────────────────── */

  /**
   * Fige les journées de la période dans un attachement.
   *
   * L'attachement est la pièce que le client signe : il reconnaît les
   * journées passées chez lui. Sans lui, une facture n'a rien à opposer à une
   * contestation.
   */
  async createAttachment(
    user: RequestUser,
    input: {
      affairId: string;
      periodStart: Date;
      periodEnd: Date;
      rates?: Record<string, number>;
      /** Quantité saisie à la main, par mission — à l'unité surtout. */
      quantities?: Record<string, number>;
    },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    if (input.periodEnd < input.periodStart) {
      throw new BadRequestException('La fin de période précède son début.');
    }

    const prepared = await this.prepare(user, input.affairId, input.periodStart, input.periodEnd);

    if (prepared.lines.length === 0) {
      throw new BadRequestException(
        'Aucune journée visée et facturable sur cette période : rien à attacher.',
      );
    }

    // Le prix et la quantité viennent de la saisie, sinon du bon de commande.
    const lines = prepared.lines.map((line) => {
      const rateOverride = line.missionId ? input.rates?.[line.missionId] : undefined;
      const quantityOverride = line.missionId ? input.quantities?.[line.missionId] : undefined;
      const unitRate = rateOverride ?? line.unitRate;
      const quantity = quantityOverride ?? line.quantity;
      return {
        ...line,
        unitRate,
        quantity,
        amountHT: unitRate === null ? 0 : round(quantity * unitRate),
      };
    });

    // À l'unité, une quantité nulle veut dire qu'on ne sait pas ce qui a été
    // contrôlé : on ne facture pas zéro équipement par défaut.
    const noQuantity = lines.filter((l) => l.unit === 'UNIT' && l.quantity <= 0);
    if (noQuantity.length > 0) {
      throw new BadRequestException({
        message: 'Nombre d’équipements contrôlés manquant.',
        errors: noQuantity.map((l) => ({
          field: l.missionNumber ?? 'affaire',
          message: 'Indiquez le nombre d’équipements contrôlés sur cette mission.',
        })),
      });
    }

    // Un forfait déjà facturé porte une quantité nulle, sans prix à réclamer.
    const missing = lines.filter(
      (l) => l.quantity > 0 && (l.unitRate === null || l.unitRate <= 0),
    );
    if (missing.length > 0) {
      throw new BadRequestException({
        message: 'Prix unitaire manquant : renseignez le barème de l’affaire ou saisissez-le ici.',
        errors: missing.map((l) => ({
          field: l.missionNumber ?? 'affaire',
          message: 'Aucun prix unitaire connu pour cette prestation.',
        })),
      });
    }

    const affair = await this.affair(user, input.affairId);
    const totalHT = round(lines.reduce((sum, l) => sum + l.amountHT, 0));

    const sheet = await this.prisma.$transaction(async (tx) => {
      const number = await this.numbering.next(affair.companyId, 'ATTACHMENT', {}, tx);

      const created = await tx.attachmentSheet.create({
        data: {
          number,
          affairId: affair.id,
          clientId: affair.clientId,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          status: 'DRAFT',
          totalHT,
        },
      });

      for (const line of lines) {
        await tx.attachmentLine.create({
          data: {
            attachmentSheetId: created.id,
            missionId: line.missionId,
            designation: line.designation,
            days: line.days,
            unit: line.unit,
            quantity: line.quantity,
            unitRate: line.unitRate ?? 0,
            amountHT: line.amountHT,
            // Le rattachement des journées est ce qui empêche de les
            // facturer une seconde fois.
            timesheetDays: { connect: line.timesheetDayIds.map((id) => ({ id })) },
          },
        });
      }

      return created;
    });

    await this.audit.record(
      {
        entity: 'attachment',
        entityId: sheet.id,
        action: 'CREATE',
        after: {
          number: sheet.number,
          affair: affair.number,
          period: `${iso(input.periodStart)} → ${iso(input.periodEnd)}`,
          days: lines.reduce((sum, l) => sum + l.days, 0),
          totalHT,
        },
        companyId: affair.companyId,
      },
      { user, ...ctx },
    );

    return sheet;
  }

  /* ── Circuit de l'attachement ─────────────────────────────────── */

  /** Transmis au client pour signature. */
  async submitAttachment(
    user: RequestUser,
    id: string,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const sheet = await this.attachment(user, id);

    if (sheet.status !== 'DRAFT' && sheet.status !== 'CORRECTION') {
      throw new BadRequestException(
        `Un attachement « ${sheet.status} » n’est plus à transmettre.`,
      );
    }

    const updated = await this.prisma.attachmentSheet.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    });

    await this.audit.record(
      {
        entity: 'attachment',
        entityId: id,
        action: 'SUBMIT',
        before: { status: sheet.status },
        after: { status: updated.status },
        companyId: sheet.affair.companyId,
      },
      { user, ...ctx },
    );

    return updated;
  }

  /** Signé par le client : l'attachement devient facturable. */
  async validateAttachment(
    user: RequestUser,
    id: string,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const sheet = await this.attachment(user, id);

    if (sheet.status !== 'SUBMITTED') {
      throw new BadRequestException(
        'Seul un attachement transmis au client peut être déclaré signé.',
      );
    }

    const updated = await this.prisma.attachmentSheet.update({
      where: { id },
      data: { status: 'VALIDATED', validatedAt: new Date(), validatedById: user.employeeId },
    });

    await this.audit.record(
      {
        entity: 'attachment',
        entityId: id,
        action: 'VALIDATE',
        before: { status: sheet.status },
        after: { status: updated.status },
        companyId: sheet.affair.companyId,
      },
      { user, ...ctx },
    );

    return updated;
  }

  /* ── Facture ──────────────────────────────────────────────────── */

  /**
   * Facture un ou plusieurs attachements signés.
   *
   * Une facture ne s'invente pas : elle reprend des attachements que le
   * client a reconnus. L'échéance découle du délai de règlement contractuel
   * du client — c'est ce qui rend le suivi des retards opposable.
   */
  async createInvoice(
    user: RequestUser,
    input: { attachmentIds: string[]; issueDate?: Date; vatRate?: number; notes?: string | null },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const sheets = await this.prisma.attachmentSheet.findMany({
      where: { id: { in: input.attachmentIds } },
      include: {
        lines: true,
        affair: { select: { id: true, number: true, companyId: true } },
        client: { select: { id: true, name: true, paymentTerms: true } },
      },
    });

    if (sheets.length !== input.attachmentIds.length) {
      throw new BadRequestException('Un attachement demandé est introuvable.');
    }

    const notSigned = sheets.filter((s) => s.status !== 'VALIDATED');
    if (notSigned.length > 0) {
      throw new BadRequestException({
        message: 'Un attachement non signé par le client ne se facture pas.',
        errors: notSigned.map((s) => ({ field: s.number, message: `Statut ${s.status}.` })),
      });
    }

    const clientIds = new Set(sheets.map((s) => s.clientId));
    if (clientIds.size > 1) {
      throw new BadRequestException(
        'Une facture ne porte qu’un seul client : séparez les attachements.',
      );
    }

    const client = sheets[0]!.client;
    const companyId = sheets[0]!.affair.companyId;
    const affairIds = new Set(sheets.map((s) => s.affairId));

    const issueDate = input.issueDate ?? new Date();
    const dueDate = addDays(issueDate, client.paymentTerms);
    const vatRate = input.vatRate ?? DEFAULT_VAT_RATE;

    const lines = sheets.flatMap((sheet) =>
      sheet.lines.map((line) => ({
        designation: `${sheet.number} · ${line.designation} (${BILLING_UNIT_LABELS[line.unit as BillingUnit].unit})`,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitRate),
        amountHT: Number(line.amountHT),
      })),
    );

    const totalHT = round(lines.reduce((sum, l) => sum + l.amountHT, 0));
    const totalTTC = round(totalHT * (1 + vatRate / 100));

    const invoice = await this.prisma.$transaction(async (tx) => {
      const number = await this.numbering.next(companyId, 'INVOICE', {}, tx);

      const created = await tx.invoice.create({
        data: {
          companyId,
          number,
          clientId: client.id,
          affairId: affairIds.size === 1 ? [...affairIds][0]! : null,
          issueDate,
          dueDate,
          totalHT,
          vatRate,
          totalTTC,
          status: 'DRAFT',
          notes: input.notes?.trim() || null,
          lines: {
            create: lines.map((line, index) => ({
              position: index + 1,
              designation: line.designation,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              amountHT: line.amountHT,
              vatRate,
            })),
          },
          attachments: {
            create: sheets.map((s) => ({ attachmentSheetId: s.id })),
          },
        },
      });

      // Les attachements facturés ne peuvent plus l'être ailleurs.
      await tx.attachmentSheet.updateMany({
        where: { id: { in: sheets.map((s) => s.id) } },
        data: { status: 'INVOICED' },
      });

      return created;
    });

    await this.audit.record(
      {
        entity: 'invoice',
        entityId: invoice.id,
        action: 'CREATE',
        after: {
          number: invoice.number,
          client: client.name,
          attachments: sheets.map((s) => s.number),
          totalHT,
          totalTTC,
          dueDate: iso(dueDate),
        },
        companyId,
      },
      { user, ...ctx },
    );

    return invoice;
  }

  /** Émise : la facture part chez le client et court à l'échéance. */
  async issueInvoice(
    user: RequestUser,
    id: string,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const invoice = await this.invoice(user, id);

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException(`Une facture « ${invoice.status} » est déjà émise.`);
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: 'ISSUED' },
    });

    await this.audit.record(
      {
        entity: 'invoice',
        entityId: id,
        action: 'ISSUE',
        before: { status: invoice.status },
        after: { status: updated.status, dueDate: iso(invoice.dueDate) },
        companyId: invoice.companyId,
      },
      { user, ...ctx },
    );

    return updated;
  }

  /* ── Encaissement ─────────────────────────────────────────────── */

  /**
   * Enregistre un règlement.
   *
   * Le solde décide du statut : une facture n'est soldée que lorsque tout est
   * encaissé, et jamais au-delà — un encaissement excédentaire cache toujours
   * une erreur d'imputation.
   */
  async addPayment(
    user: RequestUser,
    invoiceId: string,
    input: { amount: number; date?: Date; method: string; bankReference?: string | null },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const invoice = await this.invoice(user, invoiceId);

    if (invoice.status === 'DRAFT') {
      throw new BadRequestException('Une facture non émise ne s’encaisse pas.');
    }
    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cette facture est annulée.');
    }
    if (input.amount <= 0) {
      throw new BadRequestException('Le montant d’un règlement est strictement positif.');
    }

    // Un avoir réduit ce que le client doit, au même titre qu'un règlement.
    const paid =
      invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0) +
      invoice.creditNotes.reduce((sum, c) => sum + Number(c.amountTTC), 0);
    const total = Number(invoice.totalTTC);
    const outcome = settle(total, paid, input.amount);

    if (!outcome.accepted) {
      throw new BadRequestException(
        `Le règlement dépasse le solde dû (${round(total - paid).toFixed(2)} DH). Vérifiez l’imputation.`,
      );
    }

    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          invoiceId,
          date: input.date ?? new Date(),
          amount: input.amount,
          method: input.method,
          bankReference: input.bankReference?.trim() || null,
        },
      });

      // Un acompte sur une facture déjà échue ne la remet pas « dans les
      // temps » : il reste un solde, toujours en retard.
      const status =
        outcome.status === 'PARTIALLY_PAID' && isOverdue(invoice.dueDate, outcome.remaining, new Date())
          ? 'OVERDUE'
          : outcome.status;
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status },
      });

      return created;
    });

    await this.audit.record(
      {
        entity: 'payment',
        entityId: payment.id,
        action: 'CREATE',
        after: {
          invoice: invoice.number,
          amount: input.amount,
          method: input.method,
          remaining: outcome.remaining,
        },
        companyId: invoice.companyId,
      },
      { user, ...ctx },
    );

    return payment;
  }

  /* ── Avoir ────────────────────────────────────────────────────── */

  /**
   * Émet un avoir sur une facture.
   *
   * Une facture émise ne se modifie jamais : une erreur de quantité, un geste
   * commercial ou une annulation se corrigent par un avoir, numéroté à part,
   * au même taux de TVA que la facture. Il réduit le chiffre d'affaires de
   * l'affaire et ce que le client doit.
   */
  async createCreditNote(
    user: RequestUser,
    invoiceId: string,
    input: { amountHT: number; reason: string; issueDate?: Date },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const invoice = await this.invoice(user, invoiceId);

    if (invoice.status === 'DRAFT') {
      throw new BadRequestException('Une facture en brouillon se corrige directement : elle n’a pas besoin d’avoir.');
    }
    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cette facture est annulée.');
    }

    const vatRate = Number(invoice.vatRate);
    const outcome = creditOutcome({
      totalHT: Number(invoice.totalHT),
      totalTTC: Number(invoice.totalTTC),
      vatRate,
      creditedHT: invoice.creditNotes.reduce((s, c) => s + Number(c.amount), 0),
      creditedTTC: invoice.creditNotes.reduce((s, c) => s + Number(c.amountTTC), 0),
      paid: invoice.payments.reduce((s, p) => s + Number(p.amount), 0),
      amountHT: input.amountHT,
    });
    if (!outcome.accepted) throw new BadRequestException(outcome.reason);

    const creditNote = await this.prisma.$transaction(async (tx) => {
      const number = await this.numbering.next(invoice.companyId, 'CREDIT_NOTE', {}, tx);
      const created = await tx.creditNote.create({
        data: {
          invoiceId,
          number,
          amount: round(input.amountHT),
          vatRate,
          amountTTC: outcome.amountTTC,
          reason: input.reason,
          issueDate: input.issueDate ?? new Date(),
          createdById: user.id,
        },
      });
      // Plus rien à payer : la facture est soldée.
      if (outcome.remaining <= 0) {
        await tx.invoice.update({ where: { id: invoiceId }, data: { status: 'PAID' } });
      }
      return created;
    });

    await this.audit.record(
      {
        entity: 'credit_note',
        entityId: creditNote.id,
        action: 'CREATE',
        after: {
          number: creditNote.number,
          invoice: invoice.number,
          amountHT: round(input.amountHT),
          amountTTC: outcome.amountTTC,
          remaining: outcome.remaining,
        },
        reason: input.reason,
        companyId: invoice.companyId,
      },
      { user, ...ctx },
    );

    return { ...creditNote, remaining: outcome.remaining };
  }

  /* ── Lectures internes ────────────────────────────────────────── */

  async attachment(user: RequestUser, id: string) {
    const sheet = await this.prisma.attachmentSheet.findFirst({
      where: { id, affair: this.affairs.affairWhere(user, 'VIEW') },
      include: {
        affair: { select: { id: true, number: true, title: true, companyId: true } },
        client: { select: { id: true, name: true, paymentTerms: true } },
        lines: {
          include: { mission: { select: { number: true, objective: true } } },
          orderBy: { designation: 'asc' },
        },
        invoices: { include: { invoice: { select: { id: true, number: true, status: true } } } },
      },
    });

    if (!sheet) throw new NotFoundException('Attachement introuvable.');
    return sheet;
  }

  async invoice(user: RequestUser, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, companyId: { in: user.companyIds } },
      include: {
        client: { select: { id: true, name: true, paymentTerms: true } },
        affair: { select: { id: true, number: true, title: true } },
        lines: { orderBy: { position: 'asc' } },
        payments: { orderBy: { date: 'asc' } },
        creditNotes: { orderBy: { issueDate: 'asc' } },
        attachments: {
          include: { attachmentSheet: { select: { id: true, number: true, totalHT: true } } },
        },
      },
    });

    if (!invoice) throw new NotFoundException('Facture introuvable.');
    return invoice;
  }

  private async affair(user: RequestUser, affairId: string) {
    const affair = await this.prisma.affair.findFirst({
      where: { id: affairId, deletedAt: null, ...this.affairs.affairWhere(user, 'VIEW') },
      select: {
        id: true,
        number: true,
        title: true,
        companyId: true,
        clientId: true,
        dailyRate: true,
        billingUnit: true,
        poUnitPrice: true,
        client: { select: { name: true } },
      },
    });

    if (!affair) throw new NotFoundException('Affaire introuvable ou hors de votre périmètre.');
    return affair;
  }
}

/* ── Avoir ────────────────────────────────────────────────────────── */

/**
 * Ce qu'un avoir peut couvrir.
 *
 * - Jamais plus que le hors-taxes de la facture non encore crédité.
 * - Jamais plus que ce que le client doit encore : au-delà, l'avoir
 *   créerait un trop-perçu à lui rembourser, et l'application ne gère pas
 *   encore les remboursements.
 */
export function creditOutcome(input: {
  totalHT: number;
  totalTTC: number;
  vatRate: number;
  creditedHT: number;
  creditedTTC: number;
  paid: number;
  amountHT: number;
}): { accepted: true; amountTTC: number; remaining: number } | { accepted: false; reason: string } {
  if (!(input.amountHT > 0)) {
    return { accepted: false, reason: 'Le montant d’un avoir est strictement positif.' };
  }
  const creditableHT = round(input.totalHT - input.creditedHT);
  if (input.amountHT > creditableHT + 0.005) {
    return {
      accepted: false,
      reason: `L’avoir dépasse le montant restant de la facture (${creditableHT.toFixed(2)} DH HT déjà crédités compris).`,
    };
  }
  // Dernier avoir qui solde le HT : il reprend exactement le TTC restant, pour
  // ne laisser aucun centime d'arrondi de TVA.
  const amountTTC =
    Math.abs(input.amountHT - creditableHT) < 0.005
      ? round(input.totalTTC - input.creditedTTC)
      : round(input.amountHT * (1 + input.vatRate / 100));
  const open = round(input.totalTTC - input.paid - input.creditedTTC);
  if (amountTTC > open + 0.01) {
    return {
      accepted: false,
      reason: `L’avoir (${amountTTC.toFixed(2)} DH TTC) dépasse ce que le client doit encore (${open.toFixed(2)} DH). Le remboursement d’un client déjà réglé n’est pas encore pris en charge.`,
    };
  }
  const remaining = round(open - amountTTC);
  return { accepted: true, amountTTC, remaining: remaining > 0.01 ? remaining : 0 };
}

/* ── Solde ────────────────────────────────────────────────────────── */

/**
 * Ce que devient une facture après un règlement.
 *
 * La tolérance d'un centime absorbe les arrondis de TVA : sans elle, une
 * facture réglée à l'euro près resterait éternellement « partiellement
 * réglée » pour un écart d'arrondi.
 */
export function settle(
  total: number,
  alreadyPaid: number,
  amount: number,
): { accepted: boolean; status: 'PARTIALLY_PAID' | 'PAID'; remaining: number } {
  const remaining = round(total - alreadyPaid);
  const accepted = amount > 0 && amount <= remaining + 0.01;
  const paid = round(alreadyPaid + amount);

  return {
    accepted,
    status: paid >= total - 0.01 ? 'PAID' : 'PARTIALLY_PAID',
    remaining: round(total - paid),
  };
}

/* ── Utilitaires ──────────────────────────────────────────────────── */

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}
