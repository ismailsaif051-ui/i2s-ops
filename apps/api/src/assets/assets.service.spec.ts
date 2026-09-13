import { describe, expect, it } from 'vitest';
import { addMonths, startOfDay } from './assets.service';

const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Report de l'échéance réglementaire après un contrôle.
 *
 * Une erreur ici décale la prochaine visite d'un équipement sous pression ou
 * d'un appareil de levage : c'est la date qui atteste que le contrôle est à
 * jour devant l'inspection du travail.
 */
describe('échéance réglementaire', () => {
  it('reporte d’une périodicité annuelle', () => {
    expect(iso(addMonths(new Date('2026-09-07T00:00:00.000Z'), 12))).toBe('2027-09-07');
  });

  it('reporte d’une périodicité de six mois — levage en milieu chaud', () => {
    expect(iso(addMonths(new Date('2026-09-07T00:00:00.000Z'), 6))).toBe('2027-03-07');
  });

  it('reporte d’une périodicité décennale — fond de bac', () => {
    expect(iso(addMonths(new Date('2026-09-07T00:00:00.000Z'), 120))).toBe('2036-09-07');
  });

  it('franchit le changement d’année', () => {
    expect(iso(addMonths(new Date('2026-11-20T00:00:00.000Z'), 24))).toBe('2028-11-20');
  });

  it('ramène toute date au début du jour, en UTC', () => {
    // Sans cela, deux contrôles du même jour produiraient deux échéances
    // différentes selon l'heure de saisie.
    expect(iso(startOfDay(new Date('2026-09-07T23:45:00.000Z')))).toBe('2026-09-07');
    expect(iso(startOfDay(new Date('2026-09-07T00:00:00.000Z')))).toBe('2026-09-07');
  });
});
