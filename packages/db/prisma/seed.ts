/**
 * Seed des référentiels I2S OPS.
 * Idempotent : peut être rejoué sans dupliquer.
 *
 * Sources : docs/00-ANALYSE-CDC.md (barèmes de frais, départements),
 *           docs/04-RBAC.md (matrice des droits).
 */
import { randomBytes } from 'node:crypto';
import { hash } from '@node-rs/argon2';
import {
  PrismaClient,
  PermissionAction,
  ScopeLevel,
  ExpenseCapType,
} from '@prisma/client';
import { REPORT_FORMS } from './report-forms';
import { TEMPLATES as REPORT_TEMPLATES } from './report-templates';

const prisma = new PrismaClient();

const A = PermissionAction;
const S = ScopeLevel;

const VIEW = [A.VIEW];
const READ_EXPORT = [A.VIEW, A.EXPORT];
const CRUD = [A.VIEW, A.CREATE, A.UPDATE, A.DELETE];
const CU = [A.VIEW, A.CREATE, A.UPDATE];
const CU_APPROVE = [A.VIEW, A.CREATE, A.UPDATE, A.APPROVE];
const VIEW_APPROVE = [A.VIEW, A.APPROVE];
const FULL = [A.VIEW, A.CREATE, A.UPDATE, A.DELETE, A.APPROVE, A.EXPORT, A.DOWNLOAD];

/** Ressources protégées. Une ressource = un module ou un objet métier. */
const RESOURCES = [
  'client', 'contact', 'opportunity', 'tender', 'offer',
  'affair', 'project', 'site',
  'mission', 'mission_order', 'planning',
  'employee', 'daily_cost', 'timesheet', 'leave', 'certification',
  'inspection', 'inspection_template', 'report', 'asset', 'measuring_device', 'non_conformity',
  'attachment', 'invoice', 'payment', 'expense_report', 'advance', 'payment_batch',
  'vehicle', 'controlling', 'document', 'dashboard', 'audit',
  'user', 'role', 'setting',
] as const;

type Grant = [resource: string, actions: PermissionAction[], scope: ScopeLevel];

