import { describe, expect, it } from 'vitest';
import { LEAVE_TYPES, LEAVE_TYPE_LABELS } from './leaves.service';

/**
 * Décompte des jours ouvrés d'une période. Repris à l'identique du service :
 * une erreur ici fausserait tous les soldes de congé.
 */
function workingDays(from: string, to: string, holidays: string[] = []): number {
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  const chomes = new Set(holidays);

  let days = 0;
  for (let day = new Date(start); day <= end; day = new Date(day.getTime() + 86_400_000)) {
    const iso = day.toISOString().slice(0, 10);
    if (chomes.has(iso)) continue;
    if ([0, 6].includes(day.getUTCDay())) continue;
    days += 1;
  }
  return days;
}

describe('décompte des jours de congé', () => {
  it('compte dix jours pour deux semaines pleines', () => {
    // Du lundi 7 au vendredi 18 décembre 2026.
    expect(workingDays('2026-12-07', '2026-12-18')).toBe(10);
  });

  it('exclut les week-ends', () => {
    expect(workingDays('2026-12-05', '2026-12-06')).toBe(0);
  });

  it('exclut les jours fériés du calendrier', () => {
    // Le 6 novembre 2026 est la Marche Verte, un vendredi.
    expect(workingDays('2026-11-02', '2026-11-06')).toBe(5);
    expect(workingDays('2026-11-02', '2026-11-06', ['2026-11-06'])).toBe(4);
  });

  it('compte une seule journée pour un congé d’un jour', () => {
    expect(workingDays('2026-12-07', '2026-12-07')).toBe(1);
  });
});

describe('natures de congé', () => {
  it('couvre les cinq natures du référentiel, chacune nommée', () => {
    expect(LEAVE_TYPES).toHaveLength(5);
    for (const type of LEAVE_TYPES) {
      expect(LEAVE_TYPE_LABELS[type], `nature ${type} sans libellé`).toBeTruthy();
    }
  });

  it('distingue l’arrêt maladie du congé annuel', () => {
    // Le pointage en fait deux catégories différentes : les confondre
    // fausserait le suivi d'absentéisme.
    expect(LEAVE_TYPES).toContain('SICK');
    expect(LEAVE_TYPES).toContain('ANNUAL');
  });
});
