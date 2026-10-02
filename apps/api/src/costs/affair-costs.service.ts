import { Injectable } from '@nestjs/common';
import { vehicleShare } from '@i2s/calc';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Les postes de coût d'une affaire.
 *
 * Ce sont aussi les catégories de `AffairBudgetLine` : les nommer ici
 * garantit que le prévu et le réel se comparent poste à poste, et qu'aucun
 * poste réel ne tombe hors du tableau.
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
 * Un poste sans source affiché à zéro passerait pour une économie de 100 % :
 * c'est pourquoi chaque poste dit d'où il tire ses chiffres.
 */
export const COST_SOURCES: Record<CostCategory, string | null> = {
  LABOUR: 'Journées pointées, au coût figé du jour de l’intervention',
  EXPENSES: 'Lignes de notes de frais acceptées et imputées à l’affaire',
  VEHICLES: 'Loyer mensuel du véhicule, au prorata des jours ouvrés de mission',
  SUBCONTRACTING: 'Coûts de sous-traitance saisis sur l’affaire (facture fournisseur reçue)',
  OTHER: 'Autres coûts directs saisis sur l’affaire (facture fournisseur reçue)',
};

/** Missions dont le travail est fait : leur véhicule est un coût réel. */
export const DONE_MISSIONS = ['COMPLETED', 'REPORTED', 'CLOSED'] as const;

/** Missions encore à faire : elles pèsent sur le coût à terminaison. */
export const PLANNED_MISSIONS = [
  'REQUESTED',
  'PLANNED',
  'ASSIGNED',
  'CONFIRMED',
  'ORDER_ISSUED',
  'IN_PROGRESS',
] as const;

export type CostsByCategory = Record<CostCategory, number>;

export function zeroCosts(): CostsByCategory {
  return { LABOUR: 0, EXPENSES: 0, VEHICLES: 0, SUBCONTRACTING: 0, OTHER: 0 };
}

export function totalCosts(costs: CostsByCategory): number {
  return round(COST_CATEGORIES.reduce((sum, c) => sum + costs[c], 0));
}

/** Ce qu’il faut savoir d’une mission pour en compter les jours. */
const MISSION_DAYS = {
  affairId: true,
  plannedStartDate: true,
  plannedEndDate: true,
  affair: { select: { companyId: true } },
  vehicle: { select: { monthlyFee: true } },
} as const;

interface MissionDays {
  affairId: string;
  plannedStartDate: Date | null;
  plannedEndDate: Date | null;
  affair: { companyId: string };
  vehicle: { monthlyFee: unknown } | null;
}

/**
 * Les coûts d'une affaire, en un seul endroit.
 *
 * La fiche affaire, la liste de rentabilité et le contrôle de gestion
 * calculaient chacun le leur — et pas de la même façon : la liste oubliait
 * le véhicule, le contrôle comptait les week-ends. Une marge ne peut pas
 * dépendre de l'écran où on la lit.
 *
 * - Réel : ce qui est déjà dépensé (journées pointées, frais acceptés,
 *   véhicule des missions faites, factures fournisseurs reçues).
 * - Engagé : ce qui reste à dépenser (missions planifiées valorisées au coût
 *   du jour, leur véhicule, commandes fournisseurs passées).
 * - À terminaison = réel + engagé.
 */
