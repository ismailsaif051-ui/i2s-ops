import { Injectable } from '@nestjs/common';
import {
  breakdown,
  idleCost as idleCostOf,
  netProductivity,
  nonBillableSiteCost,
  onTimeRate,
  profitability,
  CATEGORY_LABELS,
  type CategoryCounts,
  type TimesheetCategory,
  type TimesheetFact,
} from '@i2s/calc';
import { can } from '@i2s/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeService } from '../rbac/scope.service';
import { REPORT_SCOPE, isOnTime } from '../reports/reports.service';
import type { RequestUser } from '../common/types';

/** Statuts d'attachement qui valorisent une journée comme « facturée ». */
const BILLED_STATUSES = ['VALIDATED', 'BILLABLE', 'INVOICED'] as const;

const TIMESHEET_SCOPE = {
  companyPath: 'employee.companyId',
  departmentPath: 'employee.departmentId',
  ownerPath: 'employeeId',
  teamPath: 'employeeId',
} as const;

/**
 * Une facture se rattache à une affaire : c'est elle qui porte le périmètre.
 * Même forme que dans le module facturation, où les attachements l'utilisent.
 */
const INVOICE_SCOPE = {
  companyPath: 'affair.companyId',
  departmentPath: 'affair.departmentId',
  ownerPath: 'affair.accountManagerId',
  teamPath: 'affair.accountManagerId',
} as const;

const AFFAIR_SCOPE = {
  companyPath: 'companyId',
  departmentPath: 'departmentId',
  ownerPath: 'accountManagerId',
  teamPath: 'accountManagerId',
} as const;

