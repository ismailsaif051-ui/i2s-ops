/**
 * Unités de facturation d'un bon de commande — dans l'ordre où on les rencontre.
 *
 * Dans un module neutre, ni serveur ni navigateur : la fiche affaire (rendue
 * côté serveur) et les formulaires (côté navigateur) en ont besoin. Exportée
 * d'un fichier « use client », la liste n'arrive au serveur que comme une
 * référence vide, et la page plante au premier `.find`.
 */
export const BILLING_UNIT_OPTIONS = [
  {
    value: 'VACATION',
    label: 'À la vacation',
    unit: 'vacation',
    hint: 'La journée d’inspecteur ; une demi-journée compte 0,5.',
  },
  {
    value: 'INTERVENTION',
    label: 'À l’intervention',
    unit: 'intervention',
    hint: 'Chaque jour où la mission a lieu compte 1, même partagé avec une autre.',
  },
  {
    value: 'UNIT',
    label: 'À l’unité (équipement contrôlé)',
    unit: 'équipement',
    hint: 'Un prix par palan, élingue, grue… compté sur les rapports d’inspection.',
  },
  {
    value: 'FIXED',
    label: 'Au forfait',
    unit: 'forfait',
    hint: 'La mission se facture une seule fois, quel que soit le temps passé.',
  },
] as const;

export type BillingUnitValue = (typeof BILLING_UNIT_OPTIONS)[number]['value'];