@Injectable()
export class AffairCostsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ce qui a réellement été dépensé, par affaire et par poste.
   *
   * Le véhicule compte pour les missions terminées, et pour les jours déjà
   * écoulés d'une mission en cours — ses jours à venir sont dans l'engagé.
   */
  async actual(affairIds: string[], today = new Date()): Promise<Map<string, CostsByCategory>> {
    const result = new Map<string, CostsByCategory>();
    if (affairIds.length === 0) return result;
    const at = (id: string) => {
      if (!result.has(id)) result.set(id, zeroCosts());
      return result.get(id)!;
    };
    const now = startOfDay(today);

    const [labour, expenses, missions, manual] = await Promise.all([
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
        where: {
          affairId: { in: affairIds },
          vehicleId: { not: null },
          status: { in: [...DONE_MISSIONS, 'IN_PROGRESS'] },
        },
        select: { ...MISSION_DAYS, status: true },
      }),
      this.prisma.affairCost.groupBy({
        by: ['affairId', 'category'],
        where: { affairId: { in: affairIds }, status: 'ACTUAL', deletedAt: null },
        _sum: { amountHT: true },
      }),
    ]);

    for (const row of labour) {
      if (row.affairId) at(row.affairId).LABOUR += Number(row._sum.dailyCostSnapshot ?? 0);
    }
    for (const row of expenses) {
      if (row.affairId) at(row.affairId).EXPENSES += Number(row._sum.amount ?? 0);
    }

    const isWorking = await this.calendar(missions);
    for (const m of missions) {
      const fee = Number(m.vehicle?.monthlyFee ?? 0);
      if (!fee) continue;
      const window = m.status === 'IN_PROGRESS' ? { until: now } : {};
      at(m.affairId).VEHICLES += vehicleShare(fee, workingDaysOf(m, isWorking, window));
    }

    for (const row of manual) {
      at(row.affairId)[row.category] += Number(row._sum.amountHT ?? 0);
    }

    return roundAll(result);
  }

  /**
   * Ce qui reste à dépenser : missions pas encore faites, et commandes
   * fournisseurs dont la facture n'est pas encore reçue.
   *
   * Seuls les jours OUVRÉS comptent. D'une mission en cours, seuls les jours
   * à partir d'aujourd'hui : les jours passés sont déjà dans le pointage, les
   * compter ici les ferait payer deux fois.
   */
  async committed(affairIds: string[], today = new Date()): Promise<Map<string, CostsByCategory>> {
    const result = new Map<string, CostsByCategory>();
    if (affairIds.length === 0) return result;
    const at = (id: string) => {
      if (!result.has(id)) result.set(id, zeroCosts());
      return result.get(id)!;
    };
    const now = startOfDay(today);

    const [missions, manual] = await Promise.all([
      this.prisma.mission.findMany({
        where: { affairId: { in: affairIds }, status: { in: [...PLANNED_MISSIONS] } },
        select: { ...MISSION_DAYS, status: true, assignments: { select: { employeeId: true } } },
      }),
      this.prisma.affairCost.groupBy({
        by: ['affairId', 'category'],
        where: { affairId: { in: affairIds }, status: 'COMMITTED', deletedAt: null },
        _sum: { amountHT: true },
      }),
    ]);

    const employeeIds = [...new Set(missions.flatMap((m) => m.assignments.map((a) => a.employeeId)))];
    const [rates, load, isWorking] = await Promise.all([
      this.currentDailyCosts(employeeIds),
      this.missionsPerDay(employeeIds),
      this.calendar(missions),
    ]);

    for (const m of missions) {
      const window = m.status === 'IN_PROGRESS' ? { from: now } : {};
      const days = daysOf(m, window).filter((t) => isWorking(m.affair.companyId, t));
      const costs = at(m.affairId);

      for (const a of m.assignments) {
        const rate = rates.get(a.employeeId) ?? 0;
        // Un jour partagé avec d'autres missions ne coûte que sa part : deux
        // interventions le même jour coûtent une journée, pas deux.
        for (const t of days) {
          const key = `${a.employeeId}|${iso(new Date(t))}`;
          costs.LABOUR += rate / Math.max(1, load.get(key) ?? 1);
        }
      }

      const fee = Number(m.vehicle?.monthlyFee ?? 0);
      if (fee) costs.VEHICLES += vehicleShare(fee, days.length);
    }

    for (const row of manual) {
      at(row.affairId)[row.category] += Number(row._sum.amountHT ?? 0);
    }

    return roundAll(result);
  }

  /**
   * Jours ouvrés de la société : son calendrier (jours fériés marocains), et
   * à défaut du lundi au vendredi pour une date qu'il ne couvre pas.
   */
  private async calendar(missions: MissionDays[]): Promise<(companyId: string, t: number) => boolean> {
    const dated = missions.filter((m) => m.plannedStartDate && m.plannedEndDate);
    if (dated.length === 0) return () => false;

    const from = new Date(Math.min(...dated.map((m) => m.plannedStartDate!.getTime())));
    const to = new Date(Math.max(...dated.map((m) => m.plannedEndDate!.getTime())));
    const rows = await this.prisma.workCalendarDay.findMany({
      where: {
        companyId: { in: [...new Set(dated.map((m) => m.affair.companyId))] },
        date: { gte: from, lte: to },
      },
      select: { companyId: true, date: true, isWorkingDay: true },
    });
    const known = new Map(rows.map((c) => [`${c.companyId}|${iso(c.date)}`, c.isWorkingDay]));

    return (companyId, t) => {
      const listed = known.get(`${companyId}|${iso(new Date(t))}`);
      const weekday = new Date(t).getUTCDay();
      return listed ?? (weekday >= 1 && weekday <= 5);
    };
  }

  /**
   * Nombre de missions prévues par intervenant et par jour, toutes affaires
   * confondues — pour partager le coût d'une journée entre ses interventions.
   */
  private async missionsPerDay(employeeIds: string[]): Promise<Map<string, number>> {
    if (employeeIds.length === 0) return new Map();

    const assignments = await this.prisma.missionAssignment.findMany({
      where: {
        employeeId: { in: employeeIds },
        mission: { deletedAt: null, status: { in: [...PLANNED_MISSIONS] } },
      },
      select: {
        employeeId: true,
        mission: { select: { plannedStartDate: true, plannedEndDate: true } },
      },
    });

    const load = new Map<string, number>();
    for (const a of assignments) {
      const { plannedStartDate: start, plannedEndDate: end } = a.mission;
      if (!start || !end) continue;
      for (let t = start.getTime(); t <= end.getTime(); t += DAY) {
        const key = `${a.employeeId}|${iso(new Date(t))}`;
        load.set(key, (load.get(key) ?? 0) + 1);
      }
    }
    return load;
  }

  /**
   * Le coût journalier en vigueur aujourd'hui, par intervenant : ce qui reste
   * à faire se valorise au tarif qui s'appliquera quand la mission aura lieu.
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
      if (!map.has(c.employeeId)) map.set(c.employeeId, Number(c.amount));
    }
    return map;
  }
}

const DAY = 86_400_000;

function startOfDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/** Les jours d’une mission, éventuellement bornés : `from` inclus, `until` exclu. */
export function daysOf(m: MissionDays, window: { from?: number; until?: number }): number[] {
  if (!m.plannedStartDate || !m.plannedEndDate) return [];
  const first = Math.max(m.plannedStartDate.getTime(), window.from ?? -Infinity);
  const last = Math.min(m.plannedEndDate.getTime(), (window.until ?? Infinity) - DAY);
  const days: number[] = [];
  for (let t = first; t <= last; t += DAY) days.push(t);
  return days;
}

export function workingDaysOf(
  m: MissionDays,
  isWorking: (companyId: string, t: number) => boolean,
  window: { from?: number; until?: number },
): number {
  return daysOf(m, window).filter((t) => isWorking(m.affair.companyId, t)).length;
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundAll(map: Map<string, CostsByCategory>): Map<string, CostsByCategory> {
  for (const costs of map.values()) {
    for (const c of COST_CATEGORIES) costs[c] = round(costs[c]);
  }
  return map;
}
