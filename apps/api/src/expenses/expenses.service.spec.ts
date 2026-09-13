import { describe, expect, it } from 'vitest';
import { EXPENSE_STEPS } from './expenses.service';

/**
 * Le circuit de visa est une chaîne : la sortie d'une étape est l'entrée de la
 * suivante. Un maillon manquant laisserait une note bloquée dans un statut que
 * personne ne peut franchir — sans message, sans recours.
 */
describe('circuit de visa des notes de frais', () => {
  it('enchaîne les étapes sans trou', () => {
    for (let i = 1; i < EXPENSE_STEPS.length; i += 1) {
      expect(EXPENSE_STEPS[i]!.from).toBe(EXPENSE_STEPS[i - 1]!.to);
    }
  });

  it('part de la note transmise et aboutit au bon à payer', () => {
    expect(EXPENSE_STEPS[0]!.from).toBe('SUBMITTED');
    expect(EXPENSE_STEPS[EXPENSE_STEPS.length - 1]!.to).toBe('READY_TO_PAY');
  });

  it('numérote les étapes dans l’ordre', () => {
    expect(EXPENSE_STEPS.map((s) => s.step)).toEqual([1, 2, 3, 4, 5]);
  });

  it('confie chaque étape à un rôle, et jamais au seul administrateur', () => {
    for (const step of EXPENSE_STEPS) {
      const business = step.roles.filter((r) => r !== 'ADMIN');
      expect(business.length, `l’étape « ${step.label} » n’a aucun rôle métier`).toBeGreaterThan(0);
    }
  });

  it('sépare la comptabilisation de l’approbation générale', () => {
    // Le RAF comptabilise et prépare le paiement ; la DG approuve entre les
    // deux. Confondre les deux rôles ôterait le contrôle croisé.
    const accounting = EXPENSE_STEPS.find((s) => s.to === 'ACCOUNTED')!;
    const approval = EXPENSE_STEPS.find((s) => s.to === 'APPROVED_DG')!;
    expect(accounting.roles).not.toContain('DG');
    expect(approval.roles).not.toContain('RAF');
  });
});
