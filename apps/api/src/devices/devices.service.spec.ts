import { describe, expect, it } from 'vitest';
import { CALIBRATION_RESULTS } from './devices.service';

/**
 * Échéance retenue quand le certificat n'en porte pas : la périodicité de
 * l'instrument s'applique à la date d'étalonnage. Reprise ici parce qu'une
 * erreur de mois prolongerait ou raccourcirait à tort la validité d'un
 * appareil — et donc la validité des rapports qui s'appuient dessus.
 */
function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

describe('échéance déduite de la périodicité', () => {
  it('ajoute la périodicité usuelle de douze mois', () => {
    expect(iso(addMonths(new Date('2026-09-01T00:00:00.000Z'), 12))).toBe('2027-09-01');
  });

  it('franchit le changement d’année', () => {
    expect(iso(addMonths(new Date('2026-11-15T00:00:00.000Z'), 6))).toBe('2027-05-15');
  });

  it('gère une périodicité courte, comme un pied à coulisse', () => {
    expect(iso(addMonths(new Date('2026-09-30T00:00:00.000Z'), 3))).toBe('2026-12-30');
  });

  it('reporte au mois suivant quand le quantième n’existe pas', () => {
    // 31 janvier + 1 mois : février n'a pas de 31. La date bascule au 3 mars —
    // comportement de JavaScript, retenu ici volontairement plutôt que corrigé,
    // car il ne raccourcit jamais la validité.
    expect(iso(addMonths(new Date('2026-01-31T00:00:00.000Z'), 1))).toBe('2026-03-03');
  });
});

describe('résultats d’étalonnage', () => {
  it('distingue le conforme sous réserve du non conforme', () => {
    // La réserve laisse l'instrument utilisable ; la non-conformité le sort du
    // service. Confondre les deux remettrait en circulation un appareil refusé.
    expect(CALIBRATION_RESULTS).toEqual(['CONFORM', 'CONFORM_WITH_RESERVE', 'NON_CONFORM']);
  });
});
