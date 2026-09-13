/** Formats d'affichage — français, dirham marocain. */

/** Normalise les espaces fines insécables d'ICU en espace insécable simple. */
function normalizeSpaces(value: string): string {
  return value.replace(/[  ]/g, ' ');
}

export function money(value: number | string | null | undefined, decimals = 0): string {
  if (value === null || value === undefined) return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '—';
  return normalizeSpaces(
    n.toLocaleString('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
  );
}

export function moneyDh(value: number | string | null | undefined, decimals = 0): string {
  const formatted = money(value, decimals);
  return formatted === '—' ? formatted : `${formatted} DH`;
}

/** Montants de tableau de bord : 4,12 M DH plutôt que 4 120 000 DH. */
export function compactDh(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} M DH`;
  }
  if (Math.abs(value) >= 10_000) {
    return `${(value / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} k DH`;
  }
  return moneyDh(value);
}

export function percent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} %`;
}

export function points(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} pts`;
}

export function date(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR');
}

export function dateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

export function monthLabel(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

/** Mois courant au format attendu par l'API (`2026-03`). */
export function currentMonthParam(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/* ── Libellés métier ────────────────────────────────────────────── */

export const AFFAIR_COMMERCIAL_LABELS: Record<string, string> = {
  GAGNEE: 'Gagnée',
  SUIVANT_OP: 'Suivant offre de prix',
  PERDUE_ANNULEE: 'Perdue / annulée',
  DP: 'DP',
};

export const AFFAIR_WORKS_LABELS: Record<string, string> = {
  NON_DEMARRE: 'Non démarré',
  EN_COURS: 'En cours',
  A_FACTURER: 'À facturer',
  FAC_PARTIELLE: 'Facturation partielle',
  FAC_TOTALE: 'Facturation totale',
  PERDU_ANNULE: 'Perdu / annulé',
};

export const MISSION_STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Demandée',
  PLANNED: 'Planifiée',
  ASSIGNED: 'Affectée',
  CONFIRMED: 'Confirmée',
  ORDER_ISSUED: 'OM émis',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  REPORTED: 'Rapport remis',
  CLOSED: 'Clôturée',
  POSTPONED: 'Reportée',
  CANCELLED: 'Annulée',
};

/**
 * Les statuts de rapport sont définis dans le contrat partagé : l'API et
 * l'interface doivent nommer le même état de la même façon. On réexporte ici
 * pour ne pas obliger chaque page à changer d'import.
 */
export { REPORT_STATUS_LABELS } from '@i2s/contracts';

export const EXPENSE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumise',
  CONFIRMED_N1: 'Confirmée N+1',
  CHECKED_HR_CG: 'Contrôlée RH / CG',
  ACCOUNTED: 'Comptabilisée',
  APPROVED_DG: 'Approuvée DG',
  READY_TO_PAY: 'Bon à payer',
  PAID: 'Payée',
  REJECTED: 'Rejetée',
};

export const DEVICE_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  IN_USE: 'En service',
  DUE_CALIBRATION: 'À étalonner',
  IN_CALIBRATION: 'En étalonnage',
  EXPIRED: 'Périmé',
  OUT_OF_SERVICE: 'Hors service',
};

export const VEHICLE_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  IN_USE: 'En mission',
  MAINTENANCE: 'En entretien',
  OUT_OF_SERVICE: 'Immobilisé',
};

export const OWNERSHIP_LABELS: Record<string, string> = {
  OWNED: 'Propriété',
  LLD: 'LLD',
  LCD: 'LCD',
};
