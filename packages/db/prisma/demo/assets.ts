/**
 * Parc d'équipements des clients de démonstration.
 *
 * Ce sont les objets qu'I2S contrôle : bacs de stockage, ponts roulants,
 * circuits de tuyauterie, installations électriques, appareils de levage.
 * Chacun porte la périodicité que la réglementation marocaine lui impose —
 * c'est cette échéance qui ramène l'inspection l'année suivante.
 *
 * Aucun de ces équipements n'existe : les clients sont inventés.
 */

export interface AssetTemplate {
  /** Code du client porteur, tel que les fixtures le déclarent. */
  client: string;
  tag: string;
  type: string;
  brand?: string;
  model?: string;
  serialPrefix?: string;
  /** Périodicité réglementaire, en mois. */
  intervalM: number;
  regulatoryRef: string;
  /** Années écoulées depuis la mise en service. */
  ageYears: number;
}

export const ASSET_TEMPLATES: AssetTemplate[] = [
  /* ── Chimie et engrais ─────────────────────────────────────────── */
  {
    client: 'CL-001',
    tag: 'T-401',
    type: 'Bac de stockage acide sulfurique',
    brand: 'CHAUDRONNERIE ATLAS',
    model: '3 000 m³',
    serialPrefix: 'BAC',
    intervalM: 60,
    regulatoryRef: 'API 653 — inspection interne',
    ageYears: 12,
  },
  {
    client: 'CL-001',
    tag: 'T-402',
    type: 'Bac de stockage acide sulfurique',
    brand: 'CHAUDRONNERIE ATLAS',
    model: '3 000 m³',
    serialPrefix: 'BAC',
    intervalM: 60,
    regulatoryRef: 'API 653 — inspection interne',
    ageYears: 12,
  },
  {
    client: 'CL-001',
    tag: 'T-403',
    type: 'Bac de stockage acide sulfurique',
    brand: 'CHAUDRONNERIE ATLAS',
    model: '5 000 m³',
    serialPrefix: 'BAC',
    intervalM: 60,
    regulatoryRef: 'API 653 — inspection interne',
    ageYears: 8,
  },
  {
    client: 'CL-001',
    tag: 'LIG-12',
    type: 'Circuit de tuyauterie vapeur haute pression',
    intervalM: 24,
    regulatoryRef: 'API 570 — circuits classe 1',
    ageYears: 15,
  },
  {
    client: 'CL-001',
    tag: 'BAL-07',
    type: 'Ballon séparateur',
    brand: 'TECHNIP',
    serialPrefix: 'BAL',
    intervalM: 36,
    regulatoryRef: 'Décret 2-14-499 — appareils à pression',
    ageYears: 9,
  },

  /* ── Terminal pétrolier ────────────────────────────────────────── */
  {
    client: 'CL-003',
    tag: 'TK-101',
    type: 'Réservoir de stockage hydrocarbures',
    brand: 'SOFRESID',
    model: '10 000 m³',
    serialPrefix: 'TK',
    intervalM: 120,
    regulatoryRef: 'API 653 — fond de bac',
    ageYears: 18,
  },
  {
    client: 'CL-003',
    tag: 'TK-102',
    type: 'Réservoir de stockage hydrocarbures',
    brand: 'SOFRESID',
    model: '10 000 m³',
    serialPrefix: 'TK',
    intervalM: 120,
    regulatoryRef: 'API 653 — fond de bac',
    ageYears: 18,
  },
  {
    client: 'CL-003',
    tag: 'BRA-03',
    type: 'Bras de chargement navire',
    brand: 'FMC TECHNOLOGIES',
    serialPrefix: 'BRA',
    intervalM: 12,
    regulatoryRef: 'Arrêté du 9 juillet — équipements de chargement',
    ageYears: 6,
  },

  /* ── Cimenterie ────────────────────────────────────────────────── */
  {
    client: 'CL-002',
    tag: 'PR-01',
    type: 'Pont roulant bipoutre 25 t',
    brand: 'DEMAG',
    model: 'EKKE 25t',
    serialPrefix: 'DMG',
    intervalM: 12,
    regulatoryRef: 'Arrêté du 1er mars — appareils de levage',
    ageYears: 11,
  },
  {
    client: 'CL-002',
    tag: 'PR-02',
    type: 'Pont roulant monopoutre 10 t',
    brand: 'ABUS',
    model: 'ELV 10t',
    serialPrefix: 'ABS',
    intervalM: 12,
    regulatoryRef: 'Arrêté du 1er mars — appareils de levage',
    ageYears: 7,
  },
  {
    client: 'CL-002',
    tag: 'BRO-2',
    type: 'Broyeur à boulets — enveloppe',
    intervalM: 36,
    regulatoryRef: 'Contrôle d’intégrité — programme interne',
    ageYears: 20,
  },

  /* ── Portuaire ─────────────────────────────────────────────────── */
  {
    client: 'CL-008',
    tag: 'P3',
    type: 'Portique de déchargement 40 t',
    brand: 'KONECRANES',
    serialPrefix: 'KNC',
    intervalM: 12,
    regulatoryRef: 'Arrêté du 1er mars — appareils de levage',
    ageYears: 14,
  },
  {
    client: 'CL-008',
    tag: 'GRU-01',
    type: 'Grue mobile portuaire',
    brand: 'LIEBHERR',
    model: 'LHM 420',
    serialPrefix: 'LBH',
    intervalM: 12,
    regulatoryRef: 'Arrêté du 1er mars — appareils de levage',
    ageYears: 5,
  },

  /* ── Eau et traitement ─────────────────────────────────────────── */
  {
    client: 'CL-006',
    tag: 'POM-04',
    type: 'Station de pompage — collecteur',
    intervalM: 24,
    regulatoryRef: 'API 570 — circuits classe 2',
    ageYears: 10,
  },
  {
    client: 'CL-006',
    tag: 'TGBT-1',
    type: 'Tableau général basse tension',
    brand: 'SCHNEIDER',
    serialPrefix: 'SCH',
    intervalM: 12,
    regulatoryRef: 'Décret 2-14-499 — installations électriques',
    ageYears: 8,
  },

  /* ── Sidérurgie ────────────────────────────────────────────────── */
  {
    client: 'CL-004',
    tag: 'FOU-1',
    type: 'Four de réchauffage — structure',
    intervalM: 36,
    regulatoryRef: 'Contrôle d’intégrité — programme interne',
    ageYears: 22,
  },
  {
    client: 'CL-004',
    tag: 'PR-05',
    type: 'Pont roulant de coulée 50 t',
    brand: 'DEMAG',
    serialPrefix: 'DMG',
    intervalM: 6,
    regulatoryRef: 'Arrêté du 1er mars — levage en milieu chaud',
    ageYears: 16,
  },

  /* ── Bâtiment ──────────────────────────────────────────────────── */
  {
    client: 'CL-007',
    tag: 'GT-02',
    type: 'Grue à tour de chantier',
    brand: 'POTAIN',
    model: 'MDT 219',
    serialPrefix: 'PTN',
    intervalM: 6,
    regulatoryRef: 'Arrêté du 1er mars — grues à tour',
    ageYears: 3,
  },

  /* ── Maritime ──────────────────────────────────────────────────── */
  {
    client: 'DETR',
    tag: 'CAL-A',
    type: 'Cale sèche — portes et vannage',
    intervalM: 24,
    regulatoryRef: 'Contrôle d’intégrité — programme interne',
    ageYears: 30,
  },
];
