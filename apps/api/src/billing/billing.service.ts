import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
import { AffairsService } from '../affairs/affairs.service';
import type { RequestUser } from '../common/types';

/** Taux de TVA par défaut au Maroc, ajustable par affaire à la facturation. */
const DEFAULT_VAT_RATE = 20;

export interface PreparedLine {
  missionId: string | null;
  missionNumber: string | null;
  designation: string;
  days: number;
  /** Prix unitaire retenu, et d'où il vient. */
  unitRate: number | null;
  rateSource: 'AFFAIR_RATE' | 'AFFAIR_DAILY_RATE' | 'MISSING';
  amountHT: number;
  timesheetDayIds: string[];
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

    const rates = await this.prisma.affairRate.findMany({
      where: { affairId, validFrom: { lte: to } },
      orderBy: { validFrom: 'desc' },
    });
    const fallback = affair.dailyRate === null ? null : Number(affair.dailyRate);

    // Une ligne par mission : c'est ce que le client reconnaît sur le terrain.
    const byMission = new Map<string, PreparedLine>();

    for (const day of days) {
      const key = day.missionId ?? 'sans-mission';
      const serviceType = day.mission?.serviceType ?? null;

      const rate = serviceType
        ? (rates.find((r) => r.serviceType === serviceType) ?? null)
        : null;
      const unitRate = rate ? Number(rate.unitPrice) : fallback;

      const line =
        byMission.get(key) ??
        ({
          missionId: day.missionId,
          missionNumber: day.mission?.number ?? null,
          designation: day.mission
            ? `${day.mission.number} — ${day.mission.objective ?? 'intervention'}`
            : 'Journées rattachées à l’affaire',
          days: 0,
          unitRate,
          rateSource: rate ? 'AFFAIR_RATE' : fallback !== null ? 'AFFAIR_DAILY_RATE' : 'MISSING',
          amountHT: 0,
          timesheetDayIds: [],
        } satisfies PreparedLine);

      line.days += 1;
      line.timesheetDayIds.push(day.id);
      line.amountHT = line.unitRate === null ? 0 : round(line.days * line.unitRate);
      byMission.set(key, line);
    }

    const lines = [...byMission.values()].sort((a, b) =>
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
    input: { affairId: string; periodStart: Date; periodEnd: Date; rates?: Record<string, number> },
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

    // Le prix vient de la saisie, sinon du barème de l'affaire.
    const lines = prepared.lines.map((line) => {
      const override = line.missionId ? input.rates?.[line.missionId] : undefined;
      const unitRate = override ?? line.unitRate;
      return { ...line, unitRate, amountHT: unitRate === null ? 0 : round(line.days * unitRate) };
    });

    const missing = lines.filter((l) => l.unitRate === null || l.unitRate <= 0);
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
            unitRate: line.unitRate!,
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
        designation: `${sheet.number} · ${line.designation}`,
        quantity: Number(line.days),
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

    const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
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

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: outcome.status },
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
        client: { select: { name: true } },
      },
    });

    if (!affair) throw new NotFoundException('Affaire introuvable ou hors de votre périmètre.');
    return affair;
  }
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
