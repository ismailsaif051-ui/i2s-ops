import { describe, expect, it } from 'vitest';
import { settle } from './billing.service';

/**
 * Le solde décide du statut d'une facture. Une erreur ici se voit au bilan :
 * une facture soldée qui reste ouverte au recouvrement, ou l'inverse.
 */
describe('solde d’une facture', () => {
  it('accepte un acompte et laisse la facture partiellement réglée', () => {
    const outcome = settle(114_480, 0, 50_000);
    expect(outcome.accepted).toBe(true);
    expect(outcome.status).toBe('PARTIALLY_PAID');
    expect(outcome.remaining).toBe(64_480);
  });

  it('solde la facture au dernier règlement', () => {
    const outcome = settle(114_480, 50_000, 64_480);
    expect(outcome.accepted).toBe(true);
    expect(outcome.status).toBe('PAID');
    expect(outcome.remaining).toBe(0);
  });

  it('refuse un règlement supérieur au solde', () => {
    expect(settle(1_000, 900, 200).accepted).toBe(false);
    expect(settle(1_000, 0, 1_000.5).accepted).toBe(false);
  });

  it('refuse un montant nul ou négatif', () => {
    expect(settle(1_000, 0, 0).accepted).toBe(false);
    expect(settle(1_000, 0, -50).accepted).toBe(false);
  });

  it('absorbe l’arrondi de TVA au dernier centime', () => {
    // 3 333,33 × 3 laisse un centime d'écart : la facture doit se solder.
    const outcome = settle(10_000, 9_999.99, 0.01);
    expect(outcome.accepted).toBe(true);
    expect(outcome.status).toBe('PAID');
  });

  it('ne solde pas une facture à laquelle il manque plus qu’un centime', () => {
    expect(settle(10_000, 9_000, 500).status).toBe('PARTIALLY_PAID');
  });
});