/** Matrice des droits — voir docs/04-RBAC.md pour la justification ligne à ligne. */
const ROLES: Array<{
  code: string;
  name: string;
  rank: number;
  description: string;
  grants: Grant[];
  wildcard?: boolean;
}> = [
  {
    code: 'ADMIN',
    name: 'Administrateur',
    rank: 0,
    description: 'Administration technique de la plateforme, comptes et sécurité.',
    wildcard: true,
    grants: [],
  },
  {
    code: 'DG',
    name: 'Direction Générale',
    rank: 10,
    description: 'Vue groupe, approbation finale des paiements, pilotage stratégique.',
    grants: [
      ['client', READ_EXPORT, S.ALL], ['contact', VIEW, S.ALL],
      ['opportunity', VIEW_APPROVE, S.ALL], ['tender', VIEW, S.ALL], ['offer', VIEW_APPROVE, S.ALL],
      ['affair', [A.VIEW, A.APPROVE, A.EXPORT], S.ALL], ['project', VIEW, S.ALL], ['site', VIEW, S.ALL],
      ['mission', VIEW_APPROVE, S.ALL], ['mission_order', VIEW_APPROVE, S.ALL], ['planning', VIEW, S.ALL],
      ['employee', VIEW, S.ALL], ['daily_cost', VIEW, S.ALL],
      ['timesheet', READ_EXPORT, S.ALL], ['leave', VIEW_APPROVE, S.ALL], ['certification', VIEW, S.ALL],
      ['inspection', VIEW, S.ALL], ['inspection_template', VIEW, S.ALL],
      ['report', READ_EXPORT, S.ALL], ['asset', VIEW, S.ALL], ['measuring_device', VIEW, S.ALL],
      ['non_conformity', VIEW, S.ALL],
      ['attachment', VIEW_APPROVE, S.ALL],
      ['invoice', [A.VIEW, A.APPROVE, A.EXPORT], S.ALL], ['payment', READ_EXPORT, S.ALL],
      ['expense_report', [A.VIEW, A.APPROVE, A.EXPORT], S.ALL], ['advance', VIEW_APPROVE, S.ALL],
      ['payment_batch', VIEW, S.ALL],
      ['vehicle', VIEW, S.ALL],
      ['controlling', READ_EXPORT, S.ALL],
      ['document', [A.VIEW, A.EXPORT, A.DOWNLOAD], S.ALL],
      ['dashboard', VIEW, S.ALL], ['audit', READ_EXPORT, S.ALL],
      ['user', VIEW, S.ALL], ['setting', VIEW_APPROVE, S.ALL],
    ],
  },
  {
    code: 'DEPT_HEAD',
    name: 'Chef de Département',
    rank: 20,
    description: 'Supervision technique du pôle, validation opérationnelle, gestion des équipes.',
    grants: [
      ['client', VIEW, S.COMPANY], ['contact', VIEW, S.COMPANY],
      ['opportunity', VIEW, S.DEPARTMENT], ['offer', VIEW, S.DEPARTMENT],
      ['affair', VIEW, S.DEPARTMENT], ['project', CU, S.DEPARTMENT], ['site', CU, S.DEPARTMENT],
      ['mission', [...CU_APPROVE, A.DELETE], S.DEPARTMENT],
      ['mission_order', CU_APPROVE, S.DEPARTMENT],
      ['planning', CU, S.DEPARTMENT],
      ['employee', VIEW, S.DEPARTMENT],
      ['timesheet', CU_APPROVE, S.DEPARTMENT],
      ['leave', VIEW_APPROVE, S.DEPARTMENT], ['certification', VIEW, S.DEPARTMENT],
      ['inspection', CU, S.DEPARTMENT],
      ['inspection_template', CU, S.DEPARTMENT],
      ['report', CU_APPROVE, S.DEPARTMENT],
      ['asset', CU, S.DEPARTMENT], ['measuring_device', CU_APPROVE, S.DEPARTMENT],
      ['non_conformity', CU_APPROVE, S.DEPARTMENT],
      ['attachment', VIEW, S.DEPARTMENT],
      ['expense_report', VIEW_APPROVE, S.DEPARTMENT],
      ['advance', VIEW, S.DEPARTMENT],
      ['vehicle', VIEW, S.DEPARTMENT],
      ['controlling', VIEW, S.DEPARTMENT],
      ['document', [A.VIEW, A.DOWNLOAD], S.DEPARTMENT],
      ['dashboard', VIEW, S.DEPARTMENT],
    ],
  },
  {
    code: 'HR',
    name: 'Ressources Humaines',
    rank: 40,
    description: 'Gestion administrative du personnel, validation RH des notes de frais.',
    grants: [
      ['employee', [...CRUD, A.EXPORT], S.COMPANY],
      ['daily_cost', CU, S.COMPANY],
      ['timesheet', VIEW_APPROVE, S.COMPANY],
      ['leave', [...CU_APPROVE, A.DELETE], S.COMPANY],
      ['certification', CRUD, S.COMPANY],
      ['mission', VIEW, S.COMPANY], ['mission_order', VIEW, S.COMPANY], ['planning', VIEW, S.COMPANY],
      ['expense_report', VIEW_APPROVE, S.COMPANY], ['advance', VIEW_APPROVE, S.COMPANY],
      ['payment_batch', CU, S.COMPANY],
      ['vehicle', CU, S.COMPANY],
      ['document', [A.VIEW, A.DOWNLOAD], S.COMPANY],
      ['dashboard', VIEW, S.COMPANY],
      ['user', VIEW, S.COMPANY], ['setting', VIEW, S.COMPANY],
    ],
  },
  {
    code: 'CONTROLLER',
    name: 'Contrôle de Gestion',
    rank: 30,
    description: 'Coûts journaliers, budgets, contrôle analytique des dépenses et de la rentabilité.',
    grants: [
      ['client', VIEW, S.COMPANY],
      ['opportunity', VIEW, S.COMPANY], ['offer', VIEW, S.COMPANY],
      ['affair', READ_EXPORT, S.COMPANY], ['project', VIEW, S.COMPANY], ['site', VIEW, S.COMPANY],
      ['mission', VIEW, S.COMPANY], ['mission_order', VIEW, S.COMPANY], ['planning', VIEW, S.COMPANY],
      ['employee', VIEW, S.COMPANY],
      ['daily_cost', CU_APPROVE, S.COMPANY],
      ['timesheet', READ_EXPORT, S.COMPANY],
      ['report', VIEW, S.COMPANY], ['asset', VIEW, S.COMPANY], ['measuring_device', VIEW, S.COMPANY],
      ['non_conformity', VIEW, S.COMPANY],
      ['attachment', VIEW_APPROVE, S.COMPANY],
      ['invoice', READ_EXPORT, S.COMPANY], ['payment', VIEW, S.COMPANY],
      ['expense_report', [A.VIEW, A.APPROVE, A.EXPORT], S.COMPANY], ['advance', VIEW_APPROVE, S.COMPANY],
      ['payment_batch', VIEW, S.COMPANY],
      ['vehicle', VIEW, S.COMPANY],
      ['controlling', [...CU, A.EXPORT], S.COMPANY],
      ['document', [A.VIEW, A.DOWNLOAD], S.COMPANY],
      ['dashboard', VIEW, S.COMPANY], ['audit', VIEW, S.COMPANY], ['setting', CU, S.COMPANY],
    ],
  },
  {
    code: 'CONTROLLER_ASSISTANT',
    name: 'Assistante Contrôle de Gestion',
    rank: 50,
    description: 'Saisie et pré-validation des pièces de dépenses, reporting et support.',
    grants: [
      ['client', VIEW, S.COMPANY],
      ['affair', VIEW, S.COMPANY], ['mission', VIEW, S.COMPANY], ['planning', VIEW, S.COMPANY],
      ['employee', VIEW, S.COMPANY], ['daily_cost', VIEW, S.COMPANY], ['timesheet', VIEW, S.COMPANY],
      ['report', VIEW, S.COMPANY],
      ['attachment', CU, S.COMPANY],
      ['invoice', VIEW, S.COMPANY], ['payment', VIEW, S.COMPANY],
      ['expense_report', CU, S.COMPANY], ['advance', CU, S.COMPANY],
      ['vehicle', CU, S.COMPANY],
      ['controlling', CU, S.COMPANY],
      ['document', [A.VIEW, A.CREATE, A.UPDATE, A.DOWNLOAD], S.COMPANY],
      ['dashboard', VIEW, S.COMPANY],
    ],
  },
  {
    code: 'BILLING',
    name: 'Responsable Facturation',
    rank: 40,
    description: 'Établissement des factures à partir des attachements validés, suivi de facturation.',
    grants: [
      ['client', VIEW, S.COMPANY], ['contact', VIEW, S.COMPANY],
      ['affair', VIEW, S.COMPANY], ['mission', VIEW, S.COMPANY],
      ['report', VIEW, S.COMPANY],
      ['attachment', CU, S.COMPANY],
      ['invoice', [...CU_APPROVE, A.EXPORT, A.DOWNLOAD], S.COMPANY],
      ['payment', CU, S.COMPANY],
      ['document', [A.VIEW, A.DOWNLOAD], S.COMPANY],
      ['dashboard', VIEW, S.COMPANY],
    ],
  },
  {
    code: 'RAF',
    name: 'Responsable Administratif & Financier',
    rank: 30,
    description: 'Trésorerie, lettrage, règlements et rapprochements comptables.',
    grants: [
      ['client', VIEW, S.COMPANY],
      ['affair', VIEW, S.COMPANY],
      ['attachment', VIEW, S.COMPANY],
      ['invoice', [...CU_APPROVE, A.EXPORT], S.COMPANY],
      ['payment', [...CU_APPROVE, A.EXPORT], S.COMPANY],
      ['expense_report', [A.VIEW, A.APPROVE, A.DOWNLOAD], S.COMPANY],
      ['advance', CU_APPROVE, S.COMPANY],
      ['payment_batch', VIEW_APPROVE, S.COMPANY],
      ['vehicle', VIEW, S.COMPANY],
      ['employee', VIEW, S.COMPANY],
      ['controlling', READ_EXPORT, S.COMPANY],
      ['document', [A.VIEW, A.DOWNLOAD], S.COMPANY],
      ['dashboard', VIEW, S.COMPANY], ['audit', VIEW, S.COMPANY], ['setting', VIEW, S.COMPANY],
    ],
  },
  {
    code: 'ACCOUNT_MANAGER',
    name: "Chargé d'Affaires",
    rank: 50,
    description: 'Suivi commercial et technique de portefeuille, demandes d’intervention et attachements.',
    grants: [
      ['client', CU, S.TEAM], ['contact', CU, S.TEAM],
      ['opportunity', CU, S.TEAM], ['tender', CU, S.TEAM], ['offer', CU, S.TEAM],
      ['affair', CU, S.TEAM], ['project', CU, S.TEAM], ['site', CU, S.TEAM],
      ['mission', CU, S.TEAM], ['mission_order', [A.VIEW, A.CREATE], S.TEAM], ['planning', VIEW, S.TEAM],
      ['employee', VIEW, S.COMPANY], ['timesheet', VIEW, S.TEAM],
      ['inspection', VIEW, S.TEAM],
      // Le chargé d'affaires émet le rapport vers le client (docs/05, W4) sans
      // pouvoir le vérifier : la vérification reste au chef de département.
      ['report', [A.VIEW, A.CREATE, A.UPDATE, A.EXPORT], S.TEAM],
      ['asset', CU, S.TEAM], ['non_conformity', CU, S.TEAM],
      ['attachment', CU_APPROVE, S.TEAM],
      ['invoice', VIEW, S.TEAM],
      ['expense_report', VIEW_APPROVE, S.TEAM],
      ['vehicle', VIEW, S.COMPANY],
      ['controlling', VIEW, S.TEAM],
      ['document', [A.VIEW, A.CREATE, A.UPDATE, A.DOWNLOAD], S.TEAM],
      ['dashboard', VIEW, S.TEAM],
    ],
  },
  {
    code: 'SALES',
    name: 'Représentant Technico-Commercial',
    rank: 50,
    description: 'Prospection, suivi des opportunités et relances commerciales.',
    grants: [
      ['client', CU, S.COMPANY], ['contact', CU, S.COMPANY],
      ['opportunity', CU, S.COMPANY], ['tender', CU, S.COMPANY], ['offer', CU, S.COMPANY],
      ['affair', VIEW, S.COMPANY],
      ['invoice', VIEW, S.COMPANY],
      ['expense_report', CU, S.OWN],
      ['document', [A.VIEW, A.CREATE, A.DOWNLOAD], S.COMPANY],
      ['dashboard', VIEW, S.COMPANY],
    ],
  },
  {
    code: 'INSPECTOR',
    name: 'Inspecteur',
    rank: 60,
    description: 'Ordres de mission, saisie des temps, rapports et notes de frais.',
    grants: [
      ['affair', VIEW, S.OWN], ['project', VIEW, S.OWN], ['site', VIEW, S.OWN],
      ['mission', VIEW, S.OWN], ['mission_order', [A.VIEW, A.DOWNLOAD], S.OWN], ['planning', VIEW, S.OWN],
      ['employee', VIEW, S.OWN], ['certification', VIEW, S.OWN],
      ['timesheet', CU, S.OWN], ['leave', [A.VIEW, A.CREATE], S.OWN],
      ['inspection', CU, S.OWN],
      ['inspection_template', VIEW, S.COMPANY],
      ['report', CU, S.OWN],
      // Un écart dont l'inspecteur est responsable : il le traite et rend
      // compte de la levée. La vérification reste au chef de département.
      ['non_conformity', CU, S.OWN],
      ['asset', CU, S.COMPANY], ['measuring_device', VIEW, S.COMPANY],
      ['attachment', VIEW, S.OWN],
      ['expense_report', CU, S.OWN], ['advance', VIEW, S.OWN],
      ['vehicle', VIEW, S.OWN],
      ['document', [A.VIEW, A.DOWNLOAD], S.OWN],
      ['dashboard', VIEW, S.OWN],
    ],
  },
  {
    code: 'DOC_CONTROLLER',
    name: 'Document Controller',
    rank: 50,
    description: 'Contrôle qualité, numérotation, validation formelle et classement documentaire.',
    grants: [
      ['client', VIEW, S.COMPANY],
      ['affair', VIEW, S.COMPANY], ['project', VIEW, S.COMPANY],
      ['mission', VIEW, S.COMPANY], ['mission_order', VIEW, S.COMPANY],
      ['inspection', VIEW, S.COMPANY],
      ['inspection_template', CU, S.COMPANY],
      ['report', [A.VIEW, A.UPDATE, A.APPROVE, A.EXPORT], S.COMPANY],
      ['asset', VIEW, S.COMPANY], ['measuring_device', VIEW, S.COMPANY],
      ['non_conformity', VIEW, S.COMPANY],
      ['attachment', VIEW, S.COMPANY], ['invoice', VIEW, S.COMPANY],
      ['document', FULL, S.COMPANY],
      ['dashboard', VIEW, S.COMPANY], ['audit', VIEW, S.COMPANY],
    ],
  },
];

