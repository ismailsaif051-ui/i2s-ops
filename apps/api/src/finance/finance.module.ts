import { Controller, Get, Module, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { dso } from '@i2s/calc';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeService } from '../rbac/scope.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import type { RequestUser } from '../common/types';

const AFFAIR_SCOPE = {
  companyPath: 'affair.companyId',
  departmentPath: 'affair.departmentId',
  ownerPath: 'affair.accountManagerId',
  teamPath: 'affair.accountManagerId',
} as const;

@ApiTags('Facturation & encaissement')
@Controller()
class FinanceController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: ScopeService,
  ) {}

  @Get('invoices')
  @RequirePermission('invoice', 'VIEW')
  async invoices(@CurrentUser() user: RequestUser, @Query('status') status?: string) {
    const rows = await this.prisma.invoice.findMany({
      where: {
        companyId: { in: user.companyIds },
        ...(status ? { status: status as never } : {}),
      },
      orderBy: { issueDate: 'desc' },
      take: 300,
      include: {
        client: { select: { name: true } },
        affair: { select: { id: true, number: true, title: true } },
        payments: { select: { amount: true, date: true } },
        attachments: { select: { attachmentSheetId: true } },
      },
    });

    const today = new Date();

    return {
      items: rows.map((invoice) => {
        const paid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
        const totalTTC = Number(invoice.totalTTC);
        const overdueDays =
          paid < totalTTC && invoice.dueDate < today
            ? Math.floor((today.getTime() - invoice.dueDate.getTime()) / 86_400_000)
            : 0;

        return {
          id: invoice.id,
          number: invoice.number,
          client: invoice.client.name,
          affair: invoice.affair,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          totalHT: Number(invoice.totalHT),
          totalTTC,
          paid,
          balance: Math.round((totalTTC - paid) * 100) / 100,
          status: invoice.status,
          overdueDays,
          attachmentCount: invoice.attachments.length,
        };
      }),
    };
  }

  /** Échéancier, balance âgée et DSO — la vue du RAF. */
  @Get('receivables')
  @RequirePermission('payment', 'VIEW')
  async receivables(@CurrentUser() user: RequestUser) {
    const invoices = await this.prisma.invoice.findMany({
      where: { companyId: { in: user.companyIds }, status: { not: 'CANCELLED' } },
      include: {
        client: { select: { id: true, name: true } },
        payments: { select: { amount: true } },
        dunnings: { orderBy: { level: 'desc' }, take: 1 },
      },
    });

    const today = new Date();
    const buckets = { current: 0, d0_30: 0, d31_60: 0, d61_90: 0, d90plus: 0 };
    let invoiced = 0;
    let collected = 0;
    let outstanding = 0;

    const openInvoices: Array<{
      id: string;
      number: string;
      client: string;
      dueDate: Date;
      balance: number;
      overdueDays: number;
      dunningLevel: number | null;
    }> = [];

    for (const invoice of invoices) {
      const totalTTC = Number(invoice.totalTTC);
      const paid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
      invoiced += totalTTC;
      collected += paid;

      const balance = totalTTC - paid;
      if (balance <= 0.01) continue;
      outstanding += balance;

      const overdueDays = Math.floor((today.getTime() - invoice.dueDate.getTime()) / 86_400_000);
      if (overdueDays <= 0) buckets.current += balance;
      else if (overdueDays <= 30) buckets.d0_30 += balance;
      else if (overdueDays <= 60) buckets.d31_60 += balance;
      else if (overdueDays <= 90) buckets.d61_90 += balance;
      else buckets.d90plus += balance;

      openInvoices.push({
        id: invoice.id,
        number: invoice.number,
        client: invoice.client.name,
        dueDate: invoice.dueDate,
        balance: Math.round(balance * 100) / 100,
        overdueDays: Math.max(0, overdueDays),
        dunningLevel: invoice.dunnings[0]?.level ?? null,
      });
    }

    // Regroupement par client — c'est ainsi que se conduit une relance.
    const byClient = new Map<string, { client: string; balance: number; count: number; worstDays: number }>();
    for (const inv of openInvoices) {
      const entry = byClient.get(inv.client) ?? {
        client: inv.client,
        balance: 0,
        count: 0,
        worstDays: 0,
      };
      entry.balance += inv.balance;
      entry.count += 1;
      entry.worstDays = Math.max(entry.worstDays, inv.overdueDays);
      byClient.set(inv.client, entry);
    }

    return {
      totals: {
        invoiced: Math.round(invoiced),
        collected: Math.round(collected),
        outstanding: Math.round(outstanding),
        collectionRate: invoiced > 0 ? Math.round((collected / invoiced) * 1000) / 10 : 0,
        dso: dso(outstanding, invoiced, 365),
      },
      aging: Object.fromEntries(
        Object.entries(buckets).map(([k, v]) => [k, Math.round(v)]),
      ) as Record<keyof typeof buckets, number>,
      invoices: openInvoices.sort((a, b) => b.overdueDays - a.overdueDays),
      byClient: [...byClient.values()].sort((a, b) => b.balance - a.balance),
    };
  }

  @Get('attachments')
  @RequirePermission('attachment', 'VIEW')
  async attachments(@CurrentUser() user: RequestUser, @Query('status') status?: string) {
    const scopeWhere = this.scope.buildWhere(user, 'attachment', 'VIEW', AFFAIR_SCOPE);

    const rows = await this.prisma.attachmentSheet.findMany({
      where: { ...scopeWhere, ...(status ? { status: status as never } : {}) },
      orderBy: [{ periodStart: 'desc' }, { number: 'asc' }],
      take: 300,
      include: {
        affair: { select: { id: true, number: true, title: true } },
        client: { select: { name: true } },
        lines: { select: { days: true } },
        invoices: { select: { invoiceId: true } },
      },
    });

    return {
      items: rows.map((sheet) => ({
        id: sheet.id,
        number: sheet.number,
        affair: sheet.affair,
        client: sheet.client.name,
        periodStart: sheet.periodStart,
        periodEnd: sheet.periodEnd,
        status: sheet.status,
        totalHT: Number(sheet.totalHT),
        days: sheet.lines.reduce((s, l) => s + Number(l.days), 0),
        lineCount: sheet.lines.length,
        invoiced: sheet.invoices.length > 0,
        validatedAt: sheet.validatedAt,
      })),
    };
  }
}

@Module({
  controllers: [FinanceController],
})
export class FinanceModule {}
