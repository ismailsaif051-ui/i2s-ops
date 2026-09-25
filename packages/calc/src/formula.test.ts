import { describe, expect, it } from 'vitest';
import { evaluateFormula, type FormulaValue } from './formula';

const scope =
  (valeurs: Record<string, FormulaValue>) =>
  (path: string[]): FormulaValue =>
    valeurs[path.join('.')] ?? null;

describe('evaluateFormula', () => {
  it('calcule les quatre opérations et les priorités', () => {
    expect(evaluateFormula('2 + 3 * 4', scope({}))).toBe(14);
    expect(evaluateFormula('(2 + 3) * 4', scope({}))).toBe(20);
    expect(evaluateFormula('10 / 4', scope({}))).toBe(2.5);
    expect(evaluateFormula('-3 + 1', scope({}))).toBe(-2);
  });

  it('lit les champs du formulaire, y compris d’une autre section', () => {
    const valeurs = scope({ tc: 45.8, tr: 37, 'tank.tankHeight': 12000 });
    expect(evaluateFormula('tc - tr', valeurs)).toBeCloseTo(8.8);
    expect(evaluateFormula('tank.tankHeight / 200', valeurs)).toBe(60);
  });

  /** Sur un rapport, une case vide se corrige ; un zéro faux passe inaperçu. */
  it('rend indéterminé dès qu’une valeur manque', () => {
    expect(evaluateFormula('tc - tr', scope({ tc: 45 }))).toBeNull();
    expect(evaluateFormula('closed / raised', scope({ closed: 3, raised: 0 }))).toBeNull();
    expect(evaluateFormula('avg(measures[].thickness)', scope({ 'measures[].thickness': [] }))).toBeNull();
  });

  it('agrège une colonne de tableau', () => {
    const valeurs = scope({ 'measures[].thickness': [300, 250, 180, 320] });
    expect(evaluateFormula('count(measures[].thickness)', valeurs)).toBe(4);
    expect(evaluateFormula('sum(measures[].thickness)', valeurs)).toBe(1050);
    expect(evaluateFormula('avg(measures[].thickness)', valeurs)).toBe(262.5);
    expect(evaluateFormula('countBelow(measures[].thickness, 240)', valeurs)).toBe(1);
    expect(evaluateFormula('countBetween(measures[].thickness, 240, 300)', valeurs)).toBe(2);
  });

  it('applique la règle des épaisseurs de peinture', () => {
    // 80 % de 300 µm = 240 : un point sous ce seuil, deux points entre 240 et 300.
    const valeurs = scope({
      'measures[].thickness': [300, 250, 180, 320],
      contractualThickness: 300,
    });
    expect(evaluateFormula('countBelow(measures[].thickness, 0.8 * contractualThickness)', valeurs)).toBe(1);
    expect(
      evaluateFormula(
        'round(100 * countBetween(measures[].thickness, 0.8 * contractualThickness, contractualThickness) / count(measures[].thickness), 0)',
        valeurs,
      ),
    ).toBe(50);
  });

  it('arrondit à la décimale demandée', () => {
    expect(evaluateFormula('round(8.8888, 2)', scope({}))).toBe(8.89);
    expect(evaluateFormula('round(8.8888, 0)', scope({}))).toBe(9);
  });

  /** Une formule fausse vient du formulaire : elle doit se voir à la publication. */
  it('refuse une formule mal écrite', () => {
    expect(() => evaluateFormula('2 +', scope({}))).toThrow();
    expect(() => evaluateFormula('2 ** 3', scope({}))).toThrow();
    expect(() => evaluateFormula('inconnue(3)', scope({}))).toThrow();
    expect(() => evaluateFormula('process.exit(1)', scope({}))).toThrow();
  });
});
