import { describe, expect, it } from 'vitest';
import { BILLING_UNITS, BILLING_UNIT_LABELS, billedQuantity, unitFromRate } from './billing.service';

/**
 * Ce que le client paie dépend de son bon de commande, affaire par affaire.
 * Une erreur ici se voit sur la facture : une mission facturée deux fois au
 * forfait, ou une demi-journée comptée comme une journée entière.
 */
describe('facturation selon le bon de commande', () => {
  const mission = { days: 2.5, interventionDays: 4, equipments: 7, alreadyBilled: false };

  it('facture à la vacation le temps passé, demi-journées comprises', () => {
    // Quatre jours d'intervention, dont trois partagés avec une autre mission.
    expect(billedQuantity('VACATION', mission)).toEqual({ quantity: 2.5, note: null });
  });

  it('facture à l’intervention chaque jour où la mission a eu lieu', () => {
    // Un jour partagé avec une autre mission compte quand même pour 1.
    expect(billedQuantity('INTERVENTION', mission)).toEqual({ quantity: 4, note: null });
  });

  it('facture à l’unité le nombre d’équipements contrôlés', () => {
    expect(billedQuantity('UNIT', mission)).toEqual({ quantity: 7, note: null });
  });

  it('ne facture pas zéro équipement en silence', () => {
    const outcome = billedQuantity('UNIT', { ...mission, equipments: 0 });
    expect(outcome.quantity).toBe(0);
    expect(outcome.note).toContain('nombre d’équipements');
  });

  it('facture un forfait une seule fois par mission', () => {
    expect(billedQuantity('FIXED', mission)).toEqual({ quantity: 1, note: null });

    const again = billedQuantity('FIXED', { ...mission, alreadyBilled: true });
    expect(again.quantity).toBe(0);
    expect(again.note).toContain('déjà');
  });

  it('comprend les unités saisies en clair dans un barème', () => {
    expect(unitFromRate('vacation')).toBe('VACATION');
    expect(unitFromRate('Journée')).toBe('VACATION');
    expect(unitFromRate('intervention')).toBe('INTERVENTION');
    expect(unitFromRate('unité')).toBe('UNIT');
    expect(unitFromRate('Équipement')).toBe('UNIT');
    expect(unitFromRate('Forfait')).toBe('FIXED');
  });

  it('laisse le bon de commande décider quand le barème ne dit rien', () => {
    expect(unitFromRate(null)).toBeNull();
    expect(unitFromRate('')).toBeNull();
    expect(unitFromRate('mètre linéaire')).toBeNull();
  });

  it('nomme chaque unité sur l’attachement et la facture', () => {
    for (const unit of BILLING_UNITS) {
      expect(BILLING_UNIT_LABELS[unit].name).toBeTruthy();
      expect(BILLING_UNIT_LABELS[unit].unit).toBeTruthy();
    }
  });
});