/** Barème des frais — Procedure_Notes_de_Frais_I2S_TESTING V2 + classeur « Liste ». */
const EXPENSE_CATEGORIES = [
  { code: 'INDEMNITE_DEPLACEMENT', label: 'Indemnités de Déplacement', capType: ExpenseCapType.DAILY, capAmount: 100, requiresReceipt: false, requiresPriorApproval: false },
  { code: 'HEBERGEMENT', label: "Frais d'Hébergement", capType: ExpenseCapType.PER_NIGHT, capAmount: 150, requiresReceipt: false, requiresPriorApproval: true },
  { code: 'VEHICULE_PERSONNEL', label: 'Véhicule personnel', capType: ExpenseCapType.DAILY, capAmount: 100, requiresReceipt: false, requiresPriorApproval: true },
  { code: 'LOCATION_VOITURE', label: 'Location de voiture', capType: ExpenseCapType.NONE, capAmount: null, requiresReceipt: true, requiresPriorApproval: true },
  { code: 'TRANSPORT', label: 'Transport', capType: ExpenseCapType.NONE, capAmount: null, requiresReceipt: true, requiresPriorApproval: false },
  { code: 'CARBURANT', label: 'Carburant', capType: ExpenseCapType.NONE, capAmount: null, requiresReceipt: true, requiresPriorApproval: false },
  { code: 'PEAGE', label: 'Jawaz / Péage', capType: ExpenseCapType.NONE, capAmount: null, requiresReceipt: true, requiresPriorApproval: false },
  { code: 'PARKING', label: 'Parking', capType: ExpenseCapType.NONE, capAmount: null, requiresReceipt: true, requiresPriorApproval: false },
  { code: 'LAVAGE', label: 'Lavage', capType: ExpenseCapType.MONTHLY, capAmount: 100, requiresReceipt: true, requiresPriorApproval: false },
  { code: 'PETIT_OUTILLAGE', label: 'Petit outillage', capType: ExpenseCapType.NONE, capAmount: null, requiresReceipt: true, requiresPriorApproval: false },
  { code: 'IMPRESSION', label: 'Impression', capType: ExpenseCapType.NONE, capAmount: null, requiresReceipt: true, requiresPriorApproval: false },
  { code: 'ACHATS_EXCEPTIONNELS', label: 'Achats exceptionnels', capType: ExpenseCapType.MONTHLY, capAmount: 300, requiresReceipt: true, requiresPriorApproval: false },
  { code: 'REPAS_AFFAIRES', label: "Repas d'affaires", capType: ExpenseCapType.NONE, capAmount: null, requiresReceipt: true, requiresPriorApproval: true },
  { code: 'AUTRE', label: 'Autre', capType: ExpenseCapType.NONE, capAmount: null, requiresReceipt: true, requiresPriorApproval: false },
];

