import { describe, expect, it } from 'vitest';
import { TIMESHEET_CATEGORIES } from './timesheets.service';

/**
 * Le lundi d'une semaine — la fonction qui décide de quelle semaine on parle.
 * Elle est privée au service ; on la reprend ici à l'identique parce qu'une
 * erreur d'un jour décalerait tous les pointages d'un cran.
 */
function monday(date: Date): Date {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = (utc.getUTCDay() + 6) % 7;
  return new Date(utc.getTime() - weekday * 86_400_000);
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

describe('semaine de pointage', () => {
  it('ramène chaque jour au lundi de sa semaine', () => {
    // Du lundi 19 au dimanche 25 octobre 2026.
    for (const day of ['19', '20', '21', '22', '23', '24', '25']) {
      expect(iso(monday(new Date(`2026-10-${day}T12:00:00.000Z`)))).toBe('2026-10-19');
    }
  });

  it('bascule de semaine le lundi, pas le dimanche', () => {
    expect(iso(monday(new Date('2026-10-25T23:59:59.000Z')))).toBe('2026-10-19');
    expect(iso(monday(new Date('2026-10-26T00:00:00.000Z')))).toBe('2026-10-26');
  });

  it('reste stable quelle que soit l’heure du jour', () => {
    expect(iso(monday(new Date('2026-10-21T00:00:00.000Z')))).toBe('2026-10-19');
    expect(iso(monday(new Date('2026-10-21T23:30:00.000Z')))).toBe('2026-10-19');
  });

  it('franchit les changements de mois et d’année', () => {
    expect(iso(monday(new Date('2026-01-01T10:00:00.000Z')))).toBe('2025-12-29');
    expect(iso(monday(new Date('2026-12-31T10:00:00.000Z')))).toBe('2026-12-28');
  });
});

describe('catégories de pointage', () => {
  it('couvre les natures de journée du cahier des charges', () => {
    // Une journée non affectée doit exister : c'est elle qui porte le coût
    // d'inactivité, l'indicateur que la direction voulait voir apparaître.
    expect(TIMESHEET_CATEGORIES).toContain('UNASSIGNED');
    expect(TIMESHEET_CATEGORIES).toContain('MISSION_BILLABLE');
    expect(TIMESHEET_CATEGORIES).toContain('MISSION_NON_BILLABLE');
    expect(TIMESHEET_CATEGORIES).toContain('SITE_WAITING');
  });
});