export interface PeriodInput {
  /** Mois au format `2026-03`. Par défaut : le mois courant. */
  month?: string;
  /** Année entière si `month` est absent et `year` fourni. */
  year?: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: ScopeService,
  ) {}

  /* ── Productivité ────────────────────────────────────────────── */

  async productivity(user: RequestUser, period: PeriodInput) {
    const { from, to, label } = resolvePeriod(period);
    const scopeWhere = this.scope.buildWhere(user, 'timesheet', 'VIEW', TIMESHEET_SCOPE);

    const workingDays = await this.prisma.workCalendarDay.count({
      where: {
        companyId: { in: user.companyIds },
        isWorkingDay: true,
        date: { gte: from, lte: to },
      },
    });

    const days = await this.prisma.timesheetDay.findMany({
      where: { date: { gte: from, lte: to }, ...scopeWhere },
      select: {
        employeeId: true,
        category: true,
        dailyCostSnapshot: true,
        employee: {
          select: {
            matricule: true,
            firstName: true,
            lastName: true,
            isInspector: true,
            department: { select: { id: true, code: true, name: true } },
          },
        },
        attachmentLines: {
          select: { attachmentSheet: { select: { status: true } } },
        },
      },
    });

    const byEmployee = new Map<
      string,
      {
        employeeId: string;
        matricule: string;
        name: string;
        department: { id: string; code: string; name: string } | null;
        isInspector: boolean;
        counts: CategoryCounts;
        facts: TimesheetFact[];
        billedDays: number;
      }
    >();

    for (const day of days) {
      const entry =
        byEmployee.get(day.employeeId) ??
        {
          employeeId: day.employeeId,
          matricule: day.employee.matricule,
          name: `${day.employee.lastName.toUpperCase()} ${day.employee.firstName}`,
          department: day.employee.department,
          isInspector: day.employee.isInspector,
          counts: {} as CategoryCounts,
          facts: [] as TimesheetFact[],
          billedDays: 0,
        };

      const category = day.category as TimesheetCategory;
      entry.counts[category] = (entry.counts[category] ?? 0) + 1;

      const cost = Number(day.dailyCostSnapshot ?? 0);
      entry.facts.push({ category, dailyCost: cost });

      const billed = day.attachmentLines.some((line) =>
        (BILLED_STATUSES as readonly string[]).includes(line.attachmentSheet.status),
      );
      if (billed) entry.billedDays += 1;

      byEmployee.set(day.employeeId, entry);
    }

    const rows = [...byEmployee.values()]
      .map((entry) => {
        const time = breakdown(entry.counts);
        return {
          employeeId: entry.employeeId,
          matricule: entry.matricule,
          name: entry.name,
          department: entry.department,
          isInspector: entry.isInspector,
          workingDays,
          worked: time.worked,
          billable: entry.counts.MISSION_BILLABLE ?? 0,
          nonBillable: entry.counts.MISSION_NON_BILLABLE ?? 0,
          waiting: time.waiting,
          leave: time.leave,
          unassigned: entry.counts.UNASSIGNED ?? 0,
          other: entry.counts.OTHER ?? 0,
          billedDays: entry.billedDays,
          netProductivity: netProductivity(entry.billedDays, workingDays, time.leave),
          idleCost: idleCostOf(entry.facts),
          nonBillableSiteCost: nonBillableSiteCost(entry.facts),
          /** Jours travaillés qui ne sont portés par aucun attachement validé. */
          unvaluedDays: Math.max(0, time.worked - entry.billedDays),
        };
      })
      .sort((a, b) => a.netProductivity - b.netProductivity);

    const totals = rows.reduce(
      (acc, r) => ({
        worked: acc.worked + r.worked,
        billable: acc.billable + r.billable,
        billedDays: acc.billedDays + r.billedDays,
        waiting: acc.waiting + r.waiting,
        leave: acc.leave + r.leave,
        unassigned: acc.unassigned + r.unassigned,
        idleCost: acc.idleCost + r.idleCost,
        unvaluedDays: acc.unvaluedDays + r.unvaluedDays,
      }),
      { worked: 0, billable: 0, billedDays: 0, waiting: 0, leave: 0, unassigned: 0, idleCost: 0, unvaluedDays: 0 },
    );

    return {
      period: { from, to, label, workingDays },
      rows,
      totals: {
        ...totals,
        idleCost: Math.round(totals.idleCost * 100) / 100,
        netProductivity: netProductivity(
          totals.billedDays,
          workingDays * rows.length,
          totals.leave,
        ),
      },
      categoryLabels: CATEGORY_LABELS,
    };
  }

  /* ── Jours non affectés (module 13 du CDC) ───────────────────── */

  async unassignedDays(user: RequestUser, period: PeriodInput) {
    const { from, to, label } = resolvePeriod(period);
    const scopeWhere = this.scope.buildWhere(user, 'timesheet', 'VIEW', TIMESHEET_SCOPE);

    const days = await this.prisma.timesheetDay.findMany({
      where: { date: { gte: from, lte: to }, category: 'UNASSIGNED', ...scopeWhere },
      select: {
        date: true,
        employeeId: true,
        dailyCostSnapshot: true,
        employee: {
          select: {
            matricule: true,
            firstName: true,
            lastName: true,
            position: true,
            department: { select: { id: true, code: true, name: true } },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    const byDepartment = new Map<string, { code: string; name: string; days: number; cost: number; employees: Set<string> }>();
    const byEmployee = new Map<
      string,
      {
        employeeId: string;
        matricule: string;
        name: string;
        position: string | null;
        department: string | null;
        days: number;
        cost: number;
        lastDate: Date;
      }
    >();

    for (const day of days) {
      const cost = Number(day.dailyCostSnapshot ?? 0);
      const deptCode = day.employee.department?.code ?? 'SANS DÉPARTEMENT';

      const dept = byDepartment.get(deptCode) ?? {
        code: deptCode,
        name: day.employee.department?.name ?? 'Sans département',
        days: 0,
        cost: 0,
        employees: new Set<string>(),
      };
      dept.days += 1;
      dept.cost += cost;
      dept.employees.add(day.employeeId);
      byDepartment.set(deptCode, dept);

      const emp = byEmployee.get(day.employeeId) ?? {
        employeeId: day.employeeId,
        matricule: day.employee.matricule,
        name: `${day.employee.lastName.toUpperCase()} ${day.employee.firstName}`,
        position: day.employee.position,
        department: day.employee.department?.code ?? null,
        days: 0,
        cost: 0,
        lastDate: day.date,
      };
      emp.days += 1;
      emp.cost += cost;
      if (day.date > emp.lastDate) emp.lastDate = day.date;
      byEmployee.set(day.employeeId, emp);
    }

    // Évolution sur les 12 derniers mois, pour la tendance.
    const trend = await this.monthlyIdleTrend(scopeWhere, to);

    const totalDays = days.length;
    const totalCost = days.reduce((s, d) => s + Number(d.dailyCostSnapshot ?? 0), 0);

    return {
      period: { from, to, label },
      totals: {
        days: totalDays,
        cost: Math.round(totalCost * 100) / 100,
        employees: byEmployee.size,
      },
      byDepartment: [...byDepartment.values()]
        .map((d) => ({ ...d, employees: d.employees.size, cost: Math.round(d.cost * 100) / 100 }))
        .sort((a, b) => b.days - a.days),
      byEmployee: [...byEmployee.values()]
        .map((e) => ({ ...e, cost: Math.round(e.cost * 100) / 100 }))
        .sort((a, b) => b.days - a.days),
      trend,
    };
  }

  private async monthlyIdleTrend(scopeWhere: Record<string, unknown>, until: Date) {
    const start = new Date(Date.UTC(until.getUTCFullYear(), until.getUTCMonth() - 11, 1));
    const days = await this.prisma.timesheetDay.findMany({
      where: { date: { gte: start, lte: until }, category: 'UNASSIGNED', ...scopeWhere },
      select: { date: true, dailyCostSnapshot: true },
    });

    const buckets = new Map<string, { month: string; days: number; cost: number }>();
    for (let i = 0; i < 12; i += 1) {
      const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      buckets.set(key, { month: key, days: 0, cost: 0 });
    }
    for (const day of days) {
      const key = `${day.date.getUTCFullYear()}-${String(day.date.getUTCMonth() + 1).padStart(2, '0')}`;
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.days += 1;
      bucket.cost += Number(day.dailyCostSnapshot ?? 0);
    }
    return [...buckets.values()].map((b) => ({ ...b, cost: Math.round(b.cost) }));
  }

  /* ── Rentabilité d'une affaire ───────────────────────────────── */

  async affairProfitability(user: RequestUser, affairId: string) {
    const scopeWhere = this.scope.buildWhere(user, 'controlling', 'VIEW', AFFAIR_SCOPE);

    const affair = await this.prisma.affair.findFirst({
      where: { id: affairId, deletedAt: null, ...scopeWhere },
      include: {
        client: { select: { id: true, name: true, code: true } },
        department: { select: { code: true, name: true } },
        accountManager: { select: { firstName: true, lastName: true } },
        budgetLines: true,
      },
    });
    if (!affair) return null;

    const [labour, expenses, invoices, pendingAttachments, missionDays] = await Promise.all([
      this.prisma.timesheetDay.aggregate({
        where: { affairId },
        _sum: { dailyCostSnapshot: true },
        _count: true,
      }),
      this.prisma.expenseLine.aggregate({
        where: { affairId, status: 'ACCEPTED' },
        _sum: { amount: true },
      }),
      this.prisma.invoice.findMany({
        where: { affairId, status: { not: 'CANCELLED' } },
        select: { totalHT: true, totalTTC: true, status: true, payments: { select: { amount: true } } },
      }),
      this.prisma.attachmentSheet.aggregate({
        where: { affairId, status: { in: ['VALIDATED', 'BILLABLE'] } },
        _sum: { totalHT: true },
      }),
      this.prisma.mission.findMany({
        where: { affairId, vehicleId: { not: null } },
        select: {
          plannedStartDate: true,
          plannedEndDate: true,
          vehicle: { select: { monthlyFee: true } },
        },
      }),
    ]);

    const invoiced = invoices.reduce((s, i) => s + Number(i.totalHT), 0);
    const collected = invoices.reduce(
      (s, i) => s + i.payments.reduce((p, pay) => p + Number(pay.amount), 0),
      0,
    );

    // Quote-part véhicule : forfait mensuel réparti au prorata des jours d'usage.
    const vehicleCost = missionDays.reduce((sum, m) => {
      const fee = Number(m.vehicle?.monthlyFee ?? 0);
      if (!fee || !m.plannedStartDate || !m.plannedEndDate) return sum;
      const days =
        Math.round((m.plannedEndDate.getTime() - m.plannedStartDate.getTime()) / 86_400_000) + 1;
      return sum + (fee / 22) * days;
    }, 0);

    const result = profitability(
      {
        contractAmount: Number(affair.contractAmountHT ?? 0),
        invoiced,
        collected,
        pendingAttachments: Number(pendingAttachments._sum.totalHT ?? 0),
      },
      {
        labour: Number(labour._sum.dailyCostSnapshot ?? 0),
        expenses: Number(expenses._sum.amount ?? 0),
        vehicles: Math.round(vehicleCost * 100) / 100,
        // Pas encore de source de données : affiché à zéro plutôt qu'estimé.
        subcontracting: 0,
        other: 0,
      },
      affair.budgetMarginRate === null ? null : Number(affair.budgetMarginRate),
    );

    return {
      affair: {
        id: affair.id,
        number: affair.number,
        title: affair.title,
        status: affair.status,
        client: affair.client,
        department: affair.department,
        accountManager: affair.accountManager
          ? `${affair.accountManager.lastName.toUpperCase()} ${affair.accountManager.firstName}`
          : null,
        startDate: affair.startDate,
        endDate: affair.endDate,
        dailyRate: affair.dailyRate ? Number(affair.dailyRate) : null,
      },
      profitability: result,
      consumedDays: labour._count,
      budgetLines: affair.budgetLines.map((b) => ({
        category: b.category,
        planned: Number(b.plannedAmount),
      })),
    };
  }

  /**
   * Rentabilité de toutes les affaires du périmètre, en quatre requêtes
   * agrégées plutôt qu'une par affaire.
   */
  async profitabilityList(user: RequestUser) {
    const scopeWhere = this.scope.buildWhere(user, 'controlling', 'VIEW', AFFAIR_SCOPE);

    const affairs = await this.prisma.affair.findMany({
      where: { deletedAt: null, commercialStatus: 'GAGNEE', ...scopeWhere },
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        worksStatus: true,
        contractAmountHT: true,
        budgetMarginRate: true,
        client: { select: { name: true } },
        department: { select: { code: true } },
      },
      orderBy: { number: 'desc' },
    });

    const ids = affairs.map((a) => a.id);
    if (ids.length === 0) return { items: [], totals: null };

    const [labour, expenses, invoices, pending] = await Promise.all([
      this.prisma.timesheetDay.groupBy({
        by: ['affairId'],
        where: { affairId: { in: ids } },
        _sum: { dailyCostSnapshot: true },
        _count: true,
      }),
      this.prisma.expenseLine.groupBy({
        by: ['affairId'],
        where: { affairId: { in: ids }, status: 'ACCEPTED' },
        _sum: { amount: true },
      }),
      this.prisma.invoice.findMany({
        where: { affairId: { in: ids }, status: { not: 'CANCELLED' } },
        select: { affairId: true, totalHT: true, payments: { select: { amount: true } } },
      }),
      this.prisma.attachmentSheet.groupBy({
        by: ['affairId'],
        where: { affairId: { in: ids }, status: { in: ['VALIDATED', 'BILLABLE'] } },
        _sum: { totalHT: true },
      }),
    ]);

    const labourBy = new Map(
      labour.map((l) => [l.affairId, { cost: Number(l._sum.dailyCostSnapshot ?? 0), days: l._count }]),
    );
    const expenseBy = new Map(expenses.map((e) => [e.affairId, Number(e._sum.amount ?? 0)]));
    const pendingBy = new Map(pending.map((p) => [p.affairId, Number(p._sum.totalHT ?? 0)]));

    const invoicedBy = new Map<string, { invoiced: number; collected: number }>();
    for (const inv of invoices) {
      if (!inv.affairId) continue;
      const entry = invoicedBy.get(inv.affairId) ?? { invoiced: 0, collected: 0 };
      entry.invoiced += Number(inv.totalHT);
      entry.collected += inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      invoicedBy.set(inv.affairId, entry);
    }

    const items = affairs.map((affair) => {
      const money = invoicedBy.get(affair.id) ?? { invoiced: 0, collected: 0 };
      const labourInfo = labourBy.get(affair.id) ?? { cost: 0, days: 0 };

      const result = profitability(
        {
          contractAmount: Number(affair.contractAmountHT ?? 0),
          invoiced: money.invoiced,
          collected: money.collected,
          pendingAttachments: pendingBy.get(affair.id) ?? 0,
        },
        {
          labour: labourInfo.cost,
          expenses: expenseBy.get(affair.id) ?? 0,
          vehicles: 0,
          subcontracting: 0,
          other: 0,
        },
        affair.budgetMarginRate === null ? null : Number(affair.budgetMarginRate),
      );

      return {
        id: affair.id,
        number: affair.number,
        title: affair.title,
        client: affair.client.name,
        department: affair.department?.code ?? null,
        worksStatus: affair.worksStatus,
        consumedDays: labourInfo.days,
        ...result,
      };
    });

    const withRevenue = items.filter((i) => i.revenues.invoiced > 0);
    const totalInvoiced = withRevenue.reduce((s, i) => s + i.revenues.invoiced, 0);
    const totalCosts = withRevenue.reduce((s, i) => s + i.costs.total, 0);

    return {
      items: items.sort((a, b) => (a.marginGapPoints ?? 0) - (b.marginGapPoints ?? 0)),
      totals: {
        affairs: items.length,
        invoiced: Math.round(totalInvoiced),
        costs: Math.round(totalCosts),
        grossMargin: Math.round(totalInvoiced - totalCosts),
        marginRate:
          totalInvoiced > 0
            ? Math.round(((totalInvoiced - totalCosts) / totalInvoiced) * 1000) / 10
            : 0,
        atRisk: items.filter((i) => i.atRisk).length,
        loss: items.filter((i) => i.grossMargin < 0).length,
      },
    };
  }

  /* ── Cockpit ─────────────────────────────────────────────────── */

  async dashboard(user: RequestUser, period: PeriodInput) {
    const { from, to, label } = resolvePeriod(period);
    const timesheetScope = this.scope.buildWhere(user, 'timesheet', 'VIEW', TIMESHEET_SCOPE);

    // Les chiffres de facturation suivent le droit sur les factures, pas celui
    // sur le tableau de bord : un inspecteur n'a aucun droit « invoice » et
    // lisait pourtant le chiffre d'affaires et les créances de la société.
    // Sans droit, la mesure n'est pas réduite à zéro — elle est absente, et
    // l'écran ne montre pas la tuile.
    const invoiceWhere = can(user.permissions, 'invoice', 'VIEW')
      ? this.scope.buildWhere(user, 'invoice', 'VIEW', INVOICE_SCOPE)
      : null;

    const [
      affairsInProgress,
      missionsInProgress,
      missionsUpcoming,
      unassigned,
      pendingReports,
      pendingExpenses,
      overdueInvoices,
      expiringCerts,
      expiredDevices,
      openNonConformities,
    ] = await Promise.all([
      this.prisma.affair.count({ where: { status: 'IN_PROGRESS', deletedAt: null } }),
      this.prisma.mission.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.mission.count({
        where: { status: { in: ['CONFIRMED', 'ORDER_ISSUED', 'PLANNED'] }, plannedStartDate: { gte: to } },
      }),
      this.prisma.timesheetDay.aggregate({
        where: { date: { gte: from, lte: to }, category: 'UNASSIGNED', ...timesheetScope },
        _count: true,
        _sum: { dailyCostSnapshot: true },
      }),
      this.prisma.report.count({
        where: { status: { in: ['SUBMITTED', 'UNDER_CHECK', 'CORRECTION'] } },
      }),
      this.prisma.expenseReport.count({
        where: { status: { in: ['SUBMITTED', 'CONFIRMED_N1', 'CHECKED_HR_CG', 'ACCOUNTED'] } },
      }),
      invoiceWhere
        ? this.prisma.invoice.aggregate({
            where: { status: 'OVERDUE', ...invoiceWhere },
            _count: true,
            _sum: { totalTTC: true },
          })
        : Promise.resolve(null),
      this.prisma.certification.count({
        where: { expiresAt: { gte: new Date(), lte: addDays(new Date(), 60) } },
      }),
      this.prisma.measuringDevice.count({ where: { status: 'EXPIRED', deletedAt: null } }),
      this.prisma.nonConformity.count({
        where: { status: { notIn: ['CLOSED', 'REJECTED'] } },
      }),
    ]);

    const yearStart = new Date(Date.UTC(to.getUTCFullYear(), 0, 1));
    const invoices = invoiceWhere
      ? await this.prisma.invoice.findMany({
          where: { issueDate: { gte: yearStart }, status: { not: 'CANCELLED' }, ...invoiceWhere },
          select: {
            totalHT: true,
            issueDate: true,
            payments: { select: { amount: true, date: true } },
          },
        })
      : [];
    const invoiced = invoices.reduce((s, i) => s + Number(i.totalHT), 0);
    const collected = invoices.reduce(
      (s, i) => s + i.payments.reduce((p, pay) => p + Number(pay.amount), 0),
      0,
    );

    // Historique mensuel (janvier → mois courant) pour les mini-graphiques du
    // cockpit — cumul réel à partir des mêmes factures/encaissements, jamais
    // une valeur inventée.
    const monthCount = to.getUTCMonth() + 1;
    const invoicedTrend = new Array(monthCount).fill(0) as number[];
    const collectedTrend = new Array(monthCount).fill(0) as number[];
    for (const inv of invoices) {
      const m = inv.issueDate.getUTCMonth();
      if (m < monthCount) invoicedTrend[m] += Number(inv.totalHT);
      for (const pay of inv.payments) {
        const pm = pay.date.getUTCMonth();
        if (pm < monthCount) collectedTrend[pm] += Number(pay.amount);
      }
    }

    // Taux de respect du délai de remise de rapport (objectif QMS < 21 j ouvrés).
    const issuedReports = await this.prisma.report.findMany({
      where: { deliveredAt: { not: null }, issuedAt: { gte: new Date(Date.UTC(to.getUTCFullYear(), 0, 1)) } },
      select: { deliveredAt: true, mission: { select: { reportDueDate: true } } },
    });
    const onTime = issuedReports.filter(
      (r) => r.mission.reportDueDate && r.deliveredAt && r.deliveredAt <= r.mission.reportDueDate,
    ).length;

    return {
      period: { from, to, label },
      affairsInProgress,
      missionsInProgress,
      missionsUpcoming,
      unassignedDays: unassigned._count,
      idleCost: Math.round(Number(unassigned._sum.dailyCostSnapshot ?? 0)),
      pendingReports,
      pendingExpenses,
      overdueInvoices: overdueInvoices ? overdueInvoices._count : null,
      overdueAmount: overdueInvoices
        ? Math.round(Number(overdueInvoices._sum.totalTTC ?? 0))
        : null,
      expiringCertifications: expiringCerts,
      expiredDevices,
      openNonConformities,
      invoicedYtd: invoiceWhere ? Math.round(invoiced) : null,
      collectedYtd: invoiceWhere ? Math.round(collected) : null,
      invoicedTrend: invoiceWhere ? invoicedTrend.map((v) => Math.round(v)) : null,
      collectedTrend: invoiceWhere ? collectedTrend.map((v) => Math.round(v)) : null,
      reportOnTimeRate: onTimeRate(onTime, issuedReports.length),
      reportsIssued: issuedReports.length,
    };
  }

  /* ── Qualité ─────────────────────────────────────────────────── */

  /**
   * Respect du délai de remise des rapports, l'indicateur QMS.
   *
   * La règle n'est pas redéfinie ici : `isOnTime` et l'échéance portée par la
   * mission font foi, exactement comme dans la file des rapports. Une seule
   * définition, sinon deux écrans finissent par annoncer deux taux.
   *
   * Contrairement au tableau de bord, la mesure est filtrée par le périmètre
   * de l'utilisateur : un chef de département lit la performance de son
   * département, pas celle de la société.
   */
  async quality(user: RequestUser) {
    const scopeWhere = this.scope.buildWhere(user, 'report', 'VIEW', REPORT_SCOPE);
    const year = new Date().getUTCFullYear();
    const from = new Date(Date.UTC(year, 0, 1));

    const reports = await this.prisma.report.findMany({
      where: { deliveredAt: { not: null }, issuedAt: { gte: from }, ...scopeWhere },
      select: {
        id: true,
        number: true,
        deliveredAt: true,
        mission: {
          select: {
            reportDueDate: true,
            department: { select: { code: true, name: true } },
            affair: { select: { client: { select: { name: true } } } },
          },
        },
      },
    });

    const lignes = reports.map((r) => ({
      id: r.id,
      number: r.number,
      deliveredAt: r.deliveredAt,
      dueDate: r.mission.reportDueDate,
      department: r.mission.department?.code ?? null,
      client: r.mission.affair.client.name,
      onTime: isOnTime(r.deliveredAt, r.mission.reportDueDate),
      // Négatif = remis en avance. C'est la marge sur l'échéance, qui dit
      // combien de jours ont manqué ou restaient.
      daysVsDue:
        r.deliveredAt && r.mission.reportDueDate
          ? Math.round(
              (startOfUtcDay(r.deliveredAt).getTime() -
                startOfUtcDay(r.mission.reportDueDate).getTime()) /
                86_400_000,
            )
          : null,
    }));

    /** Les rapports dont l'échéance est inconnue ne comptent ni pour ni contre. */
    const mesurables = lignes.filter((l) => l.onTime !== null);
    const tenus = mesurables.filter((l) => l.onTime === true).length;

    const parCle = <T>(items: T[], cle: (t: T) => string | null) => {
      const map = new Map<string, T[]>();
      for (const item of items) {
        const k = cle(item);
        if (k === null) continue;
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(item);
      }
      return map;
    };

    const parDepartement = [...parCle(mesurables, (l) => l.department).entries()]
      .map(([code, rows]) => ({
        code,
        total: rows.length,
        onTime: rows.filter((r) => r.onTime).length,
        rate: onTimeRate(rows.filter((r) => r.onTime).length, rows.length),
      }))
      .sort((a, b) => a.rate - b.rate);

    const parTrimestre = [...parCle(mesurables, (l) =>
      l.deliveredAt ? `T${Math.floor(l.deliveredAt.getUTCMonth() / 3) + 1}` : null,
    ).entries()]
      .map(([quarter, rows]) => ({
        quarter,
        total: rows.length,
        onTime: rows.filter((r) => r.onTime).length,
        rate: onTimeRate(rows.filter((r) => r.onTime).length, rows.length),
      }))
      .sort((a, b) => a.quarter.localeCompare(b.quarter));

    const marges = mesurables.map((l) => l.daysVsDue).filter((d): d is number => d !== null);

    const retards = mesurables
      .filter((l) => l.onTime === false)
      .sort((a, b) => (b.daysVsDue ?? 0) - (a.daysVsDue ?? 0))
      .slice(0, 20);

    return {
      year,
      total: mesurables.length,
      onTime: tenus,
      rate: onTimeRate(tenus, mesurables.length),
      /** Remis sans échéance connue : hors mesure, mais on le dit. */
      unmeasured: lignes.length - mesurables.length,
      averageDaysVsDue: marges.length
        ? Math.round((marges.reduce((s, d) => s + d, 0) / marges.length) * 10) / 10
        : null,
      byDepartment: parDepartement,
      byQuarter: parTrimestre,
      late: retards,
    };
  }
}

/** Minuit UTC, pour comparer des dates sans que l'heure ne décide. */
function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/* ── Utilitaires ──────────────────────────────────────────────── */

function resolvePeriod(period: PeriodInput): { from: Date; to: Date; label: string } {
  const now = new Date();

  if (period.month) {
    const [yearRaw, monthRaw] = period.month.split('-');
    const year = Number(yearRaw);
    const month = Number(monthRaw) - 1;
    const from = new Date(Date.UTC(year, month, 1));
    const to = new Date(Date.UTC(year, month + 1, 0));
    return { from, to, label: from.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) };
  }

  if (period.year) {
    return {
      from: new Date(Date.UTC(period.year, 0, 1)),
      to: new Date(Date.UTC(period.year, 11, 31)),
      label: `Année ${period.year}`,
    };
  }

  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return { from, to, label: from.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) };
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}