const DEPARTMENTS = [
  { code: 'CND', name: 'Contrôle Non Destructif & Pression' },
  { code: 'EILM', name: 'Électricité, Incendie, Levage & Manutention' },
  { code: 'CTC', name: 'Contrôle Technique de Construction' },
  // ETUDE et QHSE sont attestés par le registre « Suivi Cde Partagé I2S ».
  { code: 'ETUDE', name: 'Bureau d’Études' },
  { code: 'QHSE', name: 'Qualité, Hygiène, Sécurité & Environnement' },
  { code: 'DIR', name: 'Direction' },
  { code: 'SUP', name: 'Support & Moyens Généraux' },
];

/** Méthodes d'inspection issues des procédures opératoires PR01 et PR02. */
const METHODS = [
  { code: 'UT', name: 'Ultrasons', dept: 'CND', standards: ['ASME V', 'EN ISO 17640'] },
  { code: 'PT', name: 'Ressuage', dept: 'CND', standards: ['ASME V', 'EN ISO 3452-1'] },
  { code: 'MT', name: 'Magnétoscopie', dept: 'CND', standards: ['ASME V', 'EN ISO 17638'] },
  { code: 'VT', name: 'Contrôle visuel', dept: 'CND', standards: ['ASME V', 'EN ISO 17637'] },
  { code: 'RT', name: 'Radiographie', dept: 'CND', standards: ['ASME V', 'EN ISO 17636'] },
  { code: 'DIM', name: 'Contrôles dimensionnels (verticalité, rotondité, déformation)', dept: 'CND', standards: [] },
  { code: 'HARD', name: 'Essai de dureté', dept: 'CND', standards: [] },
  { code: 'PMI', name: 'Identification de matériaux (PMI)', dept: 'CND', standards: [] },
  { code: 'PAINT', name: 'Contrôle peinture et adhérence', dept: 'CND', standards: [] },
  { code: 'WELD', name: 'Qualification soudage (QMOS / QS)', dept: 'CND', standards: ['ASME IX'] },
  { code: 'LIFT', name: 'Vérification des appareils et accessoires de levage', dept: 'EILM', standards: ['Arrêté viziriel du 09/09/1953'] },
  { code: 'ELEC', name: 'Vérification des installations électriques', dept: 'EILM', standards: [] },
  { code: 'THERMO', name: 'Thermographie infrarouge', dept: 'EILM', standards: [] },
  { code: 'FIRE', name: 'Prévention incendie', dept: 'EILM', standards: [] },
  { code: 'CTC', name: 'Contrôle technique de construction', dept: 'CTC', standards: ['BAEL 91', 'Eurocodes', 'CM66', 'NV65', 'RPS 2011', 'DTU'] },
];

