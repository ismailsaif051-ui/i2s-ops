import { describe, expect, it } from 'vitest';
import { DEFAULT_DUE_DAYS, SEVERITIES } from './non-conformities.service';

describe('délais de traitement par gravité', () => {
  it('couvre les quatre gravités du référentiel', () => {
    for (const severity of SEVERITIES) {
      expect(DEFAULT_DUE_DAYS[severity], `gravité ${severity} sans délai`).toBeGreaterThan(0);
    }
  });

  it('serre le délai à mesure que la gravité monte', () => {
    // Un écart critique se traite dans la semaine ; une observation peut
    // attendre. Un ordre inversé viderait la gravité de son sens.
    expect(DEFAULT_DUE_DAYS.CRITICAL).toBeLessThan(DEFAULT_DUE_DAYS.MAJOR);
    expect(DEFAULT_DUE_DAYS.MAJOR).toBeLessThan(DEFAULT_DUE_DAYS.MINOR);
    expect(DEFAULT_DUE_DAYS.MINOR).toBeLessThan(DEFAULT_DUE_DAYS.OBSERVATION);
  });

  it('laisse une semaine au plus pour un écart critique', () => {
    expect(DEFAULT_DUE_DAYS.CRITICAL).toBeLessThanOrEqual(7);
  });

  it('nomme les gravités comme le référentiel qualité', () => {
    expect(SEVERITIES).toEqual(['CRITICAL', 'MAJOR', 'MINOR', 'OBSERVATION']);
  });
});
