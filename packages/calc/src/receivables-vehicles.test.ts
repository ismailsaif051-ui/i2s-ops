import { describe, expect, it } from 'vitest';
import { isOverdue, openBalance, vehicleShare } from './index';

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe('reste dû et facture échue', () => {
  it('déduit les règlements partiels', () => {
    expect(openBalance(12_000, 5_000)).toBe(7_000);
  });

  it('ignore un reliquat d’arrondi', () => {
    expect(openBalance(1_620, 1_619.995)).toBe(0);
    expect(openBalance(1_620, 1_620)).toBe(0);
  });

  it('est échue le lendemain de l’échéance, pas le jour même', () => {
    expect(isOverdue(d('2026-10-01'), 100, d('2026-10-01'))).toBe(false);
    expect(isOverdue(d('2026-10-01'), 100, d('2026-10-02'))).toBe(true);
  });

  it('n’est jamais échue une fois soldée', () => {
    expect(isOverdue(d('2026-01-01'), 0, d('2026-10-02'))).toBe(false);
  });

  it('ignore l’heure du jour', () => {
    expect(isOverdue(d('2026-10-01'), 100, new Date('2026-10-01T23:59:00Z'))).toBe(false);
  });
});

describe('quote-part véhicule', () => {
  it('répartit le loyer sur 22 jours ouvrés', () => {
    expect(vehicleShare(3_500, 27)).toBe(4_295.45);
  });

  it('une semaine de mission = 5 jours ouvrés, pas 7', () => {
    expect(vehicleShare(2_200, 5)).toBe(500);
  });

  it('rien sans loyer ni jour ouvré', () => {
    expect(vehicleShare(0, 10)).toBe(0);
    expect(vehicleShare(3_000, 0)).toBe(0);
  });
});
