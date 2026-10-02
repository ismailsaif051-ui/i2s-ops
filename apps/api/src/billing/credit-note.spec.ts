import { describe, expect, it } from 'vitest';
import { creditOutcome } from './billing.service';

// Facture 10 000 HT, TVA 20 % → 12 000 TTC.
const invoice = { totalHT: 10_000, totalTTC: 12_000, vatRate: 20, creditedHT: 0, creditedTTC: 0, paid: 0 };

describe('avoir', () => {
  it('reprend le taux de TVA de la facture', () => {
    const r = creditOutcome({ ...invoice, amountHT: 2_500 });
    expect(r).toEqual({ accepted: true, amountTTC: 3_000, remaining: 9_000 });
  });

  it('un avoir total solde la facture au centime près', () => {
    // 3 avoirs de 3 333,33 + le reliquat : le dernier reprend exactement le TTC restant.
    let credited = { HT: 0, TTC: 0 };
    for (const amountHT of [3_333.33, 3_333.33]) {
      const r = creditOutcome({ ...invoice, creditedHT: credited.HT, creditedTTC: credited.TTC, amountHT });
      if (!r.accepted) throw new Error(r.reason);
      credited = { HT: credited.HT + amountHT, TTC: credited.TTC + r.amountTTC };
    }
    const last = creditOutcome({ ...invoice, creditedHT: credited.HT, creditedTTC: credited.TTC, amountHT: 3_333.34 });
    expect(last.accepted).toBe(true);
    if (last.accepted) {
      expect(Math.round((credited.TTC + last.amountTTC) * 100)).toBe(1_200_000);
      expect(last.remaining).toBe(0);
    }
  });

  it('refuse un avoir supérieur au hors-taxes restant', () => {
    const r = creditOutcome({ ...invoice, creditedHT: 8_000, creditedTTC: 9_600, amountHT: 2_500 });
    expect(r.accepted).toBe(false);
  });

  it('refuse un avoir qui créerait un trop-perçu à rembourser', () => {
    // Facture déjà réglée à 11 000 : il ne reste que 1 000 TTC dus.
    const r = creditOutcome({ ...invoice, paid: 11_000, amountHT: 2_000 });
    expect(r.accepted).toBe(false);
    if (!r.accepted) expect(r.reason).toContain('remboursement');
  });

  it('accepte un avoir qui solde exactement le reste dû après acompte', () => {
    const r = creditOutcome({ ...invoice, paid: 9_600, amountHT: 2_000 });
    expect(r).toEqual({ accepted: true, amountTTC: 2_400, remaining: 0 });
  });

  it('refuse un montant nul ou négatif', () => {
    expect(creditOutcome({ ...invoice, amountHT: 0 }).accepted).toBe(false);
    expect(creditOutcome({ ...invoice, amountHT: -10 }).accepted).toBe(false);
  });
});