/**
 * Jours fériés marocains 2026.
 * Les fêtes religieuses suivent le calendrier hégirien : dates données à titre
 * indicatif, à confirmer chaque année par la RH (paramétrables dans l'application).
 */
const HOLIDAYS_2026: Array<[string, string]> = [
  ['2026-01-01', "Nouvel An"],
  ['2026-01-11', "Manifeste de l'Indépendance"],
  ['2026-03-20', "Aïd Al Fitr (indicatif)"],
  ['2026-03-21', "Aïd Al Fitr (indicatif)"],
  ['2026-05-01', 'Fête du Travail'],
  ['2026-05-27', "Aïd Al Adha (indicatif)"],
  ['2026-05-28', "Aïd Al Adha (indicatif)"],
  ['2026-06-17', '1er Moharram (indicatif)'],
  ['2026-07-30', 'Fête du Trône'],
  ['2026-08-14', 'Allégeance Oued Eddahab'],
  ['2026-08-20', 'Révolution du Roi et du Peuple'],
  ['2026-08-21', 'Fête de la Jeunesse'],
  ['2026-08-26', 'Aïd Al Mawlid (indicatif)'],
  ['2026-11-06', 'Marche Verte'],
  ['2026-11-18', "Fête de l'Indépendance"],
];

/** Paramètres métier issus de la procédure de notes de frais et du QMS. */
const SETTINGS: Array<[string, unknown]> = [
  ['expense.submissionDeadlineDay', 3],
  ['expense.managerDeadlineWorkingDays', 3],
  ['expense.hrDeadlineWorkingDays', 5],
  ['expense.paymentDay', 15],
  ['expense.travelAllowanceMinKm', 150],
  ['expense.rejectReasons', [
    'Justificatif absent',
    'Justificatif illisible ou non conforme',
    'Dépense personnelle',
    'Dépassement non autorisé',
    'Mauvaise imputation analytique',
    'Dépense non liée à une mission professionnelle',
    'Non-respect de la procédure',
  ]],
  ['report.dueWorkingDays', 21],
  ['report.qualityTargetComplaintsPerQuarter', 2],
  ['affair.marginAlertThresholdPoints', 5],
  ['certification.alertDaysBefore', 60],
  ['calibration.alertDaysBefore', 30],
  ['timesheet.unassignedAlertConsecutiveDays', 3],
  // Délai de traitement d'un écart selon sa gravité, en jours calendaires.
  ['nonConformity.dueDaysCritical', 7],
  ['nonConformity.dueDaysMajor', 30],
  ['nonConformity.dueDaysMinor', 60],
  ['nonConformity.dueDaysObservation', 90],
  ['nonConformity.alertDaysBefore', 3],
  ['numbering.affairPattern', '{YY}/{SEQ}'],
  ['numbering.missionPattern', 'MIS-{YY}-{SEQ}'],
  ['numbering.missionOrderPattern', 'OM-{YY}-{SEQ}'],
  ['numbering.attachmentPattern', 'ATT-{YY}-{SEQ}'],
  ['numbering.invoicePattern', 'F-{YY}-{SEQ}'],
  ['numbering.nonConformityPattern', 'NC-{YY}-{SEQ}'],
];

