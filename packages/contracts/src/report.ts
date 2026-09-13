/**
 * Vérification d'un rapport d'inspection.
 *
 * La grille reprend les points que le système qualité impose au vérificateur.
 * Elle est enregistrée avec le rapport : un critère coché aujourd'hui doit
 * rester lisible tel quel dans dix ans, même si la grille évolue.
 */
export const REPORT_CHECK_CRITERIA = [
  'Complétude des champs obligatoires du formulaire',
  'Instrument de mesure en cours de validité d’étalonnage',
  'Cohérence des résultats avec le critère d’acceptation',
  'Visas rédacteur et vérificateur présents',
] as const;

export type ReportCheckCriterion = (typeof REPORT_CHECK_CRITERIA)[number];

/** Issue d'une vérification. */
export const CHECK_DECISIONS = ['VALIDATE', 'CORRECTION'] as const;
export type CheckDecision = (typeof CHECK_DECISIONS)[number];

export const CHECK_DECISION_LABELS: Record<CheckDecision, string> = {
  VALIDATE: 'Valider',
  CORRECTION: 'Renvoyer en correction',
};

export const REPORT_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_CHECK',
  'CORRECTION',
  'VALIDATED',
  'ISSUED',
  'ARCHIVED',
] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumis',
  UNDER_CHECK: 'En contrôle',
  CORRECTION: 'En correction',
  VALIDATED: 'Validé',
  ISSUED: 'Émis',
  ARCHIVED: 'Archivé',
};

/** Canaux de remise au client. */
export const DISTRIBUTION_CHANNELS = ['EMAIL', 'PORTAL', 'HAND', 'MAIL'] as const;
export type DistributionChannel = (typeof DISTRIBUTION_CHANNELS)[number];

export const DISTRIBUTION_CHANNEL_LABELS: Record<DistributionChannel, string> = {
  EMAIL: 'Courriel',
  PORTAL: 'Portail client',
  HAND: 'Remise en main propre',
  MAIL: 'Courrier',
};
