import { describe, expect, it } from 'vitest';
import { COST_CATEGORIES, daysOf, totalCosts, workingDaysOf, zeroCosts } from './affair-costs.service';

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
const t = (iso: string) => d(iso).getTime();
const mission = (start: string, end: string) => ({
  affairId: 'a',
  plannedStartDate: d(start),
  plannedEndDate: d(end),
  affair: { companyId: 'c' },
  vehicle: null,
});
const weekdays = (_c: string, time: number) => {
  const day = new Date(time).getUTCDay();
  return day >= 1 && day <= 5;
};

describe('jours d’une mission', () => {
  // Lundi 5 → lundi 12 octobre 2026 : 8 jours de calendrier, 6 ouvrés.
  const m = mission('2026-10-05', '2026-10-12');

  it('compte les jours ouvrés, pas les week-ends', () => {
    expect(daysOf(m, {})).toHaveLength(8);
    expect(workingDaysOf(m, weekdays, {})).toBe(6);
  });

  it('mission en cours : les jours passés vont au réel, les jours à venir à l’engagé', () => {
    // Aujourd'hui jeudi 8 : lundi-mercredi déjà pointés (3), jeudi-lundi à venir (3 ouvrés).
    const today = t('2026-10-08');
    const past = workingDaysOf(m, weekdays, { until: today });
    const ahead = workingDaysOf(m, weekdays, { from: today });
    expect(past).toBe(3);
    expect(ahead).toBe(3);
    // Rien n'est compté deux fois, rien n'est oublié.
    expect(past + ahead).toBe(workingDaysOf(m, weekdays, {}));
  });

  it('une mission sans dates n’a pas de jours', () => {
    expect(daysOf({ ...m, plannedEndDate: null }, {})).toEqual([]);
  });
});

describe('postes de coût', () => {
  it('le total additionne les cinq postes', () => {
    const costs = { ...zeroCosts(), LABOUR: 1000, SUBCONTRACTING: 250.5, OTHER: 49.5 };
    expect(totalCosts(costs)).toBe(1300);
    expect(COST_CATEGORIES).toHaveLength(5);
  });
});
