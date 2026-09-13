/**
 * Moteur de calcul I2S OPS — fonctions pures, testées unitairement.
 *
 * Ce paquet est isolé volontairement : les formules du cahier des charges
 * (productivité nette, coût d'inactivité, marge) n'y dépendent d'aucune base
 * de données, et sont donc rejouables à l'identique pour n'importe quelle
 * date. Voir docs/09-CONTROLE-DE-GESTION.md.
 */

export const TIMESHEET_CATEGORIES = [
  'MISSION_BILLABLE',
  'MISSION_NON_BILLABLE',
  'SITE_WAITING',
  'WEATHER',
  'TRAINING',
  'LEAVE',
  'SICK',
  'UNASSIGNED',
  'OTHER',
] as const;

export type TimesheetCategory = (typeof TIMESHEET_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<TimesheetCategory, string> = {
  MISSION_BILLABLE: 'Mission facturable',
  MISSION_NON_BILLABLE: 'Mission non facturable',
  SITE_WAITING: 'Attente chantier',
  WEATHER: 'Intempérie',
  TRAINING: 'Formation',
  LEAVE: 'Congé',
  SICK: 'Maladie',
  UNASSIGNED: 'Non affecté',
  OTHER: 'Autre',
};

export type CategoryCounts = Partial<Record<TimesheetCategory, number>>;

/** Une journée pointée, réduite à ce dont le calcul a besoin. */
export interface TimesheetFact {
  category: TimesheetCategory;
  /** Coût journalier figé à la date du pointage — jamais le coût courant. */
  dailyCost: number;
  /** La journée est-elle portée par un attachement validé ? */
  attached?: boolean;
}

export interface TimeBreakdown {
  worked: number;
  waiting: number;
  leave: number;
  unassigned: number;
  total: number;
}

/**
 * Décomposition du temps ouvré, exactement comme le cahier des charges la
 * définit :
 *   Temps ouvré total = travaillés + attente/intempéries + congés/formations
 *                     + non affectés
 */
export function breakdown(counts: CategoryCounts): TimeBreakdown {
  const get = (c: TimesheetCategory) => counts[c] ?? 0;

  const worked = get('MISSION_BILLABLE') + get('MISSION_NON_BILLABLE');
  const waiting = get('SITE_WAITING') + get('WEATHER');
  const leave = get('LEAVE') + get('SICK') + get('TRAINING');
  const unassigned = get('UNASSIGNED') + get('OTHER');

  return { worked, waiting, leave, unassigned, total: worked + waiting + leave + unassigned };
}

/**
 * Taux de productivité nette (%).
 *
 *   Jours facturés sur attachements / (jours ouvrés totaux − jours congés) × 100
 *
 * Choix volontairement strict : un jour travaillé mais non porté par un
 * attachement ne compte pas comme productif. L'écart devient un indicateur
 * à part entière (« jours travaillés non valorisés »).
 */
export function netProductivity(billedDays: number, totalWorkingDays: number, leaveDays: number): number {
  const base = totalWorkingDays - leaveDays;
  if (base <= 0) return 0;
  return round1((billedDays / base) * 100);
}

/**
 * Coût d'inactivité = Σ (jours non affectés × coût journalier à la date).
 * On somme fait par fait : un coût moyen fausserait le résultat dès qu'une
 * revalorisation intervient dans la période.
 */
export function idleCost(facts: readonly TimesheetFact[]): number {
  return round2(
    facts
      .filter((f) => f.category === 'UNASSIGNED')
      .reduce((sum, f) => sum + f.dailyCost, 0),
  );
}

/** Coût supporté sur les jours passés sur site sans être facturables. */
export function nonBillableSiteCost(facts: readonly TimesheetFact[]): number {
  return round2(
    facts
      .filter((f) => f.category === 'SITE_WAITING' || f.category === 'WEATHER')
      .reduce((sum, f) => sum + f.dailyCost, 0),
  );
}

/** Taux d'affectation (%) — inspecteurs déployés sur le total disponible. */
export function assignmentRate(deployed: number, available: number): number {
  if (available <= 0) return 0;
  return round1((deployed / available) * 100);
}

export interface Revenues {
  contractAmount: number;
  invoiced: number;
  collected: number;
  pendingAttachments: number;
}

export interface Costs {
  labour: number;
  expenses: number;
  vehicles: number;
  subcontracting: number;
  other: number;
}

export interface Profitability {
  revenues: Revenues;
  costs: Costs & { total: number };
  grossMargin: number;
  marginRate: number;
  budgetMarginRate: number | null;
  /** Écart en points de pourcentage entre le réel et le budget. */
  marginGapPoints: number | null;
  atRisk: boolean;
  remainingToInvoice: number;
}

/** Seuil d'alerte du cahier des charges : 5 points d'écart de marge. */
export const MARGIN_ALERT_POINTS = 5;

export function profitability(
  revenues: Revenues,
  costs: Costs,
  budgetMarginRate: number | null,
): Profitability {
  const total = round2(
    costs.labour + costs.expenses + costs.vehicles + costs.subcontracting + costs.other,
  );
  const grossMargin = round2(revenues.invoiced - total);
  const marginRate = revenues.invoiced > 0 ? round1((grossMargin / revenues.invoiced) * 100) : 0;

  const marginGapPoints =
    budgetMarginRate === null ? null : round1(marginRate - budgetMarginRate);

  return {
    revenues,
    costs: { ...costs, total },
    grossMargin,
    marginRate,
    budgetMarginRate,
    marginGapPoints,
    atRisk: marginGapPoints !== null && marginGapPoints < -MARGIN_ALERT_POINTS,
    remainingToInvoice: round2(
      revenues.contractAmount - revenues.invoiced - revenues.pendingAttachments,
    ),
  };
}

/** Marge brute par vacation, formule directe du cahier des charges. */
export function vacationMargin(
  billedRate: number,
  inspectorDailyCost: number,
  missionExpenses: number,
): number {
  return round2(billedRate - (inspectorDailyCost + missionExpenses));
}

/** Taux de respect d'un objectif exprimé en « à temps / planifié ». */
export function onTimeRate(onTime: number, total: number): number {
  if (total <= 0) return 0;
  return round1((onTime / total) * 100);
}

/** Nombre de jours ouvrés entre deux dates, calendrier fourni par l'appelant. */
export function workingDaysBetween(calendar: readonly Date[], from: Date, to: Date): number {
  const start = from.getTime();
  const end = to.getTime();
  return calendar.filter((d) => d.getTime() >= start && d.getTime() <= end).length;
}

/** Days Sales Outstanding — délai moyen de règlement client. */
export function dso(receivables: number, revenueTTC: number, periodDays: number): number {
  if (revenueTTC <= 0) return 0;
  return round1((receivables / revenueTTC) * periodDays);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
