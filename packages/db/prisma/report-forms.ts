/**
 * Catalogue des modèles de rapports I2S TESTING.
 *
 * Relevé dans le référentiel qualité (`05_PROCEDURES`, dossiers PR01 CND,
 * PR02 EILM, PR03 CTC) : un modèle par formulaire, avec son code QMS exact.
 * Ce sont des données réelles de l'entreprise, pas un jeu de démonstration.
 *
 * Seuls quelques modèles ont déjà leur formulaire de saisie construit. Les
 * autres entrent au référentiel en brouillon : ils servent dès maintenant à
 * classer et filtrer les rapports par type, mais ne peuvent pas encore être
 * saisis — l'écran de saisie ne propose que les modèles publiés, et l'API
 * refuse les autres.
 *
 * Le paradigme (mesures, liste de contrôle, critères) est provisoire pour les
 * modèles non construits : il sera confirmé à la construction du formulaire.
 */
export interface ReportForm {
  formCode: string;
  title: string;
  dept: 'CND' | 'EILM' | 'CTC';
  /** Méthode d'inspection du référentiel, quand une méthode existe pour ce contrôle. */
  methodCode: string | null;
  paradigm: 'MEASUREMENT' | 'CHECKLIST' | 'CRITERIA';
}

const cnd = (
  formCode: string,
  title: string,
  methodCode: string | null,
  paradigm: ReportForm['paradigm'] = 'MEASUREMENT',
): ReportForm => ({ formCode, title, dept: 'CND', methodCode, paradigm });

const eilm = (
  formCode: string,
  title: string,
  methodCode: string | null,
  paradigm: ReportForm['paradigm'] = 'CHECKLIST',
): ReportForm => ({ formCode, title, dept: 'EILM', methodCode, paradigm });

