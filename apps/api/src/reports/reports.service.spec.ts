import { describe, expect, it } from 'vitest';
import { isOnTime } from './reports.service';

/**
 * Regression : l'échéance est une date (minuit) et la remise un instant.
 * Comparés tels quels, tout rapport remis le jour même de l'échéance était
 * compté en retard — et le taux de respect du délai s'en trouvait faussé.
 */
describe('isOnTime', () => {
  const due = new Date('2026-09-07T00:00:00.000Z');

  it('compte une remise le jour de l’échéance comme dans le délai', () => {
    expect(isOnTime(new Date('2026-09-07T14:02:29.407Z'), due)).toBe(true);
    expect(isOnTime(new Date('2026-09-07T23:59:59.999Z'), due)).toBe(true);
  });

  it('compte le lendemain comme hors délai', () => {
    expect(isOnTime(new Date('2026-09-08T00:00:00.001Z'), due)).toBe(false);
  });

  it('compte une remise anticipée comme dans le délai', () => {
    expect(isOnTime(new Date('2026-08-30T09:00:00.000Z'), due)).toBe(true);
  });

  it('ne se prononce pas sans remise ou sans échéance', () => {
    expect(isOnTime(null, due)).toBeNull();
    expect(isOnTime(new Date('2026-09-07T10:00:00.000Z'), null)).toBeNull();
  });
});