async function main() {
  console.log('→ Seed des référentiels I2S OPS\n');

  // ── Permissions ────────────────────────────────────────────────
  const actions = Object.values(PermissionAction);
  for (const resource of RESOURCES) {
    for (const action of actions) {
      await prisma.permission.upsert({
        where: { resource_action: { resource, action } },
        update: {},
        create: { resource, action },
      });
    }
  }
  const allPermissions = await prisma.permission.findMany();
  const permIndex = new Map(allPermissions.map((p) => [`${p.resource}:${p.action}`, p.id]));
  console.log(`  ${allPermissions.length} permissions (${RESOURCES.length} ressources × ${actions.length} actions)`);

  // ── Rôles ──────────────────────────────────────────────────────
  for (const def of ROLES) {
    const role = await prisma.role.upsert({
      where: { code: def.code },
      update: { name: def.name, description: def.description, rank: def.rank, isSystem: true },
      create: { code: def.code, name: def.name, description: def.description, rank: def.rank, isSystem: true },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    const grants: Array<{ permissionId: string; scope: ScopeLevel }> = [];
    if (def.wildcard) {
      for (const p of allPermissions) grants.push({ permissionId: p.id, scope: S.ALL });
    } else {
      for (const [resource, acts, scope] of def.grants) {
        for (const action of acts) {
          const id = permIndex.get(`${resource}:${action}`);
          if (!id) throw new Error(`Permission inconnue: ${resource}:${action} (rôle ${def.code})`);
          grants.push({ permissionId: id, scope });
        }
      }
    }
    await prisma.rolePermission.createMany({
      data: grants.map((g) => ({ roleId: role.id, ...g })),
      skipDuplicates: true,
    });
    console.log(`  Rôle ${def.code.padEnd(22)} ${grants.length} droits`);
  }

  // ── Société ────────────────────────────────────────────────────
  // Périmètre MVP validé : I2S TESTING seule. I2S TESTING SUD et BETA ENG
  // sont activables sans migration (voir docs/11-DECISIONS-A-VALIDER.md, D2).
  const company = await prisma.company.upsert({
    where: { code: 'I2S' },
    update: {},
    create: {
      code: 'I2S',
      name: 'I2S TESTING',
      legalName: 'I2S TESTING',
      currency: 'MAD',
      vatRate: 20,
      city: 'Casablanca',
    },
  });
  console.log(`\n  Société ${company.name}`);

  // ── Départements ───────────────────────────────────────────────
  for (const d of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { companyId_code: { companyId: company.id, code: d.code } },
      update: { name: d.name },
      create: { companyId: company.id, code: d.code, name: d.name },
    });
  }
  const departments = await prisma.department.findMany({ where: { companyId: company.id } });
  const deptByCode = new Map(departments.map((d) => [d.code, d.id]));
  console.log(`  ${departments.length} départements : ${DEPARTMENTS.map((d) => d.code).join(', ')}`);

  // ── Méthodes d'inspection ──────────────────────────────────────
  for (const m of METHODS) {
    await prisma.inspectionMethod.upsert({
      where: { code: m.code },
      update: { name: m.name, standards: m.standards, departmentId: deptByCode.get(m.dept) ?? null },
      create: { code: m.code, name: m.name, standards: m.standards, departmentId: deptByCode.get(m.dept) ?? null },
    });
  }
  console.log(`  ${METHODS.length} méthodes d'inspection`);

  // ── Modèles de rapports du référentiel qualité ─────────────────
  // Un modèle déjà présent n'est jamais touché : un formulaire publié garde
  // son statut, sa structure et ses rapports. Seuls les manquants entrent, en
  // brouillon et sans formulaire de saisie — de quoi classer les rapports par
  // type dès maintenant, sans rien laisser saisir sur un formulaire vide.
  const methodIds = new Map(
    (await prisma.inspectionMethod.findMany({ select: { id: true, code: true } })).map((m) => [
      m.code,
      m.id,
    ]),
  );
  let addedForms = 0;
  for (const form of REPORT_FORMS) {
    const existing = await prisma.inspectionTemplate.findFirst({
      where: { formCode: form.formCode },
      select: { id: true },
    });
    if (existing) continue;

    await prisma.inspectionTemplate.create({
      data: {
        formCode: form.formCode,
        version: '00',
        title: form.title,
        methodId: form.methodCode ? (methodIds.get(form.methodCode) ?? null) : null,
        paradigm: form.paradigm,
        status: 'DRAFT',
        schema: { sections: [] },
      },
    });
    addedForms += 1;
  }
  console.log(`  ${REPORT_FORMS.length} modèles de rapports au référentiel (${addedForms} ajoutés)`);

  // Les formulaires construits sont du référentiel métier, pas de la
  // démonstration : sans cela, une mise en service sans jeu de démonstration
  // ne proposerait aucun formulaire saisissable. Le versionnement reste
  // immuable — republier crée une version, ne modifie jamais un rapport émis.
  for (const template of REPORT_TEMPLATES) {
    await prisma.inspectionTemplate.upsert({
      where: { formCode_version: { formCode: template.formCode, version: template.version } },
      update: {
        title: template.title,
        titleEn: template.titleEn ?? null,
        paradigm: template.paradigm,
        schema: template.schema as never,
        status: 'PUBLISHED',
      },
      create: {
        formCode: template.formCode,
        version: template.version,
        title: template.title,
        titleEn: template.titleEn ?? null,
        methodId: methodIds.get(template.methodCode) ?? null,
        paradigm: template.paradigm,
        applicationDate: new Date(template.applicationDate),
        status: 'PUBLISHED',
        schema: template.schema as never,
      },
    });
  }
  const sections = REPORT_TEMPLATES.reduce(
    (n, t) => n + ((t.schema as { sections: unknown[] }).sections?.length ?? 0),
    0,
  );
  console.log(
    `  ${REPORT_TEMPLATES.length} formulaires construits et publiés (${sections} sections)`,
  );

  // ── Catégories de frais ────────────────────────────────────────
  for (const [i, c] of EXPENSE_CATEGORIES.entries()) {
    await prisma.expenseCategory.upsert({
      where: { code: c.code },
      update: { ...c, position: i },
      create: { ...c, position: i },
    });
  }
  console.log(`  ${EXPENSE_CATEGORIES.length} catégories de frais avec plafonds`);

  // ── Paramètres ─────────────────────────────────────────────────
  for (const [key, value] of SETTINGS) {
    await prisma.setting.upsert({
      where: { companyId_key: { companyId: company.id, key } },
      update: { value: value as never },
      create: { companyId: company.id, key, value: value as never },
    });
  }
  console.log(`  ${SETTINGS.length} paramètres métier`);

  // ── Calendrier ouvré 2026 ──────────────────────────────────────
  const holidays = new Map(HOLIDAYS_2026);
  const days: Array<{ companyId: string; date: Date; isWorkingDay: boolean; label: string | null }> = [];
  for (let d = new Date(Date.UTC(2026, 0, 1)); d.getUTCFullYear() === 2026; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getUTCDay();
    const holidayLabel = holidays.get(iso);
    const isWeekend = dow === 0 || dow === 6;
    days.push({
      companyId: company.id,
      date: new Date(iso),
      isWorkingDay: !isWeekend && !holidayLabel,
      label: holidayLabel ?? (isWeekend ? 'Week-end' : null),
    });
  }
  await prisma.workCalendarDay.deleteMany({
    where: { companyId: company.id, date: { gte: new Date('2026-01-01'), lte: new Date('2026-12-31') } },
  });
  await prisma.workCalendarDay.createMany({ data: days, skipDuplicates: true });
  const workingDays = days.filter((d) => d.isWorkingDay).length;
  console.log(`  Calendrier 2026 : ${workingDays} jours ouvrés, ${HOLIDAYS_2026.length} jours fériés`);

  // ── Compte administrateur ──────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@i2s-testing.ma';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    console.log(`\n  Compte administrateur déjà présent : ${adminEmail} (mot de passe inchangé)`);
  } else {
    const generated = process.env.SEED_ADMIN_PASSWORD ?? randomBytes(12).toString('base64url');
    const passwordHash = await hash(generated, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
    const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: 'ADMIN' } });
    const user = await prisma.user.create({
      data: { email: adminEmail, passwordHash, mustChangePassword: true },
    });
    await prisma.userRole.create({
      data: { userId: user.id, roleId: adminRole.id, companyId: company.id },
    });
    console.log('\n  ┌─────────────────────────────────────────────────────────┐');
    console.log('  │  COMPTE ADMINISTRATEUR CRÉÉ                              │');
    console.log(`  │  Email        : ${adminEmail.padEnd(40)}│`);
    console.log(`  │  Mot de passe : ${generated.padEnd(40)}│`);
    console.log('  │  À changer à la première connexion.                      │');
    console.log('  └─────────────────────────────────────────────────────────┘');
  }

  console.log('\n✓ Seed terminé.\n');
}

main()
  .catch((e) => {
    console.error('\n✗ Seed en échec :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
