import { describe, expect, it } from 'vitest';
import { splitDay, sumShares } from './day-split';

describe('partage d’une journée entre plusieurs interventions', () => {
  it('laisse une journée entière à une intervention seule', () => {
    expect(splitDay(1, 1200)).toEqual([{ share: 1, cost: 1200 }]);
  });

  it('coupe la journée en deux parts égales', () => {
    // Un palan le matin, une élingue l'après-midi : 0,5 chacune.
    expect(splitDay(2, 1200)).toEqual([
      { share: 0.5, cost: 600 },
      { share: 0.5, cost: 600 },
    ]);
  });

  it('redonne exactement une journée et le coût du jour, même coupée en trois', () => {
    // 1/3 ne tombe pas juste : la dernière part absorbe l'arrondi, sinon la
    // journée vaudrait 0,9999 jour et perdrait un centime.
    const slots = splitDay(3, 1000);

    expect(slots.map((s) => s.share)).toEqual([0.3333, 0.3333, 0.3334]);
    expect(sumShares(slots.map((s) => s.share))).toBe(1);
    expect(slots.map((s) => s.cost)).toEqual([333.33, 333.33, 333.34]);
    expect(Math.round(slots.reduce((sum, s) => sum + (s.cost ?? 0), 0) * 100) / 100).toBe(1000);
  });

  it('garde un coût inconnu comme inconnu, au lieu de l’inventer à zéro', () => {
    expect(splitDay(2, null)).toEqual([
      { share: 0.5, cost: null },
      { share: 0.5, cost: null },
    ]);
  });

  it('traite une demande absurde comme une intervention unique', () => {
    expect(splitDay(0, 800)).toEqual([{ share: 1, cost: 800 }]);
  });

  it('additionne des parts sans dérive d’arrondi', () => {
    // 0,1 + 0,2 vaut 0,30000000000000004 en virgule flottante : pas ici.
    expect(sumShares([0.1, 0.2])).toBe(0.3);
    expect(sumShares([0.3333, 0.3333, 0.3334])).toBe(1);
  });
});
