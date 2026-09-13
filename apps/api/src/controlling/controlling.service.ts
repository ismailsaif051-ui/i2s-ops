import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeService } from '../rbac/scope.service';
import type { RequestUser } from '../common/types';

const AFFAIR_SCOPE = {
  companyPath: 'companyId',
  departmentPath: 'departmentId',
  ownerPath: 'accountManagerId',
  teamPath: 'accountManagerId',
} as const;

/** Statuts d'attachement qui valorisent une journée comme « facturée ». */
const BILLED_STATUSES = ['VALIDATED', 'BILLABLE', 'INVOICED'] as const;

/** Une affaire encore ouverte : c'est sur celles-là que le contrôle porte. */
const OPEN_AFFAIRS = ['IN_PROGRESS', 'SUSPENDED'] as const;

/** Missions dont le travail est fait, donc dont le coût doit exister. */
const DONE_MISSIONS = ['COMPLETED', 'REPORTED', 'CLOSED'] as const;

/** Missions encore à faire : elles pèsent sur le coût à terminaison. */
const PLANNED_MISSIONS = [
  'REQUESTED',
  'PLANNED',
  'ASSIGNED',
  'CONFIRMED',
  'ORDER_ISSUED',
  'IN_PROGRESS',
] as const;

/**
 * Les postes de coût du budget d'affaire.
 *
 * Ce sont les catégories de `AffairBudgetLine` : les nommer ici garantit que
 * le prévu et le réel se comparent poste à poste, et qu'aucun poste réel ne
 * tombe hors du tableau.
 */
export const COST_CATEGORIES = [
  'LABOUR',
  'EXPENSES',
  'VEHICLES',
  'SUBCONTRACTING',
  'OTHER',
] as const;
export type CostCategory = (typeof COST_CATEGORIES)[number];

export const COST_LABELS: Record<CostCategory, string> = {
  LABOUR: 'Main-d’œuvre',
  EXPENSES: 'Frais de mission',
  VEHICLES: 'Véhicules',
  SUBCONTRACTING: 'Sous-traitance',
  OTHER: 'Autres',
};

/**
 * D'où vient le réel de chaque poste.
 *
 * Deux postes n'ont pas encore de source : les afficher à zéro sans le dire
 * les ferait passer pour une économie de 100 %, ce qui est faux et pousserait
 * à la mauvaise décision. L'écran le signale au lieu de laisser croire.
 */
export const COST_SOURCES: Record<CostCategory, string | null> = {
  LABOUR: 'Journées pointées, au coût figé du jour de l’intervention',
  EXPENSES: 'Lignes de notes de frais acceptées et imputées à l’affaire',
  VEHICLES: 'Forfait mensuel du véhicule, au prorata des jours de mission',
  SUBCONTRACTING: null,
  OTHER: null,
};

/**
 * Écart au-delà duquel un poste mérite qu'on s'y arrête.
 *
 * En dessous, c'est le bruit habituel d'un chantier ; au-dessus, c'est une
 * dérive qui se rattrape encore si on la voit à temps.
 */
export const OVERRUN_ALERT_RATE = 10;

/** Une journée facturable oubliée au-delà de ce délai est du chiffre perdu. */
export const BILLING_LAG_DAYS = 45;

export interface AnomalySeverity {
  code: string;
  label: string;
  /** Ce que ça coûte si personne ne le corrige. */
  why: string;
  severity: 'CRITICAL' | 'WARNING';
}

/**
 * Contrôle de gestion.
 *
 * Trois questions, et rien d'autre : ce qui était prévu contre ce qui a été
 * dépensé, ce que l'affaire coûtera une fois finie, et ce qui ne colle pas
 * dans les données. La troisième est la plus utile : une marge se perd plus
 * souvent par une journée jamais facturée que par un dépassement visible.
 */