export const REPORT_FORMS: ReportForm[] = [
  /* ── PR01 — Contrôle non destructif & pression ──────────────────── */
  cnd('PR01-F02', 'Rapport d’examen par ultrasons', 'UT'),
  cnd('PR01-F03', 'Rapport de contrôle de verticalité', 'DIM'),
  cnd('PR01-F04', 'Rapport d’examen par ressuage', 'PT'),
  cnd('PR01-F05', 'Rapport d’examen par magnétoscopie', 'MT'),
  cnd('PR01-F06', 'Rapport d’examen d’adhérence', 'PAINT'),
  cnd('PR01-F07', 'Rapport de contrôle de rotondité', 'DIM'),
  cnd('PR01-F08', 'Rapport d’examen visuel', 'VT', 'CHECKLIST'),
  cnd('PR01-F09', 'PV de qualification de mode opératoire de soudage (QMOS) — ASME IX', 'WELD', 'CRITERIA'),
  cnd('PR01-F10', 'Rapport de contrôle de déformation locale', 'DIM'),
  cnd('PR01-F11', 'Attestation de vérification de composition d’atmosphère', null),
  cnd('PR01-F12', 'PV de qualification de mode opératoire de soudage', 'WELD', 'CRITERIA'),
  cnd('PR01-F13', 'Certificat de qualification de soudeurs', 'WELD', 'CRITERIA'),
  cnd('PR01-F14', 'Rapport de réception et de suivi des travaux', null, 'CHECKLIST'),
  cnd('PR01-F17', 'Rapport d’inspection', null, 'CHECKLIST'),
  cnd('PR01-F18', 'Rapport d’identification des matériaux (PMI)', 'PMI'),
  cnd('PR01-F21', 'Rapport de contrôle peinture', 'PAINT'),
  cnd('PR01-F22', 'Rapport d’interprétation de clichés radiographiques', 'RT'),
  cnd('PR01-F25', 'Rapport de tarage de soupape', null),
  cnd('PR01-F26', 'Rapport d’essai de dureté', 'HARD'),
  cnd('PR01-F27', 'Rapport de fonctionnement des appareils', null, 'CHECKLIST'),

  /* ── PR02 — Électricité, incendie, levage & manutention ─────────── */
  eilm('PR02-F01', 'Vérification de grue auxiliaire de chargement', 'LIFT'),
  eilm('PR02-F02', 'Inspection de plate-forme suspendue', 'LIFT'),
  eilm('PR02-F03', 'Vérification de chariot à flèche télescopique', 'LIFT'),
  eilm('PR02-F04', 'Vérification de grue à tour', 'LIFT'),
  eilm('PR02-F05', 'Vérification de grue mobile', 'LIFT'),
  eilm('PR02-F06', 'Vérification de plateforme élévatrice mobile de personnel', 'LIFT'),
  eilm('PR02-F07', 'Vérification de harnais de sécurité', 'LIFT'),
  eilm('PR02-F08', 'Vérification de palan à levier', 'LIFT'),
  eilm('PR02-F09', 'Vérification d’élingue', 'LIFT'),
  eilm('PR02-F10', 'Vérification de manille', 'LIFT'),
  eilm('PR02-F11', 'Inspection de treuil manuel de levage', 'LIFT'),
  eilm('PR02-F12', 'Vérification d’équipement mécanique (ascenseur, monte-charge)', 'LIFT'),
  eilm('PR02-F13', 'Thermographie infrarouge des armoires électriques', 'THERMO', 'MEASUREMENT'),
  eilm('PR02-F14', 'Vérification des installations électriques', 'ELEC'),
  eilm('PR02-F15', 'Mise en service de ligne de vie', null),
  eilm('PR02-F16', 'Vérification d’échafaudage roulant', null),
  eilm('PR02-F17', 'Vérification de ligne de vie', null),
  eilm('PR02-F18', 'Vérification de plateforme individuelle roulante', null),
  eilm('PR02-F19', 'Vérification d’échafaudage fixe', null),
  eilm('PR02-F20', 'Vérification de pelle de chargement', null),
  eilm('PR02-F21', 'Vérification de porte automatique', null),
  eilm('PR02-F22', 'Vérification de poste de soudure', 'ELEC'),
  eilm('PR02-F23', 'Vérification de niveleuse', null),
  eilm('PR02-F24', 'Vérification de forage', null),
  eilm('PR02-F25', 'Vérification de compresseur mobile', null),
  eilm('PR02-F26', 'Vérification de compacteur mobile', null),
  eilm('PR02-F27', 'Vérification de groupe électrogène', 'ELEC'),
  eilm('PR02-F28', 'Vérification de bétonnière', null),
  eilm('PR02-F32', 'Rapport EIL', null),
  eilm('PR02-F33', 'Contrôle du système de protection cathodique', null),
  eilm('PR02-F34', 'Vérification avant mise en service d’ascenseur ou de monte-charge', 'LIFT'),
  eilm('PR02-F35', 'Vérification de stop-chute', null),
  eilm('PR02-F36', 'Certificat annuel de vérification d’installation électrique', 'ELEC'),
  eilm('PR02-F37', 'Mise en service de palonnier', 'LIFT'),
  eilm('PR02-F38', 'Vérification périodique de chariot de manutention à mât', 'LIFT'),
  eilm('PR02-F39', 'Vérification de mise ou remise en service de pont ou portique', 'LIFT'),
  eilm('PR02-F40', 'Rapport de vérification périodique — pont roulant ou portique', 'LIFT'),
  eilm('PR02-F41', 'Vérification de vérin hydraulique', null),
  eilm('PR02-F42', 'Vérification de centrale hydraulique', null),

  /* ── PR03 — Contrôle technique de construction ──────────────────── */
  { formCode: 'PR03-F01', title: 'Rapport de contrôle technique de construction', dept: 'CTC', methodCode: 'CTC', paradigm: 'CRITERIA' },
  { formCode: 'PR03-F02', title: 'Rapport sur notice de sécurité incendie', dept: 'CTC', methodCode: 'CTC', paradigm: 'CRITERIA' },
];

/** Le service d'un modèle se lit dans son code QMS : PR01 CND, PR02 EILM, PR03 CTC. */
export function deptOfForm(formCode: string): 'CND' | 'EILM' | 'CTC' | null {
  if (formCode.startsWith('PR01')) return 'CND';
  if (formCode.startsWith('PR02')) return 'EILM';
  if (formCode.startsWith('PR03')) return 'CTC';
  return null;
}
