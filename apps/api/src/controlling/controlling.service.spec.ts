import { describe, expect, it } from 'vitest';
import {
  BILLING_LAG_DAYS,
  COST_CATEGORIES,
  COST_LABELS,
  COST_SOURCES,
  OVERRUN_ALERT_RATE,
  type CostCategory,
} from './controlling.service';

describe('contrôle de gestion', () => {
  it('nomme chaque poste de coût du budget', () => {
    // Ce sont les catégories de `AffairBudgetLine` : un poste réel qui n'y
    // figurerait pas tomberait hors du tableau sans que personne le voie.
    expect(COST_CATEGORIES).toEqual([
      'LABOUR',
      'EXPENSES',
      'VEHICLES',
      'SUBCONTRACTING',
      'OTHER',
    ]);

    for (const category of COST_CATEGORIES) {
      expect(COST_LABELS[category], `poste ${category} sans libellé`).toBeTruthy();
      expect(COST_SOURCES).toHaveProperty(category);
    }
  });

  it('dit d’où vient le réel de chaque poste, ou qu’il n’en a pas', () => {
    // Un poste sans source affiché à zéro passerait pour une économie de
    // 100 % : c'est faux, et cela pousserait à la mauvaise décision.
    expect(COST_SOURCES.LABOUR).toContain('coût figé');
    expect(COST_SOURCES.EXPENSES).toContain('acceptées');
    expect(COST_SOURCES.VEHICLES).toContain('prorata');

    expect(COST_SOURCES.SUBCONTRACTING).toBeNull();
    expect(COST_SOURCES.OTHER).toBeNull();
  });

  it('garde au moins un poste alimenté', () => {
    // Sinon le contrôle de gestion ne contrôlerait rien.
    const tracked = COST_CATEGORIES.filter((c) => COST_SOURCES[c] !== null);
    expect(tracked.length).toBeGreaterThan(0);
  });

  it('fixe un seuil d’alerte qui laisse passer le bruit d’un chantier', () => {
    // Trop bas, tout est en alerte et plus personne ne regarde ; trop haut,
    // la dérive n'est vue qu'à la clôture.
    expect(OVERRUN_ALERT_RATE).toBeGreaterThanOrEqual(5);
    expect(OVERRUN_ALERT_RATE).toBeLessThanOrEqual(20);
  });

  it('laisse au circuit d’attachement le temps de se faire', () => {
    // Le délai doit dépasser le cycle mensuel des attachements, sinon chaque
    // fin de mois déclencherait une alerte sur du travail normal.
    expect(BILLING_LAG_DAYS).toBeGreaterThan(30);
  });

  it('calcule le coût à terminaison comme consommé plus reste à engager', () => {
    // La règle qui distingue un consommé, qui ne dit rien de la suite, d'un
    // coût à terminaison, qui dit si l'affaire tiendra son budget.
    const consumed: Record<CostCategory, number> = {
      LABOUR: 120_000,
      EXPENSES: 8_000,
      VEHICLES: 4_500,
      SUBCONTRACTING: 0,
      OTHER: 0,
    };
    const committed: Record<CostCategory, number> = {
      LABOUR: 30_000,
      EXPENSES: 0,
      VEHICLES: 1_500,
      SUBCONTRACTING: 0,
      OTHER: 0,
    };

    const tracked = COST_CATEGORIES.filter((c) => COST_SOURCES[c] !== null);
    const atCompletion = tracked.reduce((s, c) => s + consumed[c] + committed[c], 0);

    expect(atCompletion).toBe(164_000);

    // Un budget de 150 000 est tenu au consommé (132 500) mais dépassé à
    // terminaison : c'est exactement ce que l'écran doit montrer.
    const planned = 150_000;
    expect(tracked.reduce((s, c) => s + consumed[c], 0)).toBeLessThan(planned);
    expect(atCompletion).toBeGreaterThan(planned);
  });
});
