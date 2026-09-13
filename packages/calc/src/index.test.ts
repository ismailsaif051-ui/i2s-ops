import { describe, expect, it } from 'vitest';
import {
  MARGIN_ALERT_POINTS,
  assignmentRate,
  breakdown,
  dso,
  idleCost,
  netProductivity,
  nonBillableSiteCost,
  onTimeRate,
  profitability,
  vacationMargin,
  type TimesheetFact,
} from './index';

describe('décomposition du temps ouvré', () => {
  it('répartit chaque catégorie dans le bon agrégat', () => {
    const result = breakdown({
      MISSION_BILLABLE: 14,
      MISSION_NON_BILLABLE: 2,
      SITE_WAITING: 3,
      WEATHER: 1,
      LEAVE: 2,
      TRAINING: 1,
      UNASSIGNED: 4,
    });

    expect(result.worked).toBe(16);
    expect(result.waiting).toBe(4);
    expect(result.leave).toBe(3);
    expect(result.unassigned).toBe(4);
    expect(result.total).toBe(27);
  });

  it('renvoie zéro partout sans donnée', () => {
    expect(breakdown({})).toEqual({ worked: 0, waiting: 0, leave: 0, unassigned: 0, total: 0 });
  });
});

describe('productivité nette', () => {
  it('applique la formule du cahier des charges', () => {
    // 16 jours facturés sur 22 ouvrés dont 2 de congé → 16 / 20 = 80 %
    expect(netProductivity(16, 22, 2)).toBe(80);
  });

  it('ne compte pas les jours travaillés non attachés', () => {
    // 18 jours travaillés mais seulement 14 portés par un attachement
    expect(netProductivity(14, 22, 0)).toBeCloseTo(63.6, 1);
  });

  it('évite la division par zéro quand tout le mois est en congé', () => {
    expect(netProductivity(0, 22, 22)).toBe(0);
  });
});

describe("coût d'inactivité", () => {
  it('somme fait par fait, avec le coût en vigueur à la date', () => {
    // Trois jours non affectés à cheval sur une revalorisation trimestrielle
    const facts: TimesheetFact[] = [
      { category: 'UNASSIGNED', dailyCost: 850 },
      { category: 'UNASSIGNED', dailyCost: 850 },
      { category: 'UNASSIGNED', dailyCost: 900 },
      { category: 'MISSION_BILLABLE', dailyCost: 900 },
      { category: 'LEAVE', dailyCost: 900 },
    ];
    expect(idleCost(facts)).toBe(2600);
  });

  it('utiliser le coût courant au lieu du coût à la date fausserait le total', () => {
    // Deux jours au tarif T1 (850) et un au tarif T3 (900).
    const facts: TimesheetFact[] = [
      { category: 'UNASSIGNED', dailyCost: 850 },
      { category: 'UNASSIGNED', dailyCost: 850 },
      { category: 'UNASSIGNED', dailyCost: 900 },
    ];
    const currentCost = 900;
    expect(idleCost(facts)).toBe(2600);
    expect(idleCost(facts)).not.toBe(currentCost * facts.length); // 2700
  });

  it('isole le coût des jours non facturables passés sur site', () => {
    const facts: TimesheetFact[] = [
      { category: 'SITE_WAITING', dailyCost: 850 },
      { category: 'WEATHER', dailyCost: 850 },
      { category: 'UNASSIGNED', dailyCost: 850 },
    ];
    expect(nonBillableSiteCost(facts)).toBe(1700);
  });
});

describe('rentabilité', () => {
  const revenues = {
    contractAmount: 480000,
    invoiced: 312000,
    collected: 240000,
    pendingAttachments: 48000,
  };

  it('calcule marge, taux et écart au budget', () => {
    const result = profitability(
      revenues,
      { labour: 180000, expenses: 42000, vehicles: 28000, subcontracting: 15000, other: 21400 },
      22,
    );

    expect(result.costs.total).toBe(286400);
    expect(result.grossMargin).toBe(25600);
    expect(result.marginRate).toBeCloseTo(8.2, 1);
    expect(result.marginGapPoints).toBeCloseTo(-13.8, 1);
    expect(result.atRisk).toBe(true);
  });

  it("ne déclenche pas l'alerte pour un écart faible", () => {
    const result = profitability(
      revenues,
      { labour: 150000, expenses: 30000, vehicles: 20000, subcontracting: 10000, other: 8000 },
      25,
    );
    expect(result.marginGapPoints).toBeGreaterThan(-MARGIN_ALERT_POINTS);
    expect(result.atRisk).toBe(false);
  });

  it("n'invente pas d'écart quand aucun budget de marge n'est défini", () => {
    const result = profitability(revenues, { labour: 1, expenses: 0, vehicles: 0, subcontracting: 0, other: 0 }, null);
    expect(result.marginGapPoints).toBeNull();
    expect(result.atRisk).toBe(false);
  });

  it('déduit le reste à facturer du montant contractuel', () => {
    const result = profitability(revenues, { labour: 0, expenses: 0, vehicles: 0, subcontracting: 0, other: 0 }, 22);
    expect(result.remainingToInvoice).toBe(120000);
  });

  it('renvoie un taux nul plutôt que NaN sans chiffre d’affaires facturé', () => {
    const result = profitability(
      { contractAmount: 100000, invoiced: 0, collected: 0, pendingAttachments: 0 },
      { labour: 5000, expenses: 0, vehicles: 0, subcontracting: 0, other: 0 },
      20,
    );
    expect(result.marginRate).toBe(0);
    expect(Number.isNaN(result.marginRate)).toBe(false);
  });
});

describe('indicateurs simples', () => {
  it('marge par vacation', () => {
    expect(vacationMargin(1800, 850, 260)).toBe(690);
  });

  it("taux d'affectation", () => {
    expect(assignmentRate(11, 15)).toBeCloseTo(73.3, 1);
    expect(assignmentRate(0, 0)).toBe(0);
  });

  it('taux de respect des délais', () => {
    expect(onTimeRate(39, 50)).toBe(78);
    expect(onTimeRate(0, 0)).toBe(0);
  });

  it('DSO', () => {
    expect(dso(1_200_000, 4_120_000, 90)).toBeCloseTo(26.2, 1);
    expect(dso(1000, 0, 90)).toBe(0);
  });
});
