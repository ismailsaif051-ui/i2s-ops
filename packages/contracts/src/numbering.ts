/**
 * Formats de numérotation métier. Voir docs/03-MODELE-DONNEES.md §13.
 * Le motif est stocké en base (paramétrable) ; ces valeurs sont les défauts.
 */

export const NUMBER_SCOPES = [
  'AFFAIR',
  'MISSION',
  'MISSION_ORDER',
  'REPORT',
  'ATTACHMENT',
  'INVOICE',
  'EXPENSE_REPORT',
  'NON_CONFORMITY',
  'OFFER',
  'CREDIT_NOTE',
] as const;
export type NumberScope = (typeof NUMBER_SCOPES)[number];

export const DEFAULT_PATTERNS: Record<NumberScope, string> = {
  AFFAIR: '{YY}/{SEQ}',
  MISSION: 'MIS-{YY}-{SEQ}',
  MISSION_ORDER: 'OM-{YY}-{SEQ}',
  REPORT: '{FORM}-{YY}-{SEQ}',
  ATTACHMENT: 'ATT-{YY}-{SEQ}',
  INVOICE: 'F-{YY}-{SEQ}',
  EXPENSE_REPORT: 'NF-{YY}-{MM}-{MATRICULE}',
  NON_CONFORMITY: 'NC-{YY}-{SEQ}',
  OFFER: 'OFF-{YY}-{SEQ}',
  CREDIT_NOTE: 'AV-{YY}-{SEQ}',
};

export interface NumberTokens {
  year: number;
  sequence: number;
  padding?: number;
  month?: number;
  formCode?: string;
  matricule?: string;
  companyCode?: string;
}

/**
 * Rend un numéro métier à partir d'un motif.
 * Jetons : {YYYY} {YY} {MM} {SEQ} {FORM} {MATRICULE} {CO}
 */
export function formatNumber(pattern: string, t: NumberTokens): string {
  const padding = t.padding ?? 4;
  return pattern
    .replace('{YYYY}', String(t.year))
    .replace('{YY}', String(t.year % 100).padStart(2, '0'))
    .replace('{MM}', String(t.month ?? 1).padStart(2, '0'))
    .replace('{SEQ}', String(t.sequence).padStart(padding, '0'))
    .replace('{FORM}', t.formCode ?? '')
    .replace('{MATRICULE}', t.matricule ?? '')
    .replace('{CO}', t.companyCode ?? '');
}