@Injectable()
export class ControllingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: ScopeService,
  ) {}

  /* ── Budget contre réel ───────────────────────────────────────── */

  /**
   * Le prévu, le dépensé et le reste à faire, poste par poste.
   *
   * Le coût à terminaison additionne ce qui est déjà consommé et ce que les
   * missions encore à réaliser coûteront : c'est lui qui dit si l'affaire
   * tiendra son budget, pas le consommé seul.
   */
  async overview(user: RequestUser) {
    const scopeWhere = this.scope.buildWhere(user, 'controlling', 'VIEW', AFFAIR_SCOPE);

    const affairs = await this.prisma.affair.findMany({
      where: { deletedAt: null, status: { in: [...OPEN_AFFAIRS] }, ...scopeWhere },
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        contractAmountHT: true,
        offerAmountHT: true,
        poAmountHT: true,
        endDate: true,
        client: { select: { name: true } },
        department: { select: { code: true } },
        budgetLines: { select: { category: true, plannedAmount: true } },
      },
      orderBy: { number: 'asc' },
    });

    if (affairs.length === 0) {
      return {
        items: [],
        categories: COST_CATEGORIES.map((c) => ({
          category: c,
          label: COST_LABELS[c],
          tracked: COST_SOURCES[c] !== null,
          source: COST_SOURCES[c],
          planned: 0,
          actual: 0,
          committed: 0,
          atCompletion: 0,
          variance: null,
          varianceRate: null,
        })),
        totals: this.emptyTotals(),
      };
    }

    const ids = affairs.map((a) => a.id);
    const actuals = await this.actualCosts(ids);
    const committed = await this.committedCosts(ids);

    const items = affairs.map((affair) => {
      const planned = new Map<string, number>(
        affair.budgetLines.map((b) => [b.category, Number(b.plannedAmount)]),
      );
      const actual = actuals.get(affair.id) ?? this.zeroCosts();
      const rest = committed.get(affair.id) ?? this.zeroCosts();

      const lines = COST_CATEGORIES.map((category) => {
        const p = planned.get(category) ?? 0;
        const a = actual[category];
        const c = rest[category];
        const atCompletion = a + c;

        return {
          category,
          label: COST_LABELS[category],
          planned: round(p),
          actual: round(a),
          committed: round(c),
          atCompletion: round(atCompletion),
          /** Écart à terminaison : négatif, le poste dérive. */
          variance: round(p - atCompletion),
          varianceRate: p > 0 ? round(((p - atCompletion) / p) * 100) : null,
        };
      });

      const tracked = lines.filter((l) => COST_SOURCES[l.category] !== null);
      const plannedTotal = tracked.reduce((s, l) => s + l.planned, 0);
      const actualTotal = tracked.reduce((s, l) => s + l.actual, 0);
      const atCompletionTotal = tracked.reduce((s, l) => s + l.atCompletion, 0);

      // Le montant du marché suit le registre : bon de commande s'il existe,
      // sinon le contrat, sinon l'offre.
      const revenue = Number(
        affair.poAmountHT ?? affair.contractAmountHT ?? affair.offerAmountHT ?? 0,
      );

      return {
        id: affair.id,
        number: affair.number,
        title: affair.title,
        client: affair.client.name,
        department: affair.department?.code ?? null,
        status: affair.status,
        endDate: affair.endDate,
        revenue: round(revenue),
        planned: round(plannedTotal),
        actual: round(actualTotal),
        committed: round(atCompletionTotal - actualTotal),
        atCompletion: round(atCompletionTotal),
        /** Marge à terminaison : ce que l'affaire laissera si rien ne change. */
        marginAtCompletion: round(revenue - atCompletionTotal),
        marginRate: revenue > 0 ? round(((revenue - atCompletionTotal) / revenue) * 100) : null,
        /** Sans budget saisi, il n'y a rien à contrôler — et on le dit. */
        budgeted: affair.budgetLines.length > 0,
        overrun: plannedTotal > 0 && atCompletionTotal > plannedTotal,
        overrunRate:
          plannedTotal > 0 ? round(((atCompletionTotal - plannedTotal) / plannedTotal) * 100) : null,
        lines,
      };
    });

    // Consolidation par poste, tous dossiers confondus.
    const categories = COST_CATEGORIES.map((category) => {
      const rows = items.flatMap((i) => i.lines.filter((l) => l.category === category));
      const planned = rows.reduce((s, l) => s + l.planned, 0);
      const atCompletion = rows.reduce((s, l) => s + l.atCompletion, 0);

      const source = COST_SOURCES[category];

      return {
        category,
        label: COST_LABELS[category],
        /** Le réel de ce poste est-il alimenté ? Sinon, l'écart ne veut rien dire. */
        tracked: source !== null,
        source,
        planned: round(planned),
        actual: round(rows.reduce((s, l) => s + l.actual, 0)),
        committed: round(rows.reduce((s, l) => s + l.committed, 0)),
        atCompletion: round(atCompletion),
        variance: source === null ? null : round(planned - atCompletion),
        varianceRate:
          source !== null && planned > 0
            ? round(((planned - atCompletion) / planned) * 100)
            : null,
      };
    });

    const revenue = items.reduce((s, i) => s + i.revenue, 0);
    const atCompletion = items.reduce((s, i) => s + i.atCompletion, 0);
    const planned = items.reduce((s, i) => s + i.planned, 0);

    return {
      items,
      categories,
      totals: {
        affairs: items.length,
        unbudgeted: items.filter((i) => !i.budgeted).length,
        revenue: round(revenue),
        planned: round(planned),
        actual: round(items.reduce((s, i) => s + i.actual, 0)),
        committed: round(items.reduce((s, i) => s + i.committed, 0)),
        atCompletion: round(atCompletion),
        marginAtCompletion: round(revenue - atCompletion),
        marginRate: revenue > 0 ? round(((revenue - atCompletion) / revenue) * 100) : null,
        // Un dépassement au-delà du seuil d'alerte, à terminaison.
        overrunning: items.filter(
          (i) => i.overrunRate !== null && i.overrunRate > OVERRUN_ALERT_RATE,
        ).length,
        overrunAmount: round(
          items
            .filter((i) => i.budgeted && i.atCompletion > i.planned)
            .reduce((s, i) => s + (i.atCompletion - i.planned), 0),
        ),
      },
    };
  }

  /* ── Contrôles de cohérence ───────────────────────────────────── */

  /**
   * Ce qui ne colle pas dans les données.
   *
   * Chaque contrôle répond à une question d'argent : une journée facturée deux
   * fois, un travail fait jamais facturé, un coût qui n'atterrit sur aucune
   * affaire. Aucun n'est bloquant — ils désignent, ils n'empêchent pas — mais
   * chacun se chiffre.
   */
  async anomalies(user: RequestUser) {
    const scopeWhere = this.scope.buildWhere(user, 'controlling', 'VIEW', AFFAIR_SCOPE);

    const affairs = await this.prisma.affair.findMany({
      where: { deletedAt: null, ...scopeWhere },
      select: { id: true, number: true, title: true, status: true, endDate: true },
    });
    const affairIds = affairs.map((a) => a.id);
    const byId = new Map(affairs.map((a) => [a.id, a]));

    const checks = await Promise.all([
      this.doubleBilled(affairIds, byId),
      this.workNeverBilled(affairIds, byId),
      this.doneWithoutTimesheet(affairIds, byId),
      this.expensesWithoutAffair(user),
      this.openWithoutBudget(affairIds, byId),
      this.timesheetAfterClosure(affairIds, byId),
      this.invoicesWithoutAttachment(affairIds, byId),
    ]);

    const groups = checks.filter((g) => g.count > 0);
    groups.sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === 'CRITICAL' ? -1 : 1;
      return b.amount - a.amount;
    });

    return {
      groups,
      totals: {
        groups: groups.length,
        rows: groups.reduce((s, g) => s + g.count, 0),
        critical: groups.filter((g) => g.severity === 'CRITICAL').reduce((s, g) => s + g.count, 0),
        amount: round(groups.reduce((s, g) => s + g.amount, 0)),
      },
    };
  }

  /** Une même journée portée par deux attachements : elle sera payée deux fois. */
  private async doubleBilled(affairIds: string[], byId: Map<string, AffairRef>) {
    const days = await this.prisma.timesheetDay.findMany({
      where: {
        affairId: { in: affairIds },
        attachmentLines: {
          some: { attachmentSheet: { status: { in: [...BILLED_STATUSES] } } },
        },
      },
      select: {
        id: true,
        date: true,
        affairId: true,
        employee: { select: { matricule: true, firstName: true, lastName: true } },
        attachmentLines: {
          where: { attachmentSheet: { status: { in: [...BILLED_STATUSES] } } },
          select: {
            unitRate: true,
            days: true,
            attachmentSheet: { select: { number: true, status: true } },
          },
        },
      },
    });

    const rows = days
      .filter((d) => d.attachmentLines.length > 1)
      .map((d) => ({
        reference: `${d.employee.lastName.toUpperCase()} ${d.employee.firstName} — ${iso(d.date)}`,
        affair: byId.get(d.affairId ?? '')?.number ?? '—',
        detail: `Portée par ${d.attachmentLines.map((l) => l.attachmentSheet.number).join(' et ')}`,
        // Le doublon, c'est tout sauf la première ligne.
        amount: round(
          d.attachmentLines
            .slice(1)
            .reduce((s, l) => s + Number(l.unitRate) * Number(l.days), 0),
        ),
      }));

    return this.group(
      {
        code: 'DOUBLE_BILLED',
        label: 'Journée portée par deux attachements',
        why: 'La même journée sera facturée deux fois au client. C’est une réclamation assurée, et un avoir à passer.',
        severity: 'CRITICAL',
      },
      rows,
    );
  }

  /** Du travail fait, facturable, et jamais porté sur un attachement. */
  private async workNeverBilled(affairIds: string[], byId: Map<string, AffairRef>) {
    const limit = new Date();
    limit.setDate(limit.getDate() - BILLING_LAG_DAYS);

    const days = await this.prisma.timesheetDay.groupBy({
      by: ['affairId'],
      where: {
        affairId: { in: affairIds },
        billable: true,
        date: { lt: limit },
        attachmentLines: { none: {} },
      },
      _count: { _all: true },
      _sum: { dailyCostSnapshot: true },
    });

    const rows = days
      .filter((d) => d.affairId)
      .map((d) => {
        const affair = byId.get(d.affairId!);
        return {
          reference: affair?.number ?? '—',
          affair: affair?.number ?? '—',
          detail: `${d._count._all} journée(s) facturable(s) de plus de ${BILLING_LAG_DAYS} jours, sur aucun attachement — ${affair?.title ?? ''}`,
          // À défaut du prix de vente, le coût donne l'ordre de grandeur perdu.
          amount: round(Number(d._sum.dailyCostSnapshot ?? 0)),
        };
      });

    return this.group(
      {
        code: 'NEVER_BILLED',
        label: 'Travail fait, jamais attaché',
        why: 'Une prestation réalisée qui n’entre sur aucun attachement ne sera jamais facturée. C’est du chiffre d’affaires perdu, pas un retard.',
        severity: 'CRITICAL',
      },
      rows,
    );
  }

  /** Mission terminée sans une seule journée pointée : son coût est invisible. */
  private async doneWithoutTimesheet(affairIds: string[], byId: Map<string, AffairRef>) {
    const missions = await this.prisma.mission.findMany({
      where: {
        affairId: { in: affairIds },
        status: { in: [...DONE_MISSIONS] },
        timesheetDays: { none: {} },
      },
      select: {
        number: true,
        objective: true,
        affairId: true,
        plannedStartDate: true,
        plannedEndDate: true,
        _count: { select: { assignments: true } },
      },
      take: 200,
    });

    const rows = missions.map((m) => ({
      reference: m.number,
      affair: byId.get(m.affairId)?.number ?? '—',
      detail: `${m.objective ?? 'Mission'} — terminée, ${m._count.assignments} intervenant(s), aucune journée pointée`,
      amount: 0,
    }));

    return this.group(
      {
        code: 'NO_TIMESHEET',
        label: 'Mission terminée sans pointage',
        why: 'Le coût de cette mission n’apparaît nulle part : la marge de l’affaire est surévaluée d’autant.',
        severity: 'WARNING',
      },
      rows,
    );
  }

  /** Un frais accepté qui ne retombe sur aucune affaire. */
  private async expensesWithoutAffair(user: RequestUser) {
    const lines = await this.prisma.expenseLine.findMany({
      where: {
        status: 'ACCEPTED',
        affairId: null,
        expenseReport: { employee: { companyId: { in: user.companyIds } } },
      },
      select: {
        date: true,
        amount: true,
        description: true,
        category: { select: { label: true } },
        expenseReport: {
          select: { number: true, employee: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { date: 'desc' },
      take: 200,
    });

    const rows = lines.map((l) => ({
      reference: l.expenseReport.number,
      affair: '—',
      detail: `${iso(l.date)} · ${l.category.label} · ${l.expenseReport.employee.lastName.toUpperCase()} ${l.expenseReport.employee.firstName}${l.description ? ` — ${l.description}` : ''}`,
      amount: round(Number(l.amount)),
    }));

    return this.group(
      {
        code: 'EXPENSE_UNASSIGNED',
        label: 'Frais accepté sans affaire',
        why: 'Ce coût est décaissé mais n’est imputé à aucune affaire : il n’entre dans aucune marge, et il ne sera jamais refacturé.',
        severity: 'WARNING',
      },
      rows,
    );
  }

  /** Une affaire en cours sans budget : il n'y a rien à contrôler. */
  private async openWithoutBudget(affairIds: string[], byId: Map<string, AffairRef>) {
    const affairs = await this.prisma.affair.findMany({
      where: {
        id: { in: affairIds },
        status: { in: [...OPEN_AFFAIRS] },
        budgetLines: { none: {} },
      },
      select: { id: true, number: true, title: true, contractAmountHT: true, poAmountHT: true },
      take: 200,
    });

    const rows = affairs.map((a) => ({
      reference: a.number,
      affair: a.number,
      detail: `${a.title} — aucun budget saisi`,
      amount: round(Number(a.poAmountHT ?? a.contractAmountHT ?? 0)),
    }));

    return this.group(
      {
        code: 'NO_BUDGET',
        label: 'Affaire en cours sans budget',
        why: 'Sans budget prévisionnel, aucun écart ne peut être calculé : la dérive ne se verra qu’à la clôture, quand il sera trop tard.',
        severity: 'WARNING',
      },
      rows,
    );
  }

  /** Une journée pointée sur une affaire déjà close, après sa date de fin. */
  private async timesheetAfterClosure(affairIds: string[], byId: Map<string, AffairRef>) {
    const closed = await this.prisma.affair.findMany({
      where: { id: { in: affairIds }, status: { in: ['CLOSED', 'CANCELLED'] }, endDate: { not: null } },
      select: { id: true, number: true, title: true, endDate: true },
    });

    if (closed.length === 0) return this.group(CLOSED_CHECK, []);

    const days = await this.prisma.timesheetDay.groupBy({
      by: ['affairId'],
      where: {
        OR: closed.map((a) => ({ affairId: a.id, date: { gt: a.endDate! } })),
      },
      _count: { _all: true },
      _sum: { dailyCostSnapshot: true },
    });

    const rows = days
      .filter((d) => d.affairId)
      .map((d) => {
        const affair = closed.find((a) => a.id === d.affairId);
        return {
          reference: affair?.number ?? '—',
          affair: affair?.number ?? '—',
          detail: `${d._count._all} journée(s) pointée(s) après la fin de l’affaire (${iso(affair?.endDate ?? null)})`,
          amount: round(Number(d._sum.dailyCostSnapshot ?? 0)),
        };
      });

    return this.group(CLOSED_CHECK, rows);
  }

  /** Une facture qui ne s'appuie sur aucun attachement validé. */
  private async invoicesWithoutAttachment(affairIds: string[], byId: Map<string, AffairRef>) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        affairId: { in: affairIds },
        status: { notIn: ['DRAFT', 'CANCELLED'] },
        attachments: { none: {} },
      },
      select: { number: true, affairId: true, totalHT: true, issueDate: true, status: true },
      orderBy: { issueDate: 'desc' },
      take: 200,
    });

    const rows = invoices.map((i) => ({
      reference: i.number,
      affair: byId.get(i.affairId ?? '')?.number ?? '—',
      detail: `Émise le ${iso(i.issueDate)} — aucun attachement rattaché`,
      amount: round(Number(i.totalHT)),
    }));

    return this.group(
      {
        code: 'INVOICE_UNBACKED',
        label: 'Facture sans attachement',
        why: 'Rien ne prouve le travail facturé. En cas de contestation du client, la facture est indéfendable.',
        severity: 'WARNING',
      },
      rows,
    );
  }

  /* ── Calcul des coûts ─────────────────────────────────────────── */

  /** Ce qui a réellement été dépensé, par affaire et par poste. */
  private async actualCosts(affairIds: string[]): Promise<Map<string, Record<CostCategory, number>>> {
    const [labour, expenses, missions] = await Promise.all([
      this.prisma.timesheetDay.groupBy({
        by: ['affairId'],
        where: { affairId: { in: affairIds } },
        _sum: { dailyCostSnapshot: true },
      }),
      this.prisma.expenseLine.groupBy({
        by: ['affairId'],
        where: { affairId: { in: affairIds }, status: 'ACCEPTED' },
        _sum: { amount: true },
      }),
      this.prisma.mission.findMany({
        where: { affairId: { in: affairIds }, vehicleId: { not: null } },
        select: {
          affairId: true,
          status: true,
          plannedStartDate: true,
          plannedEndDate: true,
          vehicle: { select: { monthlyFee: true } },
        },
      }),
    ]);

    const result = new Map<string, Record<CostCategory, number>>();
    const at = (id: string) => {
      if (!result.has(id)) result.set(id, this.zeroCosts());
      return result.get(id)!;
    };

    for (const row of labour) {
      if (row.affairId) at(row.affairId).LABOUR += Number(row._sum.dailyCostSnapshot ?? 0);
    }
    for (const row of expenses) {
      if (row.affairId) at(row.affairId).EXPENSES += Number(row._sum.amount ?? 0);
    }
    // Le véhicule n'est un coût réel que sur les missions déjà faites.
    for (const m of missions) {
      if (!DONE_MISSIONS.includes(m.status as (typeof DONE_MISSIONS)[number])) continue;
      at(m.affairId).VEHICLES += vehicleShare(m);
    }

    return result;
  }

  /**
   * Ce qui reste à dépenser : les missions planifiées, pas encore faites.
   *
   * C'est la différence entre un consommé, qui ne dit rien de la suite, et un
   * coût à terminaison, qui dit si l'affaire tiendra.
   */
  private async committedCosts(
    affairIds: string[],
  ): Promise<Map<string, Record<CostCategory, number>>> {
    const missions = await this.prisma.mission.findMany({
      where: { affairId: { in: affairIds }, status: { in: [...PLANNED_MISSIONS] } },
      select: {
        affairId: true,
        status: true,
        plannedStartDate: true,
        plannedEndDate: true,
        vehicle: { select: { monthlyFee: true } },
        assignments: { select: { employeeId: true } },
      },
    });

    const employeeIds = [...new Set(missions.flatMap((m) => m.assignments.map((a) => a.employeeId)))];
    const rates = await this.currentDailyCosts(employeeIds);

    const result = new Map<string, Record<CostCategory, number>>();
    const at = (id: string) => {
      if (!result.has(id)) result.set(id, this.zeroCosts());
      return result.get(id)!;
    };

    for (const m of missions) {
      const days = plannedDays(m.plannedStartDate, m.plannedEndDate);
      if (days <= 0) continue;

      const costs = at(m.affairId);
      for (const a of m.assignments) {
        costs.LABOUR += (rates.get(a.employeeId) ?? 0) * days;
      }
      costs.VEHICLES += vehicleShare(m);
    }

    return result;
  }

  /**
   * Le coût journalier en vigueur aujourd'hui, par intervenant.
   *
   * Le coût est historisé : ce qui est déjà pointé porte son propre coût figé
   * (`dailyCostSnapshot`), et ce qui reste à faire se valorise au tarif du
   * jour — celui qui s'appliquera quand la mission sera exécutée.
   */
  private async currentDailyCosts(employeeIds: string[]): Promise<Map<string, number>> {
    if (employeeIds.length === 0) return new Map();

    const today = new Date();
    const costs = await this.prisma.employeeDailyCost.findMany({
      where: {
        employeeId: { in: employeeIds },
        validFrom: { lte: today },
        OR: [{ validTo: null }, { validTo: { gte: today } }],
      },
      orderBy: { validFrom: 'desc' },
      select: { employeeId: true, amount: true },
    });

    const map = new Map<string, number>();
    for (const c of costs) {
      // Le premier vu est le plus récent : les suivants sont d'anciens barèmes.
      if (!map.has(c.employeeId)) map.set(c.employeeId, Number(c.amount));
    }
    return map;
  }

  /* ── Utilitaires ──────────────────────────────────────────────── */

  private zeroCosts(): Record<CostCategory, number> {
    return { LABOUR: 0, EXPENSES: 0, VEHICLES: 0, SUBCONTRACTING: 0, OTHER: 0 };
  }

  private emptyTotals() {
    return {
      affairs: 0,
      unbudgeted: 0,
      revenue: 0,
      planned: 0,
      actual: 0,
      committed: 0,
      atCompletion: 0,
      marginAtCompletion: 0,
      marginRate: null as number | null,
      overrunning: 0,
      overrunAmount: 0,
    };
  }

  private group(check: AnomalySeverity, rows: AnomalyRow[]) {
    return {
      ...check,
      count: rows.length,
      amount: round(rows.reduce((s, r) => s + r.amount, 0)),
      rows: rows.slice(0, 50),
      truncated: Math.max(0, rows.length - 50),
    };
  }
}

interface AffairRef {
  id: string;
  number: string;
  title: string;
  status: string;
  endDate: Date | null;
}

interface AnomalyRow {
  reference: string;
  affair: string;
  detail: string;
  amount: number;
}

const CLOSED_CHECK: AnomalySeverity = {
  code: 'AFTER_CLOSURE',
  label: 'Pointage après clôture de l’affaire',
  why: 'Du coût continue de s’imputer sur une affaire soldée : la marge annoncée à la clôture était fausse.',
  severity: 'WARNING',
};

/** Quote-part véhicule : forfait mensuel réparti au prorata des jours d'usage. */
function vehicleShare(mission: {
  plannedStartDate: Date | null;
  plannedEndDate: Date | null;
  vehicle: { monthlyFee: unknown } | null;
}): number {
  const fee = Number(mission.vehicle?.monthlyFee ?? 0);
  const days = plannedDays(mission.plannedStartDate, mission.plannedEndDate);
  if (!fee || days <= 0) return 0;
  return (fee / 22) * days;
}

function plannedDays(start: Date | null, end: Date | null): number {
  if (!start || !end) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function iso(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : '—';
}
