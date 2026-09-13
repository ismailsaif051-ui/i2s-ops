/**
 * ═══════════════════════════════════════════════════════════════════════
 *  DONNÉES DE DÉMONSTRATION — ENTIÈREMENT FICTIVES
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Aucune de ces entreprises, personnes, affaires ou valeurs ne correspond à
 * une réalité d'I2S TESTING. Les raisons sociales sont inventées et ne
 * désignent aucune société existante.
 *
 * Objectif : rendre la plateforme démontrable de bout en bout, avec des
 * volumes et des ratios plausibles pour un bureau de contrôle.
 * Conformément au cahier des charges §21, l'application affiche un bandeau
 * « données de démonstration » tant que ce jeu est chargé.
 */

export const DEMO_MARKER = 'demo.enabled';

/* ── Générateur pseudo-aléatoire déterministe ──────────────────────── */

export function makeRandom(seed = 20260907) {
  let state = seed >>> 0;
  return {
    next(): number {
      state |= 0;
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(min: number, max: number): number {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    pick<T>(items: readonly T[]): T {
      return items[Math.floor(this.next() * items.length)]!;
    },
    chance(probability: number): boolean {
      return this.next() < probability;
    },
  };
}

export type Random = ReturnType<typeof makeRandom>;

/* ── Employés ──────────────────────────────────────────────────────── */

export interface DemoEmployee {
  matricule: string;
  firstName: string;
  lastName: string;
  dept: string;
  position: string;
  isInspector: boolean;
  /** Coût journalier T1 2026 ; T2 et T3 sont dérivés (+3 %, puis +3 %). */
  baseCost: number;
  roleCode: string;
  managerMatricule?: string;
}

export const EMPLOYEES: DemoEmployee[] = [
  // Direction & fonctions support
  { matricule: 'A0001', firstName: 'Rachid', lastName: 'BENNANI', dept: 'DIR', position: 'Directeur Général', isInspector: false, baseCost: 2400, roleCode: 'DG' },
  { matricule: 'A0002', firstName: 'Salma', lastName: 'EL FASSI', dept: 'SUP', position: 'Responsable RH', isInspector: false, baseCost: 1100, roleCode: 'HR', managerMatricule: 'A0001' },
  { matricule: 'A0003', firstName: 'Nabil', lastName: 'OUAZZANI', dept: 'SUP', position: 'Contrôleur de Gestion', isInspector: false, baseCost: 1250, roleCode: 'CONTROLLER', managerMatricule: 'A0001' },
  { matricule: 'A0004', firstName: 'Hind', lastName: 'CHERKAOUI', dept: 'SUP', position: 'Assistante Contrôle de Gestion', isInspector: false, baseCost: 720, roleCode: 'CONTROLLER_ASSISTANT', managerMatricule: 'A0003' },
  { matricule: 'A0005', firstName: 'Karim', lastName: 'TAZI', dept: 'SUP', position: 'Responsable Administratif & Financier', isInspector: false, baseCost: 1500, roleCode: 'RAF', managerMatricule: 'A0001' },
  { matricule: 'A0006', firstName: 'Loubna', lastName: 'AMRANI', dept: 'SUP', position: 'Responsable Facturation', isInspector: false, baseCost: 850, roleCode: 'BILLING', managerMatricule: 'A0005' },
  { matricule: 'A0007', firstName: 'Otmane', lastName: 'SEBTI', dept: 'SUP', position: 'Document Controller', isInspector: false, baseCost: 780, roleCode: 'DOC_CONTROLLER', managerMatricule: 'A0001' },
  { matricule: 'A0008', firstName: 'Meryem', lastName: 'LAHLOU', dept: 'SUP', position: 'Technico-Commerciale', isInspector: false, baseCost: 950, roleCode: 'SALES', managerMatricule: 'A0001' },

  // CND — département pilote
  { matricule: 'C0101', firstName: 'Youssef', lastName: 'RACHDI', dept: 'CND', position: 'Chef de Département CND', isInspector: true, baseCost: 1350, roleCode: 'DEPT_HEAD', managerMatricule: 'A0001' },
  { matricule: 'C0102', firstName: 'Abdelhak', lastName: 'HOUARI', dept: 'CND', position: 'Inspecteur CND niveau 2', isInspector: true, baseCost: 850, roleCode: 'INSPECTOR', managerMatricule: 'C0101' },
  { matricule: 'C0103', firstName: 'Mehdi', lastName: 'BENALI', dept: 'CND', position: 'Inspecteur CND niveau 2', isInspector: true, baseCost: 850, roleCode: 'INSPECTOR', managerMatricule: 'C0101' },
  { matricule: 'C0104', firstName: 'Khalid', lastName: 'ZAHRI', dept: 'CND', position: 'Inspecteur CND niveau 2', isInspector: true, baseCost: 880, roleCode: 'INSPECTOR', managerMatricule: 'C0101' },
  { matricule: 'C0105', firstName: 'Samir', lastName: 'IDRISSI', dept: 'CND', position: 'Inspecteur CND niveau 1', isInspector: true, baseCost: 700, roleCode: 'INSPECTOR', managerMatricule: 'C0101' },
  { matricule: 'C0106', firstName: 'Anas', lastName: 'BOUKHRIS', dept: 'CND', position: 'Inspecteur CND niveau 2', isInspector: true, baseCost: 900, roleCode: 'INSPECTOR', managerMatricule: 'C0101' },
  { matricule: 'C0107', firstName: 'Zineb', lastName: 'HAJJI', dept: 'CND', position: 'Inspectrice CND niveau 2', isInspector: true, baseCost: 870, roleCode: 'INSPECTOR', managerMatricule: 'C0101' },

  // EILM
  { matricule: 'E0201', firstName: 'Hassan', lastName: 'MOUTI', dept: 'EILM', position: 'Chef de Département EILM', isInspector: true, baseCost: 1300, roleCode: 'DEPT_HEAD', managerMatricule: 'A0001' },
  { matricule: 'E0202', firstName: 'Adil', lastName: 'BERRADA', dept: 'EILM', position: 'Vérificateur levage', isInspector: true, baseCost: 820, roleCode: 'INSPECTOR', managerMatricule: 'E0201' },
  { matricule: 'E0203', firstName: 'Fatima', lastName: 'NACIRI', dept: 'EILM', position: 'Vérificatrice électricité', isInspector: true, baseCost: 840, roleCode: 'INSPECTOR', managerMatricule: 'E0201' },
  { matricule: 'E0204', firstName: 'Ilyas', lastName: 'SAOUDI', dept: 'EILM', position: 'Vérificateur levage', isInspector: true, baseCost: 790, roleCode: 'INSPECTOR', managerMatricule: 'E0201' },
  { matricule: 'E0205', firstName: 'Reda', lastName: 'KETTANI', dept: 'EILM', position: 'Vérificateur électricité', isInspector: true, baseCost: 810, roleCode: 'INSPECTOR', managerMatricule: 'E0201' },

  // CTC
  { matricule: 'T0301', firstName: 'Jawad', lastName: 'OULAMIN', dept: 'CTC', position: 'Chef de Département CTC', isInspector: true, baseCost: 1400, roleCode: 'DEPT_HEAD', managerMatricule: 'A0001' },
  { matricule: 'T0302', firstName: 'Imane', lastName: 'BELKACEM', dept: 'CTC', position: 'Ingénieure contrôle technique', isInspector: true, baseCost: 1050, roleCode: 'INSPECTOR', managerMatricule: 'T0301' },
  { matricule: 'T0303', firstName: 'Yassine', lastName: 'MAAROUFI', dept: 'CTC', position: 'Ingénieur contrôle technique', isInspector: true, baseCost: 980, roleCode: 'INSPECTOR', managerMatricule: 'T0301' },

  // Chargés d'affaires
  { matricule: 'A0009', firstName: 'Soufiane', lastName: 'GHALI', dept: 'SUP', position: "Chargé d'Affaires Industrie", isInspector: false, baseCost: 1150, roleCode: 'ACCOUNT_MANAGER', managerMatricule: 'A0001' },
  { matricule: 'A0010', firstName: 'Nawal', lastName: 'BERRECHID', dept: 'SUP', position: "Chargée d'Affaires Bâtiment", isInspector: false, baseCost: 1120, roleCode: 'ACCOUNT_MANAGER', managerMatricule: 'A0001' },
];

/* ── Clients (raisons sociales inventées) ──────────────────────────── */

export interface DemoClient {
  code: string;
  name: string;
  sector: string;
  city: string;
  paymentTerms: number;
  contacts: Array<{ firstName: string; lastName: string; role: string }>;
}

export const CLIENTS: DemoClient[] = [
  {
    code: 'CL-001', name: 'SOMAPHOS INDUSTRIES', sector: 'Chimie & engrais', city: 'Safi', paymentTerms: 60,
    contacts: [
      { firstName: 'Driss', lastName: 'AMEZIANE', role: 'Responsable Maintenance' },
      { firstName: 'Ghita', lastName: 'SLAOUI', role: 'Achats' },
    ],
  },
  {
    code: 'CL-002', name: 'CIMBER — Cimenterie de Berrechid', sector: 'Matériaux de construction', city: 'Berrechid', paymentTerms: 45,
    contacts: [{ firstName: 'Mustapha', lastName: 'RAMI', role: 'Responsable HSE' }],
  },
  {
    code: 'CL-003', name: 'PETROMED TERMINAL', sector: 'Stockage pétrolier', city: 'Mohammedia', paymentTerms: 30,
    contacts: [
      { firstName: 'Hicham', lastName: 'DAOUDI', role: 'Ingénieur Inspection' },
      { firstName: 'Sanae', lastName: 'MERZOUKI', role: 'Directrice Technique' },
    ],
  },
  {
    code: 'CL-004', name: 'ACIERS DU SAÏS', sector: 'Sidérurgie', city: 'Fès', paymentTerms: 60,
    contacts: [{ firstName: 'Omar', lastName: 'CHRAIBI', role: 'Chef de Production' }],
  },
  {
    code: 'CL-005', name: 'SUGHAR AGRO', sector: 'Agroalimentaire', city: 'Kénitra', paymentTerms: 45,
    contacts: [{ firstName: 'Latifa', lastName: 'BENJELLOUN', role: 'Responsable Travaux Neufs' }],
  },
  {
    code: 'CL-006', name: 'HYDRALIA MAROC', sector: 'Traitement des eaux', city: 'Casablanca', paymentTerms: 30,
    contacts: [{ firstName: 'Tarik', lastName: 'ALAOUI', role: 'Responsable Projets' }],
  },
  {
    code: 'CL-007', name: 'ANFA PROMOTION IMMOBILIÈRE', sector: 'Promotion immobilière', city: 'Casablanca', paymentTerms: 60,
    contacts: [{ firstName: 'Rim', lastName: 'SQALLI', role: 'Directrice de Programme' }],
  },
  {
    code: 'CL-008', name: 'TERMINAL VRAC ORIENTAL', sector: 'Logistique portuaire', city: 'Nador', paymentTerms: 90,
    contacts: [{ firstName: 'Brahim', lastName: 'AZZOUZI', role: 'Responsable Équipements' }],
  },
];

/* ── Affaires ──────────────────────────────────────────────────────── */

/**
 * Structure calquée sur le registre réel « Suivi Cde Partagé I2S » :
 * deux axes de statut indépendants, montant d'offre distinct du montant de
 * bon de commande, pilote distinct du préparateur, services multiples.
 */
export type CommercialStatus = 'GAGNEE' | 'SUIVANT_OP' | 'PERDUE_ANNULEE';
export type WorksStatus =
  | 'NON_DEMARRE'
  | 'EN_COURS'
  | 'A_FACTURER'
  | 'FAC_PARTIELLE'
  | 'FAC_TOTALE'
  | 'PERDU_ANNULE';

export interface DemoAffair {
  seq: number;
  clientCode: string;
  title: string;
  dept: string;
  /** Services additionnels mobilisés, comme « CND-CTC-EILM » au registre. */
  extraServices?: string[];
  accountManager: string;
  pilot: string;
  preparedBy: string;
  /** Montant de l'offre de prix (Mt OP HT). Par défaut : le montant contractuel. */
  offerAmount?: number;
  /** Montant du bon de commande reçu ; absent tant que la commande n'est pas là. */
  poAmount?: number;
  poNumber?: string;
  commercialStatus: CommercialStatus;
  worksStatus: WorksStatus;
  physicalFileOpened: boolean;
  contractAmount: number;
  budgetMarginRate: number;
  dailyRate: number;
  startMonth: number;
  months: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'SUSPENDED' | 'PROSPECT' | 'CANCELLED';
  site: { name: string; city: string; region: string; distanceKm: number };
  observation?: string;
  /** Affaire volontairement dégradée pour démontrer l'alerte de marge. */
  troubled?: boolean;
}

/**
 * Les affaires « structurantes » : peu nombreuses, montants élevés, elles
 * portent les missions longues et servent la démonstration du pilotage.
 * Le registre réel montre qu'elles sont minoritaires — la majorité des
 * affaires sont de courtes interventions (médiane ≈ 15 000 DH HT), générées
 * plus bas par ROUTINE_AFFAIRS.
 */

export const AFFAIRS: DemoAffair[] = [
  {
    seq: 1, clientCode: 'CL-001', title: 'Contrôle END des réservoirs de stockage acide', dept: 'CND',
    accountManager: 'A0009', contractAmount: 480000, budgetMarginRate: 22, dailyRate: 1800,
    pilot: 'AE', preparedBy: 'KN',
    commercialStatus: 'GAGNEE', worksStatus: 'FAC_PARTIELLE',
    physicalFileOpened: true,
    poNumber: 'BC 4501653671',
    observation: 'Facturation en cours — écart de marge à analyser.',
    startMonth: 1, months: 9, status: 'IN_PROGRESS', troubled: true,
    site: { name: 'Unité acide sulfurique — bacs T-401 à T-406', city: 'Safi', region: 'Marrakech-Safi', distanceKm: 245 },
  },
  {
    seq: 2, clientCode: 'CL-003', title: 'Inspection périodique bacs de stockage hydrocarbures', dept: 'CND',
    accountManager: 'A0009', contractAmount: 620000, budgetMarginRate: 26, dailyRate: 2100,
    pilot: 'AE', preparedBy: 'KN',
    commercialStatus: 'GAGNEE', worksStatus: 'FAC_PARTIELLE',
    physicalFileOpened: true,
    poNumber: 'CF_0013464373',
    startMonth: 2, months: 7, status: 'IN_PROGRESS',
    site: { name: 'Parc de stockage Nord', city: 'Mohammedia', region: 'Casablanca-Settat', distanceKm: 28 },
  },
  {
    seq: 3, clientCode: 'CL-002', title: 'Vérification réglementaire des appareils de levage', dept: 'EILM',
    accountManager: 'A0009', contractAmount: 295000, budgetMarginRate: 30, dailyRate: 1650,
    pilot: 'MH', preparedBy: 'MH',
    commercialStatus: 'GAGNEE', worksStatus: 'EN_COURS',
    physicalFileOpened: true,
    poNumber: 'BC 34950',
    startMonth: 1, months: 12, status: 'IN_PROGRESS',
    site: { name: 'Ligne de cuisson et parc à clinker', city: 'Berrechid', region: 'Casablanca-Settat', distanceKm: 42 },
  },
  {
    seq: 4, clientCode: 'CL-004', title: 'Contrôle radiographique et ultrasons soudures four', dept: 'CND',
    accountManager: 'A0009', contractAmount: 385000, budgetMarginRate: 24, dailyRate: 1950,
    pilot: 'AE', preparedBy: 'KN',
    commercialStatus: 'GAGNEE', worksStatus: 'EN_COURS',
    physicalFileOpened: true,
    poNumber: 'BC N°672',
    startMonth: 3, months: 5, status: 'IN_PROGRESS',
    site: { name: 'Aciérie électrique — four EAF 2', city: 'Fès', region: 'Fès-Meknès', distanceKm: 290 },
  },
  {
    seq: 5, clientCode: 'CL-007', title: 'Mission de contrôle technique — résidence Les Jardins', dept: 'CTC',
    accountManager: 'A0010', contractAmount: 540000, budgetMarginRate: 28, dailyRate: 2400,
    pilot: 'JO', preparedBy: 'NS',
    commercialStatus: 'GAGNEE', worksStatus: 'EN_COURS',
    physicalFileOpened: true,
    poNumber: 'Contrat + Avenant',
    startMonth: 1, months: 14, status: 'IN_PROGRESS',
    site: { name: 'Îlot 12 — 4 immeubles R+6', city: 'Casablanca', region: 'Casablanca-Settat', distanceKm: 12 },
  },
  {
    seq: 6, clientCode: 'CL-005', title: 'Vérification installations électriques et incendie', dept: 'EILM',
    accountManager: 'A0009', contractAmount: 168000, budgetMarginRate: 32, dailyRate: 1550,
    pilot: 'MH', preparedBy: 'MH',
    commercialStatus: 'GAGNEE', worksStatus: 'FAC_PARTIELLE',
    physicalFileOpened: true,
    poNumber: 'BC 0312-195',
    startMonth: 2, months: 6, status: 'IN_PROGRESS',
    site: { name: 'Sucrerie — ateliers et magasins', city: 'Kénitra', region: 'Rabat-Salé-Kénitra', distanceKm: 165 },
  },
  {
    seq: 7, clientCode: 'CL-006', title: 'Contrôle de tuyauterie et essais de pression', dept: 'CND',
    accountManager: 'A0009', contractAmount: 212000, budgetMarginRate: 25, dailyRate: 1750,
    pilot: 'AE', preparedBy: 'KN',
    commercialStatus: 'GAGNEE', worksStatus: 'FAC_TOTALE',
    physicalFileOpened: true,
    poNumber: 'BC 9400141729',
    observation: 'Affaire soldée.',
    startMonth: 4, months: 4, status: 'COMPLETED',
    site: { name: 'Station de traitement — ligne process 3', city: 'Casablanca', region: 'Casablanca-Settat', distanceKm: 18 },
  },
  {
    seq: 8, clientCode: 'CL-008', title: 'Vérification portiques et accessoires de levage', dept: 'EILM',
    accountManager: 'A0009', contractAmount: 340000, budgetMarginRate: 27, dailyRate: 1700,
    pilot: 'MH', preparedBy: 'MH',
    commercialStatus: 'GAGNEE', worksStatus: 'EN_COURS',
    physicalFileOpened: true,
    poNumber: 'BC CA26-00000051',
    startMonth: 2, months: 10, status: 'IN_PROGRESS',
    site: { name: 'Quai vraquier — portiques P1 à P4', city: 'Nador', region: 'Oriental', distanceKm: 540 },
  },
  {
    seq: 9, clientCode: 'CL-001', title: 'Contrôle de rotondité et verticalité des silos', dept: 'CND',
    accountManager: 'A0009', contractAmount: 96000, budgetMarginRate: 20, dailyRate: 1800,
    pilot: 'AE', preparedBy: 'KN',
    commercialStatus: 'GAGNEE', worksStatus: 'FAC_TOTALE',
    physicalFileOpened: false,
    poNumber: 'Cmde verbale',
    observation: 'Commande verbale confirmée par mail.',
    startMonth: 5, months: 3, status: 'COMPLETED',
    site: { name: 'Silos de stockage phosphate', city: 'Safi', region: 'Marrakech-Safi', distanceKm: 245 },
  },
  {
    seq: 10, clientCode: 'CL-007', title: 'Contrôle technique — centre commercial Riad', dept: 'CTC',
    accountManager: 'A0010', contractAmount: 410000, budgetMarginRate: 29, dailyRate: 2300,
    pilot: 'JO', preparedBy: 'NS',
    commercialStatus: 'GAGNEE', worksStatus: 'EN_COURS',
    physicalFileOpened: true,
    poNumber: 'BC 1_1190_26',
    startMonth: 3, months: 12, status: 'IN_PROGRESS',
    site: { name: 'Lot B — structure béton armé', city: 'Rabat', region: 'Rabat-Salé-Kénitra', distanceKm: 92 },
  },
  {
    seq: 11, clientCode: 'CL-002', title: 'Thermographie infrarouge des armoires électriques', dept: 'EILM',
    accountManager: 'A0009', contractAmount: 74000, budgetMarginRate: 35, dailyRate: 1600,
    pilot: 'MH', preparedBy: 'MH',
    commercialStatus: 'GAGNEE', worksStatus: 'FAC_TOTALE',
    physicalFileOpened: true,
    poNumber: 'BC 4500021599',
    startMonth: 6, months: 2, status: 'COMPLETED',
    site: { name: 'Poste de livraison et TGBT', city: 'Berrechid', region: 'Casablanca-Settat', distanceKm: 42 },
  },
  {
    seq: 12, clientCode: 'CL-004', title: 'Assistance qualification soudage (QMOS/QS)', dept: 'CND',
    accountManager: 'A0009', contractAmount: 128000, budgetMarginRate: 23, dailyRate: 2000,
    pilot: 'AE', preparedBy: 'KN',
    commercialStatus: 'SUIVANT_OP', worksStatus: 'NON_DEMARRE',
    physicalFileOpened: false,
    observation: 'En attente du bon de commande client.',
    startMonth: 7, months: 4, status: 'SUSPENDED',
    site: { name: 'Atelier chaudronnerie', city: 'Fès', region: 'Fès-Meknès', distanceKm: 290 },
  },
];

/* ── Parc d'instruments de mesure ──────────────────────────────────── */

export interface DemoDevice {
  code: string;
  type: string;
  brand: string;
  model: string;
  serial: string;
  dept: string;
  holderMatricule?: string;
  /** Mois de validité restants — négatif = périmé. */
  calibrationOffsetMonths: number;
}

export const DEVICES: DemoDevice[] = [
  { code: 'UT-001', type: 'Appareil ultrasons', brand: 'SOFRANEL', model: 'Sitescan D-50', serial: '1909574110', dept: 'CND', holderMatricule: 'C0102', calibrationOffsetMonths: 7 },
  { code: 'UT-002', type: 'Appareil ultrasons', brand: 'SOFRANEL', model: 'Sitescan D-50', serial: '1909574222', dept: 'CND', holderMatricule: 'C0104', calibrationOffsetMonths: 4 },
  { code: 'UT-003', type: 'Mesureur d’épaisseur', brand: 'SOFRANEL', model: '26MG', serial: 'MG-33121', dept: 'CND', holderMatricule: 'C0106', calibrationOffsetMonths: -2 },
  { code: 'MT-001', type: 'Électroaimant magnétoscopie', brand: 'PARKER', model: 'B310-PDC', serial: 'PK-88213', dept: 'CND', holderMatricule: 'C0103', calibrationOffsetMonths: 9 },
  { code: 'MT-002', type: 'Électroaimant magnétoscopie', brand: 'PARKER', model: 'B310-PDC', serial: 'PK-88477', dept: 'CND', calibrationOffsetMonths: 1 },
  { code: 'VT-001', type: 'Luxmètre', brand: 'TESTO', model: '540', serial: 'TS-11902', dept: 'CND', holderMatricule: 'C0107', calibrationOffsetMonths: 5 },
  { code: 'VT-002', type: 'Jauge de soudure', brand: 'CAMBRIDGE', model: 'Multigauge', serial: 'CB-4471', dept: 'CND', calibrationOffsetMonths: 11 },
  { code: 'DU-001', type: 'Duromètre portable', brand: 'EQUOTIP', model: '550 Leeb', serial: 'EQ-70233', dept: 'CND', holderMatricule: 'C0105', calibrationOffsetMonths: 0 },
  { code: 'PT-001', type: 'Thermomètre de surface', brand: 'TESTO', model: '905-T2', serial: 'TS-22087', dept: 'CND', calibrationOffsetMonths: 6 },
  { code: 'EL-001', type: 'Contrôleur d’installation', brand: 'CHAUVIN ARNOUX', model: 'CA 6117', serial: 'CA-90114', dept: 'EILM', holderMatricule: 'E0203', calibrationOffsetMonths: 8 },
  { code: 'EL-002', type: 'Pince ampèremétrique', brand: 'FLUKE', model: '376 FC', serial: 'FL-55231', dept: 'EILM', holderMatricule: 'E0205', calibrationOffsetMonths: 2 },
  { code: 'TH-001', type: 'Caméra thermique', brand: 'FLIR', model: 'E96', serial: 'FR-31004', dept: 'EILM', holderMatricule: 'E0201', calibrationOffsetMonths: 3 },
  { code: 'LV-001', type: 'Dynamomètre de traction', brand: 'DILLON', model: 'EDXtreme 10t', serial: 'DL-60218', dept: 'EILM', holderMatricule: 'E0202', calibrationOffsetMonths: -1 },
  { code: 'LV-002', type: 'Télémètre laser', brand: 'LEICA', model: 'DISTO D2', serial: 'LC-77410', dept: 'EILM', holderMatricule: 'E0204', calibrationOffsetMonths: 10 },
  { code: 'CT-001', type: 'Scléromètre béton', brand: 'PROCEQ', model: 'Original Schmidt', serial: 'PQ-40912', dept: 'CTC', holderMatricule: 'T0302', calibrationOffsetMonths: 5 },
  { code: 'CT-002', type: 'Pachomètre', brand: 'PROCEQ', model: 'Profometer 6', serial: 'PQ-41880', dept: 'CTC', holderMatricule: 'T0303', calibrationOffsetMonths: 1 },
];

/* ── Flotte ────────────────────────────────────────────────────────── */

export interface DemoVehicle {
  plate: string;
  brand: string;
  model: string;
  type: 'SERVICE' | 'FUNCTION';
  dept: string;
  ownership: 'OWNED' | 'LLD' | 'LCD';
  monthlyFee?: number;
  assignedTo?: string;
  km: number;
}

export const VEHICLES: DemoVehicle[] = [
  { plate: '12345-A-6', brand: 'Dacia', model: 'Duster', type: 'SERVICE', dept: 'CND', ownership: 'LLD', monthlyFee: 3500, km: 84200 },
  { plate: '23456-B-6', brand: 'Dacia', model: 'Duster', type: 'SERVICE', dept: 'CND', ownership: 'LLD', monthlyFee: 3500, km: 61050 },
  { plate: '34567-A-1', brand: 'Renault', model: 'Kangoo', type: 'SERVICE', dept: 'CND', ownership: 'OWNED', km: 132400 },
  { plate: '45678-C-6', brand: 'Dacia', model: 'Logan', type: 'SERVICE', dept: 'EILM', ownership: 'LLD', monthlyFee: 2900, km: 47800 },
  { plate: '56789-A-6', brand: 'Peugeot', model: 'Partner', type: 'SERVICE', dept: 'EILM', ownership: 'OWNED', km: 98600 },
  { plate: '67890-B-1', brand: 'Volkswagen', model: 'Caddy', type: 'SERVICE', dept: 'CTC', ownership: 'LCD', monthlyFee: 4200, km: 22300 },
  { plate: '78901-A-6', brand: 'Toyota', model: 'Corolla', type: 'FUNCTION', dept: 'DIR', ownership: 'LLD', monthlyFee: 5600, assignedTo: 'A0001', km: 31900 },
  { plate: '89012-D-6', brand: 'Hyundai', model: 'Tucson', type: 'FUNCTION', dept: 'SUP', ownership: 'LLD', monthlyFee: 5100, assignedTo: 'A0005', km: 28450 },
];

/* ── Certifications ────────────────────────────────────────────────── */

export const CERTIFICATIONS: Array<{
  matricule: string;
  type: string;
  method: string;
  level: string;
  issuer: string;
  /** Mois avant expiration à compter d'aujourd'hui. */
  expiresInMonths: number;
}> = [
  { matricule: 'C0102', type: 'COFREND', method: 'UT', level: '2', issuer: 'COFREND', expiresInMonths: 14 },
  { matricule: 'C0102', type: 'COFREND', method: 'PT', level: '2', issuer: 'COFREND', expiresInMonths: 8 },
  { matricule: 'C0102', type: 'COFREND', method: 'MT', level: '2', issuer: 'COFREND', expiresInMonths: 1 },
  { matricule: 'C0103', type: 'COFREND', method: 'UT', level: '2', issuer: 'COFREND', expiresInMonths: 22 },
  { matricule: 'C0103', type: 'COFREND', method: 'VT', level: '2', issuer: 'COFREND', expiresInMonths: 19 },
  { matricule: 'C0104', type: 'ASNT', method: 'RT', level: '2', issuer: 'ASNT', expiresInMonths: 2 },
  { matricule: 'C0104', type: 'COFREND', method: 'UT', level: '2', issuer: 'COFREND', expiresInMonths: 30 },
  { matricule: 'C0105', type: 'COFREND', method: 'PT', level: '1', issuer: 'COFREND', expiresInMonths: 26 },
  { matricule: 'C0106', type: 'COFREND', method: 'UT', level: '2', issuer: 'COFREND', expiresInMonths: 11 },
  { matricule: 'C0106', type: 'COFREND', method: 'RT', level: '2', issuer: 'COFREND', expiresInMonths: 16 },
  { matricule: 'C0107', type: 'COFREND', method: 'MT', level: '2', issuer: 'COFREND', expiresInMonths: 20 },
  { matricule: 'C0101', type: 'COFREND', method: 'UT', level: '3', issuer: 'COFREND', expiresInMonths: 33 },
  { matricule: 'E0202', type: 'Habilitation', method: 'LIFT', level: 'Vérificateur', issuer: 'Organisme agréé', expiresInMonths: 5 },
  { matricule: 'E0203', type: 'Habilitation électrique', method: 'ELEC', level: 'B2V-BR', issuer: 'Organisme agréé', expiresInMonths: 9 },
  { matricule: 'E0204', type: 'Habilitation', method: 'LIFT', level: 'Vérificateur', issuer: 'Organisme agréé', expiresInMonths: 1 },
  { matricule: 'E0205', type: 'Habilitation électrique', method: 'ELEC', level: 'B2V-BR', issuer: 'Organisme agréé', expiresInMonths: 15 },
  { matricule: 'T0302', type: 'Qualification', method: 'CTC', level: 'Ingénieur structure', issuer: 'Interne', expiresInMonths: 24 },
];

/* ── Opportunités commerciales en cours ────────────────────────────── */

export const OPPORTUNITIES: Array<{
  clientCode: string;
  title: string;
  dept: string;
  stage: 'NEW' | 'CONSULTATION' | 'OFFER_DRAFT' | 'OFFER_SENT' | 'FOLLOW_UP' | 'NEGOTIATION' | 'WON' | 'LOST';
  amount: number;
  probability: number;
  owner: string;
  /** Cause catégorisée — c'est elle qui se totalise dans l'analyse des pertes. */
  lostCause?:
    | 'PRIX'
    | 'DELAI'
    | 'REFERENCES'
    | 'CAPACITE'
    | 'CONCURRENT_EN_PLACE'
    | 'DOSSIER_NON_CONFORME'
    | 'PROJET_ABANDONNE'
    | 'SANS_SUITE'
    | 'AUTRE';
  lostReason?: string;
  /**
   * Consultation formelle, quand le client passe par un appel d'offres.
   *
   * `deadlineInDays` se compte à partir d'aujourd'hui : négatif, la remise est
   * passée. L'ouverture des plis suit la remise, jamais l'inverse.
   */
  tender?: {
    reference: string;
    publisher: string;
    deadlineInDays: number;
    openingAfterDays: number;
    guarantee: number;
  };
}> = [
  { clientCode: 'CL-003', title: 'Extension du contrat d’inspection — bacs Sud', dept: 'CND', stage: 'NEGOTIATION', amount: 310000, probability: 70, owner: 'A0008' },
  { clientCode: 'CL-005', title: 'Contrôle réglementaire annuel 2027', dept: 'EILM', stage: 'OFFER_SENT', amount: 185000, probability: 50, owner: 'A0008' },
  {
    clientCode: 'CL-006', title: 'Requalification périodique équipements sous pression', dept: 'CND', stage: 'FOLLOW_UP', amount: 240000, probability: 40, owner: 'A0008',
    tender: { reference: 'AO 42/2026 — HYD', publisher: 'HYDRALIA MAROC — Direction des achats', deadlineInDays: -34, openingAfterDays: 2, guarantee: 24000 },
  },
  {
    clientCode: 'CL-008', title: 'Vérification grues mobiles — campagne 2027', dept: 'EILM', stage: 'CONSULTATION', amount: 128000, probability: 25, owner: 'A0008',
    tender: { reference: 'AO 07/2026 — TVO', publisher: 'TERMINAL VRAC ORIENTAL — Cellule marchés', deadlineInDays: 5, openingAfterDays: 3, guarantee: 12800 },
  },
  {
    clientCode: 'CL-007', title: 'Contrôle technique — programme Bouskoura', dept: 'CTC', stage: 'OFFER_DRAFT', amount: 620000, probability: 35, owner: 'A0010',
    tender: { reference: 'AO 118/2026 — ANFA', publisher: 'ANFA PROMOTION IMMOBILIÈRE', deadlineInDays: 19, openingAfterDays: 1, guarantee: 62000 },
  },
  { clientCode: 'CL-002', title: 'Diagnostic structure silo clinker', dept: 'CTC', stage: 'NEW', amount: 95000, probability: 15, owner: 'A0010' },
  {
    clientCode: 'CL-004', title: 'Campagne END arrêt annuel 2026', dept: 'CND', stage: 'LOST', amount: 275000, probability: 0, owner: 'A0008',
    lostCause: 'PRIX', lostReason: 'Prix supérieur de 12 % au concurrent retenu',
    tender: { reference: 'AO 61/2026 — ADS', publisher: 'ACIERS DU SAÏS — Achats travaux', deadlineInDays: -96, openingAfterDays: 5, guarantee: 27500 },
  },
  { clientCode: 'CL-001', title: 'Inspection tuyauterie unité NPK', dept: 'CND', stage: 'LOST', amount: 143000, probability: 0, owner: 'A0008', lostCause: 'DELAI', lostReason: 'Délai d’intervention incompatible avec l’arrêt client' },
  { clientCode: 'CL-003', title: 'Contrôle d’étanchéité des cuvettes de rétention', dept: 'CND', stage: 'LOST', amount: 168000, probability: 0, owner: 'A0008', lostCause: 'PRIX', lostReason: 'Écart de 9 % sur le prix de la vacation' },
  {
    clientCode: 'CL-006', title: 'Vérification des installations électriques — site Aïn Sebaâ', dept: 'EILM', stage: 'LOST', amount: 96000, probability: 0, owner: 'A0008',
    lostCause: 'REFERENCES', lostReason: 'Agrément demandé pour les installations HTA que I2S ne détient pas encore',
    tender: { reference: 'AO 29/2026 — HYD', publisher: 'HYDRALIA MAROC — Direction des achats', deadlineInDays: -128, openingAfterDays: 3, guarantee: 9600 },
  },
  {
    clientCode: 'CL-008', title: 'Contrôle des portiques et engins de manutention', dept: 'EILM', stage: 'LOST', amount: 212000, probability: 0, owner: 'A0008',
    lostCause: 'DOSSIER_NON_CONFORME', lostReason: 'Attestation de qualification jointe périmée : dossier écarté à l’ouverture des plis',
    tender: { reference: 'AO 14/2026 — TVO', publisher: 'TERMINAL VRAC ORIENTAL — Cellule marchés', deadlineInDays: -71, openingAfterDays: 2, guarantee: 21200 },
  },
  { clientCode: 'CL-005', title: 'Thermographie des armoires — ligne de conditionnement', dept: 'EILM', stage: 'LOST', amount: 74000, probability: 0, owner: 'A0008', lostCause: 'PROJET_ABANDONNE', lostReason: 'Budget d’investissement reporté à l’exercice suivant' },
  { clientCode: 'CL-007', title: 'Contrôle technique — résidence Aïn Diab', dept: 'CTC', stage: 'LOST', amount: 340000, probability: 0, owner: 'A0010', lostCause: 'CONCURRENT_EN_PLACE', lostReason: 'Bureau de contrôle déjà mandaté sur les phases précédentes, reconduit sans consultation' },
  { clientCode: 'CL-002', title: 'Requalification du pont roulant de l’atelier broyage', dept: 'EILM', stage: 'LOST', amount: 58000, probability: 0, owner: 'A0010', lostCause: 'SANS_SUITE', lostReason: 'Trois relances sans réponse du service maintenance' },
];

/* ── Dossiers commerciaux aboutis ──────────────────────────────────── */

/**
 * Ce que l'affaire a été avant d'être une affaire.
 *
 * Le rapprochement se fait sur le rang de l'affaire dans le registre (`seq`) :
 * l'opportunité, l'offre acceptée et le bon de commande reconstituent l'état
 * exact que produit l'acceptation d'une offre dans l'application.
 */
export const WON_OPPORTUNITIES: Array<{
  affairSeq: number;
  owner: string;
  /** Écart entre l'offre et le bon de commande, en pourcentage du montant proposé. */
  negotiationRate: number;
  daysBeforeStart: number;
  followUps: number;
  tender?: {
    reference: string;
    publisher: string;
    deadlineInDays: number;
    openingAfterDays: number;
    guarantee: number;
  };
}> = [
  {
    affairSeq: 1, owner: 'A0008', negotiationRate: -4, daysBeforeStart: 52, followUps: 2,
    tender: { reference: 'AO 12/2026 — SPI', publisher: 'SOMAPHOS INDUSTRIES — Direction achats', deadlineInDays: -150, openingAfterDays: 4, guarantee: 30000 },
  },
  { affairSeq: 2, owner: 'A0008', negotiationRate: 0, daysBeforeStart: 31, followUps: 1 },
  {
    affairSeq: 3, owner: 'A0008', negotiationRate: -7, daysBeforeStart: 64, followUps: 3,
    tender: { reference: 'AO 03/2026 — CIMBER', publisher: 'CIMBER — Cellule marchés', deadlineInDays: -175, openingAfterDays: 2, guarantee: 15000 },
  },
  { affairSeq: 4, owner: 'A0010', negotiationRate: -2, daysBeforeStart: 40, followUps: 2 },
];

/* ── Libellés de missions par département ──────────────────────────── */

export const MISSION_LABELS: Record<string, string[]> = {
  CND: [
    'Contrôle par ultrasons des soudures circulaires',
    'Ressuage sur piquages et brides',
    'Magnétoscopie des soudures d’angle',
    'Contrôle visuel et relevé d’épaisseurs',
    'Interprétation de clichés radiographiques',
    'Mesure de dureté sur zone affectée thermiquement',
    'Contrôle de rotondité de virole',
    'Essai d’adhérence et contrôle peinture',
  ],
  EILM: [
    'Vérification périodique pont roulant',
    'Vérification des accessoires de levage',
    'Vérification des installations électriques',
    'Thermographie infrarouge des armoires',
    'Vérification de plateforme élévatrice',
    'Mise en service palonnier',
    'Vérification échafaudage fixe',
  ],
  CTC: [
    'Visite de chantier — ferraillage semelles',
    'Contrôle du coffrage et des armatures voile',
    'Vérification note de calcul structure',
    'Contrôle de conformité étanchéité toiture',
    'Visite de réception — second œuvre',
  ],
};

/**
 * Le modèle de rapport que produit chaque type de mission.
 *
 * Un contrôle par ressuage donne un rapport de ressuage (PR01-F04), pas un
 * rapport d'ultrasons : le numéro du rapport porte ce code, et c'est lui qui
 * permet de filtrer les rapports par type.
 */
export const MISSION_FORMS: Record<string, string> = {
  // CND
  'Contrôle par ultrasons des soudures circulaires': 'PR01-F02',
  'Ressuage sur piquages et brides': 'PR01-F04',
  'Magnétoscopie des soudures d’angle': 'PR01-F05',
  'Contrôle visuel et relevé d’épaisseurs': 'PR01-F08',
  'Interprétation de clichés radiographiques': 'PR01-F22',
  'Mesure de dureté sur zone affectée thermiquement': 'PR01-F26',
  'Contrôle de rotondité de virole': 'PR01-F07',
  'Essai d’adhérence et contrôle peinture': 'PR01-F06',
  // EILM
  'Vérification périodique pont roulant': 'PR02-F40',
  'Vérification des accessoires de levage': 'PR02-F09',
  'Vérification des installations électriques': 'PR02-F14',
  'Thermographie infrarouge des armoires': 'PR02-F13',
  'Vérification de plateforme élévatrice': 'PR02-F06',
  'Mise en service palonnier': 'PR02-F37',
  'Vérification échafaudage fixe': 'PR02-F19',
  // CTC
  'Visite de chantier — ferraillage semelles': 'PR03-F01',
  'Contrôle du coffrage et des armatures voile': 'PR03-F01',
  'Vérification note de calcul structure': 'PR03-F01',
  'Contrôle de conformité étanchéité toiture': 'PR03-F01',
  'Visite de réception — second œuvre': 'PR03-F01',
};

/* ── Motifs de non-conformité ──────────────────────────────────────── */

export const NON_CONFORMITIES: Array<{
  affairSeq: number;
  description: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'OBSERVATION';
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'VERIFICATION' | 'CLOSED';
  owner: string;
  dueInDays: number;
}> = [
  { affairSeq: 1, description: 'Indication linéaire de 18 mm détectée en UT sur la soudure longitudinale du bac T-403, au-delà du critère d’acceptation ASME V.', severity: 'CRITICAL', status: 'IN_PROGRESS', owner: 'C0101', dueInDays: 4 },
  { affairSeq: 1, description: 'Épaisseur résiduelle mesurée à 7,2 mm sur la virole basse du bac T-405, inférieure au minimum admissible de 8 mm.', severity: 'MAJOR', status: 'ASSIGNED', owner: 'C0102', dueInDays: 12 },
  { affairSeq: 3, description: 'Absence de fin de course haut sur le pont roulant P2 — arrêt d’exploitation recommandé.', severity: 'CRITICAL', status: 'VERIFICATION', owner: 'E0201', dueInDays: -2 },
  { affairSeq: 3, description: 'Élingue textile n° EL-118 présentant une déchirure des fibres porteuses.', severity: 'MAJOR', status: 'CLOSED', owner: 'E0202', dueInDays: -25 },
  { affairSeq: 5, description: 'Enrobage d’armatures insuffisant relevé sur le voile V12 du bloc B (22 mm mesurés pour 30 mm requis).', severity: 'MAJOR', status: 'IN_PROGRESS', owner: 'T0301', dueInDays: 7 },
  { affairSeq: 4, description: 'Porosités groupées sur le cordon de la passe de racine, repère S-44.', severity: 'MINOR', status: 'CLOSED', owner: 'C0104', dueInDays: -18 },
  { affairSeq: 8, description: 'Corrosion avancée du chemin de roulement du portique P3, côté mer.', severity: 'MAJOR', status: 'OPEN', owner: 'E0201', dueInDays: 15 },
  { affairSeq: 10, description: 'Décalage de 4 cm entre le plan d’exécution et l’implantation réelle du poteau P-27.', severity: 'MINOR', status: 'ASSIGNED', owner: 'T0302', dueInDays: 9 },
];

/* ── Affaires courantes ────────────────────────────────────────────── */

/**
 * Le registre réel montre une majorité de courtes interventions :
 * médiane ≈ 15 000 DH HT, minimum quelques centaines de dirhams, avec une
 * longue traîne vers les gros projets. Ces gabarits reproduisent cette
 * distribution ; le générateur en tire une soixantaine d'affaires.
 */
export interface RoutineAffairTemplate {
  dept: string;
  label: string;
  /** Fourchette de montant d'offre en DH HT. */
  min: number;
  max: number;
  /** Durée typique de l'intervention, en jours ouvrés. */
  days: [number, number];
}

export const ROUTINE_AFFAIRS: RoutineAffairTemplate[] = [
  { dept: 'CND', label: 'Dégazage et contrôle de citerne', min: 2500, max: 9000, days: [1, 2] },
  { dept: 'CND', label: 'Contrôle par ressuage de piquages', min: 3000, max: 12000, days: [1, 3] },
  { dept: 'CND', label: 'Relevé d’épaisseurs par ultrasons', min: 6000, max: 28000, days: [2, 5] },
  { dept: 'CND', label: 'Contrôle visuel de soudures en atelier', min: 1800, max: 8000, days: [1, 2] },
  { dept: 'CND', label: 'Requalification périodique d’équipement sous pression', min: 12000, max: 65000, days: [3, 8] },
  { dept: 'CND', label: 'Essai hydraulique de réservoir', min: 8000, max: 35000, days: [2, 5] },
  { dept: 'CND', label: 'Contrôle radiographique de soudures', min: 15000, max: 90000, days: [3, 9] },
  { dept: 'CND', label: 'Essai de dureté sur zone soudée', min: 2000, max: 7000, days: [1, 2] },
  { dept: 'CND', label: 'Assistance à réception d’équipement neuf', min: 5000, max: 22000, days: [1, 4] },
  { dept: 'EILM', label: 'Vérification périodique de pont roulant', min: 3500, max: 16000, days: [1, 3] },
  { dept: 'EILM', label: 'Vérification d’accessoires de levage', min: 1200, max: 6500, days: [1, 2] },
  { dept: 'EILM', label: 'Vérification d’installation électrique', min: 4000, max: 24000, days: [1, 4] },
  { dept: 'EILM', label: 'Thermographie infrarouge d’armoires', min: 3000, max: 14000, days: [1, 2] },
  { dept: 'EILM', label: 'Mise en service de palonnier', min: 2000, max: 8000, days: [1, 1] },
  { dept: 'EILM', label: 'Vérification de plateforme élévatrice', min: 2500, max: 9500, days: [1, 2] },
  { dept: 'EILM', label: 'Vérification d’échafaudage fixe', min: 1500, max: 7000, days: [1, 2] },
  { dept: 'EILM', label: 'Contrôle de ligne de vie', min: 2200, max: 11000, days: [1, 2] },
  { dept: 'EILM', label: 'Vérification de chariot de manutention', min: 1800, max: 7500, days: [1, 2] },
  { dept: 'CTC', label: 'Visite de chantier — ferraillage', min: 4000, max: 18000, days: [1, 3] },
  { dept: 'CTC', label: 'Vérification de note de calcul', min: 8000, max: 45000, days: [2, 6] },
  { dept: 'CTC', label: 'Contrôle d’étanchéité de toiture', min: 3500, max: 15000, days: [1, 3] },
  { dept: 'ETUDE', label: 'Étude de dimensionnement d’équipement', min: 12000, max: 190000, days: [3, 12] },
  { dept: 'ETUDE', label: 'Note de calcul de charpente métallique', min: 15000, max: 120000, days: [4, 14] },
  { dept: 'QHSE', label: 'Audit sécurité de site', min: 6000, max: 30000, days: [2, 5] },
];

/** Lieux de contrôle rencontrés — texte libre, comme au registre. */
export const CONTROL_LOCATIONS = [
  'Dépôt de Mohammedia',
  'Zone industrielle de Berrechid',
  'Site de Safi',
  'Atelier Casablanca — Aïn Sebaâ',
  'Chantier Rabat — Hay Riad',
  'Terminal de Nador',
  'Usine de Kénitra',
  'Aéroport Mohammed V',
  'Zone franche de Tanger',
  'Site de Jorf Lasfar',
  'Atelier client — Fès',
  'Plateforme logistique de Skhirat',
];

/** Initiales des pilotes, telles qu'elles apparaissent au registre. */
export const PILOT_INITIALS: Record<string, string> = {
  A0009: 'AE',
  A0010: 'JO',
  A0008: 'KN',
  C0101: 'RH',
  E0201: 'MH',
  T0301: 'JO',
  A0003: 'NS',
};

/** Numéros de bon de commande — formats réellement observés. */
export const PO_NUMBER_FORMATS = [
  'BC {n}',
  'BC N°{n}',
  'CF_00134{n}',
  'BC 45016{n}',
  'Cmde verbale',
  'Cde Verbale',
  'BC CA26-000000{s}',
  'Contrat + Avenant',
];
