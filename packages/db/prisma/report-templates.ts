/**
 * Formulaires d'inspection construits, saisissables dans l'application.
 *
 * Structures relevées une à une sur les modèles du référentiel I2S
 * (`05_PROCEDURES`), dont les fichiers Excel et Word font foi :
 *   PR01-F02  Examen par ultrasons                  → mesures et indications
 *   PR01-F03  Contrôle de verticalité               → mesures dimensionnelles
 *   PR01-F04  Examen par ressuage                   → mesures et indications
 *   PR01-F05  Examen par magnétoscopie              → mesures et indications
 *   PR01-F06  Examen d’adhérence                    → épaisseurs de peinture
 *   PR01-F07  Contrôle de rotondité                 → mesures dimensionnelles
 *   PR01-F08  Examen visuel                         → mesures et indications
 *   PR01-F09  QMOS selon l’ASME IX                  → variables QW et essais
 *   PR01-F10  Contrôle de déformation locale        → mesures dimensionnelles
 *   PR01-F11  Composition d’atmosphère              → attestation sur mesures
 *   PR01-F12  QMOS, référentiel européen            → paramètres par passe et essais
 *   PR01-F13  Qualification de soudeur (ASME IX)    → variables et essais
 *   PR01-F14  Réception et suivi des travaux        → constats et décisions
 *   PR01-F17  Rapport d’inspection de réservoir     → rapport rédigé structuré
 *   PR01-F18  Identification des matériaux (PMI)    → composition par élément
 *   PR01-F21  Contrôle peinture                     → préparation et épaisseurs
 *   PR01-F22  Interprétation de clichés radio       → mesures et indications
 *   PR01-F25  Tarage de soupape                     → essai par soupape
 *   PR01-F26  Essai de dureté                       → mesures et indications
 *   PR01-F27  Fonctionnement des appareils          → fiches et résultat
 *   PR02-F01  Grue auxiliaire de chargement         → appareil de levage
 *   PR02-F02  Plate-forme suspendue                 → appareil de levage
 *   PR02-F03  Chariot à flèche télescopique         → appareil de levage
 *   PR02-F04  Grue à tour                           → check-list et épreuves
 *   PR02-F05  Grue mobile                           → appareil de levage
 *   PR02-F06  Plateforme élévatrice de personnel    → appareil de levage
 *   PR02-F07  Harnais de sécurité                   → accessoire à check-list
 *   PR02-F08  Palan à levier                        → accessoire
 *   PR02-F09  Élingue                               → accessoire
 *   PR02-F10  Manille                               → accessoire
 *   PR02-F11  Treuil manuel de levage               → accessoire
 *   PR02-F12  Ascenseur ou monte-charge             → check-list réglementaire
 *   PR02-F13  Thermographie infrarouge              → mesures et fiches d’anomalie
 *   PR02-F14  Installations électriques (v01)       → points, relevés et mesures
 *   PR02-F15  Mise en service de ligne de vie       → compte rendu et essai
 *   PR02-F16  Échafaudage roulant                   → échafaudage
 *   PR02-F17  Ligne de vie                          → travail en hauteur
 *   PR02-F18  Plateforme individuelle roulante      → échafaudage
 *   PR02-F19  Échafaudage fixe                      → échafaudage
 *   PR02-F20  Pelle de chargement                   → engin de chantier
 *   PR02-F21  Porte automatique                     → check-list propre
 *   PR02-F22  Poste de soudure                      → accessoire
 *   PR02-F23  Niveleuse                             → engin de chantier
 *   PR02-F24  Machine mobile de forage              → engin de chantier
 *   PR02-F25  Compresseur mobile                    → engin de chantier
 *   PR02-F26  Compacteur mobile                     → engin de chantier
 *   PR02-F27  Groupe électrogène                    → liste continue
 *   PR02-F28  Bétonnière                            → engin de chantier
 *   PR02-F32  Compte rendu d’examen EIL             → avis codifiés
 *   PR02-F33  Protection cathodique                 → mesures de potentiels
 *   PR02-F34  Mise en service d’ascenseur           → constatations et essais
 *   PR02-F35  Stop-chute                            → accessoire
 *   PR02-F36  Certificat d’installation électrique  → attestation
 *   PR02-F37  Mise en service de palonnier          → essai statique
 *   PR02-F38  Chariot de manutention à mât          → check-list réglementaire
 *   PR02-F39  Mise en service pont roulant          → check-list et épreuves
 *   PR02-F40  Vérification périodique pont roulant  → check-list réglementaire
 *   PR02-F41  Vérin hydraulique                     → accessoire
 *   PR02-F42  Centrale hydraulique                  → accessoire
 *   PR03-F01  Rapport de contrôle technique         → critères d'acceptation
 *   PR03-F02  Notice de sécurité incendie           → avis par disposition
 *   PR04-F01  Plan HSE global                       → plan et évaluation des risques
 *   PR04-F02  Rapport journalier HSE                → notes TS / S / I / SO et constats
 *   PR04-F03  Rapport hebdomadaire HSE              → indicateurs et suivi par entreprise
 *   PR04-F04  Rapport mensuel de suivi HSE          → synthèse et taux de résolution
 *   PR04-F05  Accident ou incident                  → analyse des causes et actions
 *   PR04-F06  Inspection HSE de chantier            → check-list par thème de risque
 *   PR04-F07  Permis de travail                     → mesures, atmosphère, clôture
 *   PR04-F08  Fiche d’accueil sécurité              → modules et émargement
 *   PR04-F09  Causerie sécurité                     → thème et participants
 *   PR04-F10  Contrôle d’engin avant accès          → documents, état, décision
 *
 * Les rapports PR04 ne viennent pas du référentiel qualité : les quatre
 * premiers reprennent les canevas du service HSE, les six autres les
 * complètent. Leur codification est une proposition à valider par le QHSE.
 *
 * Tous les formulaires du catalogue (`report-forms.ts`) sont construits. Là
 * où le modèle d'origine s'écarte de son titre, cite un texte abrogé ou
 * copie un rapport réel, le formulaire le dit en commentaire : ces écarts
 * sont à arbitrer par le QHSE, pas à corriger en silence ici.
 *
 * Les libellés bilingues, l'ordre des blocs et les listes de valeurs sont
 * repris des formulaires existants : un rapport généré doit être visuellement
 * superposable au modèle Word ou Excel actuel.
 */

export interface TemplateSeed {
  formCode: string;
  version: string;
  title: string;
  titleEn?: string;
  /** Absente pour un compte rendu général qui ne relève d'aucune méthode d'inspection. */
  methodCode: string | null;
  paradigm: 'MEASUREMENT' | 'CHECKLIST' | 'CRITERIA';
  applicationDate: string;
  schema: unknown;
}

const END_HEADER = {
  key: 'header',
  label: { fr: 'Identification', en: 'Identification' },
  type: 'keyvalue',
  repeatable: false,
  fields: [
    { key: 'client', label: { fr: 'Client', en: 'Customer' }, type: 'ref', required: true, autofill: 'client', span: 4 },
    { key: 'affairNumber', label: { fr: 'N° d’affaire', en: 'Transaction N°' }, type: 'ref', required: true, autofill: 'affairNumber', span: 4 },
    { key: 'procedure', label: { fr: 'Instruction de référence', en: 'Procedure N°' }, type: 'text', required: true, autofill: 'procedure', span: 4 },
    { key: 'manufacturer', label: { fr: 'Fabricant', en: 'Manufacturer' }, type: 'text', required: false, autofill: 'manufacturer', span: 4 },
    { key: 'place', label: { fr: 'Lieu de contrôle', en: 'Place of inspection' }, type: 'ref', required: true, autofill: 'site', span: 4 },
    { key: 'standard', label: { fr: 'Spécification applicable', en: 'Examination according to' }, type: 'standard-ref', required: true, autofill: 'standards', span: 4 },
    { key: 'drawing', label: { fr: 'Plan de référence', en: 'Drawing N°' }, type: 'text', required: false, span: 6 },
    { key: 'material', label: { fr: 'Matériel examiné', en: 'Material examined' }, type: 'ref', required: true, autofill: 'asset', span: 6 },
  ],
};

const END_SIGNATURES = {
  key: 'signatures',
  label: { fr: 'Visas', en: 'Signatures' },
  type: 'signature-matrix',
  repeatable: false,
  signatories: [
    { fr: 'Examen effectué par', en: 'Examination carried on by' },
    { fr: 'Rapport établi par', en: 'Report established by' },
    { fr: 'Client / tierce partie', en: 'Customer / third party' },
    { fr: 'Client final', en: 'End customer' },
  ],
};

/** Ressuage et magnétoscopie ne font pas viser le client final : trois colonnes, pas quatre. */
const END_SIGNATURES_3 = {
  key: 'signatures',
  label: { fr: 'Visas', en: 'Signatures' },
  type: 'signature-matrix',
  repeatable: false,
  signatories: [
    { fr: 'Examen effectué par', en: 'Examination carried on by' },
    { fr: 'Rapport établi par', en: 'Report established by' },
    { fr: 'Client / tierce partie', en: 'Customer / third party' },
  ],
};

/** Lumière d'observation : même bloc sur tous les examens de surface. */
const LIGHT_FIELDS = [
  { key: 'light', label: { fr: 'Lumière', en: 'Light' }, type: 'enum', required: true, options: ['Naturelle', 'Artificielle', 'Noire'], span: 4 },
  { key: 'lightValue', label: { fr: 'Valeur mesurée', en: 'Specified value' }, type: 'number', required: true, unit: 'Lux', span: 4 },
];

/* ── Contrôles dimensionnels de réservoirs (verticalité, rotondité…) ─ */

/** En-tête commun aux contrôles dimensionnels, bilingue comme les autres rapports END. */
const DIM_HEADER = {
  key: 'header',
  label: { fr: 'Identification', en: 'Identification' },
  type: 'keyvalue',
  repeatable: false,
  fields: [
    { key: 'client', label: { fr: 'Client', en: 'Customer' }, type: 'ref', required: true, autofill: 'client', span: 4 },
    { key: 'affairNumber', label: { fr: 'Affaire', en: 'Transaction' }, type: 'ref', required: true, autofill: 'affairNumber', span: 4 },
    { key: 'manufacturer', label: { fr: 'Fabricant / lieu de fabrication', en: 'Manufacturer / place of manufacture' }, type: 'text', required: false, autofill: 'manufacturer', span: 4 },
    { key: 'drawing', label: { fr: 'Plan de référence', en: 'Reference drawing' }, type: 'text', required: false, span: 4 },
    { key: 'standard', label: { fr: 'Spécification applicable', en: 'Examination according to' }, type: 'standard-ref', required: true, autofill: 'standards', span: 4 },
    { key: 'material', label: { fr: 'Matériel (ou construction) examiné', en: 'Material (or construction) examined' }, type: 'ref', required: true, autofill: 'asset', span: 4 },
    { key: 'description', label: { fr: 'Description de l’inspection', en: 'Description of inspection' }, type: 'textarea', required: false, span: 12 },
  ],
};

/** Résultat d'un contrôle dimensionnel : deux issues, comme au modèle. */
const ACCEPTABLE_RESULT = {
  key: 'result',
  label: { fr: 'Résultat de l’inspection', en: 'Inspection result' },
  type: 'verdict',
  repeatable: false,
  verdicts: [
    { fr: 'Acceptable', en: 'Acceptable' },
    { fr: 'Non acceptable', en: 'Not acceptable' },
  ],
};

const END_NOTE = {
  key: 'note',
  label: { fr: 'Note', en: 'Note' },
  type: 'text',
  repeatable: false,
  fields: [{ key: 'note', label: { fr: 'Note', en: 'Note' }, type: 'textarea', required: false, span: 12 }],
};

/* ── Contrôles de peinture ────────────────────────────────────────── */

/**
 * Conditions ambiantes relevées avant application, côté intérieur et côté
 * extérieur. Les seuils sont ceux imprimés au modèle.
 */
const PAINT_CONDITIONS = {
  key: 'ambient',
  label: { fr: 'Conditions d’application', en: 'Operating conditions' },
  type: 'conditions',
  repeatable: false,
  help: 'Spécification du modèle : hygrométrie < 85 % · température ambiante > 5 °C · température du support > 5 °C · point de rosée > 3 °C.',
  fields: [
    { key: 'humidityIn', label: { fr: 'Hygrométrie — intérieur', en: 'Humidity — in' }, type: 'number', required: false, unit: '%', decimals: 0, span: 3 },
    { key: 'humidityOut', label: { fr: 'Hygrométrie — extérieur', en: 'Humidity — out' }, type: 'number', required: false, unit: '%', decimals: 0, span: 3 },
    { key: 'ambientIn', label: { fr: 'Température ambiante — intérieur', en: 'Ambient temperature — in' }, type: 'number', required: false, unit: '°C', decimals: 1, span: 3 },
    { key: 'ambientOut', label: { fr: 'Température ambiante — extérieur', en: 'Ambient temperature — out' }, type: 'number', required: false, unit: '°C', decimals: 1, span: 3 },
    { key: 'surfaceIn', label: { fr: 'Température du support — intérieur', en: 'Surface temperature — in' }, type: 'number', required: false, unit: '°C', decimals: 1, span: 3 },
    { key: 'surfaceOut', label: { fr: 'Température du support — extérieur', en: 'Surface temperature — out' }, type: 'number', required: false, unit: '°C', decimals: 1, span: 3 },
    { key: 'dewPointIn', label: { fr: 'Point de rosée — intérieur', en: 'Dew point — in' }, type: 'number', required: false, unit: '°C', decimals: 1, span: 3 },
    { key: 'dewPointOut', label: { fr: 'Point de rosée — extérieur', en: 'Dew point — out' }, type: 'number', required: false, unit: '°C', decimals: 1, span: 3 },
    { key: 'recoatDelay', label: { fr: 'Délai de recouvrement', en: 'Time between coats' }, type: 'text', required: false, span: 6 },
  ],
};

/**
 * Synthèse de l'épaisseur de feuil sec. Le modèle Excel la calcule ; le
 * moteur de formulaires ne sait pas encore calculer, elle est donc saisie
 * et la règle rappelée : aucun point sous 80 % de l'épaisseur contractuelle,
 * au plus 20 % des points entre 80 % et 100 %, moyenne au moins égale.
 */
const paintSummary = (avecSeuil60: boolean) => ({
  key: 'summary',
  label: { fr: 'Synthèse des épaisseurs', en: 'Thickness summary' },
  type: 'conditions',
  repeatable: false,
  help: 'Règle du modèle : aucun point < 80 % de l’épaisseur contractuelle (Ep) · au plus 20 % des points entre 80 % d’Ep et Ep · moyenne ≥ Ep.',
  fields: [
    { key: 'contractualThickness', label: { fr: 'Épaisseur contractuelle (Ep)', en: 'Contractual thickness' }, type: 'number', required: true, unit: 'µm', decimals: 0, span: 4 },
    { key: 'measureCount', label: { fr: 'Nombre de mesures', en: 'Number of measurements' }, type: 'number', required: true, decimals: 0, span: 4 },
    { key: 'below80', label: { fr: 'Points < 80 % d’Ep', en: 'Points < 80 %' }, type: 'number', required: true, decimals: 0, span: 4 },
    ...(avecSeuil60
      ? [{ key: 'below60', label: { fr: 'Points < 60 % d’Ep', en: 'Points < 60 %' }, type: 'number', required: false, decimals: 0, span: 4 }]
      : []),
    { key: 'between80and100', label: { fr: 'Taux de points entre 80 % d’Ep et Ep', en: 'Rate 80 % ≤ X ≤ Ep' }, type: 'number', required: true, unit: '%', decimals: 0, span: 4 },
    { key: 'average', label: { fr: 'Moyenne', en: 'Average' }, type: 'number', required: true, unit: 'µm', decimals: 0, span: 4 },
  ],
});

const PAINT_MEASURES = {
  key: 'measures',
  label: { fr: 'Résultats de l’interprétation', en: 'Interpretation results' },
  type: 'table',
  repeatable: true,
  minRows: 1,
  help: 'Une ligne par point de mesure d’épaisseur de feuil sec.',
  columns: [
    { key: 'zone', label: { fr: 'Zone ou repère', en: 'Area or mark' }, type: 'text', required: true, span: 6 },
    { key: 'thickness', label: { fr: 'Épaisseur mesurée', en: 'Measured thickness' }, type: 'number', required: true, unit: 'µm', decimals: 0, span: 6 },
  ],
};

const COMPLIANT_RESULT = {
  key: 'result',
  label: { fr: 'Conclusion', en: 'Conclusion' },
  type: 'verdict',
  repeatable: false,
  verdicts: [
    { fr: 'Conforme', en: 'Compliant' },
    { fr: 'Non conforme', en: 'Not compliant' },
  ],
};

const END_COMMENTS = {
  key: 'comments',
  label: { fr: 'Commentaires', en: 'Comments' },
  type: 'text',
  repeatable: false,
  fields: [{ key: 'comments', label: { fr: 'Commentaires', en: 'Comments' }, type: 'textarea', required: false, span: 12 }],
};

/* ── Qualification de modes opératoires de soudage ────────────────── */

/**
 * Champ bilingue facultatif, demi-largeur par défaut : les PV de soudage en
 * alignent des dizaines, et chaque libellé y est donné en français et en
 * anglais comme au modèle.
 */
const champ = (
  key: string,
  fr: string,
  en: string,
  type = 'text',
  extra: Record<string, unknown> = {},
) => ({ key, label: { fr, en }, type, required: false, span: 6, ...extra });

const section = (key: string, fr: string, en: string, fields: unknown[], type = 'keyvalue', help?: string) => ({
  key,
  label: { fr, en },
  type,
  repeatable: false,
  ...(help ? { help } : {}),
  fields,
});

const tableau = (key: string, fr: string, en: string, columns: unknown[], help?: string) => ({
  key,
  label: { fr, en },
  type: 'table',
  repeatable: true,
  minRows: 0,
  ...(help ? { help } : {}),
  columns,
});

const OUI_NON = ['Oui', 'Non'];

/* ── Supervision HSE de chantier (PR04, codification proposée) ────── */

/** Champ en français seul, demi-largeur par défaut : les canevas HSE ne sont pas bilingues. */
const hc = (key: string, fr: string, type = 'text', extra: Record<string, unknown> = {}) => ({
  key,
  label: { fr },
  type,
  required: false,
  span: 6,
  ...extra,
});

const hSection = (key: string, fr: string, fields: unknown[], type = 'keyvalue', help?: string) => ({
  key,
  label: { fr },
  type,
  repeatable: false,
  ...(help ? { help } : {}),
  fields,
});

const hTable = (key: string, fr: string, columns: unknown[], help?: string, minRows = 0) => ({
  key,
  label: { fr },
  type: 'table',
  repeatable: true,
  minRows,
  ...(help ? { help } : {}),
  columns,
});

/** En-tête de tous les rapports HSE : le projet suivi et le superviseur I2S. */
const HSE_PROJECT = (fields: unknown[] = []) =>
  hSection('project', 'Projet', [
    hc('project', 'Projet', 'text', { required: true }),
    hc('client', 'Maître d’ouvrage', 'ref', { required: true, autofill: 'client' }),
    hc('affairNumber', 'N° d’affaire', 'ref', { required: true, autofill: 'affairNumber', span: 4 }),
    hc('site', 'Site', 'ref', { required: true, autofill: 'site', span: 4 }),
    hc('supervisor', 'Superviseur HSE', 'ref', { required: true, autofill: 'inspector', span: 4 }),
    ...fields,
  ]);

/**
 * Échelle de notation du canevas journalier. La lecture de « TS » (très
 * satisfaisant) est une hypothèse : le canevas ne la définit pas.
 */
const NOTE_HSE = ['TS', 'S', 'I', 'SO'];
const NOTE_HSE_HELP = 'TS : très satisfaisant · S : satisfaisant · I : insuffisant · SO : sans objet. Toute note « I » appelle un constat dans le tableau ci-dessous.';

const STATUT_ACTION = ['Ouverte', 'En cours', 'Close'];

/**
 * Indicateurs de sécurité, sur la période et en cumul chantier. Les taux
 * ne sont pas calculés par le moteur : leur formule est rappelée.
 */
const hseIndicators = (periode: string) =>
  hSection(
    'indicators',
    'Indicateurs de sécurité',
    [
      ['dangerous', 'Situations dangereuses'],
      ['incidents', 'Incidents'],
      ['lostTime', 'Accidents avec arrêt'],
      ['noLostTime', 'Accidents sans arrêt'],
      ['lostDays', 'Nombre de jours d’arrêt'],
      ['firstAid', 'Soins'],
      ['commuting', 'Accidents de trajet ou de circulation'],
      ['frequencyRate', 'Taux de fréquence'],
      ['severityRate', 'Taux de gravité'],
    ].flatMap(([key, fr]) => [
      hc(`${key}Period`, `${fr} — ${periode}`, 'number', { decimals: key.endsWith('Rate') ? 2 : 0, span: 6 }),
      hc(`${key}Total`, `${fr} — cumul chantier`, 'number', { decimals: key.endsWith('Rate') ? 2 : 0, span: 6 }),
    ]),
    'conditions',
    'Taux de fréquence = accidents avec arrêt × 1 000 000 / heures travaillées · taux de gravité = jours d’arrêt × 1 000 / heures travaillées.',
  );

const HSE_PHOTOS = {
  key: 'photos',
  label: { fr: 'Photos chantier' },
  type: 'photos',
  repeatable: true,
  minRows: 0,
};

/* ── Blocs communs aux vérifications réglementaires EILM ──────────── */

/** Les rapports EILM ne font pas viser le client : inspecteur puis direction. */
const EILM_VISAS = {
  key: 'signatures',
  label: { fr: 'Visas' },
  type: 'signature-matrix',
  repeatable: false,
  signatories: [{ fr: 'Inspecteur' }, { fr: 'Direction' }],
};

const EILM_OBSERVATIONS = {
  key: 'observations',
  label: { fr: 'Observations' },
  type: 'text',
  repeatable: false,
  fields: [
    { key: 'observations', label: { fr: 'Observations' }, type: 'textarea', required: false, span: 12 },
  ],
};

/** Les trois issues réglementaires d'une vérification, mot pour mot. */
const EILM_CONCLUSION = {
  key: 'conclusion',
  label: { fr: 'Conclusion' },
  type: 'verdict',
  repeatable: false,
  help: 'Un seul point de contrôle non conforme interdit la conclusion « sans réserve ».',
  verdicts: [
    { fr: 'Appareil apte au service sans réserve' },
    { fr: 'Appareil apte au service avec réserves à lever' },
    { fr: 'Appareil inapte au service nécessitant l’arrêt' },
  ],
};

const EILM_PHOTOS = {
  key: 'photos',
  label: { fr: 'Photographies' },
  type: 'photos',
  repeatable: true,
  minRows: 0,
};

/**
 * Check-list pont roulant et portique : les dix groupes sont identiques dans
 * la vérification périodique (F40) et la mise ou remise en service (F39), à la
 * virgule près. Un seul jeu de points garantit que les deux rapports restent
 * comparables dans le temps pour un même appareil.
 *
 * `expected` ne porte que la valeur attendue imprimée au modèle. Là où le
 * modèle Word affiche un constat de terrain plutôt qu'un attendu (« Sans
 * objet », « Voir observations »), le point reste sans attendu : l'inspecteur
 * répond SO / NA / C / NC sans être orienté.
 *
 * Les groupes ne portent pas de précision figée : au modèle, « POUTRE
 * CAISSON » ou « CÂBLE IWRC » décrivent l'appareil d'une visite passée —
 * la cabine y était même « SANS OBJET ». Figés, ils feraient affirmer
 * « poutre caisson » au rapport d'un pont à treillis. Ces descriptifs sont
 * saisis dans la fiche de l'appareil (PONT_EQUIPMENT).
 */
const PONT_GROUPS = [
  {
    key: 'electrical',
    label: { fr: 'Installations électriques' },
    points: [
      { key: 'protection-live', label: { fr: 'Protection contre les contacts directs de l’appareil de levage et des charges avec les conducteurs nus sous tension' }, expected: 'Aspect général satisfaisant' },
      { key: 'lockable-isolator', label: { fr: 'Séparation générale verrouillable' }, expected: 'Bon fonctionnement' },
      { key: 'cabin-protection', label: { fr: 'Protection contre les contacts avec les pièces nues sous tension dans la cabine' }, expected: 'Aspect général satisfaisant' },
      { key: 'earthing', label: { fr: 'Mises à la terre des masses métalliques fixes ou mobiles' }, expected: 'Réalisées correctement' },
    ],
  },
  {
    key: 'runway',
    label: { fr: 'Châssis, support, chemin de roulement' },
    points: [
      { key: 'rails', label: { fr: 'Rails et poutres de roulement' }, expected: 'Aspect général satisfaisant' },
      { key: 'posts', label: { fr: 'Poteaux et corbeaux' }, expected: 'Aspect général satisfaisant' },
      { key: 'buffers', label: { fr: 'Butoirs amortisseurs' }, expected: 'En place, correctement fixés' },
    ],
  },
  {
    key: 'frame',
    label: { fr: 'Charpente' },
    points: [
      { key: 'framework', label: { fr: 'Ossature, plate-forme, support de charge' }, expected: 'Bon état de fonctionnement' },
      { key: 'counterweight', label: { fr: 'Contrepoids' }, expected: 'Sans défaut apparent' },
      { key: 'access', label: { fr: 'Accès intégrés' }, expected: 'Maintien en conformité' },
    ],
  },
  {
    key: 'cabin',
    label: { fr: 'Cabine et poste de conduite' },
    points: [
      { key: 'cabin-access', label: { fr: 'Accès' } },
      { key: 'cabin-floor', label: { fr: 'Constitution, fixation, planchers' } },
      { key: 'fall-protection', label: { fr: 'Protection contre les chutes de hauteur du poste de conduite' } },
      { key: 'visibility', label: { fr: 'Visibilité — vitrage, essuie-glace, rétroviseur' } },
      { key: 'extinguisher', label: { fr: 'Extincteur en cabine' } },
      { key: 'seat', label: { fr: 'Siège' } },
      { key: 'lighting', label: { fr: 'Éclairage cabine' } },
    ],
  },
  {
    key: 'suspension',
    label: { fr: 'Suspentes, poulies, dispositifs de préhension' },
    points: [
      { key: 'cables', label: { fr: 'Câbles et chaînes' }, expected: 'Sans défaut apparent' },
      { key: 'attachments', label: { fr: 'Attaches' }, expected: 'Correctement réalisées' },
      { key: 'pulleys', label: { fr: 'Poulies, noix, pignons, axes, tambours' }, expected: 'Bon état apparent' },
      { key: 'hook', label: { fr: 'Moufle et crochet' }, expected: 'Aspect général satisfaisant' },
    ],
  },
  {
    key: 'controls',
    label: { fr: 'Organes de service et de manœuvre' },
    points: [
      { key: 'control-identification', label: { fr: 'Identification et état des organes' } },
      { key: 'neutral-return', label: { fr: 'Retour au point neutre' }, expected: 'Assuré' },
      { key: 'involuntary', label: { fr: 'Protection contre les manœuvres involontaires' }, expected: 'Assurée' },
      { key: 'start-stop', label: { fr: 'Mise en marche, arrêt normal, sélecteur' }, expected: 'Fonctionne' },
      { key: 'emergency-stop', label: { fr: 'Autres arrêts accessibles (urgence)' }, expected: 'Fonctionne' },
      { key: 'horn', label: { fr: 'Avertisseur sonore ou lumineux' }, expected: 'Fonctionne' },
      { key: 'indicators', label: { fr: 'Indicateurs' }, expected: 'Bon état apparent' },
    ],
  },
  {
    key: 'hoisting',
    label: { fr: 'Mouvements concourant au levage' },
    points: [
      { key: 'hoist-mechanisms', label: { fr: 'Mécanismes' }, expected: 'Aspect satisfaisant des parties visibles sans démontage' },
      { key: 'hoist-guarding', label: { fr: 'Protection des organes mobiles' }, expected: 'Assurée par capotage des organes accessibles' },
      { key: 'service-brake', label: { fr: 'Frein de service' }, expected: 'Automatiquement serré, efficace à la charge d’essai' },
      { key: 'backup-brake', label: { fr: 'Frein de secours' } },
      { key: 'safety-brake', label: { fr: 'Frein de sécurité' } },
      { key: 'speed-limit', label: { fr: 'Limitation de la vitesse' }, expected: 'Dispositions constructives en état' },
      { key: 'upper-limit', label: { fr: 'Limiteur de course haut ou dispositif équivalent' }, expected: 'Bon fonctionnement' },
      { key: 'lower-limit', label: { fr: 'Limiteur de course bas ou dispositif équivalent' }, expected: 'Bon réglage avec le sol' },
      { key: 'hoist-overtravel', label: { fr: 'Dispositif hors course' } },
      { key: 'load-limiter', label: { fr: 'Limiteur de charge, limiteur de moment' } },
    ],
  },
  {
    key: 'travel',
    label: { fr: 'Mouvement de translation' },
    points: [
      { key: 'travel-mechanisms', label: { fr: 'Mécanismes' }, expected: 'Aspect satisfaisant des parties visibles sans démontage' },
      { key: 'travel-guarding', label: { fr: 'Protection des organes mobiles de transmission' }, expected: 'Assurée par capotage des organes accessibles' },
      { key: 'travel-brake', label: { fr: 'Frein du mouvement de translation' }, expected: 'Efficace à la charge d’essai' },
      { key: 'travel-limit', label: { fr: 'Limiteur de course' }, expected: 'Fonctionne' },
      { key: 'travel-overtravel', label: { fr: 'Dispositif hors course' } },
      { key: 'immobilisation', label: { fr: 'Immobilisation hors service' } },
      { key: 'anticollision', label: { fr: 'Anticollision' }, expected: 'En place et fonctionne' },
    ],
  },
  {
    key: 'traverse',
    label: { fr: 'Mouvement de direction et de distribution' },
    points: [
      { key: 'traverse-mechanisms', label: { fr: 'Mécanismes' }, expected: 'Aspect satisfaisant des parties visibles sans démontage' },
      { key: 'traverse-guarding', label: { fr: 'Protection des organes mobiles de transmission' }, expected: 'Assurée par capotage des organes accessibles' },
      { key: 'traverse-brake', label: { fr: 'Frein du mouvement de direction' }, expected: 'Efficace à la charge d’essai' },
      { key: 'traverse-limit', label: { fr: 'Limiteur de course' }, expected: 'Fonctionne' },
      { key: 'traverse-buffers', label: { fr: 'Butoirs, amortisseurs, rails' }, expected: 'Aspect satisfaisant des parties visibles sans démontage' },
    ],
  },
  {
    key: 'misc',
    label: { fr: 'Dispositions diverses' },
    points: [
      { key: 'load-display', label: { fr: 'Affichage des charges sur l’appareil' }, expected: 'Lisible du poste de conduite par le conducteur' },
      { key: 'safety-notice', label: { fr: 'Consignes de sécurité' }, expected: 'Apposées auprès de l’appareil' },
      { key: 'manual', label: { fr: 'Notice d’instruction, déclaration de conformité' }, expected: 'Existe' },
      { key: 'previous-tests', label: { fr: 'Épreuves et essais avant mise ou remise en service' }, expected: 'Réalisées' },
      { key: 'device-identification', label: { fr: 'Identification et repère de l’appareil' }, expected: 'Existe et affichée' },
      { key: 'special-equipment', label: { fr: 'Équipement particulier' } },
      { key: 'signal-lights', label: { fr: 'Feux de signalisation' } },
    ],
  },
];

/** Légende des réponses, rappelée en tête de chaque check-list EILM. */
const EILM_CHECKS_HELP = 'SO : sans objet · NA : non appliqué · C : conforme · NC : non conforme';

/* ── Vérification générale périodique des engins de chantier ──────── */

/**
 * En-tête de visite d'une vérification générale périodique : identique au mot
 * près sur tous les engins et appareils mobiles. Seuls les textes cités
 * changent — les engins de chantier relèvent des arrêtés de 2018, les
 * appareils de levage de l'arrêté viziriel de 1953.
 */
const vgpClientSection = (textes: string) => ({
  key: 'client',
  label: { fr: 'Références du client et circonstances de la visite' },
  type: 'keyvalue',
  repeatable: false,
  reference: `Textes de référence : ${textes}`,
  fields: [
    { key: 'establishment', label: { fr: 'Établissement' }, type: 'ref', required: true, autofill: 'client', span: 6 },
    { key: 'address', label: { fr: 'Adresse' }, type: 'text', required: false, span: 6 },
    { key: 'location', label: { fr: 'Lieu d’intervention' }, type: 'ref', required: true, autofill: 'site', span: 6 },
    { key: 'nature', label: { fr: 'Nature de l’intervention' }, type: 'enum', required: true, options: ['Vérification générale périodique (VGP)', 'Mise en service', 'Remise en service'], span: 6 },
    { key: 'inspector', label: { fr: 'Vérification réalisée par' }, type: 'ref', required: true, autofill: 'inspector', span: 4 },
    { key: 'date', label: { fr: 'Vérification réalisée le' }, type: 'date', required: true, autofill: 'date', span: 4 },
    { key: 'nextInspection', label: { fr: 'Prochaine vérification' }, type: 'date', required: false, span: 4 },
  ],
});

const ENGIN_CLIENT = vgpClientSection('arrêtés viziriels n° 1281-18 et n° 1282-18 du 15 mars 2018.');
const LEVAGE_CLIENT = vgpClientSection('arrêté viziriel du 09 septembre 1953.');

/**
 * Fiche de l'engin : un socle identique d'un modèle à l'autre, complété par
 * les caractéristiques propres à l'engin (pression, portée, puissance…).
 */
const enginEquipment = (specifiques: unknown[]) => ({
  key: 'equipment',
  label: { fr: 'Identification et caractéristiques de l’équipement' },
  type: 'keyvalue',
  repeatable: false,
  fields: [
    { key: 'designation', label: { fr: 'Désignation' }, type: 'text', required: true, span: 6 },
    { key: 'description', label: { fr: 'Description' }, type: 'textarea', required: false, span: 12 },
    { key: 'identification', label: { fr: 'N° d’identification' }, type: 'text', required: true, span: 4 },
    { key: 'manufacturer', label: { fr: 'Fabricant' }, type: 'text', required: true, span: 4 },
    ...specifiques,
    { key: 'year', label: { fr: 'Année de fabrication' }, type: 'number', required: false, decimals: 0, span: 4 },
  ],
});

/**
 * Fiche des appareils de levage mobiles : chariot télescopique, grue mobile et
 * chariot à mât portent la même, au champ près.
 */
const levageMobileEquipment = (uniteCapacite: string) => ({
  key: 'equipment',
  label: { fr: 'Identification et caractéristiques de l’équipement' },
  type: 'keyvalue',
  repeatable: false,
  fields: [
    { key: 'designation', label: { fr: 'Désignation' }, type: 'text', required: true, span: 6 },
    { key: 'description', label: { fr: 'Description' }, type: 'textarea', required: false, span: 12 },
    { key: 'attachment', label: { fr: 'Équipement' }, type: 'text', required: false, span: 6 },
    { key: 'suspension', label: { fr: 'Suspentes' }, type: 'text', required: false, span: 6 },
    { key: 'identification', label: { fr: 'N° d’identification' }, type: 'text', required: true, span: 4 },
    { key: 'manufacturer', label: { fr: 'Fabricant' }, type: 'text', required: true, span: 4 },
    { key: 'model', label: { fr: 'Modèle' }, type: 'text', required: false, span: 4 },
    // Une capacité en kilogrammes s'exprime en entiers, en tonnes au centième.
    { key: 'capacity', label: { fr: 'Capacité maximale d’utilisation' }, type: 'number', required: true, unit: uniteCapacite, decimals: uniteCapacite === 'kg' ? 0 : 2, span: 4 },
    { key: 'liftHeight', label: { fr: 'Hauteur maximale du levage' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 4 },
    { key: 'year', label: { fr: 'Année de fabrication' }, type: 'number', required: false, decimals: 0, span: 4 },
    { key: 'reach', label: { fr: 'Portée maximale' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 4 },
  ],
});

/**
 * Groupe « équipements et mécanismes » des engins portant des fourches :
 * repris tel quel sur la pelle, le compresseur, le chariot télescopique et la
 * grue mobile. « État des suspentes » y chapeaute les trois points suivants.
 */
const MECANISMES_FOURCHES = {
  key: 'mechanisms',
  label: { fr: 'Équipements et mécanismes' },
  points: [
    { key: 'electrical-circuit', label: { fr: 'Circuit électrique' } },
    { key: 'hydraulic-circuit', label: { fr: 'Circuit hydraulique' } },
    { key: 'suspension-chain', label: { fr: 'État des suspentes — chaîne' } },
    { key: 'suspension-cable', label: { fr: 'État des suspentes — câble' } },
    { key: 'suspension-limits', label: { fr: 'État des suspentes — limiteurs de fin de course' } },
    { key: 'travel-speed', label: { fr: 'Vitesse de déplacement' } },
    { key: 'braking-circuit', label: { fr: 'Circuit de freinage' } },
    { key: 'tyres', label: { fr: 'Pneumatiques' } },
    { key: 'wheels', label: { fr: 'Roues et chenilles' } },
    { key: 'guarding', label: { fr: 'Capotage' } },
    { key: 'accessories', label: { fr: 'Accessoires' } },
    { key: 'forks', label: { fr: 'Fourches' } },
  ],
};

/** Translation et direction réunies : même groupe sur les chariots et grues mobiles. */
const TRANSLATION_DIRECTION = {
  key: 'travel',
  label: { fr: 'Mouvement de translation et de direction' },
  points: [
    { key: 'travel-mechanisms', label: { fr: 'Mécanismes' } },
    { key: 'travel-guarding', label: { fr: 'Protection des organes mobiles' } },
    { key: 'travel-brake', label: { fr: 'Frein du mouvement de translation' } },
    { key: 'steering-brake', label: { fr: 'Frein du mouvement de direction' } },
    { key: 'parking-brake', label: { fr: 'Frein de stationnement' } },
  ],
};

/** Poste de conduite : mêmes quatre points sur tous les engins. */
const enginCabine = (supplements: unknown[] = []) => ({
  key: 'cabin',
  label: { fr: 'Cabine' },
  points: [
    { key: 'window', label: { fr: 'Vitre' } },
    { key: 'mirror', label: { fr: 'Rétroviseur' } },
    { key: 'wiper', label: { fr: 'Essuie-glace' } },
    { key: 'seat', label: { fr: 'Siège du conducteur' } },
    ...supplements,
  ],
});

/** Équipements de sécurité : liste identique sur tous les engins. */
const ENGIN_SECURITE = {
  key: 'safety',
  label: { fr: 'Système de sécurité' },
  points: [
    { key: 'horn', label: { fr: 'Klaxon' } },
    { key: 'beacon', label: { fr: 'Gyrophare' } },
    { key: 'signal-lights', label: { fr: 'Feux de signalisation' } },
    { key: 'extinguisher', label: { fr: 'Extincteur' } },
    { key: 'emergency-stop', label: { fr: 'Arrêt d’urgence' } },
  ],
};

/**
 * Check-list d'un engin.
 *
 * Aucun point ne porte de valeur attendue : sur ces modèles, la seconde
 * colonne du document Word est une saisie de terrain d'un rapport passé
 * (« / », « Sur lieu de travail », « Sans objet »), pas un attendu imprimé
 * comme sur les rapports de levage. L'inspecteur répond SO / NA / C / NC.
 */
const enginChecks = (groups: unknown[]) => ({
  key: 'checks',
  label: { fr: 'Examen de l’appareil et de ses équipements' },
  type: 'checklist',
  repeatable: false,
  help: EILM_CHECKS_HELP,
  groups,
});

/* ── Accessoires de levage et équipements simples ─────────────────── */

/**
 * « Références client » des accessoires : plus court que l'en-tête des
 * appareils, il ajoute la ville et l'interlocuteur rencontré sur place. Selon
 * le modèle, l'une ou l'autre manque, et l'échafaudage fixe ajoute la nature
 * des travaux : chaque variante reste superposable à son modèle Word.
 */
const accessoireClient = (
  textes: string,
  { ville = true, interlocuteur = true, champs = [] as unknown[] } = {},
) => ({
  key: 'client',
  label: { fr: 'Références client' },
  type: 'keyvalue',
  repeatable: false,
  reference: `Référence réglementaire : ${textes}`,
  fields: [
    { key: 'establishment', label: { fr: 'Établissement' }, type: 'ref', required: true, autofill: 'client', span: 6 },
    { key: 'address', label: { fr: 'Adresse' }, type: 'text', required: false, span: 6 },
    ...(ville ? [{ key: 'city', label: { fr: 'Ville' }, type: 'text', required: false, span: 4 }] : []),
    { key: 'nature', label: { fr: 'Nature de la vérification' }, type: 'enum', required: true, options: ['Vérification générale périodique', 'Mise en service', 'Remise en service'], span: 4 },
    { key: 'location', label: { fr: 'Lieu d’intervention' }, type: 'ref', required: true, autofill: 'site', span: 4 },
    ...(interlocuteur
      ? [{ key: 'contact', label: { fr: 'Interlocuteur sur place' }, type: 'text', required: false, span: 4 }]
      : []),
    ...champs,
    { key: 'date', label: { fr: 'Date de la vérification' }, type: 'date', required: true, autofill: 'date', span: 4 },
    { key: 'nextInspection', label: { fr: 'Prochaine vérification' }, type: 'date', required: false, span: 4 },
  ],
});

const ARRETE_1953_CODE_TRAVAIL =
  'Arrêté viziriel du 09/09/1953, Code du travail marocain, art. 281 et 282 (maintien en état des équipements).';
const CODE_TRAVAIL = 'Code du travail marocain, art. 281 et 282 (maintien en état des équipements).';

/** Fiche d'un accessoire : désignation imprimée au modèle, puis ses caractéristiques. */
const accessoireEquipment = (champs: unknown[]) => ({
  key: 'equipment',
  label: { fr: 'Identification de l’équipement' },
  type: 'keyvalue',
  repeatable: false,
  fields: [
    { key: 'designation', label: { fr: 'Désignation' }, type: 'textarea', required: true, span: 12 },
    ...champs,
    { key: 'year', label: { fr: 'Année de fabrication' }, type: 'number', required: false, decimals: 0, span: 4 },
  ],
});

/**
 * Les modèles d'accessoires n'ont qu'un cadre libre « Observations et
 * conclusion ». La conclusion y est structurée avec les trois issues
 * réglementaires, comme sur les appareils : sans cela, un accessoire inapte
 * ne serait repérable qu'en relisant le texte de chaque rapport.
 */
const ACCESSOIRE_FIN = [EILM_OBSERVATIONS, EILM_CONCLUSION, EILM_PHOTOS, EILM_VISAS];

/* ── Échafaudages et plateformes roulantes ────────────────────────── */

/**
 * Check-list commune à l'échafaudage roulant, à la plateforme individuelle
 * roulante et à l'échafaudage fixe : mêmes quatre rubriques, mêmes points.
 * Seul l'intitulé du second document de montage change — l'échafaudage fixe
 * exige des notes de calcul en plus des plans.
 *
 * Aucun attendu : les réponses imprimées diffèrent d'un modèle à l'autre
 * (« Affichée », « En place », « Présentée »), ce sont des saisies passées.
 */
const echafaudageChecks = (documentMontage: string) => ({
  key: 'checks',
  label: { fr: 'Vérification et inspection' },
  type: 'checklist',
  repeatable: false,
  help: EILM_CHECKS_HELP,
  groups: [
    {
      key: 'documents',
      label: { fr: 'Montage et installation — documents relatifs au montage et à l’installation' },
      points: [
        { key: 'assembly-manual', label: { fr: 'Notice de montage' } },
        { key: 'assembly-plans', label: { fr: documentMontage } },
      ],
    },
    {
      key: 'assembly',
      label: { fr: 'Montage et installation — examen relatif au montage' },
      points: [
        { key: 'structure', label: { fr: 'Structure' } },
        { key: 'support', label: { fr: 'Appui, ancrage, stabilité' } },
        { key: 'floors', label: { fr: 'Planchers, garde-corps' } },
        { key: 'access', label: { fr: 'Accès' } },
        { key: 'lifting-device', label: { fr: 'Appareil de levage' } },
      ],
    },
    {
      key: 'installation',
      label: { fr: 'Montage et installation — examen relatif à l’installation' },
      points: [
        { key: 'clearance', label: { fr: 'Distance aux éléments environnants' } },
        { key: 'lightning', label: { fr: 'Protection contre la foudre' } },
        { key: 'passers-by', label: { fr: 'Protection des passants sur la voie publique' } },
        { key: 'impacts', label: { fr: 'Protection contre les heurts par véhicules ou engins' } },
        { key: 'signage', label: { fr: 'Signalisation' } },
        { key: 'notices', label: { fr: 'Affichage' } },
      ],
    },
    {
      key: 'condition',
      label: { fr: 'Examen de l’état de conservation' },
      points: [
        { key: 'state-structure', label: { fr: 'Structure' } },
        { key: 'state-wedging', label: { fr: 'Calage' } },
        { key: 'state-floors', label: { fr: 'Planchers, garde-corps' } },
        { key: 'state-access', label: { fr: 'Accès' } },
        { key: 'state-passers-by', label: { fr: 'Protection des passants' } },
        { key: 'state-lightning', label: { fr: 'Protection contre la foudre' } },
        { key: 'state-impacts', label: { fr: 'Protection contre les heurts' } },
        { key: 'state-signage', label: { fr: 'Signalisation' } },
        { key: 'state-notices', label: { fr: 'Affichage' } },
        { key: 'conditions-of-use', label: { fr: 'Conditions d’utilisation' } },
      ],
    },
  ],
});

/* ── Ascenseurs et monte-charges ──────────────────────────────────── */

/**
 * Constatations d'ascenseur : dix groupes de la gaine à la machine, repris à
 * l'identique par la vérification périodique (F12) et la mise en service
 * (F34). « Sans objet » et « non testé » restent des réponses, pas des
 * attendus ; les descriptifs de tête de groupe sont dans les caractéristiques.
 */
const ASCENSEUR_CHECKS = {
  key: 'checks',
  label: { fr: 'Constatations' },
  type: 'checklist',
  repeatable: false,
  help: EILM_CHECKS_HELP,
  groups: [
    {
      key: 'shaft',
      label: { fr: 'Gaine' },
      points: [
        { key: 'shaft-walls', label: { fr: 'Parois de protection' }, expected: 'Sans défaut apparent' },
        { key: 'shaft-doors', label: { fr: 'Panneau, porte, portillon, visite de secours' }, expected: 'Réalisation, état, fonctionnement corrects' },
        { key: 'shaft-toe-guards', label: { fr: 'Garde-pieds, seuils' }, expected: 'État satisfaisant' },
        { key: 'pit-access', label: { fr: 'Moyens d’accès à la cuvette' }, expected: 'Sans défaut apparent' },
        { key: 'pit', label: { fr: 'Cuvette' }, expected: 'État satisfaisant' },
        { key: 'pit-stop', label: { fr: 'Dispositif d’arrêt en cuvette' }, expected: 'Bon état et fonctionne correctement' },
        { key: 'buffers', label: { fr: 'Amortisseurs, socles, butées' }, expected: 'Bon état et fonctionne correctement' },
        { key: 'guides', label: { fr: 'Éléments de guidage' }, expected: 'Fixation sans défaut apparent' },
      ],
    },
    {
      key: 'landings',
      label: { fr: 'Équipement des paliers' },
      points: [
        { key: 'landing-lighting', label: { fr: 'Éclairage' }, expected: 'Fonctionne' },
        { key: 'landing-signals', label: { fr: 'Signalisation' }, expected: 'Fonctionne' },
        { key: 'landing-display', label: { fr: 'Affichage' }, expected: 'En bon état' },
        { key: 'firefighter', label: { fr: 'Manœuvre pompier' } },
      ],
    },
    {
      key: 'landing-doors',
      label: { fr: 'Portes palières' },
      points: [
        { key: 'landing-door-parts', label: { fr: 'Éléments constitutifs' }, expected: 'État satisfaisant' },
        { key: 'landing-locks', label: { fr: 'Serrures et dispositifs de verrouillage' }, expected: 'Bon fonctionnement' },
        { key: 'landing-closing', label: { fr: 'Condamnation électrique, contrôle de fermeture' }, expected: 'Bon fonctionnement' },
      ],
    },
    {
      key: 'suspension',
      label: { fr: 'Organes de suspension' },
      points: [
        { key: 'suspension-type', label: { fr: 'Caractéristiques' }, expected: 'Type adapté' },
        { key: 'suspension-state', label: { fr: 'État général' }, expected: 'Sans défaut apparent' },
        { key: 'attachments', label: { fr: 'Attaches' }, expected: 'Correctement réalisées, sans défaut apparent' },
        { key: 'pulleys', label: { fr: 'Poulies, pignons' }, expected: 'Sans défaut apparent' },
        { key: 'ram', label: { fr: 'Vérin — état' } },
      ],
    },
    {
      key: 'cabin',
      label: { fr: 'Cabine' },
      points: [
        { key: 'cabin-parts', label: { fr: 'Éléments constitutifs' }, expected: 'État satisfaisant' },
        { key: 'emergency-hatches', label: { fr: 'Trappes de secours' } },
        { key: 'emergency-doors', label: { fr: 'Portes de secours' } },
        { key: 'service-face', label: { fr: 'Face de service' }, expected: 'Sans jeu excessif' },
        { key: 'cabin-toe-guard', label: { fr: 'Garde-pieds' }, expected: 'Dispositions satisfaisantes' },
        { key: 'cabin-doors', label: { fr: 'Portes de cabine' }, expected: 'Sans défaut apparent' },
        { key: 'cabin-lock', label: { fr: 'Dispositif de verrouillage' }, expected: 'Réalisation correcte, essais satisfaisants' },
        { key: 'cabin-closing', label: { fr: 'Contrôle de fermeture' }, expected: 'En place et fonctionne correctement' },
        { key: 'cabin-lighting', label: { fr: 'Éclairage normal de la cabine' }, expected: 'En place et fonctionne correctement' },
        { key: 'cabin-display', label: { fr: 'Affichage' }, expected: 'Bon état' },
        { key: 'cabin-stop', label: { fr: 'Dispositif d’arrêt en cabine' }, expected: 'Bon état' },
        { key: 'door-reopening', label: { fr: 'Dispositif de réouverture de porte' }, expected: 'En place, essai satisfaisant' },
        { key: 'roof-stop', label: { fr: 'Dispositif d’arrêt sur le toit' }, expected: 'En place et fonctionne correctement' },
      ],
    },
    {
      key: 'counterweight',
      label: { fr: 'Contrepoids' },
      points: [
        { key: 'counterweight-parts', label: { fr: 'Éléments constitutifs' }, expected: 'Sans défaut apparent' },
      ],
    },
    {
      key: 'compensation',
      label: { fr: 'Organe de compensation' },
      points: [
        { key: 'compensation-parts', label: { fr: 'Éléments constitutifs' } },
      ],
    },
    {
      key: 'safety',
      label: { fr: 'Dispositifs de sécurité' },
      points: [
        { key: 'cabin-safety-gear', label: { fr: 'Parachute de cabine' }, expected: 'Dispositif constructif' },
        { key: 'counterweight-safety-gear', label: { fr: 'Parachute de contrepoids' } },
        { key: 'ascending-overspeed', label: { fr: 'Dispositif contre la vitesse excessive en montée' }, expected: 'Dispositif constructif en état' },
        { key: 'uncontrolled-movement', label: { fr: 'Dispositif contre le mouvement incontrôlé' }, expected: 'Dispositif constructif en état' },
        { key: 'overspeed-governor', label: { fr: 'Limiteur de vitesse' }, expected: 'Dispositif constructif en état' },
        { key: 'hydraulic-creep', label: { fr: 'Dispositif s’opposant à la dérive — appareil hydraulique' } },
        { key: 'maintenance-lock', label: { fr: 'Verrouillage de la cabine (maintenance)' } },
        { key: 'maintenance-stop', label: { fr: 'Butée de la cabine (maintenance)' } },
        { key: 'slack-rope', label: { fr: 'Contrôle de rupture ou de mou de suspente' } },
        { key: 'link', label: { fr: 'Organe de liaison' }, expected: 'Sans défaut apparent' },
        { key: 'overtravel', label: { fr: 'Hors course' }, expected: 'Sans défaut apparent' },
      ],
    },
    {
      key: 'machine-room',
      label: { fr: 'Locaux de la machine et des poulies' },
      points: [
        { key: 'room-access', label: { fr: 'Accès aux locaux' } },
        { key: 'floor', label: { fr: 'Sol' } },
        { key: 'inner-access', label: { fr: 'Accès à l’intérieur du local' } },
        { key: 'main-switch', label: { fr: 'Interrupteur de force motrice' }, expected: 'En place, bon fonctionnement' },
        { key: 'room-lighting', label: { fr: 'Éclairage normal et de secours' } },
        { key: 'pulley-stop', label: { fr: 'Interrupteur d’arrêt du local des poulies' }, expected: 'Réalisation correcte, bon état, fonctionne correctement' },
      ],
    },
    {
      key: 'machine',
      label: { fr: 'Machine' },
      points: [
        { key: 'machine', label: { fr: 'Machine' }, expected: 'Sans défaut apparent' },
        { key: 'manual-rescue', label: { fr: 'Manœuvre de secours manuelle' }, expected: 'Réalisation correcte, sans défaut apparent, fonctionnement satisfaisant' },
        { key: 'electric-recall', label: { fr: 'Manœuvre électrique de rappel' } },
        { key: 'switchgear', label: { fr: 'Appareillage électrique' }, expected: 'Sans défaut apparent' },
      ],
    },
  ],
};

/**
 * En-tête de visite pont roulant. Seuls les textes réglementaires cités
 * changent d'un modèle à l'autre : la périodique ne vise qu'un arrêté, la mise
 * en service en vise deux.
 */
const pontClientSection = (textes: string) => ({
  key: 'client',
  label: { fr: 'Références du client et circonstances de la visite' },
  type: 'keyvalue',
  repeatable: false,
  reference: `Textes de référence : ${textes}`,
  fields: [
    { key: 'establishment', label: { fr: 'Établissement' }, type: 'ref', required: true, autofill: 'client', span: 6 },
    { key: 'address', label: { fr: 'Adresse' }, type: 'text', required: false, span: 6 },
    { key: 'location', label: { fr: 'Lieu d’intervention' }, type: 'ref', required: true, autofill: 'site', span: 6 },
    { key: 'nature', label: { fr: 'Nature de l’intervention' }, type: 'enum', required: true, options: ['Vérification réglementaire périodique', 'Mise en service', 'Remise en service'], span: 6 },
    { key: 'date', label: { fr: 'Date de vérification' }, type: 'date', required: true, autofill: 'date', span: 6 },
  ],
});

/** Caractéristiques de l'appareil : même fiche dans les deux rapports pont. */
const PONT_EQUIPMENT = {
  key: 'equipment',
  label: { fr: 'Identification et caractéristiques de l’équipement' },
  type: 'keyvalue',
  repeatable: false,
  fields: [
    { key: 'designation', label: { fr: 'Désignation' }, type: 'text', required: true, span: 6 },
    { key: 'description', label: { fr: 'Description' }, type: 'textarea', required: false, span: 12 },
    { key: 'manufacturer', label: { fr: 'Constructeur' }, type: 'text', required: true, span: 4 },
    { key: 'identification', label: { fr: 'N° d’identification' }, type: 'text', required: true, span: 4 },
    { key: 'type', label: { fr: 'Type' }, type: 'text', required: false, span: 4 },
    { key: 'span', label: { fr: 'Portée' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 4 },
    { key: 'liftHeight', label: { fr: 'Hauteur de levage sous crochet' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 4 },
    { key: 'capacity', label: { fr: 'Capacité maximale d’utilisation' }, type: 'number', required: true, unit: 't', decimals: 2, span: 4 },
    { key: 'year', label: { fr: 'Année de fabrication' }, type: 'number', required: false, decimals: 0, span: 4 },
    // Descriptifs portés au modèle en tête de chaque groupe de contrôle.
    { key: 'electricalSupply', label: { fr: 'Alimentation électrique' }, type: 'text', required: false, span: 4 },
    { key: 'runwayType', label: { fr: 'Châssis et chemin de roulement' }, type: 'text', required: false, span: 4 },
    { key: 'frameType', label: { fr: 'Charpente' }, type: 'text', required: false, span: 4 },
    { key: 'cabin', label: { fr: 'Cabine et poste de conduite' }, type: 'text', required: false, span: 4 },
    { key: 'suspensionType', label: { fr: 'Suspentes' }, type: 'text', required: false, span: 4 },
    { key: 'controlType', label: { fr: 'Organes de service' }, type: 'text', required: false, span: 4 },
    { key: 'hoistDrive', label: { fr: 'Motorisation du levage' }, type: 'text', required: false, span: 4 },
    { key: 'travelDrive', label: { fr: 'Motorisation de la translation' }, type: 'text', required: false, span: 4 },
    { key: 'traverseDrive', label: { fr: 'Motorisation de la direction' }, type: 'text', required: false, span: 4 },
  ],
};

const PONT_CHECKS = {
  key: 'checks',
  label: { fr: 'Vérifications et inspections de l’appareil et de ses aménagements' },
  type: 'checklist',
  repeatable: false,
  help: EILM_CHECKS_HELP,
  groups: PONT_GROUPS,
};

export const TEMPLATES: TemplateSeed[] = [
  /* ═══════════════════════════════════════════════════════════════
   *  PR01-F02 — ULTRASONS (paradigme « mesures »)
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR01-F02',
    version: '00',
    title: 'Rapport d’examen par ultrasons',
    titleEn: 'Report of ultrasonic examination',
    methodCode: 'UT',
    paradigm: 'MEASUREMENT',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        END_HEADER,
        {
          key: 'equipment',
          label: { fr: 'Matériel utilisé', en: 'Equipment used' },
          type: 'devices',
          repeatable: false,
          minRows: 1,
          help: 'Un appareil hors étalonnage à la date de l’essai empêche la soumission du rapport.',
          fields: [
            { key: 'device', label: { fr: 'Poste US', en: 'UT set' }, type: 'device', required: true, span: 12 },
          ],
        },
        {
          key: 'transducers',
          label: { fr: 'Traducteurs', en: 'Transducers' },
          type: 'table',
          repeatable: true,
          minRows: 1,
          maxRows: 8,
          columns: [
            { key: 'waves', label: { fr: 'Ondes', en: 'Waves' }, type: 'enum', required: true, options: ['L', 'T', 'TR', 'Q', 'Autre'], span: 2 },
            { key: 'brand', label: { fr: 'Marque', en: 'Trade mark' }, type: 'text', required: true, span: 2 },
            { key: 'reference', label: { fr: 'Référence et n°', en: 'Reference and Nr' }, type: 'text', required: true, span: 3 },
            { key: 'crystal', label: { fr: 'Élément', en: 'Crystal' }, type: 'text', required: false, span: 2 },
            { key: 'angle', label: { fr: 'Angle', en: 'Angle' }, type: 'enum', required: true, options: ['0°', '45°', '60°', '70°'], span: 1 },
            { key: 'frequency', label: { fr: 'Fréquence', en: 'Frequency' }, type: 'number', required: true, unit: 'MHz', decimals: 1, span: 1 },
            { key: 'dimensions', label: { fr: 'Dimensions', en: 'Dimensions' }, type: 'text', required: false, span: 1 },
          ],
        },
        {
          key: 'conditions',
          label: { fr: 'Conditions d’examen', en: 'Operating conditions' },
          type: 'conditions',
          repeatable: false,
          fields: [
            { key: 'surface', label: { fr: 'État de surface', en: 'Surface condition' }, type: 'enum', required: true, options: ['Brut', 'Brossé', 'Autre'], span: 3 },
            { key: 'couplant', label: { fr: 'Produit de couplage', en: 'Couplant' }, type: 'enum', required: true, options: ['Huile', 'Graisse', 'Autre'], span: 3 },
            { key: 'direction', label: { fr: 'Sens de sondage', en: 'Scanning direction' }, type: 'enum', required: true, options: ['Périphérie', 'Quadrillage', 'Autre'], span: 3 },
            { key: 'extent', label: { fr: 'Étendue du sondage', en: 'Extent of scanning' }, type: 'enum', required: true, options: ['Total', 'Partiel', 'Autre'], span: 3 },
          ],
        },
        {
          key: 'calibration',
          label: { fr: 'Étalonnage', en: 'Calibration' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'block', label: { fr: 'Bloc d’étalonnage', en: 'Calibration block' }, type: 'text', required: true, span: 3 },
            { key: 'referenceBlock', label: { fr: 'Bloc de référence n°', en: 'Reference block' }, type: 'text', required: false, span: 3 },
            { key: 'hole', label: { fr: 'Trou', en: 'Hole' }, type: 'text', required: false, span: 2 },
            { key: 'notch', label: { fr: 'Entaille', en: 'Notch' }, type: 'text', required: false, span: 2 },
            { key: 'other', label: { fr: 'Autre', en: 'Other' }, type: 'text', required: false, span: 2 },
          ],
        },
        {
          key: 'settings',
          label: { fr: 'Réglages de l’appareil', en: 'Equipment calibration' },
          type: 'table',
          repeatable: true,
          minRows: 1,
          columns: [
            { key: 'transducer', label: { fr: 'Traducteur', en: 'Transducer' }, type: 'text', required: true, span: 2 },
            { key: 'range', label: { fr: 'Distance', en: 'Range' }, type: 'number', required: true, unit: 'mm', span: 2 },
            { key: 'gain', label: { fr: 'Gain', en: 'Gain' }, type: 'number', required: true, unit: 'dB', decimals: 1, span: 2 },
            { key: 'transfer', label: { fr: 'Transfert', en: 'Correcting transfer' }, type: 'number', required: false, unit: 'dB', decimals: 1, span: 2 },
            { key: 'evaluation', label: { fr: 'Évaluation', en: 'Evaluation' }, type: 'number', required: false, unit: 'dB', decimals: 1, span: 2 },
            { key: 'detection', label: { fr: 'Détection', en: 'Detection' }, type: 'number', required: false, unit: 'dB', decimals: 1, span: 2 },
          ],
        },
        {
          key: 'results',
          label: { fr: 'Résultats de l’interprétation', en: 'Interpretation results' },
          type: 'table',
          repeatable: true,
          minRows: 0,
          help: 'Chaque ligne devient une indication exploitable, transformable en non-conformité.',
          columns: [
            { key: 'mark', label: { fr: 'Repère pièce ou soudure', en: 'Mark of part or weld' }, type: 'text', required: true, span: 2 },
            { key: 'indication', label: { fr: 'N° d’indication', en: 'Indication N°' }, type: 'text', required: true, span: 1 },
            { key: 'probeAngle', label: { fr: 'Angle traducteur', en: 'Angle probe' }, type: 'enum', required: true, options: ['0°', '45°', '60°', '70°'], span: 1 },
            { key: 'probePosition', label: { fr: 'Position traducteur', en: 'Probe position' }, type: 'text', required: false, span: 2 },
            { key: 'x', label: { fr: 'X', en: 'X' }, type: 'number', required: true, unit: 'mm', span: 1 },
            { key: 'y', label: { fr: 'Y', en: 'Y' }, type: 'number', required: true, unit: 'mm', span: 1 },
            { key: 'z', label: { fr: 'Z', en: 'Z' }, type: 'number', required: true, unit: 'mm', span: 1 },
            { key: 'amplitude', label: { fr: 'Hd/Hr', en: 'Hd/Hr' }, type: 'number', required: false, unit: 'dB', decimals: 1, span: 1 },
            { key: 'decision', label: { fr: 'Décision', en: 'Decision' }, type: 'enum', required: true, options: ['V', 'NV', 'C', 'NC'], span: 2 },
          ],
        },
        {
          key: 'photos',
          label: { fr: 'Photographies', en: 'Photographs' },
          type: 'photos',
          repeatable: true,
          minRows: 0,
        },
        END_SIGNATURES,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F40 — PONT ROULANT (paradigme « check-list »)
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F40',
    version: '00',
    title: 'Rapport de vérification périodique — pont roulant ou portique',
    methodCode: 'LIFT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        pontClientSection('Arrêté viziriel du 09 septembre 1953.'),
        PONT_EQUIPMENT,
        PONT_CHECKS,
        EILM_OBSERVATIONS,
        EILM_CONCLUSION,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F39 — MISE OU REMISE EN SERVICE PONT ROULANT
   *
   *  Même appareil et même check-list que la vérification périodique, mais
   *  une mise en service exige en plus les épreuves de charge : c'est le seul
   *  écart entre les deux modèles.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F39',
    version: '00',
    title: 'Rapport de vérification de mise ou remise en service — pont roulant ou portique',
    methodCode: 'LIFT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        pontClientSection('Arrêté viziriel du 09 septembre 1953 et arrêté viziriel du 03 novembre 1953.'),
        PONT_EQUIPMENT,
        PONT_CHECKS,
        {
          key: 'tests',
          label: { fr: 'Compte rendu des épreuves' },
          type: 'table',
          repeatable: true,
          minRows: 1,
          help: 'Épreuve statique avec coefficient de surcharge, puis épreuve dynamique à 110 % sur trois cycles.',
          columns: [
            { key: 'kind', label: { fr: 'Nature de l’épreuve' }, type: 'enum', required: true, options: ['Épreuve statique', 'Épreuve dynamique'], span: 3 },
            { key: 'load', label: { fr: 'Charge appliquée' }, type: 'number', required: true, unit: 'kg', decimals: 0, span: 2 },
            { key: 'span', label: { fr: 'Portée' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 2 },
            { key: 'height', label: { fr: 'Hauteur' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 1 },
            { key: 'overload', label: { fr: 'Coefficient de surcharge' }, type: 'number', required: true, unit: '%', decimals: 0, span: 2 },
            { key: 'position', label: { fr: 'Position de l’appareil' }, type: 'text', required: false, span: 2 },
          ],
        },
        {
          key: 'testResults',
          label: { fr: 'Résultats des épreuves' },
          type: 'text',
          repeatable: false,
          fields: [
            { key: 'configuration', label: { fr: 'Configuration lors des épreuves' }, type: 'textarea', required: false, span: 12 },
            { key: 'results', label: { fr: 'Résultats des épreuves' }, type: 'textarea', required: true, span: 12 },
          ],
        },
        EILM_OBSERVATIONS,
        EILM_CONCLUSION,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F38 — CHARIOT DE MANUTENTION À MÂT
   *
   *  Check-list propre au chariot : six groupes numérotés au modèle, dont les
   *  mouvements de translation et de direction sont réunis, contrairement au
   *  pont roulant qui les traite séparément.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F38',
    version: '00',
    title: 'Rapport de vérification périodique — chariot de manutention à mât',
    methodCode: 'LIFT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'client',
          label: { fr: 'Références du client et circonstances de la visite' },
          type: 'keyvalue',
          repeatable: false,
          reference: 'Texte de référence : Arrêté viziriel du 09 septembre 1953.',
          fields: [
            { key: 'establishment', label: { fr: 'Établissement' }, type: 'ref', required: true, autofill: 'client', span: 6 },
            { key: 'address', label: { fr: 'Adresse' }, type: 'text', required: false, span: 6 },
            { key: 'location', label: { fr: 'Lieu d’intervention' }, type: 'ref', required: true, autofill: 'site', span: 6 },
            { key: 'inspector', label: { fr: 'Inspecteur chargé de mission' }, type: 'ref', required: true, autofill: 'inspector', span: 6 },
            { key: 'date', label: { fr: 'Date de réalisation' }, type: 'date', required: true, autofill: 'date', span: 4 },
            { key: 'nature', label: { fr: 'Nature de l’intervention' }, type: 'enum', required: true, options: ['Vérification réglementaire périodique', 'Mise en service', 'Remise en service'], span: 4 },
            { key: 'nextInspection', label: { fr: 'Prochaine vérification' }, type: 'date', required: false, span: 4 },
          ],
        },
        levageMobileEquipment('kg'),
        {
          key: 'checks',
          label: { fr: 'Examen de l’appareil et de ses équipements' },
          type: 'checklist',
          repeatable: false,
          help: EILM_CHECKS_HELP,
          groups: [
            {
              key: 'mechanisms',
              label: { fr: 'Équipements et mécanismes' },
              points: [
                { key: 'electrical-circuit', label: { fr: 'Circuit électrique' }, expected: 'Aspect général satisfaisant' },
                { key: 'lines', label: { fr: 'Équipements, canalisations, enrouleurs' }, expected: 'Aspect général satisfaisant' },
                { key: 'hydraulic-circuit', label: { fr: 'Circuit hydraulique' }, expected: 'Aspect général satisfaisant' },
                { key: 'chassis', label: { fr: 'Châssis, traverses, longerons' }, expected: 'Sans défaut apparent' },
                // « État des suspentes » chapeaute au modèle les deux points
                // suivants : c'est un intertitre, pas un point à renseigner.
                { key: 'suspension-chain', label: { fr: 'État des suspentes — chaîne' }, expected: 'Sans défaut apparent' },
                { key: 'suspension-limits', label: { fr: 'État des suspentes — limiteurs de fin de course' }, expected: 'Sans défaut apparent' },
                { key: 'speed-limit', label: { fr: 'Limitation de vitesse de déplacement' }, expected: 'Dispositions constructives en état' },
                { key: 'batteries', label: { fr: 'Batteries' }, expected: 'Bon état apparent' },
                { key: 'framework', label: { fr: 'Ossature, plate-forme, support de charge' }, expected: 'Sans défaut apparent' },
                { key: 'counterweight', label: { fr: 'Contrepoids' }, expected: 'Sans défaut apparent' },
                { key: 'forks', label: { fr: 'Fourches' }, expected: 'Sans défaut apparent' },
              ],
            },
            {
              key: 'hoisting',
              label: { fr: 'Mouvement concourant au levage' },
              points: [
                { key: 'hoist-mechanisms', label: { fr: 'Mécanismes' }, expected: 'Aspect satisfaisant des parties visibles sans démontage' },
                { key: 'hoist-guarding', label: { fr: 'Protection des organes mobiles' }, expected: 'Assurée par capotage' },
                { key: 'load-limiter', label: { fr: 'Limiteur de charge, limiteur de moment' } },
                { key: 'service-brake', label: { fr: 'Frein de service' }, expected: 'Fonctionne à la charge d’essai' },
                { key: 'course-limits', label: { fr: 'Limiteurs de course haut et bas' }, expected: 'Fonctionne' },
              ],
            },
            {
              key: 'travel',
              label: { fr: 'Mouvement de translation et de direction' },
              points: [
                { key: 'travel-mechanisms', label: { fr: 'Mécanismes' }, expected: 'Aspect satisfaisant des parties visibles sans démontage' },
                { key: 'travel-guarding', label: { fr: 'Protection des organes mobiles' }, expected: 'Assurée par capotage' },
                { key: 'travel-brake', label: { fr: 'Frein du mouvement de translation' }, expected: 'Fonctionne' },
                { key: 'steering-brake', label: { fr: 'Frein du mouvement de direction' }, expected: 'Fonctionne' },
                { key: 'parking-brake', label: { fr: 'Frein de stationnement' }, expected: 'Fonctionne' },
              ],
            },
            {
              key: 'cabin',
              label: { fr: 'Cabine' },
              points: [
                { key: 'visibility', label: { fr: 'Visibilité — vitre, rétroviseur, essuie-glace' }, expected: 'Correcte' },
                { key: 'cabin-floor', label: { fr: 'Constitution, fixation, planchers' }, expected: 'Sans anomalie visible' },
                { key: 'driver-restraint', label: { fr: 'Dispositif de retenue du conducteur' }, expected: 'Bon état de fonctionnement' },
                { key: 'driver-protection', label: { fr: 'Protection du conducteur' }, expected: 'Aspect général satisfaisant' },
                { key: 'seat', label: { fr: 'Siège du conducteur' }, expected: 'Bon état' },
              ],
            },
            {
              key: 'controls',
              label: { fr: 'Organes de service et de manœuvre' },
              points: [
                { key: 'control-identification', label: { fr: 'Identification et état des organes' }, expected: 'Pictogrammes et étiquettes en place' },
                { key: 'horn', label: { fr: 'Avertisseur sonore ou lumineux' }, expected: 'Fonctionne' },
                { key: 'indicators', label: { fr: 'Indicateurs' }, expected: 'Bon état apparent' },
                { key: 'neutral-return', label: { fr: 'Retour au point neutre' }, expected: 'Assuré' },
                { key: 'lockout', label: { fr: 'Dispositif de condamnation' }, expected: 'Par clef, bon état de fonctionnement' },
              ],
            },
            {
              key: 'misc',
              label: { fr: 'Dispositions diverses' },
              points: [
                { key: 'load-display', label: { fr: 'Affichage des charges' }, expected: 'Lisible du poste de conduite par le conducteur' },
                { key: 'safety-notice', label: { fr: 'Consignes de sécurité' }, expected: 'Affichées' },
                { key: 'previous-tests', label: { fr: 'Vérification avant mise ou remise en service' } },
                { key: 'signal-lights', label: { fr: 'Feux de signalisation' }, expected: 'En état de fonctionnement' },
                { key: 'device-identification', label: { fr: 'Identification, repère, marquage' }, expected: 'Existe' },
              ],
            },
          ],
        },
        EILM_OBSERVATIONS,
        EILM_CONCLUSION,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F20 — PELLE DE CHARGEMENT
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F20',
    version: '00',
    title: 'Rapport de vérification — pelle de chargement',
    methodCode: 'MACHINE',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        ENGIN_CLIENT,
        enginEquipment([
          { key: 'attachment', label: { fr: 'Équipement' }, type: 'text', required: false, span: 4 },
          { key: 'model', label: { fr: 'Modèle' }, type: 'text', required: false, span: 4 },
          { key: 'maxHeight', label: { fr: 'Hauteur maximale' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 4 },
        ]),
        enginChecks([
          MECANISMES_FOURCHES,
          {
            key: 'hoisting',
            label: { fr: 'Système de levage' },
            points: [
              { key: 'load-limiter', label: { fr: 'Limiteurs de charge' } },
              { key: 'moving-parts', label: { fr: 'Protection des organes mobiles' } },
              { key: 'movements', label: { fr: 'Mouvements' } },
              { key: 'service-brake', label: { fr: 'Frein de service' } },
              { key: 'course-limits', label: { fr: 'Limiteurs de course' } },
            ],
          },
          {
            key: 'steering',
            label: { fr: 'Mouvement de direction' },
            points: [
              { key: 'steering-mechanisms', label: { fr: 'Mécanismes' } },
              { key: 'steering-guarding', label: { fr: 'Protection des organes mobiles' } },
              { key: 'steering-brake', label: { fr: 'Frein du mouvement de direction' } },
              { key: 'parking-brake', label: { fr: 'Frein de stationnement' } },
            ],
          },
          enginCabine(),
          ENGIN_SECURITE,
          {
            key: 'misc',
            label: { fr: 'Dispositions diverses' },
            points: [
              { key: 'safety-notice', label: { fr: 'Affichage des consignes de sécurité' } },
              { key: 'load-display', label: { fr: 'Affichage des charges' } },
            ],
          },
        ]),
        EILM_OBSERVATIONS,
        EILM_CONCLUSION,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F23 — NIVELEUSE
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F23',
    version: '00',
    title: 'Rapport de vérification — niveleuse',
    methodCode: 'MACHINE',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        ENGIN_CLIENT,
        enginEquipment([
          { key: 'clientRef', label: { fr: 'Repère client' }, type: 'text', required: false, span: 4 },
          { key: 'model', label: { fr: 'Modèle' }, type: 'text', required: false, span: 4 },
          { key: 'type', label: { fr: 'Type' }, type: 'text', required: false, span: 4 },
          { key: 'weight', label: { fr: 'Poids de l’engin' }, type: 'number', required: false, unit: 't', decimals: 2, span: 4 },
        ]),
        enginChecks([
          {
            key: 'mechanisms',
            label: { fr: 'Équipements et mécanismes' },
            points: [
              { key: 'electrical-circuit', label: { fr: 'Circuit électrique' } },
              { key: 'hydraulic-circuit', label: { fr: 'Circuit hydraulique' } },
              { key: 'travel-speed', label: { fr: 'Vitesse de déplacement' } },
              { key: 'tyres', label: { fr: 'Pneumatiques et roues' } },
              { key: 'lines', label: { fr: 'Équipements et canalisations' } },
            ],
          },
          {
            key: 'carrier',
            label: { fr: 'Châssis porteur' },
            points: [
              { key: 'chassis', label: { fr: 'Châssis, traverses, longerons' } },
              { key: 'rolling', label: { fr: 'Organes de roulement (pneumatiques)' } },
              { key: 'stabilisers', label: { fr: 'Stabilisateurs' } },
              { key: 'locking', label: { fr: 'Dispositifs de verrouillage en position route' } },
              { key: 'suspension-lock', label: { fr: 'Blocage de suspension' } },
              { key: 'level-indicator', label: { fr: 'Indicateur de niveau' } },
              { key: 'lashing', label: { fr: 'Dispositifs d’arrimage pour le transport' } },
            ],
          },
          {
            key: 'steering',
            label: { fr: 'Mouvement de direction' },
            points: [
              { key: 'steering-mechanisms', label: { fr: 'Mécanismes' } },
              { key: 'steering-guarding', label: { fr: 'Protection des organes mobiles' } },
              { key: 'steering-brake', label: { fr: 'Frein du mouvement de direction' } },
              { key: 'parking-brake', label: { fr: 'Frein de stationnement' } },
            ],
          },
          enginCabine([{ key: 'seatbelt', label: { fr: 'Ceintures de sécurité' } }]),
          ENGIN_SECURITE,
          {
            key: 'misc',
            label: { fr: 'Dispositions diverses' },
            points: [
              { key: 'safety-notice', label: { fr: 'Affichage des consignes de sécurité' } },
              { key: 'load-display', label: { fr: 'Affichage des charges' } },
              { key: 'equipment-mass', label: { fr: 'Masse et capacité des équipements' } },
              { key: 'device-identification', label: { fr: 'Identification et repère' } },
            ],
          },
        ]),
        EILM_OBSERVATIONS,
        EILM_CONCLUSION,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F24 — MACHINE MOBILE DE FORAGE
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F24',
    version: '00',
    title: 'Rapport de vérification — machine mobile de forage',
    methodCode: 'MACHINE',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        ENGIN_CLIENT,
        enginEquipment([
          { key: 'model', label: { fr: 'Modèle' }, type: 'text', required: false, span: 3 },
          { key: 'type', label: { fr: 'Type' }, type: 'text', required: false, span: 3 },
          { key: 'brand', label: { fr: 'Marque' }, type: 'text', required: false, span: 3 },
          { key: 'reach', label: { fr: 'Portée' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 3 },
          { key: 'length', label: { fr: 'Longueur' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 3 },
          { key: 'load', label: { fr: 'Charge' }, type: 'number', required: false, unit: 'kg', decimals: 0, span: 3 },
          { key: 'maxHeight', label: { fr: 'Hauteur maximale' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 3 },
        ]),
        enginChecks([
          {
            key: 'mechanisms',
            label: { fr: 'Équipements et mécanismes' },
            points: [
              { key: 'electrical-circuit', label: { fr: 'Circuit électrique' } },
              { key: 'hydraulic-circuit', label: { fr: 'Circuit hydraulique' } },
              // « État des suspentes » chapeaute les trois points suivants.
              { key: 'pulleys', label: { fr: 'État des suspentes — poulies, noix, pignons, axes, tambours' } },
              { key: 'grippers', label: { fr: 'État des suspentes — dispositifs de préhension, fourches, moufle' } },
              { key: 'cables', label: { fr: 'État des suspentes — câbles, chaînes, attaches' } },
              { key: 'lines', label: { fr: 'Équipements, canalisations, enrouleurs' } },
              { key: 'tyres', label: { fr: 'Pneumatiques' } },
              { key: 'wheels', label: { fr: 'Roues et chenilles' } },
              { key: 'guarding', label: { fr: 'Capotage' } },
              { key: 'batteries', label: { fr: 'Batteries' } },
              { key: 'stabilisers', label: { fr: 'Stabilisateurs et extensions' } },
              { key: 'suspension-lock', label: { fr: 'Blocage de suspension' } },
              { key: 'tilt-limiter', label: { fr: 'Limiteur de dévers, indicateur de niveau' } },
            ],
          },
          {
            key: 'hoisting',
            label: { fr: 'Système de levage, relevage ou télescopage' },
            points: [
              { key: 'hoist-mechanisms', label: { fr: 'Mécanismes de levage et de relevage' } },
              { key: 'telescoping', label: { fr: 'Mécanismes de télescopage ou de repliage' } },
              { key: 'moving-parts', label: { fr: 'Protection des organes mobiles' } },
              { key: 'course-limits-hl', label: { fr: 'Limiteurs de course bas et haut' } },
              { key: 'service-brake', label: { fr: 'Frein de service levage et relevage' } },
              { key: 'course-limits', label: { fr: 'Limiteurs de course' } },
            ],
          },
          {
            key: 'travel',
            label: { fr: 'Mouvement de translation' },
            points: [
              { key: 'travel-mechanisms', label: { fr: 'Mécanismes' } },
              { key: 'travel-guarding', label: { fr: 'Protection des organes mobiles' } },
              { key: 'travel-brake', label: { fr: 'Frein du mouvement de translation' } },
              { key: 'parking-brake', label: { fr: 'Frein de stationnement' } },
            ],
          },
          enginCabine(),
          ENGIN_SECURITE,
          {
            key: 'misc',
            label: { fr: 'Dispositions diverses' },
            points: [
              { key: 'safety-notice', label: { fr: 'Affichage des consignes de sécurité' } },
              { key: 'load-display', label: { fr: 'Affichage des charges' } },
            ],
          },
        ]),
        EILM_OBSERVATIONS,
        EILM_CONCLUSION,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F25 — COMPRESSEUR MOBILE
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F25',
    version: '00',
    title: 'Rapport de vérification — compresseur mobile',
    methodCode: 'MACHINE',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        ENGIN_CLIENT,
        enginEquipment([
          { key: 'model', label: { fr: 'Modèle' }, type: 'text', required: false, span: 4 },
          { key: 'maxPressure', label: { fr: 'Pression maximale' }, type: 'number', required: false, unit: 'bar', decimals: 1, span: 4 },
          { key: 'engineSpeed', label: { fr: 'Vitesse de rotation moteur' }, type: 'number', required: false, unit: 'tr/min', decimals: 0, span: 4 },
          { key: 'hourMeter', label: { fr: 'Compteur horaire' }, type: 'number', required: false, unit: 'h', decimals: 0, span: 4 },
        ]),
        enginChecks([
          MECANISMES_FOURCHES,
          {
            key: 'hoisting',
            label: { fr: 'Système de levage' },
            points: [
              { key: 'load-limiter', label: { fr: 'Limiteurs de charge' } },
              { key: 'moving-parts', label: { fr: 'Protection des organes mobiles' } },
              { key: 'movements', label: { fr: 'Mouvements' } },
              { key: 'service-brake', label: { fr: 'Frein de service' } },
              { key: 'course-limits', label: { fr: 'Limiteurs de course' } },
            ],
          },
          {
            key: 'steering',
            label: { fr: 'Mouvement de direction' },
            points: [
              { key: 'steering-mechanisms', label: { fr: 'Mécanismes' } },
              { key: 'steering-guarding', label: { fr: 'Protection des organes mobiles' } },
              { key: 'steering-brake', label: { fr: 'Frein du mouvement de direction' } },
              { key: 'parking-brake', label: { fr: 'Frein de stationnement' } },
            ],
          },
          enginCabine(),
          ENGIN_SECURITE,
          {
            key: 'misc',
            label: { fr: 'Dispositions diverses' },
            points: [
              { key: 'safety-notice', label: { fr: 'Affichage des consignes de sécurité' } },
              { key: 'pressure-display', label: { fr: 'Affichage des pressions' } },
            ],
          },
        ]),
        EILM_OBSERVATIONS,
        EILM_CONCLUSION,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F26 — COMPACTEUR MOBILE
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F26',
    version: '00',
    title: 'Rapport de vérification — compacteur mobile',
    methodCode: 'MACHINE',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        ENGIN_CLIENT,
        enginEquipment([
          { key: 'model', label: { fr: 'Modèle' }, type: 'text', required: false, span: 4 },
          { key: 'capacity', label: { fr: 'Capacité' }, type: 'text', required: false, span: 4 },
          { key: 'engineSpeed', label: { fr: 'Vitesse de rotation moteur' }, type: 'number', required: false, unit: 'tr/min', decimals: 0, span: 4 },
          { key: 'hourMeter', label: { fr: 'Compteur horaire' }, type: 'number', required: false, unit: 'h', decimals: 0, span: 4 },
        ]),
        enginChecks([
          {
            key: 'mechanisms',
            label: { fr: 'Équipements et mécanismes' },
            points: [
              { key: 'electrical-circuit', label: { fr: 'Circuit électrique' } },
              { key: 'hydraulic-circuit', label: { fr: 'Circuit hydraulique' } },
              // « État des suspentes » chapeaute les trois points suivants.
              { key: 'suspension-chain', label: { fr: 'État des suspentes — chaîne' } },
              { key: 'suspension-cable', label: { fr: 'État des suspentes — câble' } },
              { key: 'suspension-limits', label: { fr: 'État des suspentes — limiteurs de fin de course' } },
              { key: 'travel-speed', label: { fr: 'Vitesse de déplacement' } },
              { key: 'tyres', label: { fr: 'Pneumatiques' } },
              { key: 'cylinders', label: { fr: 'Cylindres' } },
              { key: 'guarding', label: { fr: 'Capotage' } },
              { key: 'accessories', label: { fr: 'Accessoires' } },
              { key: 'forks', label: { fr: 'Fourches' } },
            ],
          },
          {
            key: 'controls',
            label: { fr: 'Organes de service et de commande' },
            points: [
              { key: 'control-identification', label: { fr: 'Identification des organes de manœuvre' } },
              { key: 'neutral-return', label: { fr: 'Retour au point neutre' } },
              { key: 'start-stop', label: { fr: 'Mise en marche et arrêt' } },
              { key: 'service-brake', label: { fr: 'Frein de service' } },
              { key: 'course-limits', label: { fr: 'Limiteurs de course' } },
            ],
          },
          {
            key: 'transmission',
            label: { fr: 'Mécanismes et organes de transmission' },
            points: [
              { key: 'transmission-mechanisms', label: { fr: 'Mécanismes' } },
              { key: 'rams', label: { fr: 'Vérins et canalisations' } },
              { key: 'moving-parts', label: { fr: 'Protection des organes en mouvement' } },
              { key: 'parking-brake', label: { fr: 'Frein de stationnement' } },
            ],
          },
          enginCabine(),
          ENGIN_SECURITE,
          {
            key: 'misc',
            label: { fr: 'Dispositions diverses' },
            points: [
              { key: 'safety-notice', label: { fr: 'Affichage des consignes de sécurité' } },
              { key: 'pressure-display', label: { fr: 'Affichage des pressions' } },
            ],
          },
        ]),
        EILM_OBSERVATIONS,
        EILM_CONCLUSION,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F28 — BÉTONNIÈRE
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F28',
    version: '00',
    title: 'Rapport de vérification — bétonnière',
    methodCode: 'MACHINE',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        ENGIN_CLIENT,
        enginEquipment([
          { key: 'type', label: { fr: 'Type' }, type: 'text', required: false, span: 4 },
          { key: 'power', label: { fr: 'Puissance de l’engin' }, type: 'number', required: false, unit: 'kW', decimals: 1, span: 4 },
        ]),
        enginChecks([
          {
            key: 'mechanisms',
            label: { fr: 'Équipements et mécanismes' },
            points: [
              { key: 'electrical-circuit', label: { fr: 'Circuit électrique' } },
              { key: 'hydraulic-circuit', label: { fr: 'Circuit hydraulique' } },
              { key: 'chassis', label: { fr: 'Châssis, traverses, longerons' } },
              { key: 'rolling', label: { fr: 'Organes de roulement (pneumatiques)' } },
              { key: 'stabilisers', label: { fr: 'Stabilisateurs' } },
              { key: 'locking', label: { fr: 'Dispositifs de verrouillage en position route' } },
              { key: 'framework', label: { fr: 'Ossature' } },
              { key: 'boom', label: { fr: 'Flèche, bras, balancier' } },
              { key: 'structure', label: { fr: 'Structure, fixations, liaisons, axes' } },
            ],
          },
          {
            key: 'controls',
            label: { fr: 'Organes de service et de commande' },
            points: [
              { key: 'control-identification', label: { fr: 'Identification des organes de manœuvre' } },
              { key: 'neutral-return', label: { fr: 'Retour au point neutre' } },
              { key: 'start-stop', label: { fr: 'Mise en marche et arrêt' } },
              { key: 'service-brake', label: { fr: 'Frein de service' } },
              { key: 'course-limits', label: { fr: 'Limiteurs de course' } },
            ],
          },
          {
            key: 'transmission',
            label: { fr: 'Mécanismes et organes de transmission' },
            points: [
              { key: 'transmission-mechanisms', label: { fr: 'Mécanismes' } },
              { key: 'rams', label: { fr: 'Vérins et canalisations' } },
              { key: 'moving-parts', label: { fr: 'Protection des organes en mouvement' } },
              { key: 'parking-brake', label: { fr: 'Frein de stationnement' } },
            ],
          },
          enginCabine(),
          ENGIN_SECURITE,
          {
            key: 'misc',
            label: { fr: 'Dispositions diverses' },
            points: [
              { key: 'safety-notice', label: { fr: 'Affichage des consignes de sécurité' } },
              { key: 'weight-display', label: { fr: 'Affichage des poids sur l’appareil' } },
            ],
          },
        ]),
        EILM_OBSERVATIONS,
        EILM_CONCLUSION,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F27 — GROUPE ÉLECTROGÈNE
   *
   *  Seul engin dont l'examen tient en une liste continue plutôt qu'en
   *  groupes par organe : le modèle enchaîne l'examen visuel, les
   *  signalisations et les protections électriques.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F27',
    version: '00',
    title: 'Rapport de vérification — groupe électrogène',
    methodCode: 'ELEC',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        ENGIN_CLIENT,
        {
          key: 'equipment',
          label: { fr: 'Identification et caractéristiques de l’équipement' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'designation', label: { fr: 'Désignation' }, type: 'text', required: true, span: 6 },
            { key: 'manufacturer', label: { fr: 'Constructeur' }, type: 'text', required: true, span: 6 },
            { key: 'identification', label: { fr: 'N° d’identification' }, type: 'text', required: true, span: 4 },
            { key: 'clientRef', label: { fr: 'Repère client' }, type: 'text', required: false, span: 4 },
            { key: 'type', label: { fr: 'Type' }, type: 'text', required: false, span: 4 },
            { key: 'hourMeter', label: { fr: 'Compteur horaire' }, type: 'number', required: false, unit: 'h', decimals: 0, span: 4 },
            { key: 'ratedPower', label: { fr: 'Puissance nominale' }, type: 'number', required: true, unit: 'kVA', decimals: 1, span: 4 },
            { key: 'ratedVoltage', label: { fr: 'Tension nominale' }, type: 'number', required: true, unit: 'V', decimals: 0, span: 4 },
            { key: 'ratedCurrent', label: { fr: 'Courant nominal' }, type: 'number', required: false, unit: 'A', decimals: 1, span: 4 },
            { key: 'frequency', label: { fr: 'Fréquence' }, type: 'number', required: false, unit: 'Hz', decimals: 0, span: 4 },
            { key: 'alternator', label: { fr: 'Alternateur' }, type: 'text', required: false, span: 4 },
            { key: 'powerFactor', label: { fr: 'Facteur de puissance (cos φ)' }, type: 'number', required: false, decimals: 2, span: 4 },
            { key: 'year', label: { fr: 'Année de fabrication' }, type: 'number', required: false, decimals: 0, span: 4 },
          ],
        },
        enginChecks([
          {
            key: 'inspection',
            label: { fr: 'Examen visuel et vérification' },
            points: [
              { key: 'wiring', label: { fr: 'État du câblage et des connexions' } },
              { key: 'marking', label: { fr: 'Présence des repérages' } },
              { key: 'auto-start', label: { fr: 'Essai de démarrage automatique' } },
              { key: 'rotation', label: { fr: 'Sens de rotation du moteur' } },
              { key: 'cooling', label: { fr: 'Système de refroidissement' } },
              { key: 'bearing-noise', label: { fr: 'Bruit de roulement' } },
              { key: 'vibration', label: { fr: 'Vibration' } },
              { key: 'fuel-level', label: { fr: 'Présence du contrôleur de niveau bas de gazole' } },
              { key: 'oil-level', label: { fr: 'Présence du contrôleur de niveau bas d’huile' } },
              { key: 'signals', label: { fr: 'Présence des différentes signalisations' } },
              { key: 'output', label: { fr: 'Débit secteur ou alternateur' } },
              { key: 'pressure-fault', label: { fr: 'Défaut de pression ou de température' } },
              { key: 'overload-fault', label: { fr: 'Défaut de surcharge' } },
              { key: 'excitation-fault', label: { fr: 'Défaut d’excitation' } },
              { key: 'audible-alarm', label: { fr: 'Alarme sonore' } },
              { key: 'direct-contact', label: { fr: 'Protection contre les contacts directs' } },
              { key: 'short-circuit', label: { fr: 'Protection contre les courts-circuits' } },
              { key: 'overload-protection', label: { fr: 'Protection contre les surcharges' } },
              { key: 'earth-continuity', label: { fr: 'Continuité du conducteur de protection' } },
              { key: 'chargers', label: { fr: 'Fonctionnement des chargeurs de batteries' } },
              { key: 'electrolyte', label: { fr: 'Électrolyte des batteries' } },
              { key: 'ventilation', label: { fr: 'Aération de la salle' } },
              { key: 'notices', label: { fr: 'Présence des affiches réglementaires' } },
              { key: 'lighting', label: { fr: 'Éclairage' } },
            ],
          },
        ]),
        EILM_OBSERVATIONS,
        EILM_CONCLUSION,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F21 — PORTE AUTOMATIQUE
   *
   *  Modèle bâti à part des engins : il porte son propre objet de mission
   *  et ses renseignements généraux, et numérote ses points 7.x.y.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F21',
    version: '00',
    title: 'Rapport d’inspection — porte automatique',
    methodCode: 'MACHINE',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'scope',
          label: { fr: 'Objet de la mission' },
          type: 'text',
          repeatable: false,
          reference: 'Articles 281 à 291 du code du travail marocain ; arrêté n° 93-08 du 12 mai 2008. La mission ne couvre ni la conformité aux règles de conception, ni les mesures d’organisation.',
          fields: [
            { key: 'scope', label: { fr: 'Objet' }, type: 'textarea', required: false, span: 12 },
          ],
        },
        {
          key: 'client',
          label: { fr: 'Renseignements généraux' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'client', label: { fr: 'Client' }, type: 'ref', required: true, autofill: 'client', span: 6 },
            { key: 'legalName', label: { fr: 'Raison sociale' }, type: 'text', required: false, span: 6 },
            { key: 'activity', label: { fr: 'Activité' }, type: 'text', required: false, span: 6 },
            { key: 'location', label: { fr: 'Lieu d’intervention' }, type: 'ref', required: true, autofill: 'site', span: 6 },
            { key: 'previousDate', label: { fr: 'Date de la dernière vérification' }, type: 'date', required: false, span: 4 },
            { key: 'date', label: { fr: 'Date d’intervention' }, type: 'date', required: true, autofill: 'date', span: 4 },
            { key: 'inspector', label: { fr: 'Nom de l’intervenant' }, type: 'ref', required: true, autofill: 'inspector', span: 4 },
            { key: 'accompaniedBy', label: { fr: 'Accompagné par' }, type: 'text', required: false, span: 4 },
            { key: 'installation', label: { fr: 'Emplacement d’installation' }, type: 'text', required: false, span: 4 },
            { key: 'periodicity', label: { fr: 'Périodicité réglementaire' }, type: 'enum', required: true, options: ['Annuelle', 'Semestrielle'], span: 4 },
          ],
        },
        {
          key: 'equipment',
          label: { fr: 'Caractéristiques de l’appareil examiné' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'designation', label: { fr: 'Désignation' }, type: 'text', required: true, span: 6 },
            { key: 'type', label: { fr: 'Type' }, type: 'text', required: false, span: 6 },
            { key: 'manufacturer', label: { fr: 'Constructeur' }, type: 'text', required: true, span: 6 },
            { key: 'weight', label: { fr: 'Poids' }, type: 'number', required: false, unit: 'kg', decimals: 0, span: 6 },
            { key: 'identification', label: { fr: 'N° d’identification' }, type: 'text', required: true, span: 6 },
            { key: 'dimensions', label: { fr: 'Dimensions (L × H)' }, type: 'text', required: false, span: 6 },
            { key: 'year', label: { fr: 'Année de fabrication' }, type: 'number', required: false, decimals: 0, span: 6 },
            { key: 'conformity', label: { fr: 'Déclaration de conformité' }, type: 'text', required: false, span: 6 },
            { key: 'particularity', label: { fr: 'Particularité' }, type: 'textarea', required: false, span: 12 },
          ],
        },
        {
          key: 'checks',
          label: { fr: 'Constatations' },
          type: 'checklist',
          repeatable: false,
          help: EILM_CHECKS_HELP,
          groups: [
            {
              key: 'power',
              label: { fr: 'Source d’énergie' },
              points: [
                { key: 'lockable-isolator', label: { fr: 'Séparation générale verrouillable' }, expected: 'Assurée' },
                { key: 'lines', label: { fr: 'Équipements et canalisations' }, expected: 'Bon état apparent' },
                { key: 'live-parts', label: { fr: 'Protection des pièces nues sous tension' }, expected: 'Réalisée' },
              ],
            },
            {
              key: 'installation',
              label: { fr: 'Installation' },
              points: [
                { key: 'gate-locking', label: { fr: 'Verrouillage du portillon' }, expected: 'Fonctionne' },
                { key: 'closing-zone', label: { fr: 'Zone de fin de fermeture' }, expected: 'Dispositif en place, fonctionne' },
                { key: 'opening-zone', label: { fr: 'Zone de fin d’ouverture' }, expected: 'Dispositif en place, fonctionne' },
                { key: 'shearing-zone', label: { fr: 'Zone de cisaillement ou d’écrasement' }, expected: 'Protégée' },
                { key: 'lighting', label: { fr: 'Éclairage' }, expected: 'Fonctionne' },
                { key: 'floor-marking', label: { fr: 'Marquage au sol' } },
                { key: 'flashing-light', label: { fr: 'Feu orange clignotant' } },
                { key: 'transparent-parts', label: { fr: 'Éléments transparents' }, expected: 'Marquage présent' },
                { key: 'other-safety', label: { fr: 'Autres dispositifs de sécurité' }, expected: 'Sans défaut apparent' },
                { key: 'work-zone', label: { fr: 'Zone de travail' }, expected: 'Sans défaut apparent' },
                { key: 'signal-lights', label: { fr: 'Feux de signalisation' } },
              ],
            },
            {
              key: 'controls',
              label: { fr: 'Organes de service et de manœuvre' },
              points: [
                { key: 'control-identification', label: { fr: 'Identification des organes de service' }, expected: 'Pictogrammes et étiquettes en place' },
                { key: 'start-stop', label: { fr: 'Marche, arrêt, sélecteur' }, expected: 'Fonctionne' },
                { key: 'involuntary', label: { fr: 'Dispositif contre les manœuvres involontaires' }, expected: 'Bon état de fonctionnement' },
                { key: 'emergency-operation', label: { fr: 'Manœuvre de secours' } },
              ],
            },
            {
              key: 'frame',
              label: { fr: 'Charpente' },
              points: [
                { key: 'structure', label: { fr: 'Structure, tablier, sélecteur' }, expected: 'Sans défaut apparent' },
                { key: 'fixings', label: { fr: 'Fixations et scellements' }, expected: 'Parties visibles et accessibles sans défaut' },
                { key: 'guides', label: { fr: 'Guidages et galets' }, expected: 'Bon état' },
              ],
            },
            {
              key: 'mechanisms',
              label: { fr: 'Mécanismes' },
              points: [
                { key: 'mechanisms', label: { fr: 'Mécanismes' }, expected: 'Aspect satisfaisant des parties visibles sans démontage' },
                { key: 'guarding', label: { fr: 'Protection des organes mobiles de transmission' }, expected: 'Assurée par capotage' },
                { key: 'guide-parts', label: { fr: 'Organes de guidage' }, expected: 'Bon état' },
              ],
            },
            {
              key: 'horizontal',
              label: { fr: 'Mouvement horizontal' },
              points: [
                { key: 'service-brake', label: { fr: 'Frein de service' }, expected: 'Automatiquement serré, efficace' },
                { key: 'course-limit', label: { fr: 'Limiteur de course' } },
              ],
            },
            {
              key: 'misc',
              label: { fr: 'Dispositions diverses' },
              points: [
                { key: 'safety-notice', label: { fr: 'Consigne de sécurité' }, expected: 'Apposée au poste de commande' },
                { key: 'conformity', label: { fr: 'Déclaration de conformité, manuel d’instruction' } },
                { key: 'device-identification', label: { fr: 'Identification, repère, marquage' }, expected: 'Existe' },
                { key: 'special-equipment', label: { fr: 'Équipement particulier' } },
              ],
            },
          ],
        },
        EILM_OBSERVATIONS,
        EILM_CONCLUSION,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F01 — GRUE AUXILIAIRE DE CHARGEMENT
   *
   *  Seul modèle du lot levage dont la colonne des attendus est renseignée de
   *  façon cohérente et alignée : ses valeurs sont donc reprises, là où les
   *  autres modèles ne portent que des saisies de terrain.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F01',
    version: '00',
    title: 'Rapport de vérification — grue auxiliaire de chargement',
    methodCode: 'LIFT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        LEVAGE_CLIENT,
        {
          key: 'equipment',
          label: { fr: 'Identification et caractéristiques de l’équipement' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'description', label: { fr: 'Description' }, type: 'textarea', required: false, span: 12 },
            { key: 'manufacturer', label: { fr: 'Constructeur' }, type: 'text', required: true, span: 4 },
            { key: 'identification', label: { fr: 'N° d’identification' }, type: 'text', required: true, span: 4 },
            { key: 'type', label: { fr: 'Type' }, type: 'text', required: false, span: 4 },
            { key: 'chassisNumber', label: { fr: 'N° de châssis du porteur' }, type: 'text', required: false, span: 4 },
            { key: 'plate', label: { fr: 'N° d’immatriculation du camion' }, type: 'text', required: false, span: 4 },
            { key: 'reach', label: { fr: 'Portée maximale' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 4 },
            { key: 'capacity', label: { fr: 'Capacité maximale d’utilisation' }, type: 'number', required: true, unit: 't', decimals: 2, span: 4 },
            { key: 'attachment', label: { fr: 'Équipement' }, type: 'text', required: false, span: 4 },
            { key: 'testLoad', label: { fr: 'Charge d’essais' }, type: 'number', required: false, unit: 'kg', decimals: 0, span: 4 },
            { key: 'year', label: { fr: 'Année de fabrication' }, type: 'number', required: false, decimals: 0, span: 4 },
          ],
        },
        enginChecks([
          {
            key: 'mechanisms',
            label: { fr: 'Équipements et mécanismes' },
            points: [
              { key: 'electrical-circuit', label: { fr: 'Circuit électrique' }, expected: 'Bon état apparent' },
              { key: 'hydraulic-circuit', label: { fr: 'Circuit hydraulique' }, expected: 'Bon état apparent' },
              { key: 'seats-fixings', label: { fr: 'Assises et fixations' }, expected: 'Bon état apparent' },
              { key: 'rolling', label: { fr: 'Organes de roulement (pneumatiques)' }, expected: 'Bon état apparent' },
              { key: 'stabilisers', label: { fr: 'Stabilisateurs et extensions' }, expected: 'Bon état de fonctionnement' },
              { key: 'tilt-limiter', label: { fr: 'Limiteur de dévers, indicateur de niveau' }, expected: 'Bon état' },
              { key: 'visibility', label: { fr: 'Visibilité — vitrage, essuie-glace, rétroviseur' }, expected: 'Correcte' },
              { key: 'seat', label: { fr: 'Siège' }, expected: 'Correctement fixé' },
              { key: 'control-identification', label: { fr: 'Identification et état des organes' }, expected: 'Étiquetage sur place' },
              { key: 'involuntary', label: { fr: 'Protection contre les manœuvres involontaires' }, expected: 'Correcte' },
              { key: 'start-stop', label: { fr: 'Mise en marche, arrêt normal, sélecteur' }, expected: 'Fonctionne' },
              { key: 'moving-parts', label: { fr: 'Protection des organes mobiles' }, expected: 'Satisfaisant' },
            ],
          },
          {
            key: 'hoisting',
            label: { fr: 'Système de levage et d’orientation' },
            points: [
              { key: 'hoist-mechanisms', label: { fr: 'Mécanismes' }, expected: 'Bon fonctionnement' },
              { key: 'hoist-speed-limit', label: { fr: 'Limitation de vitesse du mouvement de levage' }, expected: 'Fonctionne' },
              { key: 'slew-brake', label: { fr: 'Frein de service du mouvement d’orientation' }, expected: 'Fonctionne' },
              { key: 'hoist-brake', label: { fr: 'Frein de service du mouvement de levage' }, expected: 'Fonctionne' },
              { key: 'slew-limits', label: { fr: 'Limiteurs de course du mouvement d’orientation' }, expected: 'Efficace' },
              { key: 'parking-brake', label: { fr: 'Frein de stationnement' }, expected: 'Correcte' },
              { key: 'slew-speed-limit', label: { fr: 'Limiteur de vitesse du mouvement d’orientation' }, expected: 'Fonctionne' },
              { key: 'lower-limit', label: { fr: 'Limiteur de course bas' }, expected: 'Fonctionne' },
              { key: 'upper-limit', label: { fr: 'Limiteur de course haut' }, expected: 'Fonctionne' },
              { key: 'load-limiter', label: { fr: 'Limiteur de charge et de moment' }, expected: 'Fonctionne à 110 % de la CMU' },
            ],
          },
          {
            key: 'safety',
            label: { fr: 'Système de sécurité' },
            points: [
              { key: 'horn', label: { fr: 'Klaxon' }, expected: 'Fonctionne' },
              { key: 'beacon', label: { fr: 'Gyrophare' }, expected: 'Fonctionne' },
              { key: 'signal-lights', label: { fr: 'Feux de signalisation' }, expected: 'En état de fonctionnement' },
              { key: 'extinguisher', label: { fr: 'Extincteur' }, expected: 'En place' },
              { key: 'emergency-stop', label: { fr: 'Arrêts d’urgence' }, expected: 'Fonctionne' },
            ],
          },
          {
            key: 'misc',
            label: { fr: 'Dispositions diverses' },
            points: [
              { key: 'safety-notice', label: { fr: 'Affichage des consignes de sécurité' }, expected: 'Apposée au poste de conduite' },
              { key: 'load-display', label: { fr: 'Affichage des charges' }, expected: 'Lisible du poste de conduite par le conducteur' },
              { key: 'manual', label: { fr: 'Notice d’utilisation' }, expected: 'Existe' },
            ],
          },
        ]),
        EILM_OBSERVATIONS,
        EILM_CONCLUSION,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F02 — PLATE-FORME SUSPENDUE
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F02',
    version: '00',
    title: 'Rapport d’inspection — plate-forme suspendue',
    methodCode: 'LIFT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        LEVAGE_CLIENT,
        {
          key: 'equipment',
          label: { fr: 'Identification et caractéristiques de l’équipement' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'description', label: { fr: 'Description' }, type: 'textarea', required: false, span: 12 },
            { key: 'manufacturer', label: { fr: 'Constructeur' }, type: 'text', required: true, span: 4 },
            { key: 'identification', label: { fr: 'N° d’identification' }, type: 'text', required: true, span: 4 },
            { key: 'type', label: { fr: 'Type' }, type: 'text', required: false, span: 4 },
            { key: 'reach', label: { fr: 'Portée maximale' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 4 },
            { key: 'capacity', label: { fr: 'Capacité maximale d’utilisation' }, type: 'number', required: true, unit: 'kg', decimals: 0, span: 4 },
            { key: 'travel', label: { fr: 'Course' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 4 },
            { key: 'suspension', label: { fr: 'Suspentes' }, type: 'text', required: false, span: 4 },
            { key: 'testLoad', label: { fr: 'Charge d’essais' }, type: 'number', required: false, unit: 'kg', decimals: 0, span: 4 },
            { key: 'year', label: { fr: 'Année de fabrication' }, type: 'number', required: false, decimals: 0, span: 4 },
          ],
        },
        enginChecks([
          {
            key: 'mechanisms',
            label: { fr: 'Équipements et mécanismes' },
            points: [
              { key: 'electrical-circuit', label: { fr: 'Circuit électrique' } },
              { key: 'hydraulic-circuit', label: { fr: 'Circuit hydraulique' } },
              // « État des suspentes » chapeaute les trois points suivants.
              { key: 'suspension-chain', label: { fr: 'État des suspentes — chaîne' } },
              { key: 'suspension-cable', label: { fr: 'État des suspentes — câble' } },
              { key: 'suspension-limits', label: { fr: 'État des suspentes — limiteurs de fin de course' } },
              { key: 'travel-speed', label: { fr: 'Vitesse de déplacement' } },
              { key: 'braking-circuit', label: { fr: 'Circuit de freinage' } },
              { key: 'tyres', label: { fr: 'Pneumatiques' } },
              { key: 'wheels', label: { fr: 'Roues et chenilles' } },
              { key: 'guarding', label: { fr: 'Capotage' } },
              { key: 'accessories', label: { fr: 'Accessoires' } },
              { key: 'moving-parts', label: { fr: 'Protection des organes en mouvement' } },
            ],
          },
          {
            key: 'hoisting',
            label: { fr: 'Système de levage' },
            points: [
              { key: 'load-limiter', label: { fr: 'Limiteurs de charge' } },
              { key: 'hoist-guarding', label: { fr: 'Protection des organes mobiles' } },
              { key: 'movements', label: { fr: 'Mouvements' } },
              { key: 'service-brake', label: { fr: 'Frein de service' } },
              { key: 'course-limits', label: { fr: 'Limiteurs de course' } },
              { key: 'parking-brake', label: { fr: 'Frein de stationnement' } },
              { key: 'speed-limiter', label: { fr: 'Limiteur de vitesse' } },
              { key: 'lower-limit', label: { fr: 'Limiteur de course bas' } },
              { key: 'upper-limit', label: { fr: 'Limiteur de course haut' } },
              { key: 'tilt-limit', label: { fr: 'Limitation d’inclinaison' } },
            ],
          },
          ENGIN_SECURITE,
          {
            key: 'misc',
            label: { fr: 'Dispositions diverses' },
            points: [
              { key: 'safety-notice', label: { fr: 'Affichage des consignes de sécurité' } },
              { key: 'load-display', label: { fr: 'Affichage des charges' } },
              { key: 'manual', label: { fr: 'Notice d’utilisation' } },
            ],
          },
        ]),
        EILM_OBSERVATIONS,
        EILM_CONCLUSION,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F03 — CHARIOT DE MANUTENTION À FLÈCHE TÉLESCOPIQUE
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F03',
    version: '00',
    title: 'Rapport de vérification — chariot de manutention à flèche télescopique',
    methodCode: 'LIFT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        LEVAGE_CLIENT,
        levageMobileEquipment('kg'),
        enginChecks([
          MECANISMES_FOURCHES,
          {
            key: 'hoisting',
            label: { fr: 'Système de levage' },
            points: [
              { key: 'load-limiter', label: { fr: 'Limiteurs de charge' } },
              { key: 'hoist-guarding', label: { fr: 'Protection des organes mobiles' } },
              { key: 'movements', label: { fr: 'Mouvements' } },
              { key: 'service-brake', label: { fr: 'Frein de service' } },
              { key: 'course-limits', label: { fr: 'Limiteurs de course' } },
            ],
          },
          TRANSLATION_DIRECTION,
          enginCabine(),
          ENGIN_SECURITE,
          {
            key: 'misc',
            label: { fr: 'Dispositions diverses' },
            points: [
              { key: 'safety-notice', label: { fr: 'Affichage des consignes de sécurité' } },
              { key: 'load-display', label: { fr: 'Affichage des charges' } },
            ],
          },
        ]),
        EILM_OBSERVATIONS,
        EILM_CONCLUSION,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F05 — GRUE MOBILE
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F05',
    version: '00',
    title: 'Rapport de vérification — grue mobile',
    methodCode: 'LIFT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        LEVAGE_CLIENT,
        levageMobileEquipment('t'),
        enginChecks([
          MECANISMES_FOURCHES,
          {
            key: 'hoisting',
            label: { fr: 'Système de levage et de relevage' },
            points: [
              { key: 'load-limiter', label: { fr: 'Limiteurs de charge' } },
              { key: 'hoist-guarding', label: { fr: 'Protection des organes mobiles' } },
              { key: 'movements', label: { fr: 'Mouvements' } },
              { key: 'service-brake', label: { fr: 'Frein de service' } },
              { key: 'course-limits', label: { fr: 'Limiteurs de course' } },
            ],
          },
          TRANSLATION_DIRECTION,
          enginCabine(),
          ENGIN_SECURITE,
          {
            key: 'misc',
            label: { fr: 'Dispositions diverses' },
            points: [
              { key: 'safety-notice', label: { fr: 'Affichage des consignes de sécurité' } },
              { key: 'load-display', label: { fr: 'Affichage des charges' } },
            ],
          },
        ]),
        EILM_OBSERVATIONS,
        EILM_CONCLUSION,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F06 — PLATEFORME ÉLÉVATRICE MOBILE DE PERSONNEL
   *
   *  La PEMP porte des personnes : sa cabine est examinée pour la retenue du
   *  conducteur et l'ancrage des EPI, et elle ajoute un poste de sauvetage.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F06',
    version: '00',
    title: 'Rapport de vérification — plateforme élévatrice mobile de personnel',
    methodCode: 'LIFT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        LEVAGE_CLIENT,
        {
          key: 'equipment',
          label: { fr: 'Identification et caractéristiques de l’équipement' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'designation', label: { fr: 'Désignation' }, type: 'text', required: true, span: 6 },
            { key: 'description', label: { fr: 'Description' }, type: 'textarea', required: false, span: 12 },
            { key: 'type', label: { fr: 'Type' }, type: 'text', required: false, span: 4 },
            { key: 'identification', label: { fr: 'N° d’identification' }, type: 'text', required: true, span: 4 },
            { key: 'manufacturer', label: { fr: 'Fabricant' }, type: 'text', required: true, span: 4 },
            { key: 'model', label: { fr: 'Modèle' }, type: 'text', required: false, span: 4 },
            { key: 'suspension', label: { fr: 'Suspentes' }, type: 'text', required: false, span: 4 },
            { key: 'capacity', label: { fr: 'Capacité maximale d’utilisation' }, type: 'number', required: true, unit: 'kg', decimals: 0, span: 4 },
            { key: 'liftHeight', label: { fr: 'Hauteur maximale du levage' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 4 },
            { key: 'reach', label: { fr: 'Portée maximale' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 4 },
            { key: 'testLoad', label: { fr: 'Charge d’essais' }, type: 'number', required: false, unit: 'kg', decimals: 0, span: 4 },
            { key: 'year', label: { fr: 'Année de fabrication' }, type: 'number', required: false, decimals: 0, span: 4 },
          ],
        },
        enginChecks([
          {
            key: 'mechanisms',
            label: { fr: 'Équipements et mécanismes' },
            points: [
              { key: 'electrical-circuit', label: { fr: 'Circuit électrique' } },
              { key: 'hydraulic-circuit', label: { fr: 'Circuit hydraulique' } },
              // « État des suspentes » chapeaute les deux points suivants.
              { key: 'suspension-chain', label: { fr: 'État des suspentes — chaîne' } },
              { key: 'suspension-cable', label: { fr: 'État des suspentes — câble' } },
              { key: 'stabilisers', label: { fr: 'État des stabilisateurs' } },
              { key: 'tilt-limiter', label: { fr: 'Limiteur de dévers' } },
              { key: 'tyres', label: { fr: 'Pneumatiques' } },
              { key: 'wheels', label: { fr: 'Roues et chenilles' } },
              { key: 'chassis-lines', label: { fr: 'Châssis, équipements, canalisations' } },
            ],
          },
          {
            key: 'hoisting',
            label: { fr: 'Mouvement de levage' },
            points: [
              { key: 'load-limiter', label: { fr: 'Limiteurs de charge' } },
              { key: 'hoist-guarding', label: { fr: 'Protection des organes mobiles' } },
              { key: 'movements', label: { fr: 'Mouvements' } },
              { key: 'service-brake', label: { fr: 'Frein de service' } },
              { key: 'course-limits', label: { fr: 'Limiteurs de course haut et bas' } },
            ],
          },
          {
            key: 'travel',
            label: { fr: 'Mouvement de translation' },
            points: [
              { key: 'travel-mechanisms', label: { fr: 'Mécanismes' } },
              { key: 'travel-guarding', label: { fr: 'Protection des organes mobiles' } },
              { key: 'travel-brake', label: { fr: 'Frein du mouvement de translation' } },
              { key: 'speed-limit', label: { fr: 'Limitation de vitesse' } },
              { key: 'parking-brake', label: { fr: 'Frein de stationnement' } },
            ],
          },
          {
            key: 'slewing',
            label: { fr: 'Mouvement d’orientation' },
            points: [
              { key: 'slew-mechanisms', label: { fr: 'Mécanismes' } },
              { key: 'slew-guarding', label: { fr: 'Protection des organes mobiles' } },
              { key: 'slew-brake', label: { fr: 'Frein du mouvement d’orientation' } },
              { key: 'slew-limits', label: { fr: 'Limiteurs de course' } },
            ],
          },
          {
            key: 'cabin',
            label: { fr: 'Cabine' },
            points: [
              { key: 'cabin-access', label: { fr: 'Accès, constitution, planchers' } },
              { key: 'extinguisher', label: { fr: 'Extincteur' } },
              { key: 'fall-protection', label: { fr: 'Protection contre la chute de hauteur' } },
              { key: 'seat', label: { fr: 'Siège du conducteur' } },
              { key: 'driver-restraint', label: { fr: 'Dispositif de retenue du conducteur' }, expected: 'Point d’ancrage permettant l’accrochage des EPI' },
            ],
          },
          {
            key: 'safety',
            label: { fr: 'Système de sécurité' },
            points: [
              { key: 'control-identification', label: { fr: 'Identification et état des organes' } },
              { key: 'start-stop', label: { fr: 'Mise en marche, arrêt normal, sélecteur' } },
              { key: 'horn', label: { fr: 'Avertisseur sonore ou lumineux' } },
              { key: 'recovery-station', label: { fr: 'Poste de dépannage' } },
              { key: 'rescue-station', label: { fr: 'Poste de sauvetage' } },
              { key: 'emergency-stop', label: { fr: 'Arrêts d’urgence' } },
            ],
          },
          {
            key: 'misc',
            label: { fr: 'Dispositions diverses' },
            points: [
              { key: 'safety-notice', label: { fr: 'Affichage des consignes de sécurité' } },
              { key: 'load-display', label: { fr: 'Affichage des charges' } },
              { key: 'device-identification', label: { fr: 'Identification, repère, marquage' } },
            ],
          },
        ]),
        EILM_OBSERVATIONS,
        EILM_CONCLUSION,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F04 — GRUE À TOUR
   *
   *  Bâtie comme les rapports de pont roulant — une ligne par point, pas de
   *  groupes numérotés — et exige les épreuves statique et dynamique.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F04',
    version: '00',
    title: 'Rapport de vérification — grue à tour',
    methodCode: 'LIFT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        LEVAGE_CLIENT,
        {
          key: 'equipment',
          label: { fr: 'Identification et caractéristiques de l’équipement' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'designation', label: { fr: 'Désignation' }, type: 'text', required: true, span: 6 },
            { key: 'description', label: { fr: 'Description' }, type: 'textarea', required: false, span: 12 },
            { key: 'manufacturer', label: { fr: 'Fabricant' }, type: 'text', required: true, span: 4 },
            { key: 'identification', label: { fr: 'N° d’identification' }, type: 'text', required: true, span: 4 },
            { key: 'ballastMass', label: { fr: 'Masse du lest principal' }, type: 'number', required: false, unit: 'kg', decimals: 0, span: 4 },
            { key: 'suspension', label: { fr: 'Suspente' }, type: 'text', required: false, span: 4 },
            { key: 'jibLength', label: { fr: 'Longueur de flèche' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 4 },
            { key: 'counterJibLength', label: { fr: 'Longueur de contre-flèche' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 4 },
            { key: 'capacity', label: { fr: 'Capacité maximale d’utilisation' }, type: 'number', required: true, unit: 't', decimals: 2, span: 4 },
            { key: 'liftHeight', label: { fr: 'Hauteur de levage sous crochet' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 4 },
            { key: 'year', label: { fr: 'Année de fabrication' }, type: 'number', required: false, decimals: 0, span: 4 },
          ],
        },
        {
          key: 'tests',
          label: { fr: 'Compte rendu des épreuves' },
          type: 'table',
          repeatable: true,
          minRows: 1,
          help: 'Épreuve statique majorée de 133 %, épreuve dynamique à 110 % sur tous les mouvements.',
          columns: [
            { key: 'kind', label: { fr: 'Nature de l’épreuve' }, type: 'enum', required: true, options: ['Épreuve statique', 'Épreuve dynamique'], span: 3 },
            { key: 'load', label: { fr: 'Charge appliquée' }, type: 'number', required: true, unit: 'kg', decimals: 0, span: 2 },
            { key: 'reach', label: { fr: 'Portée' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 2 },
            { key: 'height', label: { fr: 'Hauteur' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 1 },
            { key: 'increase', label: { fr: 'Majoration' }, type: 'number', required: true, unit: '%', decimals: 0, span: 2 },
            { key: 'testLoad', label: { fr: 'Charge d’essai' }, type: 'number', required: false, unit: 'kg', decimals: 0, span: 2 },
          ],
        },
        {
          key: 'checks',
          label: { fr: 'Vérifications et inspections de l’appareil et de ses aménagements' },
          type: 'checklist',
          repeatable: false,
          help: EILM_CHECKS_HELP,
          groups: [
            {
              key: 'installation',
              label: { fr: 'Installation de l’appareil' },
              points: [
                { key: 'strength', label: { fr: 'Résistance aux contraintes — supports, charpente, éléments constitutifs, fixations' } },
                { key: 'immobilisation', label: { fr: 'Immobilisation de l’appareil à l’arrêt — freinage' } },
              ],
            },
            {
              key: 'electrical',
              label: { fr: 'Installations électriques' },
              points: [
                { key: 'protection-live', label: { fr: 'Protection contre les contacts directs de l’appareil de levage et des charges avec les conducteurs nus sous tension' } },
                { key: 'cutoff', label: { fr: 'Dispositifs de coupure — arrêt d’urgence sur l’appareil' } },
                { key: 'cabin-protection', label: { fr: 'Protection contre les contacts avec les pièces nues sous tension dans la cabine' } },
                { key: 'earthing', label: { fr: 'Mises à la terre des masses métalliques fixes ou mobiles' } },
              ],
            },
            {
              key: 'cabin',
              label: { fr: 'Cabine et moyens d’accès' },
              points: [
                { key: 'visibility', label: { fr: 'Visibilité dans la cabine et protection contre les dangers et émanations nuisibles' } },
                { key: 'floors', label: { fr: 'Constitution des planchers et passerelles — tôles perforées, caillebotis (interstice < 2 cm)' } },
                { key: 'accessibility', label: { fr: 'Accessibilité de la cabine' } },
                { key: 'evacuation', label: { fr: 'Moyens d’évacuation en cas de déplacement de la cabine' } },
                { key: 'heating', label: { fr: 'Chauffage de la cabine pendant les saisons froides' } },
                { key: 'combustibles', label: { fr: 'Emmagasinage de chiffons, déchets, huiles ou autres matières combustibles dans la cabine' } },
                { key: 'extinguisher', label: { fr: 'Extincteur d’incendie dans la cabine' } },
              ],
            },
            {
              key: 'mechanisms',
              label: { fr: 'Mécanismes, moteurs, chaînes et câbles, limiteurs de course' },
              points: [
                { key: 'overhang-parts', label: { fr: 'Fixation et protection des pièces mobiles montées en porte-à-faux (carter, enveloppe métallique)' } },
                { key: 'falling-objects', label: { fr: 'Protection contre les chutes d’objets et fixation des parties amovibles' } },
                { key: 'hook-state', label: { fr: 'État du crochet, du moufle d’accrochage, des câbles métalliques, des élingues' } },
                { key: 'drum-winding', label: { fr: 'Enroulement du câble de levage sur le tambour et rapport d’enroulement' } },
                { key: 'hoist-brakes', label: { fr: 'Freins des mouvements de levage' } },
                { key: 'speed-limiter', label: { fr: 'Limiteur de vitesse et contrôle de la descente de la charge' } },
                { key: 'course-limits', label: { fr: 'Limiteurs de course des mouvements de levage (haut et bas)' } },
                { key: 'pulleys', label: { fr: 'Protection et dispositif de manœuvre des poulies de mouflage' } },
                { key: 'oil-leak', label: { fr: 'Fuite d’huile' } },
              ],
            },
            {
              key: 'slewing',
              label: { fr: 'Mouvement d’orientation' },
              points: [
                { key: 'slew-mechanisms', label: { fr: 'Mécanismes' } },
                { key: 'slew-guarding', label: { fr: 'Protection des organes mobiles de transmission' } },
                { key: 'slew-brake', label: { fr: 'Frein de service' } },
                { key: 'turn-limit', label: { fr: 'Limitation du nombre de tours d’orientation' } },
                { key: 'weathervane', label: { fr: 'Dispositif de mise en girouette' } },
                { key: 'drift-plates', label: { fr: 'Plaques de dérive' } },
              ],
            },
            {
              key: 'misc',
              label: { fr: 'Dispositions diverses' },
              points: [
                { key: 'load-display', label: { fr: 'Affichage des charges sur l’appareil' } },
                { key: 'safety-notice', label: { fr: 'Consignes de sécurité' } },
                { key: 'manual', label: { fr: 'Notice d’instruction, déclaration de conformité' } },
                { key: 'previous-tests', label: { fr: 'Épreuves et essais avant mise ou remise en service' } },
                { key: 'device-identification', label: { fr: 'Identification et repère de l’appareil' } },
                { key: 'interference', label: { fr: 'Dispositif d’interférence' } },
                { key: 'anemometer', label: { fr: 'Anémomètre, conditions météorologiques' } },
                { key: 'special-equipment', label: { fr: 'Équipement particulier' } },
                { key: 'signal-lights', label: { fr: 'Feux de signalisation' } },
              ],
            },
          ],
        },
        EILM_OBSERVATIONS,
        EILM_CONCLUSION,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F07 — HARNAIS DE SÉCURITÉ
   *
   *  Seul accessoire à check-list : un point par boucle, anneau ou sangle.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F07',
    version: '00',
    title: 'Rapport de vérification — harnais de sécurité',
    methodCode: 'LIFT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        accessoireClient(ARRETE_1953_CODE_TRAVAIL, { interlocuteur: false }),
        accessoireEquipment([
          { key: 'manufacturer', label: { fr: 'Fabricant' }, type: 'text', required: true, span: 4 },
          { key: 'model', label: { fr: 'Modèle' }, type: 'text', required: false, span: 4 },
          { key: 'serialNumber', label: { fr: 'Numéro de série' }, type: 'text', required: true, span: 4 },
          { key: 'type', label: { fr: 'Type' }, type: 'text', required: false, span: 4 },
          { key: 'strap', label: { fr: 'Sangle' }, type: 'text', required: false, span: 4 },
          { key: 'colour', label: { fr: 'Couleur' }, type: 'text', required: false, span: 4 },
          { key: 'size', label: { fr: 'Taille' }, type: 'text', required: false, span: 4 },
        ]),
        {
          key: 'checks',
          label: { fr: 'Vérification et inspection' },
          type: 'checklist',
          repeatable: false,
          help: EILM_CHECKS_HELP,
          groups: [
            {
              key: 'harness',
              label: { fr: 'Éléments du harnais' },
              points: [
                { key: 'label', label: { fr: 'Étiquette' } },
                { key: 'dorsal-ring', label: { fr: 'Anneau dorsal' } },
                { key: 'dissipator', label: { fr: 'Plaque dissipatrice' } },
                { key: 'chest-buckle', label: { fr: 'Boucle de poitrine' } },
                { key: 'right-shoulder', label: { fr: 'Boucle de bretelle droite' } },
                { key: 'left-shoulder', label: { fr: 'Boucle de bretelle gauche' } },
                { key: 'belt', label: { fr: 'Ceinture et ardillons' } },
                { key: 'right-thigh', label: { fr: 'Boucle de cuisse droite' } },
                { key: 'left-thigh', label: { fr: 'Boucle de cuisse gauche' } },
                { key: 'holding-buckle', label: { fr: 'Boucle de maintien' } },
                { key: 'positioning-ring', label: { fr: 'Anneau de positionnement' } },
              ],
            },
          ],
        },
        ...ACCESSOIRE_FIN,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F08 — PALAN À LEVIER
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F08',
    version: '00',
    title: 'Rapport de vérification — palan à levier',
    methodCode: 'LIFT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        accessoireClient(ARRETE_1953_CODE_TRAVAIL),
        accessoireEquipment([
          { key: 'manufacturer', label: { fr: 'Fabricant' }, type: 'text', required: true, span: 4 },
          { key: 'identification', label: { fr: 'N° d’identification' }, type: 'text', required: true, span: 4 },
          { key: 'model', label: { fr: 'Modèle' }, type: 'text', required: false, span: 4 },
          { key: 'suspensionType', label: { fr: 'Type de suspente du levage' }, type: 'text', required: false, span: 4 },
          { key: 'capacity', label: { fr: 'Charge maximale d’utilisation (CMU)' }, type: 'number', required: true, unit: 'kg', decimals: 0, span: 4 },
          { key: 'suspensionDiameter', label: { fr: 'Diamètre de suspente' }, type: 'number', required: false, unit: 'mm', decimals: 1, span: 4 },
        ]),
        ...ACCESSOIRE_FIN,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F09 — ÉLINGUE
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F09',
    version: '00',
    title: 'Rapport de vérification — élingue',
    methodCode: 'LIFT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        accessoireClient(ARRETE_1953_CODE_TRAVAIL),
        accessoireEquipment([
          { key: 'manufacturer', label: { fr: 'Fabricant' }, type: 'text', required: true, span: 4 },
          { key: 'serialNumber', label: { fr: 'Numéro de série' }, type: 'text', required: false, span: 4 },
          { key: 'identification', label: { fr: 'N° d’identification' }, type: 'text', required: true, span: 4 },
          { key: 'type', label: { fr: 'Type' }, type: 'text', required: false, span: 4 },
          { key: 'capacity', label: { fr: 'CMU' }, type: 'number', required: true, unit: 'kg', decimals: 0, span: 4 },
          { key: 'chains', label: { fr: 'Chaînes' }, type: 'text', required: false, span: 4 },
        ]),
        ...ACCESSOIRE_FIN,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F10 — MANILLE
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F10',
    version: '00',
    title: 'Rapport de vérification — manille',
    methodCode: 'LIFT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        accessoireClient(ARRETE_1953_CODE_TRAVAIL),
        accessoireEquipment([
          { key: 'manufacturer', label: { fr: 'Fabricant' }, type: 'text', required: true, span: 4 },
          { key: 'model', label: { fr: 'Modèle' }, type: 'text', required: false, span: 4 },
          { key: 'serialNumber', label: { fr: 'Numéro de série' }, type: 'text', required: false, span: 4 },
          { key: 'identification', label: { fr: 'N° d’identification' }, type: 'text', required: true, span: 4 },
          { key: 'type', label: { fr: 'Type' }, type: 'text', required: false, span: 4 },
          { key: 'capacity', label: { fr: 'CMU' }, type: 'number', required: true, unit: 'kg', decimals: 0, span: 4 },
        ]),
        ...ACCESSOIRE_FIN,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F11 — TREUIL MANUEL DE LEVAGE
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F11',
    version: '00',
    title: 'Rapport d’inspection — treuil manuel de levage',
    methodCode: 'LIFT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        accessoireClient(ARRETE_1953_CODE_TRAVAIL),
        accessoireEquipment([
          { key: 'manufacturer', label: { fr: 'Fabricant' }, type: 'text', required: true, span: 4 },
          { key: 'serialNumber', label: { fr: 'Numéro de série' }, type: 'text', required: true, span: 4 },
          { key: 'model', label: { fr: 'Modèle' }, type: 'text', required: false, span: 4 },
          { key: 'pullForce', label: { fr: 'Force de traction' }, type: 'number', required: false, unit: 'daN', decimals: 0, span: 4 },
          { key: 'capacity', label: { fr: 'Charge maximale d’utilisation (CMU)' }, type: 'number', required: true, unit: 'kg', decimals: 0, span: 4 },
          { key: 'cableDiameter', label: { fr: 'Diamètre du câble' }, type: 'number', required: false, unit: 'mm', decimals: 1, span: 4 },
          { key: 'mass', label: { fr: 'Masse du treuil' }, type: 'number', required: false, unit: 'kg', decimals: 0, span: 4 },
          { key: 'cableLength', label: { fr: 'Longueur du câble de levage' }, type: 'number', required: false, unit: 'm', decimals: 1, span: 4 },
        ]),
        ...ACCESSOIRE_FIN,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F41 — VÉRIN HYDRAULIQUE
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F41',
    version: '00',
    title: 'Rapport de vérification — vérin hydraulique',
    methodCode: 'LIFT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        accessoireClient(ARRETE_1953_CODE_TRAVAIL),
        accessoireEquipment([
          { key: 'manufacturer', label: { fr: 'Fabricant' }, type: 'text', required: true, span: 4 },
          { key: 'identification', label: { fr: 'N° d’identification' }, type: 'text', required: true, span: 4 },
          { key: 'type', label: { fr: 'Type' }, type: 'text', required: false, span: 4 },
          { key: 'capacity', label: { fr: 'CMU' }, type: 'number', required: true, unit: 't', decimals: 2, span: 4 },
          { key: 'rodDiameter', label: { fr: 'Diamètre de tige' }, type: 'number', required: false, unit: 'mm', decimals: 0, span: 4 },
        ]),
        ...ACCESSOIRE_FIN,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F42 — CENTRALE HYDRAULIQUE
   *
   *  Rangée avec le levage parce qu'elle alimente les vérins du F41, bâti
   *  sur le même modèle ; son rapport ne cite pourtant que le Code du travail.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F42',
    version: '00',
    title: 'Rapport de vérification — centrale hydraulique',
    methodCode: 'LIFT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        accessoireClient(CODE_TRAVAIL),
        accessoireEquipment([
          { key: 'manufacturer', label: { fr: 'Fabricant' }, type: 'text', required: true, span: 4 },
          { key: 'identification', label: { fr: 'N° d’identification' }, type: 'text', required: true, span: 4 },
          { key: 'type', label: { fr: 'Type' }, type: 'text', required: false, span: 4 },
          { key: 'maxPressure', label: { fr: 'Pression maximale' }, type: 'number', required: false, unit: 'bar', decimals: 0, span: 4 },
          { key: 'tankCapacity', label: { fr: 'Capacité du réservoir' }, type: 'number', required: false, unit: 'L', decimals: 0, span: 4 },
          { key: 'motorPower', label: { fr: 'Puissance du moteur' }, type: 'number', required: false, unit: 'kW', decimals: 1, span: 4 },
        ]),
        ...ACCESSOIRE_FIN,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F35 — STOP-CHUTE
   *
   *  Visé par le seul chef du service EILM, « fait à Mohammedia », et non
   *  par le binôme inspecteur / direction des autres rapports.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F35',
    version: '00',
    title: 'Rapport de vérification — stop-chute',
    methodCode: 'HEIGHT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'client',
          label: { fr: 'Références client' },
          type: 'keyvalue',
          repeatable: false,
          reference: 'Référence réglementaire : Code du travail marocain, art. 281 et 282 (maintien en état des équipements) ; EN 360.',
          fields: [
            { key: 'establishment', label: { fr: 'Établissement' }, type: 'ref', required: true, autofill: 'client', span: 6 },
            { key: 'address', label: { fr: 'Adresse' }, type: 'text', required: false, span: 6 },
            { key: 'location', label: { fr: 'Lieu d’intervention' }, type: 'ref', required: true, autofill: 'site', span: 6 },
            { key: 'inspector', label: { fr: 'Inspecteur chargé de mission' }, type: 'ref', required: true, autofill: 'inspector', span: 6 },
            { key: 'nature', label: { fr: 'Nature de la vérification' }, type: 'enum', required: true, options: ['Vérification générale périodique', 'Mise en service', 'Remise en service'], span: 6 },
            { key: 'contact', label: { fr: 'Interlocuteur sur place' }, type: 'text', required: false, span: 6 },
            { key: 'date', label: { fr: 'Date de la vérification' }, type: 'date', required: true, autofill: 'date', span: 6 },
            { key: 'nextInspection', label: { fr: 'Prochaine vérification' }, type: 'date', required: false, span: 6 },
          ],
        },
        {
          key: 'equipment',
          label: { fr: 'Identification de l’équipement' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'placement', label: { fr: 'Implantation' }, type: 'text', required: false, span: 6 },
            { key: 'description', label: { fr: 'Description' }, type: 'textarea', required: false, span: 12 },
            { key: 'manufacturer', label: { fr: 'Fabricant' }, type: 'text', required: true, span: 4 },
            { key: 'serialNumber', label: { fr: 'Numéro de série' }, type: 'text', required: true, span: 4 },
            { key: 'capacity', label: { fr: 'Capacité maximale d’utilisation (CMU)' }, type: 'number', required: true, unit: 'kg', decimals: 0, span: 4 },
            { key: 'year', label: { fr: 'Année de fabrication' }, type: 'number', required: false, decimals: 0, span: 4 },
            { key: 'cableDiameter', label: { fr: 'Diamètre du câble' }, type: 'number', required: false, unit: 'mm', decimals: 1, span: 4 },
            { key: 'cableLength', label: { fr: 'Longueur du câble' }, type: 'number', required: false, unit: 'm', decimals: 1, span: 4 },
          ],
        },
        EILM_OBSERVATIONS,
        EILM_CONCLUSION,
        EILM_PHOTOS,
        {
          key: 'signatures',
          label: { fr: 'Visa' },
          type: 'signature-matrix',
          repeatable: false,
          reference: 'Fait à Mohammedia.',
          signatories: [{ fr: 'Chef du service EILM' }],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F16 — ÉCHAFAUDAGE ROULANT
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F16',
    version: '00',
    title: 'Rapport de vérification — échafaudage roulant',
    methodCode: 'HEIGHT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        accessoireClient('Arrêté viziriel du 02/04/1952 ; norme NF EN 1004.', { ville: false }),
        accessoireEquipment([
          { key: 'manufacturer', label: { fr: 'Fabricant' }, type: 'text', required: true, span: 4 },
          { key: 'type', label: { fr: 'Type' }, type: 'text', required: false, span: 4 },
          { key: 'clientRef', label: { fr: 'Repère client' }, type: 'text', required: false, span: 4 },
          { key: 'erector', label: { fr: 'Monteur' }, type: 'text', required: false, span: 4 },
          { key: 'calculationNote', label: { fr: 'Note de calcul' }, type: 'text', required: false, span: 4 },
          { key: 'assemblyPlan', label: { fr: 'Plan du montage' }, type: 'text', required: false, span: 4 },
          { key: 'width', label: { fr: 'Largeur' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 4 },
          { key: 'height', label: { fr: 'Hauteur' }, type: 'number', required: true, unit: 'm', decimals: 2, span: 4 },
          { key: 'length', label: { fr: 'Longueur' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 4 },
          { key: 'class', label: { fr: 'Classe' }, type: 'text', required: false, span: 4 },
          { key: 'load', label: { fr: 'Charge' }, type: 'number', required: false, unit: 'daN/m²', decimals: 0, span: 4 },
          { key: 'stabilisers', label: { fr: 'Nombre de stabilisateurs' }, type: 'number', required: false, decimals: 0, span: 4 },
        ]),
        echafaudageChecks('Plans de montage'),
        ...ACCESSOIRE_FIN,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F18 — PLATEFORME INDIVIDUELLE ROULANTE
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F18',
    version: '00',
    title: 'Rapport de vérification — plateforme individuelle roulante',
    methodCode: 'HEIGHT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        accessoireClient(
          'Code du travail marocain, art. 287 (maintien en bon état des équipements de travail) ; norme NF P 93-353.',
          { interlocuteur: false },
        ),
        accessoireEquipment([
          { key: 'manufacturer', label: { fr: 'Fabricant' }, type: 'text', required: true, span: 4 },
          { key: 'clientRef', label: { fr: 'Repère client' }, type: 'text', required: false, span: 4 },
          { key: 'height', label: { fr: 'Hauteur' }, type: 'number', required: true, unit: 'm', decimals: 2, span: 4 },
          { key: 'capacity', label: { fr: 'Charge maximale d’utilisation (CMU)' }, type: 'number', required: true, unit: 'kg', decimals: 0, span: 4 },
          { key: 'floorLevels', label: { fr: 'Nombre de niveaux de planchers' }, type: 'number', required: false, decimals: 0, span: 4 },
          { key: 'stabilisers', label: { fr: 'Nombre de stabilisateurs' }, type: 'number', required: false, decimals: 0, span: 4 },
        ]),
        echafaudageChecks('Plans de montage'),
        ...ACCESSOIRE_FIN,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F19 — ÉCHAFAUDAGE FIXE
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F19',
    version: '00',
    title: 'Rapport de vérification — échafaudage fixe',
    methodCode: 'HEIGHT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        accessoireClient('Arrêté viziriel du 02/04/1952 ; norme NF EN 12811-1 et -2.', {
          interlocuteur: false,
          champs: [{ key: 'works', label: { fr: 'Nature des travaux' }, type: 'text', required: false, span: 4 }],
        }),
        accessoireEquipment([
          { key: 'manufacturer', label: { fr: 'Fabricant' }, type: 'text', required: true, span: 4 },
          { key: 'erector', label: { fr: 'Monteur' }, type: 'text', required: false, span: 4 },
          { key: 'identification', label: { fr: 'N° d’identification' }, type: 'text', required: true, span: 4 },
          { key: 'clientRef', label: { fr: 'Repère client' }, type: 'text', required: false, span: 4 },
          { key: 'width', label: { fr: 'Largeur' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 4 },
          { key: 'height', label: { fr: 'Hauteur' }, type: 'number', required: true, unit: 'm', decimals: 2, span: 4 },
          { key: 'length', label: { fr: 'Longueur' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 4 },
          { key: 'class', label: { fr: 'Classe' }, type: 'text', required: false, span: 4 },
          { key: 'scaffoldLoad', label: { fr: 'Charge de l’échafaudage' }, type: 'number', required: false, unit: 'daN/m²', decimals: 0, span: 4 },
          { key: 'floorLoad', label: { fr: 'Charge des planchers' }, type: 'number', required: false, unit: 'daN/m²', decimals: 0, span: 4 },
          { key: 'floorLevels', label: { fr: 'Nombre de niveaux de planchers équipés' }, type: 'number', required: false, decimals: 0, span: 4 },
          { key: 'bays', label: { fr: 'Nombre de travées' }, type: 'number', required: false, decimals: 0, span: 4 },
          { key: 'ties', label: { fr: 'Nombre d’amarrages' }, type: 'number', required: false, decimals: 0, span: 4 },
        ]),
        echafaudageChecks('Notes de calcul et plans de montage'),
        ...ACCESSOIRE_FIN,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F17 — VÉRIFICATION DE LIGNE DE VIE
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F17',
    version: '00',
    title: 'Rapport de vérification — ligne de vie',
    methodCode: 'HEIGHT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        accessoireClient(CODE_TRAVAIL, { ville: false }),
        {
          key: 'equipment',
          label: { fr: 'Identification de l’équipement' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'placement', label: { fr: 'Implantation' }, type: 'text', required: true, span: 6 },
            { key: 'class', label: { fr: 'Classe' }, type: 'text', required: false, span: 6 },
            { key: 'description', label: { fr: 'Description' }, type: 'textarea', required: false, span: 12 },
            { key: 'installer', label: { fr: 'Installateur' }, type: 'text', required: false, span: 4 },
            { key: 'maxUsers', label: { fr: 'Nombre d’utilisateurs maximal' }, type: 'number', required: true, decimals: 0, span: 4 },
            { key: 'commissioningDate', label: { fr: 'Date de mise en service' }, type: 'date', required: false, span: 4 },
            { key: 'lastInspection', label: { fr: 'Date du dernier contrôle' }, type: 'date', required: false, span: 6 },
            { key: 'lastBody', label: { fr: 'Nom du dernier organisme' }, type: 'text', required: false, span: 6 },
          ],
        },
        {
          key: 'checks',
          label: { fr: 'Vérifications et inspections' },
          type: 'checklist',
          repeatable: false,
          help: EILM_CHECKS_HELP,
          groups: [
            {
              key: 'documents',
              label: { fr: 'Montage et installation — documents relatifs au montage et à l’installation' },
              points: [
                { key: 'assembly-manual', label: { fr: 'Notice de montage' } },
                { key: 'calculation-note', label: { fr: 'Note de calcul' } },
              ],
            },
            {
              key: 'assembly',
              label: { fr: 'Montage et installation — examen relatif au montage' },
              points: [
                { key: 'connectors', label: { fr: 'État général des connecteurs' } },
                { key: 'anchor-plates', label: { fr: 'Platines d’accrochage des ancres structurelles terminales' } },
                { key: 'end-anchors', label: { fr: 'Ancres structurelles terminales' } },
                { key: 'tensioner', label: { fr: 'Tendeur' } },
                { key: 'pretension-washer', label: { fr: 'Rondelle de prétension' } },
                { key: 'tensioner-thimble', label: { fr: 'Cosse-cœur du câble au niveau du tendeur' } },
                { key: 'cable-clamps', label: { fr: 'Serre-câbles' } },
                { key: 'cable', label: { fr: 'État général du câble' } },
                { key: 'absorber-thimble', label: { fr: 'Cosse-cœur au niveau de l’absorbeur' } },
                { key: 'absorber', label: { fr: 'Absorbeur' } },
              ],
            },
            {
              key: 'misc',
              label: { fr: 'Dispositions diverses' },
              points: [
                { key: 'safety-notice', label: { fr: 'Affichage des consignes de sécurité' } },
                { key: 'sign', label: { fr: 'Panonceau de signalisation' } },
              ],
            },
          ],
        },
        EILM_CONCLUSION,
        EILM_OBSERVATIONS,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F15 — MISE EN SERVICE DE LIGNE DE VIE
   *
   *  Compte rendu d'examen plutôt que rapport de vérification : il expose
   *  la mission, ses limites, puis l'examen documentaire, de montage et
   *  l'essai sur site selon l'annexe A de la NF EN 795. Les lettres entre
   *  parenthèses sont celles du modèle et disent comment chaque point est
   *  contrôlé.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F15',
    version: '00',
    title: 'Compte rendu d’examen — mise en service de ligne de vie',
    methodCode: 'HEIGHT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'header',
          label: { fr: 'Rapport d’examen' },
          type: 'keyvalue',
          repeatable: false,
          reference: 'Code du travail, art. 281 et 282 ; essais selon l’annexe A de la NF EN 795:2012 (hors dispositifs de types B et E) ; règlements (UE) 2016/425 et 305/2011, décision déléguée (UE) 2018/771.',
          fields: [
            { key: 'client', label: { fr: 'Client' }, type: 'ref', required: true, autofill: 'client', span: 4 },
            { key: 'affairNumber', label: { fr: 'N° d’affaire' }, type: 'ref', required: true, autofill: 'affairNumber', span: 4 },
            { key: 'date', label: { fr: 'Date de contrôle' }, type: 'date', required: true, autofill: 'date', span: 4 },
            { key: 'reportNumber', label: { fr: 'N° de compte rendu' }, type: 'text', required: false, span: 4 },
            { key: 'phase', label: { fr: 'Phase d’exécution' }, type: 'text', required: false, span: 4 },
            { key: 'affair', label: { fr: 'Affaire' }, type: 'text', required: false, span: 4 },
            { key: 'documents', label: { fr: 'Documents examinés' }, type: 'textarea', required: false, span: 12 },
          ],
        },
        {
          key: 'installation',
          label: { fr: 'Caractéristiques générales de l’installation' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'address', label: { fr: 'Adresse du lieu d’implantation' }, type: 'text', required: true, span: 6 },
            { key: 'placement', label: { fr: 'Lieu d’implantation' }, type: 'text', required: true, span: 6 },
            { key: 'installer', label: { fr: 'Installateur' }, type: 'text', required: false, span: 6 },
            { key: 'lifeline', label: { fr: 'Ligne de vie' }, type: 'text', required: false, span: 6 },
            { key: 'length', label: { fr: 'Longueur de la ligne de vie' }, type: 'number', required: false, unit: 'm', decimals: 1, span: 4 },
            { key: 'equipment', label: { fr: 'Équipement de chaque ligne' }, type: 'text', required: false, span: 4 },
            { key: 'structure', label: { fr: 'Structure' }, type: 'text', required: false, span: 4 },
            { key: 'supports', label: { fr: 'Supports' }, type: 'text', required: false, span: 12 },
            { key: 'layout', label: { fr: 'Plan d’implantation — description' }, type: 'textarea', required: false, span: 12 },
          ],
        },
        {
          key: 'measures',
          label: { fr: 'Valeurs relevées à l’examen documentaire' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'maxLoad', label: { fr: 'Charge maximale transmise à la structure d’accueil (type C)' }, type: 'number', required: false, unit: 'daN', decimals: 0, span: 4 },
            { key: 'maxAngle', label: { fr: 'Angle maximal d’utilisation par rapport à l’horizontale' }, type: 'number', required: false, unit: '°', decimals: 0, span: 4 },
            { key: 'maxDeflection', label: { fr: 'Flèche maximale indiquée' }, type: 'number', required: false, unit: 'mm', decimals: 0, span: 4 },
          ],
        },
        {
          key: 'checks',
          label: { fr: 'Examen documentaire, examen de montage, essai sur site' },
          type: 'checklist',
          repeatable: false,
          help: EILM_CHECKS_HELP,
          groups: [
            {
              key: 'instructions',
              label: { fr: '6.1 — Instruction relative à l’installation (P)' },
              qualifier: 'Examen documentaire',
              points: [
                { key: 'address', label: { fr: 'a — Adresse' } },
                { key: 'product-id', label: { fr: 'b — Identification du produit (fabricant, type, référence)' } },
                { key: 'diagram', label: { fr: 'c — Plan schématique, nomenclature des pièces' } },
                { key: 'performance', label: { fr: 'd — Attestation de performance ou essai de type du dispositif d’ancrage' } },
                { key: 'max-load', label: { fr: 'e — Charge maximale transmise à la structure d’accueil (type C)' } },
                { key: 'max-angle', label: { fr: 'f — Angle maximal par rapport à l’horizontale d’utilisation (types C et D)' } },
                { key: 'installer-cert', label: { fr: 'g — Attestation de bonne réalisation du montage de l’installateur (P)' } },
              ],
            },
            {
              key: 'host-structure',
              label: { fr: '6.2 — Aptitude de la structure d’accueil (P)' },
              points: [
                { key: 'structure-proof', label: { fr: 'Document justifiant de l’aptitude de la structure d’accueil à recevoir ce dispositif' } },
              ],
            },
            {
              key: 'use-instructions',
              label: { fr: '6.3 — Instructions d’emploi (P)' },
              points: [
                { key: 'use', label: { fr: 'Nombre de personnes, tirant d’air, antichute utilisable, critère de vérification, composant à remplacer' } },
              ],
            },
            {
              key: 'assembly',
              label: { fr: '6.4 — Montage' },
              points: [
                { key: 'positioning', label: { fr: 'a — Positionnement (R)' } },
                { key: 'components-choice', label: { fr: 'b — Choix des composants (P)' } },
                { key: 'components-assembly', label: { fr: 'c — Assemblage des composants (R-E)' } },
              ],
            },
            {
              key: 'fitting',
              label: { fr: '6.5 — Pose des composants' },
              points: [
                { key: 'immobilisation', label: { fr: 'a — Dispositif d’immobilisation (R-E)' } },
                { key: 'anchor-test', label: { fr: 'b — Ancres structurelles (F) : traction à la valeur du constructeur, ou 500 daN pendant 15 s' } },
              ],
            },
            {
              key: 'misc',
              label: { fr: '6.6 — Dispositions diverses (P-E)' },
              points: [
                { key: 'manufacturer', label: { fr: 'Nom du fabricant' } },
                { key: 'model', label: { fr: 'Identification, modèle, type' } },
                { key: 'reference-doc', label: { fr: 'Identification du document de référence' } },
                { key: 'user-info', label: { fr: 'Information exploitable par l’utilisateur' } },
              ],
            },
            {
              key: 'instructions-posted',
              label: { fr: '6.7 — Consignes (P)' },
              points: [
                { key: 'pictograms', label: { fr: 'Pictogrammes ou informations dans la langue du pays (nombre maximal d’utilisateurs, type de connecteur, tirant d’air)' } },
                { key: 'access-notice', label: { fr: 'Consigne apposée au niveau de chacun des accès (types C et D)' } },
              ],
            },
          ],
        },
        EILM_CONCLUSION,
        EILM_OBSERVATIONS,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F13 — THERMOGRAPHIE INFRAROUGE DES ARMOIRES ÉLECTRIQUES
   *
   *  Seul rapport EILM à mesures : l'inventaire des armoires contrôlées
   *  (annexe I), puis une fiche par anomalie (annexe II) avec les
   *  températures relevées et la classe de défaut qui en découle. Le
   *  rapport est consultatif et distinct de la vérification réglementaire
   *  des installations électriques (F14).
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F13',
    version: '00',
    title: 'Rapport de thermographie infrarouge des armoires électriques',
    methodCode: 'THERMO',
    paradigm: 'MEASUREMENT',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'header',
          label: { fr: 'Références de la visite' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'client', label: { fr: 'Client' }, type: 'ref', required: true, autofill: 'client', span: 6 },
            { key: 'clientAddress', label: { fr: 'Adresse du client' }, type: 'text', required: false, span: 6 },
            { key: 'object', label: { fr: 'Objet' }, type: 'text', required: false, span: 6 },
            { key: 'orderNumber', label: { fr: 'Commande n°' }, type: 'text', required: false, span: 6 },
            { key: 'date', label: { fr: 'Date de visite' }, type: 'date', required: true, autofill: 'date', span: 4 },
            { key: 'location', label: { fr: 'Lieu d’intervention' }, type: 'ref', required: true, autofill: 'site', span: 4 },
            { key: 'inspector', label: { fr: 'Visite effectuée par' }, type: 'ref', required: true, autofill: 'inspector', span: 4 },
            { key: 'accompaniedBy', label: { fr: 'Accompagné par' }, type: 'text', required: false, span: 6 },
            { key: 'periodicity', label: { fr: 'Périodicité retenue' }, type: 'enum', required: true, options: ['Annuelle', 'Ponctuelle', 'Autre'], span: 6 },
          ],
        },
        {
          key: 'equipment',
          label: { fr: 'Équipement d’inspection' },
          type: 'devices',
          repeatable: false,
          minRows: 1,
          help: 'Caméra infrarouge et pince ampèremétrique. Un appareil hors étalonnage à la date de la visite empêche la soumission du rapport.',
          fields: [
            { key: 'device', label: { fr: 'Appareil' }, type: 'device', required: true, span: 12 },
          ],
        },
        {
          key: 'inventory',
          label: { fr: 'Annexe I — Liste des équipements contrôlés' },
          type: 'table',
          repeatable: true,
          minRows: 1,
          help: 'Sur la base de la liste fournie par le client ; à défaut, les armoires et coffrets accessibles et présentés lors de la visite.',
          columns: [
            { key: 'equipment', label: { fr: 'Localisation, nature et désignation du matériel' }, type: 'text', required: true, span: 6 },
            { key: 'anomaly', label: { fr: 'Présence d’anomalies' }, type: 'enum', required: true, options: ['Oui', 'Non'], span: 2 },
            { key: 'remarks', label: { fr: 'Remarques' }, type: 'text', required: false, span: 4 },
          ],
        },
        {
          key: 'thermograms',
          label: { fr: 'Annexe II — Fiches de contrôle thermographique' },
          type: 'table',
          repeatable: true,
          minRows: 0,
          help: 'Une fiche par anomalie. ΔT = Tc − Tr. Classe 1 : ΔT > 35 °C · classe 2 : 10 °C < ΔT ≤ 35 °C · classe 3 : 0 °C < ΔT ≤ 10 °C. Urgence 1 : réparation immédiate · 2 : réparation à prévoir · 3 : à surveiller régulièrement.',
          columns: [
            { key: 'locality', label: { fr: 'Localité' }, type: 'text', required: true, span: 1 },
            { key: 'equipment', label: { fr: 'Équipement' }, type: 'text', required: true, span: 1 },
            { key: 'mark', label: { fr: 'Repère' }, type: 'text', required: false, span: 1 },
            { key: 'distance', label: { fr: 'Distance de focalisation' }, type: 'number', required: false, unit: 'm', decimals: 1, span: 1 },
            { key: 'emissivity', label: { fr: 'Émissivité ε' }, type: 'number', required: true, decimals: 2, min: 0, max: 1, span: 1 },
            { key: 'tr', label: { fr: 'Température normale Tr' }, type: 'number', required: true, unit: '°C', decimals: 1, span: 1 },
            { key: 'tc', label: { fr: 'Température composant chaud Tc' }, type: 'number', required: true, unit: '°C', decimals: 1, span: 1 },
            { key: 'deltaT', label: { fr: 'ΔT = Tc − Tr' }, type: 'number', required: true, unit: '°C', decimals: 1, span: 1 },
            { key: 'defectClass', label: { fr: 'Classe de défaut' }, type: 'enum', required: true, options: ['1', '2', '3'], span: 1 },
            { key: 'urgency', label: { fr: 'Degré d’urgence' }, type: 'enum', required: true, options: ['1 — Réparation immédiate', '2 — Réparation à prévoir', '3 — À surveiller régulièrement'], span: 2 },
            { key: 'finding', label: { fr: 'Constat' }, type: 'text', required: false, span: 1 },
          ],
        },
        {
          key: 'photos',
          label: { fr: 'Images thermiques et visibles' },
          type: 'photos',
          repeatable: true,
          minRows: 0,
          help: 'Pour chaque fiche, le thermogramme et la photographie de la zone, pour localiser le défaut.',
        },
        EILM_OBSERVATIONS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F22 — POSTE DE SOUDURE
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F22',
    version: '00',
    title: 'Rapport de vérification — poste de soudure',
    methodCode: 'ELEC',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        accessoireClient(CODE_TRAVAIL, { ville: false }),
        {
          key: 'equipment',
          label: { fr: 'Identification de l’équipement' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'designation', label: { fr: 'Désignation' }, type: 'text', required: true, span: 6 },
            { key: 'manufacturer', label: { fr: 'Constructeur' }, type: 'text', required: true, span: 6 },
            { key: 'type', label: { fr: 'Type' }, type: 'text', required: false, span: 4 },
            { key: 'identification', label: { fr: 'N° d’identification' }, type: 'text', required: true, span: 4 },
            { key: 'maxPower', label: { fr: 'Puissance maximale' }, type: 'number', required: false, unit: 'kW', decimals: 1, span: 4 },
            { key: 'ratedVoltage', label: { fr: 'Tension nominale' }, type: 'number', required: false, unit: 'V', decimals: 0, span: 4 },
            { key: 'openCircuitVoltage', label: { fr: 'Tension à vide' }, type: 'number', required: false, unit: 'V', decimals: 0, span: 4 },
            { key: 'maxWeldingCurrent', label: { fr: 'Courant maximal de soudage' }, type: 'number', required: false, unit: 'A', decimals: 0, span: 4 },
            { key: 'ratedSupplyCurrent', label: { fr: 'Courant nominal d’alimentation' }, type: 'number', required: false, unit: 'A', decimals: 1, span: 4 },
            { key: 'frequency', label: { fr: 'Fréquence' }, type: 'number', required: false, unit: 'Hz', decimals: 0, span: 4 },
            { key: 'insulationClass', label: { fr: 'Classe d’isolation' }, type: 'text', required: false, span: 4 },
            { key: 'ipRating', label: { fr: 'Indice de protection (IP)' }, type: 'text', required: false, span: 4 },
            { key: 'year', label: { fr: 'Année de fabrication' }, type: 'number', required: false, decimals: 0, span: 4 },
          ],
        },
        ...ACCESSOIRE_FIN,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F37 — MISE EN SERVICE DE PALONNIER
   *
   *  Pas de check-list : la mise en service se prononce sur l'essai statique
   *  à 150 % de la CMU pendant 15 minutes.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F37',
    version: '00',
    title: 'Rapport de mise en service — palonnier',
    methodCode: 'LIFT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'client',
          label: { fr: 'Références client' },
          type: 'keyvalue',
          repeatable: false,
          reference: 'Référence réglementaire : arrêté viziriel du 09/09/1953 et arrêté du 03/11/1953.',
          fields: [
            { key: 'establishment', label: { fr: 'Établissement' }, type: 'ref', required: true, autofill: 'client', span: 6 },
            { key: 'address', label: { fr: 'Adresse' }, type: 'text', required: false, span: 6 },
            { key: 'nature', label: { fr: 'Nature de la vérification' }, type: 'enum', required: true, options: ['Mise en service', 'Remise en service'], span: 4 },
            { key: 'location', label: { fr: 'Lieu d’intervention' }, type: 'ref', required: true, autofill: 'site', span: 4 },
            { key: 'inspector', label: { fr: 'Intervenant' }, type: 'ref', required: true, autofill: 'inspector', span: 4 },
            { key: 'date', label: { fr: 'Date de la vérification' }, type: 'date', required: true, autofill: 'date', span: 4 },
          ],
        },
        {
          key: 'equipment',
          label: { fr: 'Caractéristiques de l’appareil' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'designation', label: { fr: 'Désignation' }, type: 'text', required: true, span: 6 },
            { key: 'manufacturer', label: { fr: 'Constructeur' }, type: 'text', required: true, span: 6 },
            { key: 'identification', label: { fr: 'N° d’identification' }, type: 'text', required: true, span: 4 },
            { key: 'length', label: { fr: 'Longueur' }, type: 'number', required: false, unit: 'mm', decimals: 0, span: 4 },
            { key: 'width', label: { fr: 'Largeur' }, type: 'number', required: false, unit: 'mm', decimals: 0, span: 4 },
            { key: 'height', label: { fr: 'Hauteur' }, type: 'number', required: false, unit: 'mm', decimals: 0, span: 4 },
            { key: 'calculationBy', label: { fr: 'Note de calcul établie par' }, type: 'text', required: false, span: 4 },
            { key: 'emptyWeight', label: { fr: 'Poids à vide' }, type: 'number', required: false, unit: 'kg', decimals: 0, span: 4 },
            { key: 'lugs', label: { fr: 'Nombre d’oreilles de levage' }, type: 'number', required: false, decimals: 0, span: 4 },
            { key: 'capacity', label: { fr: 'Charge maximale d’utilisation (CMU)' }, type: 'number', required: true, unit: 'kg', decimals: 0, span: 4 },
            { key: 'year', label: { fr: 'Année de fabrication' }, type: 'number', required: false, decimals: 0, span: 4 },
          ],
        },
        {
          key: 'tests',
          label: { fr: 'Compte rendu des épreuves' },
          type: 'table',
          repeatable: true,
          minRows: 1,
          help: 'Essai statique : charge d’essai à 150 % de la CMU, maintenue 15 minutes.',
          columns: [
            { key: 'kind', label: { fr: 'Nature de l’essai' }, type: 'enum', required: true, options: ['Essai statique', 'Essai dynamique'], span: 3 },
            { key: 'capacity', label: { fr: 'CMU du palonnier' }, type: 'number', required: true, unit: 'kg', decimals: 0, span: 2 },
            { key: 'height', label: { fr: 'Hauteur' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 2 },
            { key: 'duration', label: { fr: 'Durée' }, type: 'number', required: true, unit: 'min', decimals: 0, span: 1 },
            { key: 'coefficient', label: { fr: 'Coefficient d’essai' }, type: 'number', required: true, unit: '%', decimals: 0, span: 2 },
            { key: 'testLoad', label: { fr: 'Charge d’essai' }, type: 'number', required: true, unit: 'kg', decimals: 0, span: 2 },
          ],
        },
        EILM_CONCLUSION,
        EILM_OBSERVATIONS,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F36 — CERTIFICAT ANNUEL D'INSTALLATION ÉLECTRIQUE
   *
   *  Attestation destinée à l'assureur, émise sur la foi d'un rapport de
   *  vérification détaillé (F14) : elle ne reprend pas les points de
   *  contrôle, seulement les textes visés et les observations par rubrique.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F36',
    version: '00',
    title: 'Certificat annuel de vérification d’installation électrique',
    methodCode: 'ELEC',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'establishment',
          label: { fr: 'Identification de l’établissement' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'establishment', label: { fr: 'Établissement' }, type: 'ref', required: true, autofill: 'client', span: 6 },
            { key: 'address', label: { fr: 'Adresse' }, type: 'text', required: true, span: 6 },
            { key: 'situation', label: { fr: 'Situation de l’établissement' }, type: 'text', required: false, span: 6 },
            { key: 'riskNature', label: { fr: 'Nature du risque' }, type: 'text', required: true, span: 6 },
          ],
        },
        {
          key: 'references',
          label: { fr: 'Textes réglementaires de référence' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            // Deux cases, comme au modèle : le type « multi-enum » du contrat
            // n'a pas encore de rendu et s'afficherait en texte libre.
            { key: 'decree1938', label: { fr: 'Arrêté viziriel du 28/06/1938' }, type: 'boolean', required: false, span: 12 },
            { key: 'decrees1967_1971', label: { fr: 'Arrêtés viziriels du 15/07/1967 et du 02/10/1971 relatifs aux installations de 1re et 2e catégories' }, type: 'boolean', required: false, span: 12 },
          ],
        },
        {
          key: 'attestation',
          label: { fr: 'Attestation de conformité' },
          type: 'keyvalue',
          repeatable: false,
          reference: 'I2S TESTING, organisme vérificateur agréé, déclare avoir vérifié l’installation électrique du risque déclaré par l’assuré, que cette vérification a donné lieu à un rapport détaillé remis à l’assuré, qu’elle n’a révélé aucune non-conformité majeure à la réglementation marocaine, et atteste que l’installation est conforme aux textes visés. Attestation établie pour servir et valoir ce que de droit.',
          fields: [
            { key: 'detailedReport', label: { fr: 'Rapport de vérification détaillé' }, type: 'text', required: false, span: 6 },
            { key: 'periodicity', label: { fr: 'Périodicité de contrôle' }, type: 'enum', required: true, options: ['1 an'], span: 3 },
            { key: 'date', label: { fr: 'Fait à Mohammedia, le' }, type: 'date', required: true, autofill: 'date', span: 3 },
          ],
        },
        {
          key: 'observations',
          label: { fr: 'Observations' },
          type: 'text',
          repeatable: false,
          fields: [
            { key: 'hvDesign', label: { fr: 'A — Conception et réalisation : installations HTA' }, type: 'textarea', required: false, span: 12 },
            { key: 'lvDesign', label: { fr: 'A — Conception et réalisation : installations BT' }, type: 'textarea', required: false, span: 12 },
            { key: 'fireProtection', label: { fr: 'B — Protection et adaptation contre les risques d’incendie d’origine électrique' }, type: 'textarea', required: false, span: 12 },
            { key: 'insulation', label: { fr: 'C — Isolement' }, type: 'textarea', required: false, span: 12 },
            { key: 'earthing', label: { fr: 'D — Prise de terre' }, type: 'textarea', required: false, span: 12 },
            { key: 'maintenance', label: { fr: 'E — Entretien' }, type: 'textarea', required: false, span: 12 },
            { key: 'safetyEquipment', label: { fr: 'F — Matériel de sécurité' }, type: 'textarea', required: false, span: 12 },
            { key: 'other', label: { fr: 'G — Autres observations' }, type: 'textarea', required: false, span: 12 },
          ],
        },
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F33 — CONTRÔLE DE PROTECTION CATHODIQUE
   *
   *  Rapport de mesures : relevés au redresseur puis potentiels pipe/sol
   *  par prise et par joint isolant. Le modèle Word est la copie d'un
   *  rapport réel — ses lignes nommaient les joints d'un site client ; les
   *  prises sont ici saisies librement, une ligne chacune.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F33',
    version: '00',
    title: 'Rapport de contrôle du système de protection cathodique',
    methodCode: 'ELEC',
    paradigm: 'MEASUREMENT',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'header',
          label: { fr: 'Prestation' },
          type: 'keyvalue',
          repeatable: false,
          reference: 'Contrôle du système de protection cathodique des canalisations enterrées.',
          fields: [
            { key: 'client', label: { fr: 'Client' }, type: 'ref', required: true, autofill: 'client', span: 6 },
            { key: 'location', label: { fr: 'Lieu de contrôle' }, type: 'ref', required: true, autofill: 'site', span: 6 },
            { key: 'date', label: { fr: 'Date d’intervention' }, type: 'date', required: true, autofill: 'date', span: 4 },
            { key: 'pipeline', label: { fr: 'Conduite contrôlée' }, type: 'text', required: true, span: 8 },
            { key: 'installationReport', label: { fr: 'Rapport décrivant l’installation' }, type: 'text', required: false, span: 12 },
          ],
        },
        {
          key: 'context',
          label: { fr: 'Introduction et description de l’installation' },
          type: 'text',
          repeatable: false,
          fields: [
            { key: 'purpose', label: { fr: 'Buts du contrôle' }, type: 'textarea', required: false, span: 12 },
            { key: 'description', label: { fr: 'Description de l’installation' }, type: 'textarea', required: false, span: 12 },
            { key: 'measures', label: { fr: 'Mesures et vérifications réalisées' }, type: 'textarea', required: false, span: 12 },
          ],
        },
        {
          key: 'rectifier',
          label: { fr: 'Mesures au redresseur de protection cathodique' },
          type: 'conditions',
          repeatable: false,
          fields: [
            { key: 'anodeBed', label: { fr: 'Dispositif anodique' }, type: 'text', required: false, span: 6 },
            { key: 'rectifier', label: { fr: 'Redresseur' }, type: 'text', required: true, span: 6 },
            { key: 'voltageDisplayed', label: { fr: 'Tension affichée' }, type: 'number', required: false, unit: 'V', decimals: 1, span: 4 },
            { key: 'currentDisplayed', label: { fr: 'Courant affiché' }, type: 'number', required: false, unit: 'A', decimals: 2, span: 4 },
            { key: 'potentialDisplayed', label: { fr: 'Potentiel affiché' }, type: 'number', required: false, unit: 'mV', decimals: 0, span: 4 },
            { key: 'voltageMeasured', label: { fr: 'Tension mesurée' }, type: 'number', required: true, unit: 'V', decimals: 1, span: 4 },
            { key: 'currentMeasured', label: { fr: 'Courant mesuré' }, type: 'number', required: true, unit: 'A', decimals: 2, span: 4 },
            { key: 'potentialMeasured', label: { fr: 'Potentiel mesuré' }, type: 'number', required: true, unit: 'mV', decimals: 0, span: 4 },
          ],
        },
        {
          key: 'potentials',
          label: { fr: 'Annexe 1 — Mesures des potentiels' },
          type: 'table',
          repeatable: true,
          minRows: 1,
          help: 'Potentiels pipeline/sol référés à l’électrode Cu/CuSO₄, en millivolts.',
          columns: [
            { key: 'point', label: { fr: 'Prise n° ou joint isolant' }, type: 'text', required: true, span: 3 },
            { key: 'on', label: { fr: 'Potentiel pipe ON' }, type: 'number', required: false, unit: 'mV', decimals: 0, span: 1 },
            { key: 'off', label: { fr: 'Potentiel pipe OFF' }, type: 'number', required: false, unit: 'mV', decimals: 0, span: 1 },
            { key: 'aboveGround', label: { fr: 'Joint isolant — côté aérien' }, type: 'number', required: false, unit: 'mV', decimals: 0, span: 2 },
            { key: 'buried', label: { fr: 'Joint isolant — côté enterré' }, type: 'number', required: false, unit: 'mV', decimals: 0, span: 2 },
            { key: 'observations', label: { fr: 'Observations' }, type: 'text', required: false, span: 3 },
          ],
        },
        {
          key: 'conclusions',
          label: { fr: 'Interprétation, recommandations et conclusions' },
          type: 'text',
          repeatable: false,
          fields: [
            { key: 'interpretation', label: { fr: 'Interprétation des mesures et recommandations' }, type: 'textarea', required: true, span: 12 },
            { key: 'conclusions', label: { fr: 'Conclusions' }, type: 'textarea', required: true, span: 12 },
          ],
        },
        EILM_PHOTOS,
        {
          key: 'signatures',
          label: { fr: 'Visa' },
          type: 'signature-matrix',
          repeatable: false,
          reference: 'Fait à Mohammedia.',
          signatories: [{ fr: 'Chef du service EILM' }],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F14 — VÉRIFICATION DES INSTALLATIONS ÉLECTRIQUES (version 01)
   *
   *  Le plus volumineux des rapports EILM : points réglementaires, relevé
   *  des circuits, poste de transformation, groupes, puis les mesures
   *  (isolement, différentiels, prises de terre) et le classement des
   *  locaux à risques. C'est la version 01 qui fait foi : elle ajoute aux
   *  arrêtés de 1938, 1967 et 1971 le décret du 17 novembre 2022 et
   *  l'arrêté du 11 octobre 2023.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F14',
    version: '01',
    title: 'Rapport de vérification des installations électriques',
    methodCode: 'ELEC',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'header',
          label: { fr: 'Vérification' },
          type: 'keyvalue',
          repeatable: false,
          reference: 'Vérification effectuée en application de l’arrêté du 28 juin 1938 (protection des travailleurs), des arrêtés du 15/07/1967 et du 02/10/1971 (installations de 1re et 2e catégories), du décret n° 2-22-630 du 17/11/2022 et de l’arrêté n° 2538-23 du 11/10/2023. Normes NM 06-1-102 à 106, NM 06-1-028, NM 06-1-040 ; NF C 15-100, NF C 13-100, NF C 13-200, ou leurs équivalences.',
          fields: [
            { key: 'establishment', label: { fr: 'Établissement' }, type: 'ref', required: true, autofill: 'client', span: 6 },
            { key: 'address', label: { fr: 'Adresse' }, type: 'text', required: false, span: 6 },
            { key: 'nature', label: { fr: 'Nature de la vérification' }, type: 'enum', required: true, options: ['Vérification initiale', 'Vérification périodique'], span: 4 },
            { key: 'periodicity', label: { fr: 'Type de périodicité' }, type: 'enum', required: true, options: ['Annuelle', 'Semestrielle', 'Ponctuelle'], span: 4 },
            { key: 'extent', label: { fr: 'Étendue de la vérification' }, type: 'text', required: false, span: 4 },
            { key: 'inspector', label: { fr: 'Inspecteur' }, type: 'ref', required: true, autofill: 'inspector', span: 4 },
            { key: 'location', label: { fr: 'Lieu de contrôle' }, type: 'ref', required: true, autofill: 'site', span: 4 },
            { key: 'date', label: { fr: 'Date d’intervention' }, type: 'date', required: true, autofill: 'date', span: 4 },
            { key: 'activity', label: { fr: 'Activité de l’établissement' }, type: 'text', required: false, span: 6 },
            { key: 'presentPerson', label: { fr: 'Vérification effectuée en présence de' }, type: 'text', required: false, span: 6 },
            { key: 'supervisor', label: { fr: 'Personne chargée de la surveillance de l’installation' }, type: 'text', required: false, span: 6 },
            { key: 'accompaniedBy', label: { fr: 'Accompagnés lors de la vérification par' }, type: 'text', required: false, span: 6 },
          ],
        },
        {
          key: 'establishment',
          label: { fr: 'Caractéristiques de l’établissement' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'mainActivity', label: { fr: 'Activité principale' }, type: 'text', required: false, span: 6 },
            { key: 'supply', label: { fr: 'Source d’alimentation' }, type: 'text', required: true, span: 6 },
            { key: 'indirectContact', label: { fr: 'Protection contre les contacts indirects' }, type: 'text', required: true, span: 6 },
            { key: 'directContact', label: { fr: 'Protection contre les contacts directs' }, type: 'text', required: true, span: 6 },
            { key: 'explosionRooms', label: { fr: 'Locaux à risque d’explosion' }, type: 'text', required: false, span: 6 },
            { key: 'conductiveRooms', label: { fr: 'Locaux conducteurs' }, type: 'text', required: false, span: 6 },
            { key: 'additional', label: { fr: 'Renseignements complémentaires' }, type: 'textarea', required: false, span: 12 },
          ],
        },
        {
          key: 'generalObservations',
          label: { fr: 'Observations générales' },
          type: 'text',
          repeatable: false,
          fields: [
            { key: 'changes', label: { fr: '1 — Changement d’ordre électrique constaté depuis la dernière visite' }, type: 'textarea', required: true, span: 12 },
            { key: 'incidents', label: { fr: '2 — Incidents électriques constatés par l’exploitant depuis la dernière vérification' }, type: 'textarea', required: true, span: 12 },
            { key: 'improvements', label: { fr: '3 — Analyse des améliorations d’ordre électrique constatées' }, type: 'textarea', required: false, span: 12 },
          ],
        },
        {
          key: 'equipment',
          label: { fr: 'Appareils de mesure utilisés' },
          type: 'devices',
          repeatable: false,
          minRows: 1,
          help: 'Un appareil par mesure : continuité, prises de terre, dispositifs différentiels, isolement. Un appareil hors étalonnage empêche la soumission du rapport.',
          fields: [
            { key: 'device', label: { fr: 'Appareil de mesure' }, type: 'device', required: true, span: 12 },
          ],
        },
        {
          key: 'checks',
          label: { fr: 'Points à vérifier' },
          type: 'checklist',
          repeatable: false,
          help: `${EILM_CHECKS_HELP}. En vérification périodique, chaque point est examiné sur site ; s’y ajoutent un essai pour la coupure d’urgence, les portes des locaux HT, l’éclairage de sécurité, les verrouillages, les contrôleurs d’isolement et les différentiels, et un mesurage pour l’isolement BT, les prises de terre et les conducteurs de protection.`,
          groups: [
            {
              key: 'general',
              label: { fr: 'Conditions générales' },
              points: [
                { key: 'external-influences', label: { fr: 'Adaptation du matériel aux conditions d’influences externes' } },
                { key: 'safety-lv', label: { fr: 'Conformité du matériel BT ayant une fonction de sécurité' } },
                { key: 'wiring', label: { fr: 'Mise en œuvre des canalisations' } },
                { key: 'fixing', label: { fr: 'Fixation et état mécanique apparent des matériels' } },
                { key: 'lv-insulation', label: { fr: 'Isolement des installations BT' } },
                { key: 'identification', label: { fr: 'Identification des circuits et des appareillages, repérage des conducteurs' } },
                { key: 'isolation', label: { fr: 'Sectionnement' } },
                { key: 'emergency-cutoff', label: { fr: 'Coupure d’urgence' } },
              ],
            },
            {
              key: 'hv-rooms',
              label: { fr: 'Locaux renfermant des matériels HT' },
              points: [
                { key: 'ventilation', label: { fr: '9.1 — Conditionnement, ventilation' } },
                { key: 'doors', label: { fr: '9.2 — Portes, conditions d’ouverture et de fermeture' } },
                { key: 'emergency-lighting', label: { fr: '9.3 — Éclairage de sécurité' } },
                { key: 'external-lines', label: { fr: '9.4 — Canalisations externes' } },
                { key: 'transformer-protection', label: { fr: '9.5 — Protection des transformateurs contre les surintensités et les défauts internes' } },
                { key: 'dielectric', label: { fr: '9.6 — Absence de fuite et niveau de diélectrique liquide' } },
                { key: 'safety-gear', label: { fr: '9.7 — Tabourets, tapis, gants, perches, vérificateurs d’absence de tension' } },
              ],
            },
            {
              key: 'shock',
              label: { fr: 'Protection contre les risques de chocs électriques' },
              points: [
                { key: 'earth-electrodes', label: { fr: 'Prises de terre' } },
                { key: 'protective-conductors', label: { fr: 'Conducteurs de protection et liaisons équipotentielles' } },
                { key: 'distance', label: { fr: '3.1 — Contact direct : éloignement' } },
                { key: 'obstacles', label: { fr: '3.2 — Contact direct : obstacles' } },
                { key: 'enclosures', label: { fr: '3.3 — Contact direct : enveloppes' } },
                { key: 'interlocks', label: { fr: '3.4 — Contact direct : verrouillages, schémas et consignes de manœuvre' } },
                { key: 'insulation', label: { fr: '3.5 — Contact direct : isolation' } },
                { key: 'sockets', label: { fr: '3.6 — Contact direct : culots, douilles, prises de courant, prolongateurs, connecteurs' } },
                { key: 'contact-lines', label: { fr: '3.7 — Contact direct : lignes de contact' } },
                { key: 'special-rooms', label: { fr: 'Locaux à risques particuliers de choc électrique' } },
              ],
            },
            {
              key: 'indirect',
              label: { fr: 'Protection contre les risques de contact indirect' },
              points: [
                { key: 'surge-limiters', label: { fr: '4.1.1 — Limiteurs de surtension' } },
                { key: 'imd', label: { fr: '4.1.2 — Contrôleurs permanents d’isolement' } },
                { key: 'rcd', label: { fr: '4.1.3 — Dispositifs différentiels à courant résiduel' } },
                { key: 'overcurrent', label: { fr: '4.1.4 — Dispositifs de coupure à maximum de courant' } },
                { key: 'double-insulation', label: { fr: '4.1.5 — Isolation double ou renforcée' } },
                { key: 'separation', label: { fr: '4.1.6 — Séparation électrique' } },
                { key: 'selv', label: { fr: '4.1.7 — TBTS, TBTP' } },
                { key: 'hv-first-fault', label: { fr: '4.2 — Installations HT : coupure au premier défaut, sauf neutre isolé' } },
              ],
            },
            {
              key: 'fire',
              label: { fr: 'Protection contre les risques de brûlures, d’incendie et d’explosion' },
              points: [
                { key: 'overheating', label: { fr: '1 — Échauffements anormaux' } },
                { key: 'overload', label: { fr: '2 — Protection contre les surcharges et les courts-circuits' } },
                { key: 'breaking-capacity', label: { fr: '3 — Pouvoirs de coupure' } },
                { key: 'switchgear-32a', label: { fr: '4 — Appareillages de sectionnement et de commande, prises de courant BT de plus de 32 A' } },
                { key: 'flammable-dielectric', label: { fr: '5 — Diélectrique liquide inflammable ou transformateurs de type sec' } },
                { key: 'explosion-rooms', label: { fr: '6 — Locaux et emplacements à risque d’incendie ou d’explosion' } },
              ],
            },
            {
              key: 'emergency-lighting',
              label: { fr: 'Installations d’éclairage de sécurité' },
              points: [
                { key: 'emergency-lighting-installations', label: { fr: 'Installations d’éclairage de sécurité (hors essai d’autonomie des batteries)' } },
              ],
            },
          ],
        },
        {
          key: 'receivers',
          label: { fr: 'Vérification des récepteurs et circuits terminaux' },
          type: 'table',
          repeatable: true,
          minRows: 0,
          help: 'CM : continuité des masses, B ou M comme au modèle.',
          columns: [
            { key: 'count', label: { fr: 'Nombre' }, type: 'number', required: false, decimals: 0, span: 1 },
            { key: 'circuit', label: { fr: 'Désignation et emplacement du circuit BT' }, type: 'text', required: true, span: 4 },
            { key: 'power', label: { fr: 'Puissance' }, type: 'number', required: false, unit: 'kW', decimals: 1, span: 1 },
            { key: 'brand', label: { fr: 'Marque' }, type: 'text', required: false, span: 2 },
            { key: 'continuity', label: { fr: 'Continuité des masses' }, type: 'enum', required: false, options: ['B', 'M'], span: 1 },
            { key: 'observations', label: { fr: 'Observations' }, type: 'text', required: false, span: 3 },
          ],
        },
        {
          key: 'substation',
          label: { fr: 'Poste de livraison et de transformation' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'situation', label: { fr: 'Situation' }, type: 'text', required: false, span: 6 },
            { key: 'type', label: { fr: 'Type de poste' }, type: 'text', required: false, span: 6 },
            { key: 'supplyMode', label: { fr: 'Mode d’alimentation' }, type: 'text', required: false, span: 6 },
            { key: 'earthing', label: { fr: 'Masses reliées ou séparées' }, type: 'enum', required: false, options: ['Reliées', 'Séparées'], span: 6 },
          ],
        },
        {
          key: 'transformers',
          label: { fr: 'Transformateurs HT/BT' },
          type: 'table',
          repeatable: true,
          minRows: 0,
          columns: [
            { key: 'mark', label: { fr: 'Repère' }, type: 'text', required: true, span: 1 },
            { key: 'brand', label: { fr: 'Marque' }, type: 'text', required: false, span: 1 },
            { key: 'serial', label: { fr: 'N° de série' }, type: 'text', required: false, span: 1 },
            { key: 'year', label: { fr: 'Année' }, type: 'number', required: false, decimals: 0, span: 1 },
            { key: 'power', label: { fr: 'Puissance' }, type: 'number', required: true, unit: 'kVA', decimals: 0, span: 1 },
            { key: 'primaryVoltage', label: { fr: 'Tension primaire' }, type: 'number', required: false, unit: 'V', decimals: 0, span: 1 },
            { key: 'primaryCurrent', label: { fr: 'Intensité primaire' }, type: 'number', required: false, unit: 'A', decimals: 1, span: 1 },
            { key: 'secondaryVoltage', label: { fr: 'Tension secondaire' }, type: 'number', required: false, unit: 'V', decimals: 0, span: 1 },
            { key: 'secondaryCurrent', label: { fr: 'Intensité secondaire' }, type: 'number', required: false, unit: 'A', decimals: 1, span: 1 },
            { key: 'coupling', label: { fr: 'Couplage' }, type: 'text', required: false, span: 1 },
            { key: 'shortCircuitVoltage', label: { fr: 'Tension de court-circuit' }, type: 'number', required: false, unit: '%', decimals: 1, span: 1 },
            { key: 'surgeLimiter', label: { fr: 'Limiteur de surtension' }, type: 'text', required: false, span: 1 },
            { key: 'dielectric', label: { fr: 'Diélectrique — nature' }, type: 'text', required: false, span: 1 },
          ],
        },
        {
          key: 'generators',
          label: { fr: 'Groupes électrogènes' },
          type: 'table',
          repeatable: true,
          minRows: 0,
          columns: [
            { key: 'mark', label: { fr: 'Repère' }, type: 'text', required: true, span: 1 },
            { key: 'brand', label: { fr: 'Marque' }, type: 'text', required: false, span: 2 },
            { key: 'serial', label: { fr: 'N° de série' }, type: 'text', required: false, span: 2 },
            { key: 'year', label: { fr: 'Année' }, type: 'number', required: false, decimals: 0, span: 1 },
            { key: 'standbyPower', label: { fr: 'Puissance (standby)' }, type: 'number', required: false, unit: 'kVA', decimals: 0, span: 1 },
            { key: 'voltage', label: { fr: 'Tension' }, type: 'number', required: false, unit: 'V', decimals: 0, span: 1 },
            { key: 'current', label: { fr: 'Intensité' }, type: 'number', required: false, unit: 'A', decimals: 1, span: 1 },
            { key: 'powerFactor', label: { fr: 'Cos φ' }, type: 'number', required: false, decimals: 2, span: 1 },
            { key: 'surgeLimiter', label: { fr: 'Limiteur de surtension' }, type: 'text', required: false, span: 2 },
          ],
        },
        {
          key: 'transformerInsulation',
          label: { fr: 'Mesures et essais — isolement des transformateurs HT' },
          type: 'table',
          repeatable: true,
          minRows: 0,
          help: 'P/M : primaire à la masse · S/M : secondaire à la masse · P/S : primaire au secondaire.',
          columns: [
            { key: 'transformer', label: { fr: 'Transformateur et puissance' }, type: 'text', required: true, span: 3 },
            { key: 'pm', label: { fr: 'P/M' }, type: 'number', required: false, unit: 'MΩ', decimals: 0, span: 2 },
            { key: 'sm', label: { fr: 'S/M' }, type: 'number', required: false, unit: 'MΩ', decimals: 0, span: 2 },
            { key: 'ps', label: { fr: 'P/S' }, type: 'number', required: false, unit: 'MΩ', decimals: 0, span: 2 },
            { key: 'observations', label: { fr: 'Observations' }, type: 'text', required: false, span: 3 },
          ],
        },
        {
          key: 'transformerSafety',
          label: { fr: 'Essais de sécurité des transformateurs' },
          type: 'table',
          repeatable: true,
          minRows: 0,
          help: 'F : fonctionne · NF : ne fonctionne pas.',
          columns: [
            { key: 'test', label: { fr: 'Essai' }, type: 'text', required: true, span: 5 },
            { key: 'result', label: { fr: 'Résultat' }, type: 'enum', required: true, options: ['F', 'NF'], span: 2 },
            { key: 'observations', label: { fr: 'Observations' }, type: 'text', required: false, span: 5 },
          ],
        },
        {
          key: 'rcdTests',
          label: { fr: 'Essais des dispositifs différentiels' },
          type: 'table',
          repeatable: true,
          minRows: 0,
          help: 'F : fonctionne · NF : ne fonctionne pas.',
          columns: [
            { key: 'device', label: { fr: 'Dispositif et circuit protégé' }, type: 'text', required: true, span: 5 },
            { key: 'sensitivity', label: { fr: 'Sensibilité' }, type: 'number', required: true, unit: 'A', decimals: 3, span: 2 },
            { key: 'result', label: { fr: 'Résultat' }, type: 'enum', required: true, options: ['F', 'NF'], span: 2 },
            { key: 'observations', label: { fr: 'Observations' }, type: 'text', required: false, span: 3 },
          ],
        },
        {
          key: 'lvInsulation',
          label: { fr: 'Isolement des circuits BT' },
          type: 'table',
          repeatable: true,
          minRows: 0,
          help: 'BI : bon isolement, au-delà de 1 MΩ · MI : mauvais isolement, en deçà de 1 MΩ.',
          columns: [
            { key: 'circuit', label: { fr: 'Circuit' }, type: 'text', required: true, span: 4 },
            { key: 'protection', label: { fr: 'Protection' }, type: 'text', required: false, span: 2 },
            { key: 'insulation', label: { fr: 'Isolement mesuré' }, type: 'number', required: true, unit: 'MΩ', decimals: 1, span: 2 },
            { key: 'verdict', label: { fr: 'Appréciation' }, type: 'enum', required: true, options: ['BI', 'MI'], span: 1 },
            { key: 'observations', label: { fr: 'Observations' }, type: 'text', required: false, span: 3 },
          ],
        },
        {
          key: 'earthResistance',
          label: { fr: 'Installations BT — mesure de la résistance des prises de terre' },
          type: 'table',
          repeatable: true,
          minRows: 0,
          columns: [
            { key: 'electrode', label: { fr: 'Désignation et repère' }, type: 'text', required: true, span: 4 },
            { key: 'resistance', label: { fr: 'Résistance' }, type: 'number', required: true, unit: 'Ω', decimals: 1, span: 2 },
            { key: 'observations', label: { fr: 'Adaptation et observations diverses' }, type: 'text', required: false, span: 6 },
          ],
        },
        {
          key: 'riskRooms',
          label: { fr: 'Classement des locaux à risques' },
          type: 'table',
          repeatable: true,
          minRows: 0,
          help: 'Proposé par le vérificateur à défaut de liste fournie, et réputé validé par le chef d’établissement sauf avis contraire. AE : pénétration de corps solides · AD : de liquides · AF : substances corrosives ou polluantes · BE : matières traitées ou entreposées · AG : chocs mécaniques.',
          columns: [
            { key: 'location', label: { fr: 'Localisation' }, type: 'text', required: true, span: 3 },
            { key: 'af', label: { fr: 'AF' }, type: 'enum', required: false, options: ['AF1', 'AF2', 'AF3', 'AF4'], span: 1 },
            { key: 'be', label: { fr: 'BE' }, type: 'enum', required: false, options: ['BE1', 'BE2', 'BE3', 'BE4'], span: 1 },
            { key: 'ae', label: { fr: 'AE' }, type: 'enum', required: false, options: ['AE1', 'AE2', 'AE3', 'AE4'], span: 1 },
            { key: 'ad', label: { fr: 'AD' }, type: 'enum', required: false, options: ['AD1', 'AD2', 'AD3', 'AD4', 'AD5', 'AD6', 'AD7', 'AD8'], span: 1 },
            { key: 'ag', label: { fr: 'AG' }, type: 'enum', required: false, options: ['AG1', 'AG2', 'AG3', 'AG4'], span: 1 },
            { key: 'ip', label: { fr: 'IP minimal' }, type: 'text', required: false, span: 2 },
            { key: 'ik', label: { fr: 'IK minimal' }, type: 'enum', required: false, options: ['IK 02', 'IK 07', 'IK 08', 'IK 10'], span: 2 },
          ],
        },
        EILM_OBSERVATIONS,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F12 — VÉRIFICATION PÉRIODIQUE D'ASCENSEUR OU DE MONTE-CHARGE
   *
   *  Examen de l'état de conservation avec essais de fonctionnement, en dix
   *  groupes de la gaine à la machine. Comme pour les ponts roulants, les
   *  descriptifs portés en tête de groupe au modèle (« MAÇONNÉE », « 02
   *  COURROIES MÉPLATES ») décrivent l'appareil d'une visite : ils sont
   *  saisis dans ses caractéristiques. « Sans objet » et « non testé »
   *  restent des réponses, pas des attendus.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F12',
    version: '00',
    title: 'Rapport de vérification — ascenseur ou monte-charge',
    methodCode: 'LIFT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'client',
          label: { fr: 'Renseignements généraux' },
          type: 'keyvalue',
          repeatable: false,
          reference: 'Article 6 de l’arrêté du 7 septembre 1954 modifiant l’arrêté du 9 avril 1953. Vérification générale périodique : examen de l’état de conservation avec essais de fonctionnement.',
          fields: [
            { key: 'client', label: { fr: 'Client' }, type: 'ref', required: true, autofill: 'client', span: 6 },
            { key: 'legalName', label: { fr: 'Raison sociale' }, type: 'text', required: false, span: 6 },
            { key: 'activity', label: { fr: 'Activité' }, type: 'text', required: false, span: 6 },
            { key: 'location', label: { fr: 'Lieu d’intervention' }, type: 'ref', required: true, autofill: 'site', span: 6 },
            { key: 'previousDate', label: { fr: 'Date de la dernière vérification' }, type: 'date', required: false, span: 4 },
            { key: 'date', label: { fr: 'Date d’intervention' }, type: 'date', required: true, autofill: 'date', span: 4 },
            { key: 'inspector', label: { fr: 'Nom de l’intervenant' }, type: 'ref', required: true, autofill: 'inspector', span: 4 },
            { key: 'accompaniedBy', label: { fr: 'Accompagné par' }, type: 'text', required: false, span: 4 },
            { key: 'userRef', label: { fr: 'Repère utilisateur' }, type: 'text', required: false, span: 4 },
            { key: 'periodicity', label: { fr: 'Périodicité réglementaire' }, type: 'enum', required: true, options: ['Annuelle', 'Semestrielle'], span: 4 },
          ],
        },
        {
          key: 'equipment',
          label: { fr: 'Caractéristiques de l’appareil examiné' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'location', label: { fr: 'Repère ou localisation' }, type: 'text', required: true, span: 6 },
            { key: 'classification', label: { fr: 'Classification (NM 10.05 F 010)' }, type: 'text', required: false, span: 6 },
            { key: 'manufacturer', label: { fr: 'Constructeur' }, type: 'text', required: true, span: 4 },
            { key: 'maintainer', label: { fr: 'Entretien' }, type: 'text', required: false, span: 4 },
            { key: 'commissioningYear', label: { fr: 'Année de mise en service' }, type: 'number', required: false, decimals: 0, span: 4 },
            { key: 'travel', label: { fr: 'Course' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 3 },
            { key: 'speed', label: { fr: 'Vitesse' }, type: 'number', required: false, unit: 'm/s', decimals: 2, span: 3 },
            { key: 'levels', label: { fr: 'Nombre de niveaux' }, type: 'number', required: false, decimals: 0, span: 3 },
            { key: 'ratedLoad', label: { fr: 'Charge nominale' }, type: 'number', required: true, unit: 'kg', decimals: 0, span: 3 },
            { key: 'persons', label: { fr: 'Nombre de personnes' }, type: 'number', required: false, decimals: 0, span: 3 },
            { key: 'cabinService', label: { fr: 'Cabine — type de service' }, type: 'text', required: false, span: 3 },
            { key: 'shaftAccesses', label: { fr: 'Gaine — nombre d’accès' }, type: 'number', required: false, decimals: 0, span: 3 },
            { key: 'shaftType', label: { fr: 'Genre de gaine' }, type: 'text', required: false, span: 3 },
            { key: 'controlType', label: { fr: 'Type de commande' }, type: 'text', required: false, span: 4 },
            { key: 'landingControls', label: { fr: 'Équipement des paliers' }, type: 'text', required: false, span: 4 },
            { key: 'landingDoors', label: { fr: 'Portes palières' }, type: 'text', required: false, span: 4 },
            { key: 'cabinDoors', label: { fr: 'Portes de cabine' }, type: 'text', required: false, span: 4 },
            { key: 'machineRoom', label: { fr: 'Emplacement de la machinerie' }, type: 'text', required: false, span: 4 },
            { key: 'drive', label: { fr: 'Caractéristiques du groupe (hydraulique ou moteur)' }, type: 'text', required: false, span: 4 },
            { key: 'ropes', label: { fr: 'Câbles, chaînes ou courroies — nombre, type, dimensions' }, type: 'text', required: false, span: 12 },
            { key: 'breakingLoad', label: { fr: 'Charge de rupture de la nappe' }, type: 'number', required: false, unit: 'kg', decimals: 0, span: 4 },
            { key: 'dRatio', label: { fr: 'Rapport D/d' }, type: 'number', required: false, decimals: 1, span: 4 },
            { key: 'staticLoad', label: { fr: 'Charge statique suspendue' }, type: 'number', required: false, unit: 'kg', decimals: 0, span: 4 },
            { key: 'cabinMass', label: { fr: 'Masse de la cabine' }, type: 'number', required: false, unit: 'kg', decimals: 0, span: 4 },
            { key: 'counterweightMass', label: { fr: 'Masse du contrepoids' }, type: 'number', required: false, unit: 'kg', decimals: 0, span: 4 },
            { key: 'safetyFactor', label: { fr: 'Coefficient de sécurité Cs' }, type: 'number', required: false, decimals: 1, span: 4 },
            { key: 'counterweightType', label: { fr: 'Contrepoids' }, type: 'text', required: false, span: 4 },
            { key: 'compensation', label: { fr: 'Organe de compensation' }, type: 'text', required: false, span: 4 },
            { key: 'safetyGear', label: { fr: 'Parachute de cabine' }, type: 'text', required: false, span: 4 },
            { key: 'trippingSpeed', label: { fr: 'Vitesse de prise du parachute' }, type: 'number', required: false, unit: 'm/s', decimals: 2, span: 4 },
          ],
        },
        ASCENSEUR_CHECKS,
        EILM_OBSERVATIONS,
        EILM_CONCLUSION,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F34 — VÉRIFICATION AVANT MISE EN SERVICE D'ASCENSEUR
   *
   *  Mêmes constatations que la vérification périodique (F12), complétées
   *  des essais de mise en service, des certificats d'approbation de type
   *  et des distances libres. Visé par le chef du service EILM.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F34',
    version: '00',
    title: 'Rapport de vérification avant mise en service — ascenseur ou monte-charge',
    methodCode: 'LIFT',
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'header',
          label: { fr: 'Prestation' },
          type: 'keyvalue',
          repeatable: false,
          help: 'Avis sur le respect des règles techniques normatives et réglementaires lors des travaux d’installation. Hors prestation : l’analyse des risques et les mesures de bruit, vibrations, rayonnements, polluants ou ventilation.',
          fields: [
            { key: 'client', label: { fr: 'Société' }, type: 'ref', required: true, autofill: 'client', span: 6 },
            { key: 'requester', label: { fr: 'Demandeur' }, type: 'text', required: false, span: 6 },
            { key: 'location', label: { fr: 'Lieu de contrôle' }, type: 'ref', required: true, autofill: 'site', span: 6 },
            { key: 'date', label: { fr: 'Date d’intervention' }, type: 'date', required: true, autofill: 'date', span: 6 },
            { key: 'installation', label: { fr: 'Installation vérifiée' }, type: 'text', required: true, span: 6 },
            { key: 'inspector', label: { fr: 'Vérification effectuée par' }, type: 'ref', required: true, autofill: 'inspector', span: 6 },
            { key: 'collaborator', label: { fr: 'En collaboration avec' }, type: 'text', required: false, span: 6 },
            { key: 'inService', label: { fr: 'L’ascenseur était en service lors de la vérification' }, type: 'boolean', required: false, span: 6 },
          ],
        },
        {
          key: 'references',
          label: { fr: 'Référentiel de vérification' },
          type: 'keyvalue',
          repeatable: false,
          reference: 'Textes de référence : article 6 de l’arrêté du 7 septembre 1954 modifiant l’arrêté du 9 avril 1953 ; décret n° 2-14-499 sur la sécurité incendie des constructions (ascenseurs en immeuble de grande hauteur).',
          help: 'Cocher les textes supplémentaires visés.',
          fields: [
            { key: 'accessibility2007', label: { fr: 'Arrêté du 26 février 2007 (accessibilité des bâtiments d’habitation)' }, type: 'boolean', required: false, span: 6 },
            { key: 'nfP82212', label: { fr: 'Norme NF P82-212 de novembre 2005' }, type: 'boolean', required: false, span: 6 },
            { key: 'nfP82312', label: { fr: 'Norme NF P82-312 de novembre 2005' }, type: 'boolean', required: false, span: 6 },
            { key: 'nfP82230', label: { fr: 'Norme NF P82-230 de juin 2021' }, type: 'boolean', required: false, span: 6 },
            { key: 'cctp', label: { fr: 'CCTP ou commande des travaux — référence' }, type: 'text', required: false, span: 6 },
            { key: 'previousReport', label: { fr: 'Levée des observations du rapport n°' }, type: 'text', required: false, span: 6 },
            { key: 'other', label: { fr: 'Autre' }, type: 'text', required: false, span: 12 },
          ],
        },
        {
          key: 'equipment',
          label: { fr: 'Renseignements généraux' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'manufacturer', label: { fr: 'Fabricant' }, type: 'text', required: true, span: 4 },
            { key: 'identification', label: { fr: 'N° d’identification' }, type: 'text', required: true, span: 4 },
            { key: 'commissioningYear', label: { fr: 'Année de mise en service' }, type: 'number', required: false, decimals: 0, span: 4 },
            { key: 'travel', label: { fr: 'Course' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 3 },
            { key: 'ratedLoad', label: { fr: 'Capacité' }, type: 'number', required: true, unit: 'kg', decimals: 0, span: 3 },
            { key: 'persons', label: { fr: 'Nombre de personnes' }, type: 'number', required: false, decimals: 0, span: 3 },
            { key: 'speed', label: { fr: 'Vitesse nominale' }, type: 'number', required: false, unit: 'm/s', decimals: 2, span: 3 },
            { key: 'levels', label: { fr: 'Nombre de niveaux existants' }, type: 'number', required: false, decimals: 0, span: 3 },
            { key: 'unservedLevels', label: { fr: 'Nombre de niveaux non desservis' }, type: 'number', required: false, decimals: 0, span: 3 },
            { key: 'cabinDoors', label: { fr: 'Portes de cabine (type)' }, type: 'text', required: false, span: 3 },
            { key: 'landingDoors', label: { fr: 'Portes palières (type)' }, type: 'text', required: false, span: 3 },
            { key: 'machineRoom', label: { fr: 'Position du local des machines' }, type: 'text', required: false, span: 6 },
            { key: 'machineType', label: { fr: 'Type de machine' }, type: 'text', required: false, span: 6 },
            { key: 'machineBrand', label: { fr: 'Machine — marque' }, type: 'text', required: false, span: 3 },
            { key: 'machineModel', label: { fr: 'Machine — type' }, type: 'text', required: false, span: 3 },
            { key: 'machinePower', label: { fr: 'Machine — puissance' }, type: 'number', required: false, unit: 'kW', decimals: 1, span: 3 },
            { key: 'machineCurrent', label: { fr: 'Machine — intensité nominale' }, type: 'number', required: false, unit: 'A', decimals: 1, span: 3 },
            // Descriptifs portés au modèle en tête de chaque groupe de constatations.
            { key: 'shaftType', label: { fr: 'Gaine' }, type: 'text', required: false, span: 4 },
            { key: 'landingControls', label: { fr: 'Équipement des paliers' }, type: 'text', required: false, span: 4 },
            { key: 'suspension', label: { fr: 'Organes de suspension' }, type: 'text', required: false, span: 4 },
            { key: 'counterweightType', label: { fr: 'Contrepoids' }, type: 'text', required: false, span: 4 },
            { key: 'compensation', label: { fr: 'Organe de compensation' }, type: 'text', required: false, span: 4 },
            { key: 'safetyGear', label: { fr: 'Dispositifs de sécurité — parachute' }, type: 'text', required: false, span: 4 },
          ],
        },
        ASCENSEUR_CHECKS,
        {
          key: 'tests',
          label: { fr: 'Mesures, essais et vérifications' },
          type: 'checklist',
          repeatable: false,
          help: 'Au modèle : SO, C, D. D (défavorable) se saisit NC.',
          groups: [
            {
              key: 'running',
              label: { fr: 'Essais et mesures' },
              points: [
                { key: 'cabin-travel', label: { fr: 'Déplacement de la cabine' } },
                { key: 'braking', label: { fr: 'Essais de freinage à vitesse nominale' } },
                { key: 'balancing', label: { fr: 'Conformité de l’équilibrage' } },
                { key: 'traction-dynamic', label: { fr: 'Vérification de l’adhérence — dynamique' } },
                { key: 'traction-static', label: { fr: 'Vérification de l’adhérence — statique' } },
              ],
            },
            {
              key: 'governor',
              label: { fr: 'Essai du limiteur de vitesse' },
              points: [
                { key: 'governor-cabin', label: { fr: 'Cabine et déclenchement' } },
                { key: 'governor-counterweight', label: { fr: 'Contrepoids et déclenchement' } },
                { key: 'governor-stop', label: { fr: 'Commande d’arrêt' } },
              ],
            },
            {
              key: 'cabin-safety-gear',
              label: { fr: 'Essai du parachute de cabine' },
              points: [
                { key: 'cabin-instant', label: { fr: 'Prise instantanée, à vitesse nominale' } },
                { key: 'cabin-progressive', label: { fr: 'Prise amortie, à vitesse réduite (isonivelage ou inspection, à vide)' } },
              ],
            },
            {
              key: 'counterweight-safety-gear',
              label: { fr: 'Essai du parachute de contrepoids' },
              points: [
                { key: 'counterweight-instant', label: { fr: 'Prise instantanée, à vitesse nominale si commandée par limiteur' } },
                { key: 'counterweight-progressive', label: { fr: 'Prise amortie, à vitesse réduite si commandée par limiteur' } },
                { key: 'counterweight-other', label: { fr: 'Tous types, en dynamique si commande autre que limiteur' } },
              ],
            },
            {
              key: 'buffers',
              label: { fr: 'Essai des amortisseurs' },
              points: [
                { key: 'buffers-hydraulic', label: { fr: 'À accumulation hydraulique, cabine posée sans vitesse' } },
                { key: 'buffers-other', label: { fr: 'Autres types, à vitesse nominale ou limitée' } },
              ],
            },
            {
              key: 'other-tests',
              label: { fr: 'Autres essais et mesures' },
              points: [
                { key: 'insulation', label: { fr: 'Résistance d’isolement des circuits' } },
                { key: 'earth-continuity', label: { fr: 'Continuité de la liaison à la terre' } },
              ],
            },
          ],
        },
        {
          key: 'measures',
          label: { fr: 'Valeurs mesurées' },
          type: 'conditions',
          repeatable: false,
          fields: [
            { key: 'current', label: { fr: 'Intensité' }, type: 'number', required: false, unit: 'A', decimals: 1, span: 3 },
            { key: 'voltage', label: { fr: 'Tension' }, type: 'number', required: false, unit: 'V', decimals: 0, span: 3 },
            { key: 'speed', label: { fr: 'Vitesse' }, type: 'number', required: false, unit: 'm/s', decimals: 2, span: 3 },
            { key: 'balancing', label: { fr: 'Équilibrage' }, type: 'number', required: false, unit: '%', decimals: 0, span: 3 },
            { key: 'governorCabin', label: { fr: 'Déclenchement limiteur — cabine' }, type: 'number', required: false, unit: 'm/s', decimals: 2, span: 4 },
            { key: 'governorCounterweight', label: { fr: 'Déclenchement limiteur — contrepoids' }, type: 'number', required: false, unit: 'm/s', decimals: 2, span: 4 },
            { key: 'governorStop', label: { fr: 'Commande d’arrêt du limiteur' }, type: 'number', required: false, unit: 'm/s', decimals: 2, span: 4 },
          ],
        },
        {
          key: 'certificates',
          label: { fr: 'Certificats d’approbation de type — références relevées' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'lockCertificate', label: { fr: 'Dispositif de verrouillage — laboratoire et n° d’essai' }, type: 'text', required: false, span: 4 },
            { key: 'safetyGearCertificate', label: { fr: 'Parachute — laboratoire et n° d’essai' }, type: 'text', required: false, span: 4 },
            { key: 'governorCertificate', label: { fr: 'Limiteur de vitesse — n° d’essai' }, type: 'text', required: false, span: 4 },
          ],
        },
        {
          key: 'clearances',
          label: { fr: 'Réserves supérieures et distances libres en cuvette' },
          type: 'keyvalue',
          repeatable: false,
          help: 'Pour chaque distance, la valeur nominalisée puis la valeur relevée.',
          fields: [
            { key: 'guidedTravelNominal', label: { fr: 'Course guidée encore possible en montée — nominale' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 6 },
            { key: 'guidedTravelMeasured', label: { fr: 'Course guidée encore possible en montée — relevée' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 6 },
            { key: 'roofNominal', label: { fr: 'Distance libre au-dessus du toit de cabine — nominale' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 6 },
            { key: 'roofMeasured', label: { fr: 'Distance libre au-dessus du toit de cabine — relevée' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 6 },
            { key: 'ceilingNominal', label: { fr: 'Plafond — organes les plus hauts du toit de cabine — nominale' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 6 },
            { key: 'ceilingMeasured', label: { fr: 'Plafond — organes les plus hauts du toit de cabine — relevée' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 6 },
            { key: 'guideShoesTopNominal', label: { fr: 'Plafond — coulisseaux, attaches, fronton, portes verticales — nominale' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 6 },
            { key: 'guideShoesTopMeasured', label: { fr: 'Plafond — coulisseaux, attaches, fronton, portes verticales — relevée' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 6 },
            { key: 'pitNominal', label: { fr: 'Fond de cuvette — parties les plus basses de la cabine — nominale' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 6 },
            { key: 'pitMeasured', label: { fr: 'Fond de cuvette — parties les plus basses de la cabine — relevée' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 6 },
            { key: 'guideShoesBottomNominal', label: { fr: 'Fond de cuvette — coulisseaux, parachute, garde-pieds, portes verticales — nominale' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 6 },
            { key: 'guideShoesBottomMeasured', label: { fr: 'Fond de cuvette — coulisseaux, parachute, garde-pieds, portes verticales — relevée' }, type: 'number', required: false, unit: 'm', decimals: 2, span: 6 },
          ],
        },
        {
          key: 'horizontalDistances',
          label: { fr: 'Ascenseurs munis de portes de cabine — distances horizontales' },
          type: 'conditions',
          repeatable: false,
          help: 'Valeurs nominales du modèle, dont le signe de comparaison est reconstitué d’après l’EN 81 : paroi de service ≤ 15 cm, seuils ≤ 3,5 cm, portes ≤ 12 cm, jeu cabine-contrepoids ≥ 5 cm.',
          fields: [
            { key: 'serviceWall', label: { fr: 'Paroi de service — seuil ou baie de cabine' }, type: 'number', required: false, unit: 'cm', decimals: 1, span: 6 },
            { key: 'sills', label: { fr: 'Seuil de cabine — seuil des portes palières' }, type: 'number', required: false, unit: 'cm', decimals: 1, span: 6 },
            { key: 'doors', label: { fr: 'Porte de cabine — portes palières fermées' }, type: 'number', required: false, unit: 'cm', decimals: 1, span: 6 },
            { key: 'counterweightGap', label: { fr: 'Jeu cabine — contrepoids' }, type: 'number', required: false, unit: 'cm', decimals: 1, span: 6 },
          ],
        },
        EILM_CONCLUSION,
        {
          key: 'observations',
          label: { fr: 'Observations réglementaires' },
          type: 'text',
          repeatable: false,
          fields: [
            { key: 'observations', label: { fr: 'Observations réglementaires' }, type: 'textarea', required: false, span: 12 },
          ],
        },
        EILM_PHOTOS,
        {
          key: 'signatures',
          label: { fr: 'Visa' },
          type: 'signature-matrix',
          repeatable: false,
          reference: 'Fait à Mohammedia.',
          signatories: [{ fr: 'Chef du service EILM' }],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR02-F32 — COMPTE RENDU D'EXAMEN EIL
   *
   *  Formulaire général du service, sans méthode propre : compte rendu de
   *  visite, rapport d'examen ou de réception d'ouvrages, avec un avis
   *  codifié par ouvrage ou document examiné — même logique d'avis que le
   *  contrôle technique de construction.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR02-F32',
    version: '00',
    title: 'Compte rendu d’examen EIL',
    methodCode: null,
    paradigm: 'CRITERIA',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'header',
          label: { fr: 'Compte rendu d’examen' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'kind', label: { fr: 'Nature du document' }, type: 'enum', required: true, options: ['Compte rendu de visite', 'Rapport d’examen', 'Rapport de réception des ouvrages'], span: 6 },
            { key: 'reference', label: { fr: 'Référence' }, type: 'text', required: false, span: 6 },
            { key: 'affairNumber', label: { fr: 'N° d’affaire' }, type: 'ref', required: true, autofill: 'affairNumber', span: 3 },
            { key: 'date', label: { fr: 'Date' }, type: 'date', required: true, autofill: 'date', span: 3 },
            { key: 'number', label: { fr: 'N°' }, type: 'text', required: false, span: 3 },
            { key: 'phase', label: { fr: 'Phase' }, type: 'text', required: false, span: 3 },
            { key: 'affair', label: { fr: 'Affaire' }, type: 'text', required: false, span: 12 },
          ],
        },
        {
          key: 'documents',
          label: { fr: 'Documents, ouvrages ou parties d’ouvrage examinés' },
          type: 'text',
          repeatable: false,
          fields: [
            { key: 'documents', label: { fr: 'Documents examinés' }, type: 'textarea', required: true, span: 12 },
          ],
        },
        {
          key: 'opinions',
          label: { fr: 'Avis du bureau de contrôle' },
          type: 'table',
          repeatable: true,
          minRows: 1,
          help: 'F : favorable · D : défavorable · S : suspendu · SO : sans objet · C : conforme · NC : non conforme · PM : pour mémoire. Les observations peuvent aussi être rédigées librement.',
          columns: [
            { key: 'subject', label: { fr: 'Ouvrage, partie d’ouvrage ou document' }, type: 'text', required: true, span: 4 },
            { key: 'opinion', label: { fr: 'Avis' }, type: 'enum', required: true, options: ['F', 'D', 'S', 'SO', 'C', 'NC', 'PM'], span: 2 },
            { key: 'comment', label: { fr: 'Observation' }, type: 'text', required: false, span: 6 },
          ],
        },
        EILM_OBSERVATIONS,
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR01-F03 — VERTICALITÉ DE RÉSERVOIR
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR01-F03',
    version: '00',
    title: 'Rapport de contrôle de verticalité',
    titleEn: 'Plumbness check report',
    methodCode: 'DIM',
    paradigm: 'MEASUREMENT',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        DIM_HEADER,
        {
          key: 'tank',
          label: { fr: 'Réservoir', en: 'Tank' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'tankNumber', label: { fr: 'Repère du réservoir', en: 'Tank N°' }, type: 'text', required: true, span: 6 },
            { key: 'tankHeight', label: { fr: 'Hauteur du réservoir (H)', en: 'Tank height' }, type: 'number', required: true, unit: 'mm', decimals: 0, span: 6 },
          ],
        },
        {
          key: 'equipment',
          label: { fr: 'Matériel de contrôle', en: 'Material of control' },
          type: 'devices',
          repeatable: false,
          minRows: 1,
          help: 'Un appareil hors étalonnage à la date du contrôle empêche la soumission du rapport.',
          fields: [{ key: 'device', label: { fr: 'Appareil', en: 'Device' }, type: 'device', required: true, span: 12 }],
        },
        {
          key: 'measures',
          label: { fr: 'Mesures', en: 'Measures' },
          type: 'table',
          repeatable: true,
          minRows: 1,
          maxRows: 40,
          help: 'Critère d’acceptation, réservoir neuf : écart ≤ H/200.',
          columns: [
            { key: 'axis', label: { fr: 'Axe', en: 'Axis' }, type: 'number', required: true, decimals: 0, span: 2 },
            { key: 'valueA', label: { fr: 'Valeur A', en: 'Value A' }, type: 'number', required: true, unit: 'mm', decimals: 0, span: 2 },
            { key: 'valueB', label: { fr: 'Valeur B', en: 'Value B' }, type: 'number', required: true, unit: 'mm', decimals: 0, span: 2 },
            { key: 'difference', label: { fr: 'Différence', en: 'Difference' }, type: 'number', required: true, unit: 'mm', decimals: 0, span: 3 },
            { key: 'criterion', label: { fr: 'Critère', en: 'Criterion' }, type: 'enum', required: true, options: ['Acceptable', 'Non acceptable'], span: 3 },
          ],
        },
        ACCEPTABLE_RESULT,
        END_SIGNATURES_3,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR01-F07 — ROTONDITÉ DE RÉSERVOIR
   *
   *  Le tableau d'acceptation du modèle (API 650, tableau 5.5.3) donne les
   *  classes de diamètre mais laisse les tolérances vides : elles sont
   *  rappelées d'après la norme, à confirmer.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR01-F07',
    version: '00',
    title: 'Rapport de contrôle de rotondité',
    titleEn: 'Roundness check report',
    methodCode: 'DIM',
    paradigm: 'MEASUREMENT',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        DIM_HEADER,
        {
          key: 'measures',
          label: { fr: 'Mesures', en: 'Measures' },
          type: 'table',
          repeatable: true,
          minRows: 1,
          help: 'Habituellement : rotondité de la première virole, diamètre mesuré à 300 mm de la liaison robe/fond. Tolérance sur le rayon (API 650, tableau 5.5.3) : diamètre < 12 m ±13 mm · 12 à < 45 m ±19 mm · 45 à < 75 m ±25 mm · ≥ 75 m ±32 mm.',
          columns: [
            { key: 'axis', label: { fr: 'Axe', en: 'Axis' }, type: 'text', required: true, span: 3 },
            { key: 'designRadius', label: { fr: 'Rayon intérieur de conception', en: 'Design inner radius' }, type: 'number', required: true, unit: 'm', decimals: 3, span: 3 },
            { key: 'measuredRadius', label: { fr: 'Rayon intérieur mesuré', en: 'Measured inner radius' }, type: 'number', required: true, unit: 'm', decimals: 3, span: 3 },
            { key: 'deviation', label: { fr: 'Écart', en: 'Deviation' }, type: 'number', required: true, unit: 'mm', decimals: 0, span: 3 },
          ],
        },
        END_NOTE,
        ACCEPTABLE_RESULT,
        END_SIGNATURES_3,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR01-F10 — DÉFORMATION LOCALE
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR01-F10',
    version: '00',
    title: 'Rapport de contrôle de déformation locale',
    titleEn: 'Local deformation check report',
    methodCode: 'DIM',
    paradigm: 'MEASUREMENT',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        DIM_HEADER,
        {
          key: 'measures',
          label: { fr: 'Mesures', en: 'Measures' },
          type: 'table',
          repeatable: true,
          minRows: 1,
          help: 'Critère d’acceptation du modèle : déformation maximale de 13 mm, sur soudure horizontale comme verticale.',
          columns: [
            { key: 'location', label: { fr: 'Emplacement', en: 'Location' }, type: 'enum', required: true, options: ['Soudure horizontale', 'Soudure verticale', 'Tôle'], span: 4 },
            { key: 'mark', label: { fr: 'Repère', en: 'Mark' }, type: 'text', required: true, span: 4 },
            { key: 'maxDeformation', label: { fr: 'Déformation maximale', en: 'Maximal deformation' }, type: 'number', required: true, unit: 'mm', decimals: 1, span: 4 },
          ],
        },
        END_NOTE,
        ACCEPTABLE_RESULT,
        END_SIGNATURES_3,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR01-F06 — « EXAMEN D'ADHÉRENCE »
   *
   *  Malgré son titre, le modèle ne porte aucun essai d'adhérence : c'est
   *  un relevé d'épaisseur de feuil sec, avec tableau d'échantillonnage et
   *  seuils à 80 % et 60 % de l'épaisseur contractuelle. Il est reproduit
   *  tel quel ; l'écart est à trancher par le QHSE.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR01-F06',
    version: '00',
    title: 'Rapport d’examen d’adhérence',
    titleEn: 'Report of adhesion examination',
    methodCode: 'PAINT',
    paradigm: 'MEASUREMENT',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'header',
          label: { fr: 'Identification', en: 'Identification' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'client', label: { fr: 'Client', en: 'Customer' }, type: 'ref', required: true, autofill: 'client', span: 4 },
            { key: 'applicator', label: { fr: 'Applicateur', en: 'Applicator' }, type: 'text', required: false, span: 4 },
            { key: 'place', label: { fr: 'Lieu de contrôle', en: 'Place of inspection' }, type: 'ref', required: true, autofill: 'site', span: 4 },
            { key: 'drawing', label: { fr: 'Plan de référence', en: 'Drawing N°' }, type: 'text', required: false, span: 4 },
            { key: 'standard', label: { fr: 'Spécification applicable', en: 'Examination according to' }, type: 'standard-ref', required: true, autofill: 'standards', span: 4 },
            { key: 'procedure', label: { fr: 'Instruction de référence', en: 'Procedure N°' }, type: 'text', required: true, autofill: 'procedure', span: 4 },
            { key: 'material', label: { fr: 'Matériel (ou construction) examiné', en: 'Material (or construction) examined' }, type: 'ref', required: true, autofill: 'asset', span: 12 },
          ],
        },
        {
          key: 'equipment',
          label: { fr: 'Matériel utilisé', en: 'Equipment used' },
          type: 'devices',
          repeatable: false,
          minRows: 1,
          help: 'Un appareil hors étalonnage à la date de l’essai empêche la soumission du rapport.',
          fields: [{ key: 'device', label: { fr: 'Appareil', en: 'Device' }, type: 'device', required: true, span: 12 }],
        },
        {
          key: 'coating',
          label: { fr: 'Conditions d’examen', en: 'Operating conditions' },
          type: 'conditions',
          repeatable: false,
          help: 'Nombre de mesures selon la surface : ≤ 90 m² : 20 · 91 à 150 : 30 · 151 à 300 : 50 · 301 à 500 : 80 · 501 à 1200 : 120 · 1201 à 3200 : 200 · > 3200 : 300.',
          fields: [
            { key: 'side', label: { fr: 'Peinture', en: 'Coating' }, type: 'enum', required: true, options: ['Intérieure', 'Extérieure'], span: 4 },
            { key: 'reference', label: { fr: 'Référence de peinture', en: 'Coating reference' }, type: 'text', required: true, span: 4 },
            { key: 'ral', label: { fr: 'Teinte (RAL)', en: 'Colour (RAL)' }, type: 'text', required: false, span: 4 },
            { key: 'area', label: { fr: 'Dimensions', en: 'Dimensions' }, type: 'number', required: true, unit: 'm² ou ml', decimals: 1, span: 4 },
            { key: 'specification', label: { fr: 'Spécification applicable', en: 'Applicable specification' }, type: 'text', required: false, span: 8 },
          ],
        },
        PAINT_CONDITIONS,
        PAINT_MEASURES,
        paintSummary(true),
        END_COMMENTS,
        COMPLIANT_RESULT,
        END_SIGNATURES_3,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR01-F21 — CONTRÔLE PEINTURE
   *
   *  Préparation de surface, système appliqué couche par couche, conditions
   *  d'application, puis épaisseurs. Le modèle Excel est la copie d'un
   *  rapport réel (produits, lots et zone d'un bac client) ; seule sa
   *  structure est reprise.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR01-F21',
    version: '00',
    title: 'Rapport de contrôle peinture',
    titleEn: 'Coating report',
    methodCode: 'PAINT',
    paradigm: 'MEASUREMENT',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'header',
          label: { fr: 'Identification', en: 'Identification' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'client', label: { fr: 'Client', en: 'Customer' }, type: 'ref', required: true, autofill: 'client', span: 3 },
            { key: 'affairNumber', label: { fr: 'N° d’affaire', en: 'Transaction N°' }, type: 'ref', required: true, autofill: 'affairNumber', span: 3 },
            { key: 'norm', label: { fr: 'Norme', en: 'Standard' }, type: 'text', required: false, span: 3 },
            { key: 'applicator', label: { fr: 'Applicateur', en: 'Applicator' }, type: 'text', required: false, span: 3 },
            { key: 'equipmentType', label: { fr: 'Type d’équipement', en: 'Equipment' }, type: 'ref', required: true, autofill: 'asset', span: 3 },
            { key: 'materials', label: { fr: 'Matériau', en: 'Materials' }, type: 'text', required: false, span: 3 },
            { key: 'system', label: { fr: 'Système de peinture n°', en: 'System N°' }, type: 'text', required: false, span: 3 },
            { key: 'standard', label: { fr: 'Spécification applicable', en: 'Examination according to' }, type: 'standard-ref', required: true, autofill: 'standards', span: 3 },
          ],
        },
        {
          key: 'preparation',
          label: { fr: 'Préparation de surface', en: 'Surface preparation' },
          type: 'conditions',
          repeatable: false,
          help: 'Rugosité attendue au rugosimètre : entre 60 et 100 µm.',
          fields: [
            { key: 'blasting', label: { fr: 'Méthode de décapage', en: 'Blasting method' }, type: 'enum', required: true, options: ['Sablage', 'Grenaillage', 'Autre'], span: 4 },
            { key: 'rustGrade', label: { fr: 'Degré d’enrouillement initial', en: 'Initial rust grade' }, type: 'enum', required: true, options: ['A', 'B', 'C', 'D'], span: 4 },
            { key: 'preparationGrade', label: { fr: 'Degré de préparation', en: 'Preparation grade' }, type: 'enum', required: true, options: ['Sa 1', 'Sa 2', 'Sa 2½', 'Sa 3'], span: 4 },
            { key: 'comparator', label: { fr: 'Comparateur viso-tactile', en: 'Surface comparator' }, type: 'enum', required: false, options: ['S', 'G'], span: 4 },
            { key: 'profile', label: { fr: 'Profil', en: 'Profile' }, type: 'enum', required: false, options: ['Fin', 'Moyen', 'Gros'], span: 4 },
            { key: 'roughness', label: { fr: 'Rugosité (rugosimètre)', en: 'Roughness' }, type: 'number', required: false, unit: 'µm', decimals: 0, span: 4 },
          ],
        },
        {
          key: 'coats',
          label: { fr: 'Système appliqué', en: 'Coating system' },
          type: 'table',
          repeatable: true,
          minRows: 1,
          columns: [
            { key: 'side', label: { fr: 'Peinture', en: 'Coating' }, type: 'enum', required: true, options: ['Intérieure', 'Extérieure'], span: 2 },
            { key: 'coat', label: { fr: 'Couche', en: 'Coat' }, type: 'enum', required: true, options: ['Primaire', 'Intermédiaire', 'Finition'], span: 2 },
            { key: 'reference', label: { fr: 'Référence de peinture', en: 'Coating reference' }, type: 'text', required: true, span: 3 },
            { key: 'ral', label: { fr: 'Teinte (RAL)', en: 'Colour (RAL)' }, type: 'text', required: false, span: 2 },
            { key: 'batch', label: { fr: 'N° de lot', en: 'Batch N°' }, type: 'text', required: false, span: 3 },
          ],
        },
        PAINT_CONDITIONS,
        {
          key: 'equipment',
          label: { fr: 'Matériel utilisé', en: 'Equipment used' },
          type: 'devices',
          repeatable: false,
          minRows: 1,
          help: 'Appareil à flux magnétique. Un appareil hors étalonnage empêche la soumission du rapport.',
          fields: [{ key: 'device', label: { fr: 'Appareil', en: 'Device' }, type: 'device', required: true, span: 12 }],
        },
        PAINT_MEASURES,
        paintSummary(false),
        END_COMMENTS,
        COMPLIANT_RESULT,
        {
          key: 'photos',
          label: { fr: 'Planche photographique', en: 'Photo illustration' },
          type: 'photos',
          repeatable: true,
          minRows: 0,
          help: 'Zone contrôlée, degré de préparation, réception de sablage, contrôle de surface.',
        },
        {
          ...END_SIGNATURES_3,
          signatories: [
            { fr: 'Contrôle effectué par', en: 'Examination carried on by' },
            { fr: 'Rapport établi par', en: 'Report established by' },
            { fr: 'Client / tierce partie', en: 'Customer / third party' },
          ],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR01-F18 — IDENTIFICATION DES MATÉRIAUX (PMI)
   *
   *  Composition mesurée par élément, point par point, rapprochée de la
   *  nuance attendue. Le modèle Excel est la copie d'un rapport réel
   *  (repères de tuyauteries, analyses, nom du vérificateur) : seule sa
   *  structure est reprise.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR01-F18',
    version: '00',
    title: 'Rapport d’identification des matériaux (PMI)',
    titleEn: 'Positive material identification (PMI) report',
    methodCode: 'PMI',
    paradigm: 'MEASUREMENT',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'header',
          label: { fr: 'Identification', en: 'Identification' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'client', label: { fr: 'Client', en: 'Client' }, type: 'ref', required: true, autofill: 'client', span: 4 },
            { key: 'affairNumber', label: { fr: 'N° d’affaire', en: 'Transaction N°' }, type: 'ref', required: true, autofill: 'affairNumber', span: 4 },
            { key: 'plant', label: { fr: 'Site de l’usine', en: 'Plant location' }, type: 'ref', required: true, autofill: 'site', span: 4 },
            { key: 'project', label: { fr: 'Intitulé du projet', en: 'Project title' }, type: 'text', required: false, span: 6 },
            { key: 'itp', label: { fr: 'Référence du plan d’inspection (ITP)', en: 'ITP reference' }, type: 'text', required: false, span: 6 },
            { key: 'clientDocument', label: { fr: 'N° de document client', en: 'Document number (client)' }, type: 'text', required: false, span: 4 },
            { key: 'notification', label: { fr: 'N° d’avis d’intervention client', en: 'Notification for intervention N° (client)' }, type: 'text', required: false, span: 4 },
            { key: 'engineeringDocument', label: { fr: 'N° de document d’ingénierie', en: 'Engineering document N°' }, type: 'text', required: false, span: 4 },
            { key: 'supplierDocument', label: { fr: 'N° de document fournisseur', en: 'Supplier document N°' }, type: 'text', required: false, span: 6 },
            { key: 'standard', label: { fr: 'Code / spécification', en: 'Code / specification' }, type: 'standard-ref', required: true, autofill: 'standards', span: 6 },
          ],
        },
        {
          key: 'equipment',
          label: { fr: 'Appareils de surveillance et de mesure', en: 'Monitoring and measuring devices' },
          type: 'devices',
          repeatable: false,
          minRows: 1,
          help: 'Analyseur par fluorescence X. Un appareil hors étalonnage empêche la soumission du rapport.',
          fields: [{ key: 'device', label: { fr: 'Analyseur', en: 'Analyser' }, type: 'device', required: true, span: 12 }],
        },
        {
          key: 'results',
          label: { fr: 'Inspection — éléments PMI (%)', en: 'Inspection — PMI elements (%)' },
          type: 'table',
          repeatable: true,
          minRows: 1,
          help: 'Résultat PMI indicatif : la mesure comporte un intervalle de tolérance.',
          columns: [
            { key: 'item', label: { fr: 'Repère / équipement', en: 'Tag / item' }, type: 'text', required: true, span: 1 },
            { key: 'joint', label: { fr: 'Joint n°', en: 'Joint N°' }, type: 'text', required: false, span: 1 },
            ...['Cr', 'Cu', 'Fe', 'S', 'Ni', 'Mn', 'Co', 'Mo', 'Si', 'P', 'Al', 'Zn', 'Bi', 'Nb', 'Mg', 'V'].map((el) => ({
              key: el.toLowerCase(),
              label: { fr: el, en: el },
              type: 'number',
              required: false,
              unit: '%',
              decimals: 2,
              span: 1,
            })),
            { key: 'grade', label: { fr: 'Nuance identifiée', en: 'Specification' }, type: 'text', required: true, span: 1 },
            { key: 'acceptable', label: { fr: 'Acceptable', en: 'Acceptable' }, type: 'enum', required: true, options: ['Oui', 'Non'], span: 1 },
          ],
        },
        {
          key: 'reference',
          label: { fr: 'Composition de référence', en: 'Reference composition' },
          type: 'table',
          repeatable: true,
          minRows: 0,
          help: 'Limites de la nuance attendue, telles que données par la norme matière (ex. SA335 P9).',
          columns: [
            { key: 'material', label: { fr: 'Matériau', en: 'Material' }, type: 'text', required: true, span: 3 },
            { key: 'si', label: { fr: 'Si', en: 'Si' }, type: 'text', required: false, span: 1 },
            { key: 'sMax', label: { fr: 'S max', en: 'S max' }, type: 'text', required: false, span: 1 },
            { key: 'ni', label: { fr: 'Ni', en: 'Ni' }, type: 'text', required: false, span: 1 },
            { key: 'pMax', label: { fr: 'P max', en: 'P max' }, type: 'text', required: false, span: 1 },
            { key: 'mn', label: { fr: 'Mn', en: 'Mn' }, type: 'text', required: false, span: 1 },
            { key: 'cr', label: { fr: 'Cr', en: 'Cr' }, type: 'text', required: false, span: 1 },
            { key: 'mo', label: { fr: 'Mo', en: 'Mo' }, type: 'text', required: false, span: 1 },
            { key: 'v', label: { fr: 'V', en: 'V' }, type: 'text', required: false, span: 2 },
          ],
        },
        END_NOTE,
        {
          key: 'signatures',
          label: { fr: 'Visas', en: 'Signatures' },
          type: 'signature-matrix',
          repeatable: false,
          signatories: [
            { fr: 'Examen effectué par', en: 'Examination carried on by' },
            { fr: 'Rapport établi par', en: 'Report established by' },
            { fr: 'Rapport vérifié et approuvé par', en: 'Checked and approved by' },
          ],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR01-F14 — RÉCEPTION ET SUIVI DES TRAVAUX
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR01-F14',
    version: '00',
    title: 'Rapport de réception et de suivi des travaux',
    titleEn: 'Report of receipt and work monitoring',
    methodCode: null,
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'header',
          label: { fr: 'Identification', en: 'Identification' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'client', label: { fr: 'Client', en: 'Customer' }, type: 'ref', required: true, autofill: 'client', span: 4 },
            { key: 'subcontractor', label: { fr: 'Sous-traitant', en: 'Subcontractor' }, type: 'text', required: false, span: 4 },
            { key: 'place', label: { fr: 'Lieu d’inspection', en: 'Place of inspection' }, type: 'ref', required: true, autofill: 'site', span: 4 },
            { key: 'drawing', label: { fr: 'Repère plan', en: 'Drawing N°' }, type: 'text', required: false, span: 4 },
            { key: 'designation', label: { fr: 'Désignation', en: 'Designation' }, type: 'ref', required: true, autofill: 'asset', span: 4 },
            { key: 'standard', label: { fr: 'Spécification applicable', en: 'Examination according to' }, type: 'standard-ref', required: true, autofill: 'standards', span: 4 },
          ],
        },
        {
          key: 'findings',
          label: { fr: 'Constats et observations', en: 'Statements and observations' },
          type: 'table',
          repeatable: true,
          minRows: 1,
          columns: [
            { key: 'nature', label: { fr: 'Nature des travaux', en: 'Work type' }, type: 'enum', required: true, options: ['Construction', 'Réhabilitation', 'Réparation', 'Peinture'], span: 2 },
            { key: 'finding', label: { fr: 'Constat et observation', en: 'Statement and observation' }, type: 'text', required: true, span: 7 },
            { key: 'decision', label: { fr: 'Décision', en: 'Decision' }, type: 'text', required: true, span: 3 },
          ],
        },
        {
          key: 'photos',
          label: { fr: 'Illustrations photographiques', en: 'Photographic illustrations' },
          type: 'photos',
          repeatable: true,
          minRows: 0,
        },
        {
          key: 'signatures',
          label: { fr: 'Visas', en: 'Signatures' },
          type: 'signature-matrix',
          repeatable: false,
          signatories: [
            { fr: 'Sous-traitant', en: 'Subcontractor' },
            { fr: 'I2S TESTING', en: 'I2S TESTING' },
            { fr: 'Client / tierce partie', en: 'Customer / third party' },
          ],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR01-F13 — CERTIFICAT DE QUALIFICATION DE SOUDEUR (ASME IX)
   *
   *  Chaque variable de soudage se lit en deux valeurs : celle de
   *  l'assemblage de qualification et le domaine de validité qu'elle ouvre.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR01-F13',
    version: '00',
    title: 'Certificat de qualification de soudeur',
    titleEn: 'Welder performance qualification (WPQ)',
    methodCode: 'WELD',
    paradigm: 'CRITERIA',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'welder',
          label: { fr: 'Soudeur', en: 'Welder' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'name', label: { fr: 'Nom', en: 'Name' }, type: 'text', required: true, span: 6 },
            { key: 'stamp', label: { fr: 'Repère', en: 'Stamp' }, type: 'text', required: true, span: 6 },
            { key: 'idNumber', label: { fr: 'CIN', en: 'ID N°' }, type: 'text', required: true, span: 4 },
            { key: 'code', label: { fr: 'Norme de référence', en: 'Code' }, type: 'standard-ref', required: true, autofill: 'standards', span: 4 },
            { key: 'employer', label: { fr: 'Employeur', en: 'Company' }, type: 'ref', required: true, autofill: 'client', span: 4 },
            { key: 'wps', label: { fr: 'DMOS n°', en: 'WPS N°' }, type: 'text', required: true, span: 6 },
          ],
        },
        {
          key: 'test',
          label: { fr: 'Description de l’essai', en: 'Test description' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'wpsFollowed', label: { fr: 'DMOS suivi', en: 'Identification of WPS followed' }, type: 'text', required: true, span: 6 },
            { key: 'weldType', label: { fr: 'Soudure', en: 'Weld' }, type: 'enum', required: true, options: ['Coupon d’essai', 'Soudure de production'], span: 6 },
            { key: 'baseMetal', label: { fr: 'Spécification du métal de base', en: 'Specification of base metal' }, type: 'text', required: true, span: 6 },
            { key: 'thickness', label: { fr: 'Épaisseur', en: 'Thickness' }, type: 'number', required: true, unit: 'mm', decimals: 1, span: 6 },
          ],
        },
        {
          key: 'variables',
          label: { fr: 'Paramètres de soudage — assemblage de qualification et domaine de validité', en: 'Welding parameters — qualification assembly and range qualified' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            ['process', 'Procédé de soudage', 'Welding process'],
            ['mode', 'Type (manuel, semi-automatique…)', 'Type (manual, semi-automatic…)'],
            ['backing', 'Support envers (avec, sans) — QW-402', 'Backing (with, without) — QW-402'],
            ['plateOrTube', 'Tôle (P) ou tube (T)', 'Plate (P) or tube (T)'],
            ['pNumber', 'Métal de base, P-Number à P-Number', 'Base metal P-Number to P-Number'],
            ['fillerSpec', 'Spécification du métal d’apport (SFA)', 'Filler metal specification (SFA)'],
            ['fillerClass', 'Classification du métal d’apport', 'Filler metal classification'],
            ['fNumber', 'F-Number du métal d’apport', 'Filler metal F-Number'],
            ['insert', 'Insert consommable (GTAW, PAW)', 'Consumable insert (GTAW, PAW)'],
            ['productForm', 'Forme du métal d’apport (GTAW, PAW)', 'Filler metal product form (GTAW, PAW)'],
            ['deposit', 'Épaisseur déposée par procédé (mm)', 'Deposit thickness for each process (mm)'],
            ['position', 'Position (2G, 6G, 3F…)', 'Position (2G, 6G, 3F…)'],
            ['progression', 'Progression verticale (montante, descendante)', 'Vertical progression (uphill, downhill)'],
            ['fuelGas', 'Type de gaz combustible (OFW)', 'Type of fuel gas (OFW)'],
            ['backingGas', 'Gaz inerte envers (GTAW, PAW, GMAW)', 'Inert gas backing (GTAW, PAW, GMAW)'],
            ['transfer', 'Mode de transfert (GMAW)', 'Transfer mode (GMAW)'],
            ['current', 'Courant et polarité GTAW (AC, DCEP, DCEN)', 'GTAW current type / polarity (AC, DCEP, DCEN)'],
          ].flatMap(([key, fr, en]) => [
            { key: `${key}Test`, label: { fr: `${fr} — assemblage`, en: `${en} — assembly` }, type: 'text', required: false, span: 6 },
            { key: `${key}Range`, label: { fr: `${fr} — domaine de validité`, en: `${en} — range qualified` }, type: 'text', required: false, span: 6 },
          ]),
        },
        {
          key: 'bendTests',
          label: { fr: 'Essais de pliage guidé', en: 'Guided bend tests' },
          type: 'table',
          repeatable: true,
          minRows: 0,
          columns: [
            { key: 'type', label: { fr: 'Type de pliage', en: 'Type' }, type: 'enum', required: true, options: ['QW-462.2 — côté', 'QW-462.3(a) — transversal endroit et envers', 'QW-462.3(b) — longitudinal endroit et envers'], span: 5 },
            { key: 'result', label: { fr: 'Résultat', en: 'Result' }, type: 'enum', required: true, options: ['Acceptable', 'Non acceptable'], span: 3 },
            { key: 'remarks', label: { fr: 'Observations', en: 'Remarks' }, type: 'text', required: false, span: 4 },
          ],
        },
        {
          key: 'destructive',
          label: { fr: 'Autres essais destructifs', en: 'Other destructive tests' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'fractureDefects', label: { fr: 'Soudure d’angle, essai de rupture — longueur et pourcentage des défauts', en: 'Fillet weld fracture test — length and percent of defects' }, type: 'text', required: false, span: 12 },
            { key: 'filletLeg', label: { fr: 'Macroscopie — dimension du cordon', en: 'Macro test — fillet leg size' }, type: 'number', required: false, unit: 'mm', decimals: 1, span: 6 },
            { key: 'concavity', label: { fr: 'Macroscopie — concavité / convexité', en: 'Macro test — concavity / convexity' }, type: 'text', required: false, span: 6 },
            { key: 'mechanicalBy', label: { fr: 'Essais mécaniques dirigés par', en: 'Mechanical tests conducted by' }, type: 'text', required: false, span: 6 },
            { key: 'labReport', label: { fr: 'Rapport d’essai laboratoire n°', en: 'Laboratory test N°' }, type: 'text', required: false, span: 6 },
          ],
        },
        {
          key: 'ndt',
          label: { fr: 'Résultats des CND', en: 'NDT results' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'visualResult', label: { fr: 'Examen visuel (QW-302.4) — résultat', en: 'Visual examination (QW-302.4) — result' }, type: 'enum', required: true, options: ['Acceptable', 'Non acceptable'], span: 6 },
            { key: 'visualReport', label: { fr: 'Examen visuel — rapport n°', en: 'Visual examination — report N°' }, type: 'text', required: false, span: 6 },
            { key: 'volumetricResult', label: { fr: 'Examen volumique (QW-304) — résultat', en: 'Volumetric test (QW-304) — result' }, type: 'enum', required: false, options: ['Acceptable', 'Non acceptable'], span: 6 },
            { key: 'volumetricReport', label: { fr: 'Examen volumique — rapport n°', en: 'Volumetric test — report N°' }, type: 'text', required: false, span: 6 },
          ],
        },
        {
          key: 'photos',
          label: { fr: 'Photo du soudeur', en: 'Photo' },
          type: 'photos',
          repeatable: false,
          minRows: 1,
        },
        {
          key: 'signatures',
          label: { fr: 'Visa', en: 'Signature' },
          type: 'signature-matrix',
          repeatable: false,
          reference: 'Nous certifions que les indications de ce document sont exactes et que les soudures d’essai ont été préparées, soudées et essayées conformément à la section IX du code ASME, édition 2015.',
          signatories: [{ fr: 'Inspecteur', en: 'Inspector' }],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR01-F11 — ATTESTATION DE COMPOSITION D'ATMOSPHÈRE
   *
   *  Délivrée avant travaux à chaud ou à froid : explosivité et teneur en
   *  oxygène, puis l'une des deux attestations. Le modèle porte encore une
   *  ancienne référence (« SCR, révision du 25/11/2014 ») en plus de son
   *  code QMS.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR01-F11',
    version: '00',
    title: 'Attestation de vérification de composition d’atmosphère',
    methodCode: null,
    paradigm: 'MEASUREMENT',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'header',
          label: { fr: 'Vérification' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'date', label: { fr: 'Date de la vérification' }, type: 'date', required: true, autofill: 'date', span: 3 },
            { key: 'place', label: { fr: 'Lieu de la vérification' }, type: 'ref', required: true, autofill: 'site', span: 3 },
            { key: 'client', label: { fr: 'Client' }, type: 'ref', required: true, autofill: 'client', span: 3 },
            { key: 'agent', label: { fr: 'Agent de contrôle' }, type: 'ref', required: true, autofill: 'inspector', span: 3 },
          ],
        },
        {
          key: 'equipment',
          label: { fr: 'Équipement de vérification' },
          type: 'devices',
          repeatable: false,
          minRows: 1,
          help: 'Détecteur multigaz. Un appareil hors étalonnage à la date de la vérification empêche la soumission.',
          fields: [{ key: 'device', label: { fr: 'Détecteur' }, type: 'device', required: true, span: 12 }],
        },
        {
          key: 'subject',
          label: { fr: 'Équipement ou zone sujet à vérification' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'plantId', label: { fr: 'Identification usine' }, type: 'text', required: false, span: 6 },
            { key: 'constructionId', label: { fr: 'Identification de construction' }, type: 'text', required: false, span: 6 },
            { key: 'equipmentType', label: { fr: 'Type d’équipement' }, type: 'ref', required: true, autofill: 'asset', span: 6 },
            { key: 'location', label: { fr: 'Localisation de la vérification' }, type: 'enum', required: true, options: ['Atmosphère interne', 'Atmosphère externe', 'Autre'], span: 6 },
          ],
        },
        {
          key: 'results',
          label: { fr: 'Objet de la vérification — résultats' },
          type: 'conditions',
          repeatable: false,
          help: 'Explosivité conforme si LIE = 0 % · teneur en oxygène conforme si 20 % ≤ O₂ ≤ 21 %.',
          fields: [
            { key: 'lel', label: { fr: 'Explosivité (LIE)' }, type: 'number', required: true, unit: '%', decimals: 1, span: 3 },
            { key: 'lelResult', label: { fr: 'Explosivité — résultat' }, type: 'enum', required: true, options: ['Conforme', 'Non conforme'], span: 3 },
            { key: 'oxygen', label: { fr: 'Teneur en oxygène (O₂)' }, type: 'number', required: true, unit: '%', decimals: 1, span: 3 },
            { key: 'oxygenResult', label: { fr: 'Oxygène — résultat' }, type: 'enum', required: true, options: ['Conforme', 'Non conforme'], span: 3 },
          ],
        },
        {
          key: 'attestation',
          label: { fr: 'Attestation' },
          type: 'verdict',
          repeatable: false,
          reference: 'I2S TESTING atteste, au vu des valeurs relevées et pour les paramètres et l’atmosphère contrôlés. Pour servir et valoir ce que de droit.',
          verdicts: [
            { fr: 'Efficacité du dégazage et sécurité assurée pour des travaux à chaud ou à froid (LIE = 0 %)' },
            { fr: 'Absence de sécurité assurée pour des travaux à chaud (LIE > 0 %)' },
          ],
        },
        {
          key: 'signatures',
          label: { fr: 'Visa' },
          type: 'signature-matrix',
          repeatable: false,
          reference: 'Fait à Casablanca.',
          signatories: [{ fr: 'Agent de contrôle' }],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR01-F25 — TARAGE DE SOUPAPE
   *
   *  Une ligne par soupape à ressort : caractéristiques et essai de tarage
   *  se lisent ensemble, un même rapport couvrant souvent plusieurs
   *  soupapes d'un appareil.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR01-F25',
    version: '00',
    title: 'Rapport de tarage de soupape',
    methodCode: null,
    paradigm: 'MEASUREMENT',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'parties',
          label: { fr: 'Propriétaire et demandeur de l’essai' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'owner', label: { fr: 'Propriétaire — identité' }, type: 'ref', required: true, autofill: 'client', span: 6 },
            { key: 'ownerAddress', label: { fr: 'Propriétaire — adresse' }, type: 'text', required: false, span: 6 },
            { key: 'requester', label: { fr: 'Demandeur de l’essai — identité' }, type: 'text', required: false, span: 6 },
            { key: 'requesterAddress', label: { fr: 'Demandeur de l’essai — adresse' }, type: 'text', required: false, span: 6 },
          ],
        },
        {
          key: 'equipment',
          label: { fr: 'Caractéristiques de l’appareil' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'type', label: { fr: 'Type d’appareil' }, type: 'ref', required: true, autofill: 'asset', span: 6 },
            { key: 'manufacturer', label: { fr: 'Constructeur' }, type: 'text', required: false, span: 6 },
            { key: 'serial', label: { fr: 'N° de fabrication' }, type: 'text', required: true, span: 4 },
            { key: 'year', label: { fr: 'Année de construction' }, type: 'number', required: false, decimals: 0, span: 4 },
            { key: 'place', label: { fr: 'Lieu de construction' }, type: 'text', required: false, span: 4 },
          ],
        },
        {
          key: 'test',
          label: { fr: 'Essai' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'date', label: { fr: 'Date de l’essai' }, type: 'date', required: true, autofill: 'date', span: 4 },
            { key: 'circumstance', label: { fr: 'Circonstance' }, type: 'text', required: true, span: 4 },
            { key: 'nextTest', label: { fr: 'Date du prochain essai' }, type: 'date', required: false, span: 4 },
          ],
        },
        {
          key: 'valves',
          label: { fr: 'Soupapes à ressort — essai de tarage' },
          type: 'table',
          repeatable: true,
          minRows: 1,
          columns: [
            { key: 'number', label: { fr: 'N° de soupape' }, type: 'text', required: true, span: 1 },
            { key: 'brand', label: { fr: 'Marque / type' }, type: 'text', required: false, span: 2 },
            { key: 'inletDiameter', label: { fr: 'Diamètre d’entrée' }, type: 'number', required: false, unit: 'mm', decimals: 0, span: 1 },
            { key: 'setPressure', label: { fr: 'Pression de tarage' }, type: 'number', required: true, unit: 'bar', decimals: 2, span: 1 },
            { key: 'seatTightness', label: { fr: 'Étanchéité buse-clapet à 90 % P' }, type: 'number', required: false, unit: 'bar', decimals: 2, span: 2 },
            { key: 'backPressure', label: { fr: 'Contre-pression' }, type: 'number', required: false, unit: 'bar', decimals: 2, span: 1 },
            { key: 'fluid', label: { fr: 'Fluide' }, type: 'text', required: true, span: 2 },
            { key: 'bubbles', label: { fr: 'Étanchéité' }, type: 'number', required: false, unit: 'bulles/min', decimals: 0, span: 1 },
            { key: 'duration', label: { fr: 'Temps' }, type: 'number', required: false, unit: 'min', decimals: 0, span: 1 },
          ],
        },
        {
          key: 'results',
          label: { fr: 'Résultats des essais' },
          type: 'text',
          repeatable: false,
          fields: [{ key: 'results', label: { fr: 'Résultats des essais' }, type: 'textarea', required: true, span: 12 }],
        },
        {
          key: 'signatures',
          label: { fr: 'Visas' },
          type: 'signature-matrix',
          repeatable: false,
          signatories: [{ fr: 'L’inspecteur' }, { fr: 'La direction' }, { fr: 'Le demandeur' }],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR01-F27 — FONCTIONNEMENT DES APPAREILS
   *
   *  Compresseur et son réservoir d'air : deux fiches côte à côte, puis un
   *  résultat d'examen rédigé.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR01-F27',
    version: '00',
    title: 'Rapport de fonctionnement des appareils',
    methodCode: null,
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'header',
          label: { fr: 'Renseignements généraux' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'client', label: { fr: 'Client' }, type: 'ref', required: true, autofill: 'client', span: 6 },
            { key: 'owner', label: { fr: 'Propriétaire' }, type: 'text', required: false, span: 6 },
            { key: 'place', label: { fr: 'Lieu d’examen' }, type: 'ref', required: true, autofill: 'site', span: 6 },
            { key: 'purpose', label: { fr: 'Objet de la visite' }, type: 'text', required: true, span: 6 },
          ],
        },
        {
          key: 'apparatus',
          label: { fr: 'Caractéristiques de l’appareil' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'designation', label: { fr: 'Désignation' }, type: 'ref', required: true, autofill: 'asset', span: 4 },
            { key: 'manufacturer', label: { fr: 'Constructeur' }, type: 'text', required: false, span: 4 },
            { key: 'model', label: { fr: 'Modèle / type' }, type: 'text', required: false, span: 4 },
            { key: 'year', label: { fr: 'Année de fabrication' }, type: 'number', required: false, decimals: 0, span: 4 },
            { key: 'serial', label: { fr: 'N° de série' }, type: 'text', required: true, span: 4 },
            { key: 'servicePressure', label: { fr: 'Pression de service' }, type: 'number', required: false, unit: 'bar', decimals: 1, span: 4 },
            { key: 'maxPressure', label: { fr: 'Pression maximale' }, type: 'number', required: false, unit: 'bar', decimals: 1, span: 4 },
            { key: 'cylinders', label: { fr: 'Nombre de cylindres' }, type: 'number', required: false, decimals: 0, span: 4 },
            { key: 'engineBrand', label: { fr: 'Marque du moteur' }, type: 'text', required: false, span: 4 },
          ],
        },
        {
          key: 'receiver',
          label: { fr: 'Caractéristiques du réservoir d’air' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'designation', label: { fr: 'Désignation' }, type: 'text', required: false, span: 4 },
            { key: 'manufacturer', label: { fr: 'Constructeur' }, type: 'text', required: false, span: 4 },
            { key: 'model', label: { fr: 'Modèle / type' }, type: 'text', required: false, span: 4 },
            { key: 'year', label: { fr: 'Année de fabrication' }, type: 'number', required: false, decimals: 0, span: 4 },
            { key: 'serial', label: { fr: 'N° de série' }, type: 'text', required: false, span: 4 },
            { key: 'servicePressure', label: { fr: 'Pression de service' }, type: 'number', required: false, unit: 'bar', decimals: 1, span: 4 },
            { key: 'minTemperature', label: { fr: 'Température minimale' }, type: 'number', required: false, unit: '°C', decimals: 0, span: 6 },
            { key: 'maxTemperature', label: { fr: 'Température maximale' }, type: 'number', required: false, unit: '°C', decimals: 0, span: 6 },
          ],
        },
        {
          key: 'result',
          label: { fr: 'Résultat de l’examen' },
          type: 'text',
          repeatable: false,
          help: 'Il est systématiquement préconisé que l’opérateur procède, avant chaque utilisation, à une ultime vérification de bon fonctionnement.',
          fields: [{ key: 'result', label: { fr: 'Résultat de l’examen' }, type: 'textarea', required: true, span: 12 }],
        },
        EILM_PHOTOS,
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR01-F17 — RAPPORT D'INSPECTION DE RÉSERVOIR
   *
   *  Le modèle n'est qu'un sommaire de rapport d'ingénierie : robe, toit et
   *  fond (inspection visuelle, épaisseurs, évaluation, préconisations),
   *  géométrie, stabilité au vent et au séisme. Ses rubriques deviennent
   *  les sections du formulaire ; les épaisseurs sont relevées ligne à
   *  ligne, le reste est rédigé.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR01-F17',
    version: '00',
    title: 'Rapport d’inspection',
    methodCode: null,
    paradigm: 'CHECKLIST',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'header',
          label: { fr: 'Rapport d’inspection' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'department', label: { fr: 'Département' }, type: 'text', required: false, span: 4 },
            { key: 'author', label: { fr: 'Rapport établi par' }, type: 'ref', required: true, autofill: 'inspector', span: 4 },
            { key: 'date', label: { fr: 'Établi le' }, type: 'date', required: true, autofill: 'date', span: 4 },
            { key: 'inspectionDates', label: { fr: 'Date(s) de contrôle' }, type: 'text', required: true, span: 6 },
            { key: 'inspectors', label: { fr: 'Intervenant(s)' }, type: 'text', required: true, span: 6 },
          ],
        },
        {
          key: 'presentation',
          label: { fr: 'Objectif, équipement, référentiels et programme' },
          type: 'text',
          repeatable: false,
          fields: [
            { key: 'objective', label: { fr: '1 — Objectif de la prestation' }, type: 'textarea', required: true, span: 12 },
            { key: 'equipment', label: { fr: '2 — Description de l’équipement' }, type: 'textarea', required: true, span: 12 },
            { key: 'references', label: { fr: '3 — Référentiels' }, type: 'textarea', required: true, span: 12 },
            { key: 'programme', label: { fr: '4 — Programme d’inspection' }, type: 'textarea', required: true, span: 12 },
          ],
        },
        {
          key: 'thickness',
          label: { fr: '5 — Mesures d’épaisseur' },
          type: 'table',
          repeatable: true,
          minRows: 0,
          columns: [
            { key: 'part', label: { fr: 'Partie' }, type: 'enum', required: true, options: ['Robe', 'Toit', 'Fond'], span: 2 },
            { key: 'mark', label: { fr: 'Repère (virole, tôle, point)' }, type: 'text', required: true, span: 4 },
            { key: 'nominal', label: { fr: 'Épaisseur nominale' }, type: 'number', required: false, unit: 'mm', decimals: 1, span: 3 },
            { key: 'measured', label: { fr: 'Épaisseur mesurée' }, type: 'number', required: true, unit: 'mm', decimals: 1, span: 3 },
          ],
        },
        ...(['shell', 'roof', 'bottom'] as const).map((part, i) => {
          const nom = ['Robe et accessoires', 'Toit et accessoires', 'Fond'][i];
          return {
            key: part,
            label: { fr: `5.${i + 1} — ${nom}` },
            type: 'text',
            repeatable: false,
            fields: [
              { key: 'visual', label: { fr: 'Inspection visuelle' }, type: 'textarea', required: true, span: 12 },
              { key: 'evaluation', label: { fr: 'Évaluation des résultats' }, type: 'textarea', required: true, span: 12 },
              ...(part === 'roof'
                ? [{ key: 'vents', label: { fr: 'Calcul et vérification des évents' }, type: 'textarea', required: false, span: 12 }]
                : []),
              { key: 'recommendations', label: { fr: 'Préconisations' }, type: 'textarea', required: false, span: 12 },
            ],
          };
        }),
        {
          key: 'geometry',
          label: { fr: '6 — Contrôle de la géométrie du réservoir' },
          type: 'text',
          repeatable: false,
          help: 'La rotondité et la verticalité peuvent faire l’objet de leurs propres rapports (PR01-F07 et PR01-F03).',
          fields: [
            { key: 'settlement', label: { fr: '6.1 — Tassement' }, type: 'textarea', required: false, span: 12 },
            { key: 'roundness', label: { fr: '6.2 — Rotondité' }, type: 'textarea', required: false, span: 12 },
            { key: 'plumbness', label: { fr: '6.3 — Verticalité' }, type: 'textarea', required: false, span: 12 },
          ],
        },
        {
          key: 'stability',
          label: { fr: '7 — Calcul de la stabilité du réservoir' },
          type: 'text',
          repeatable: false,
          fields: [
            { key: 'wind', label: { fr: '7.1 — Effet du vent' }, type: 'textarea', required: false, span: 12 },
            { key: 'seismic', label: { fr: '7.2 — Effet du séisme' }, type: 'textarea', required: false, span: 12 },
            { key: 'stiffeners', label: { fr: '7.3 — Raidisseurs intermédiaires' }, type: 'textarea', required: false, span: 12 },
          ],
        },
        {
          key: 'photos',
          label: { fr: 'Annexes' },
          type: 'photos',
          repeatable: true,
          minRows: 0,
        },
        EILM_VISAS,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR01-F09 — PV DE QUALIFICATION DE MODE OPÉRATOIRE (ASME IX)
   *
   *  Procedure Qualification Record : variables essentielles rangées par
   *  article QW, puis essais de traction, pliage, ténacité et soudure
   *  d'angle, et la certification sous le contrôle d'I2S TESTING.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR01-F09',
    version: '00',
    title: 'PV de qualification de mode opératoire de soudage (QMOS) — ASME IX',
    titleEn: 'Procedure qualification record (PQR) — ASME IX',
    methodCode: 'WELD',
    paradigm: 'CRITERIA',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        section('header', 'Identification', 'Identification', [
          champ('pqr', 'QMOS n°', 'PQR N°', 'text', { required: true }),
          champ('company', 'Nom de la société', 'Company name', 'ref', { required: true, autofill: 'client' }),
          champ('testDate', 'Date de l’épreuve', 'Test date', 'date', { required: true, autofill: 'date' }),
          champ('wps', 'DMOS n°', 'WPS N°', 'text', { required: true }),
          champ('processes', 'Procédé(s) de soudage', 'Welding process(es)', 'text', { required: true }),
          champ('mode', 'Type', 'Type', 'enum', { required: true, options: ['Manuel', 'Automatique', 'Semi-automatique'] }),
        ]),
        section('joints', 'Joints (QW-402)', 'Joints (QW-402)', [
          champ('grooveDesign', 'Détail du chanfrein', 'Groove design', 'textarea', { span: 6 }),
          champ('weldSequence', 'Séquence de soudage', 'Weld sequence', 'textarea', { span: 6 }),
        ], 'text'),
        tableau('passes', 'Conditions de soudage', 'Welding conditions', [
          champ('pass', 'N° de passe', 'Pass N°', 'number', { required: true, decimals: 0, span: 2 }),
          champ('process', 'Procédé', 'Process', 'text', { required: true, span: 2 }),
          champ('fillerDiameter', 'Ø métal d’apport', 'Filler dia.', 'number', { unit: 'mm', decimals: 1, span: 2 }),
          champ('amps', 'Intensité', 'Amps', 'number', { unit: 'A', decimals: 0, span: 2 }),
          champ('volts', 'Tension', 'Volts', 'number', { unit: 'V', decimals: 1, span: 2 }),
          champ('travelSpeed', 'Vitesse de soudage', 'Travel speed', 'number', { unit: 'cm/min', decimals: 1, span: 2 }),
        ]),
        section('baseMetals', 'Matériaux de base (QW-403)', 'Base metals (QW-403)', [
          champ('spec', 'Spécification matériau', 'Material spec.', 'text', { required: true }),
          champ('grade', 'Type ou nuance', 'Type or grade'),
          champ('pNumber', 'P-No', 'P-No', 'text', { span: 3 }),
          champ('toPNumber', 'sur P-No', 'to P-No', 'text', { span: 3 }),
          champ('thickness', 'Épaisseur de l’assemblage d’essai', 'Thickness of test coupon', 'number', { required: true, unit: 'mm', decimals: 1, span: 3 }),
          champ('diameter', 'Diamètre de l’assemblage d’essai', 'Diameter of test coupon', 'number', { unit: 'mm', decimals: 1, span: 3 }),
          champ('other', 'Autre', 'Other', 'text', { span: 12 }),
        ]),
        section('pwht', 'Traitement thermique après soudage (QW-407)', 'PWHT (QW-407)', [
          champ('temperature', 'Température', 'Temperature', 'number', { unit: '°C', decimals: 0, span: 4 }),
          champ('time', 'Durée', 'Time', 'text', { span: 4 }),
          champ('other', 'Autre', 'Other', 'text', { span: 4 }),
        ]),
        tableau('gas', 'Gaz (QW-408)', 'Gas (QW-408)', [
          champ('role', 'Emploi', 'Use', 'enum', { required: true, options: ['Endroit', 'Envers', 'Traînard'], span: 3 }),
          champ('gas', 'Gaz', 'Gas(es)', 'text', { required: true, span: 3 }),
          champ('mixture', 'Mélange', 'Mixture', 'text', { span: 3 }),
          champ('flow', 'Débit', 'Flow rate', 'number', { unit: 'l/min', decimals: 1, span: 3 }),
        ]),
        section('filler', 'Métaux d’apport (QW-404)', 'Filler metals (QW-404)', [
          champ('sfa', 'Spécification SFA', 'SFA specification'),
          champ('aws', 'Classification AWS', 'AWS classification'),
          champ('fNumber', 'Métal d’apport F-No', 'Filler metal F-No', 'text', { span: 4 }),
          champ('aNumber', 'Analyse du métal déposé A-No', 'Weld metal analysis A-No', 'text', { span: 4 }),
          champ('size', 'Diamètre du métal d’apport', 'Size of filler metal', 'number', { unit: 'mm', decimals: 1, span: 4 }),
          champ('depositThickness', 'Épaisseur du métal déposé', 'Weld metal thickness', 'number', { unit: 'mm', decimals: 1 }),
          champ('other', 'Autre', 'Other'),
        ]),
        section('electrical', 'Caractéristiques électriques (QW-409)', 'Electrical characteristics (QW-409)', [
          champ('current', 'Courant', 'Current', 'text', { span: 4 }),
          champ('polarity', 'Polarité', 'Polarity', 'text', { span: 4 }),
          champ('tungsten', 'Diamètre de l’électrode réfractaire', 'Tungsten electrode size', 'number', { unit: 'mm', decimals: 1, span: 4 }),
          champ('amps', 'Intensité', 'Amps', 'number', { unit: 'A', decimals: 0, span: 4 }),
          champ('volts', 'Tension', 'Volts', 'number', { unit: 'V', decimals: 1, span: 4 }),
          champ('other', 'Autre', 'Other', 'text', { span: 4 }),
        ]),
        section('position', 'Position (QW-405) et préchauffage (QW-406)', 'Position (QW-405) and preheat (QW-406)', [
          champ('groovePosition', 'Position de soudage', 'Position of groove', 'text', { span: 4 }),
          champ('progression', 'Sens de soudage (montant, descendant)', 'Weld progression (uphill, downhill)', 'text', { span: 4 }),
          champ('positionOther', 'Autre (position)', 'Other (position)', 'text', { span: 4 }),
          champ('preheat', 'Température minimale de préchauffage', 'Preheat temperature', 'number', { unit: '°C', decimals: 0, span: 4 }),
          champ('interpass', 'Température maximale entre passes', 'Interpass temperature', 'number', { unit: '°C', decimals: 0, span: 4 }),
          champ('preheatOther', 'Autre (préchauffage)', 'Other (preheat)', 'text', { span: 4 }),
        ]),
        section('technique', 'Technique (QW-410)', 'Technique (QW-410)', [
          champ('travelSpeed', 'Vitesse de soudage', 'Travel speed', 'number', { unit: 'cm/min', decimals: 1, span: 4 }),
          champ('bead', 'Passe tirée ou balayée', 'String or weave bead', 'text', { span: 4 }),
          champ('oscillation', 'Oscillation', 'Oscillation', 'text', { span: 4 }),
          champ('passes', 'Monopasse ou multipasses (par côté)', 'Multipass or single pass (per side)', 'text', { span: 4 }),
          champ('electrodes', 'Mono ou multi-électrodes', 'Single or multiple electrodes', 'text', { span: 4 }),
          champ('other', 'Autre', 'Other', 'text', { span: 4 }),
        ]),
        tableau('tensile', 'Essai de traction (QW-150)', 'Tensile test (QW-150)', [
          champ('specimen', 'Éprouvette n°', 'Specimen N°', 'text', { required: true, span: 1 }),
          champ('width', 'Largeur', 'Width', 'number', { unit: 'mm', decimals: 2, span: 1 }),
          champ('thickness', 'Épaisseur', 'Thickness', 'number', { unit: 'mm', decimals: 2, span: 1 }),
          champ('area', 'Section', 'Area', 'number', { unit: 'mm²', decimals: 1, span: 2 }),
          champ('load', 'Charge de rupture', 'Ultimate total load', 'number', { unit: 'N', decimals: 0, span: 2 }),
          champ('stress', 'Contrainte de rupture', 'Ultimate unit stress', 'number', { unit: 'MPa', decimals: 0, span: 2 }),
          champ('failure', 'Type et position de la rupture', 'Type of failure and location', 'text', { span: 3 }),
        ]),
        tableau('bend', 'Essai de pliage guidé (QW-160)', 'Guided bend test (QW-160)', [
          champ('type', 'Type et figure n°', 'Type and figure N°', 'text', { required: true, span: 6 }),
          champ('result', 'Résultat', 'Result', 'text', { required: true, span: 6 }),
        ]),
        tableau('toughness', 'Essais de ténacité (QW-170)', 'Toughness test (QW-170)', [
          champ('specimen', 'Éprouvette n°', 'Specimen N°', 'text', { required: true, span: 1 }),
          champ('notch', 'Position de l’entaille', 'Notch location', 'text', { span: 2 }),
          champ('size', 'Dimension de l’éprouvette', 'Specimen size', 'text', { span: 2 }),
          champ('temperature', 'Température d’essai', 'Test temperature', 'number', { unit: '°C', decimals: 0, span: 1 }),
          champ('energy', 'Énergie', 'Energy', 'number', { unit: 'J', decimals: 0, span: 1 }),
          champ('shear', 'Part ductile', 'Shear', 'number', { unit: '%', decimals: 0, span: 1 }),
          champ('expansion', 'Expansion', 'Lateral expansion', 'number', { unit: 'mm', decimals: 2, span: 2 }),
          champ('dropWeight', 'Drop weight (Pellini)', 'Drop weight', 'enum', { options: ['Rompu', 'Non rompu'], span: 2 }),
        ]),
        section('fillet', 'Essai de soudure d’angle (QW-180) et autres essais', 'Fillet weld test (QW-180) and other tests', [
          champ('satisfactory', 'Résultat satisfaisant', 'Result satisfactory', 'enum', { options: OUI_NON, span: 3 }),
          champ('penetration', 'Pénétration à la racine', 'Penetration into parent metal', 'enum', { options: OUI_NON, span: 3 }),
          champ('macro', 'Macroscopie — résultats', 'Macro — results'),
          champ('otherTest', 'Type d’autre essai', 'Type of other test'),
          champ('depositAnalysis', 'Analyse sur dépôt', 'Deposit analysis'),
          champ('comments', 'Observations', 'Comments', 'textarea', { span: 12 }),
        ]),
        section('welder', 'Soudeur et essais', 'Welder and tests', [
          champ('name', 'Nom du soudeur', 'Welder’s name', 'text', { required: true, span: 4 }),
          champ('clock', 'Matricule', 'Clock N°', 'text', { span: 4 }),
          champ('stamp', 'Poinçon n°', 'Stamp N°', 'text', { span: 4 }),
          champ('conductedBy', 'Essais dirigés par', 'Test conducted by'),
          champ('labReport', 'Rapport d’essai laboratoire n°', 'Laboratory test N°'),
          champ('manufacturer', 'Constructeur', 'Manufacturer', 'text', { span: 12 }),
        ]),
        {
          key: 'signatures',
          label: { fr: 'Certification', en: 'Certification' },
          type: 'signature-matrix',
          repeatable: false,
          reference: 'Le constructeur certifie l’exactitude du procès-verbal et que les assemblages d’essai ont été préparés, soudés et essayés selon la section IX du code ASME. La qualification a été réalisée en présence d’I2S TESTING, qui en certifie les résultats.',
          signatories: [
            { fr: 'Constructeur', en: 'Manufacturer' },
            { fr: 'Inspecteur I2S TESTING', en: 'I2S TESTING inspector' },
            { fr: 'Représentant autorisé I2S TESTING', en: 'I2S TESTING authorized representative' },
          ],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR01-F12 — PV DE QUALIFICATION DE MODE OPÉRATOIRE (référentiel européen)
   *
   *  Procès-verbal d'approbation : assemblage et matériaux de base, une
   *  ligne de paramètres par passe, traitements thermiques, puis sept
   *  familles d'essais. Il vise encore la directive 97/23/CE, remplacée
   *  depuis par la 2014/68/UE — reproduit tel quel, à mettre à jour par le
   *  QHSE.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR01-F12',
    version: '00',
    title: 'PV de qualification de mode opératoire de soudage',
    titleEn: 'Welding procedure qualification / approval record',
    methodCode: 'WELD',
    paradigm: 'CRITERIA',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        section('header', 'Identification', 'Identification', [
          champ('number', 'PV n°', 'Record N°', 'text', { required: true, span: 4 }),
          champ('manufacturer', 'Fabricant', 'Manufacturer', 'ref', { required: true, autofill: 'client', span: 4 }),
          champ('place', 'Lieu du soudage', 'Place of welding', 'ref', { required: true, autofill: 'site', span: 4 }),
          champ('weldingDate', 'Date de soudage', 'Date of welding', 'date', { required: true, span: 4 }),
          champ('pwps', 'DMOS-P n°', 'pWPS N°', 'text', { required: true, span: 4 }),
          champ('standard', 'Norme de référence', 'Reference standard', 'standard-ref', { required: true, autofill: 'standards', span: 4 }),
          champ('supplementedBy', 'Complétée par', 'Supplemented by', 'text', { span: 4 }),
          champ('witness', 'Essai réalisé en présence de', 'Test performed in the presence of', 'ref', { required: true, autofill: 'inspector', span: 4 }),
          champ('stamp', 'N° de poinçon', 'Stamp N°', 'text', { span: 4 }),
          champ('issuedOn', 'Procès-verbal établi le', 'Record issued on', 'date', { required: true, autofill: 'date', span: 6 }),
          champ('otherId', 'Autre identification', 'Other identification', 'text', { span: 6 }),
        ]),
        section('testPiece', 'Assemblage', 'Test piece', [
          champ('mark', 'Assemblage repère', 'Test piece N°', 'text', { required: true, span: 4 }),
          champ('jointType', 'Type d’assemblage', 'Joint type', 'enum', { required: true, options: ['Bout à bout', 'Angle'], span: 4 }),
          champ('form', 'Tubes ou tôles', 'Tubes or plates', 'enum', { required: true, options: ['Tubes', 'Tôles'], span: 4 }),
          champ('fullPenetration', 'Pleine pénétration', 'Full penetration', 'boolean', { span: 4 }),
          champ('backing', 'Support envers permanent', 'Permanent backing strip', 'enum', { options: OUI_NON, span: 4 }),
          champ('backGouging', 'Gougeage ou meulage envers', 'Back gouging or chipping', 'boolean', { span: 4 }),
          champ('grade1', 'Matériau 1 — nuance', 'Base material 1 — grade', 'text', { span: 6 }),
          champ('grade2', 'Matériau 2 — nuance', 'Base material 2 — grade', 'text', { span: 6 }),
          champ('standard1', 'Matériau 1 — norme ou spécification', 'Base material 1 — standard', 'text', { span: 6 }),
          champ('standard2', 'Matériau 2 — norme ou spécification', 'Base material 2 — standard', 'text', { span: 6 }),
          champ('heat1', 'Matériau 1 — n° de coulée', 'Base material 1 — heat N°', 'text', { span: 6 }),
          champ('heat2', 'Matériau 2 — n° de coulée', 'Base material 2 — heat N°', 'text', { span: 6 }),
          champ('thickness1', 'Matériau 1 — épaisseur', 'Base material 1 — thickness', 'number', { unit: 'mm', decimals: 1, span: 6 }),
          champ('thickness2', 'Matériau 2 — épaisseur', 'Base material 2 — thickness', 'number', { unit: 'mm', decimals: 1, span: 6 }),
          champ('diameter1', 'Matériau 1 — diamètre extérieur', 'Base material 1 — outside diameter', 'number', { unit: 'mm', decimals: 1, span: 6 }),
          champ('diameter2', 'Matériau 2 — diamètre extérieur', 'Base material 2 — outside diameter', 'number', { unit: 'mm', decimals: 1, span: 6 }),
          champ('jointDesign', 'Schéma de préparation', 'Joint design', 'textarea', { span: 6 }),
          champ('sequence', 'Disposition des passes et épaisseur déposée par procédé', 'Welding sequences and deposited thickness per process', 'textarea', { span: 6 }),
        ]),
        tableau('passes', 'Paramètres par passe', 'Parameters per pass', [
          champ('pass', 'N° de passe', 'Pass number', 'number', { required: true, decimals: 0, span: 1 }),
          champ('position', 'Position', 'Position', 'text', { span: 1 }),
          champ('process', 'Procédé et mécanisation', 'Process, degree of mechanization', 'text', { required: true, span: 1 }),
          champ('welder', 'Soudeur', 'Welder’s name', 'text', { span: 1 }),
          champ('fillerMaker', 'Métal d’apport — fabricant', 'Filler — manufacturer', 'text', { span: 1 }),
          champ('fillerTrade', 'Métal d’apport — appellation', 'Filler — trade mark', 'text', { span: 1 }),
          champ('fillerDesignation', 'Métal d’apport — désignation normalisée', 'Filler — std. designation', 'text', { span: 1 }),
          champ('fillerDiameter', 'Métal d’apport — diamètre', 'Filler — diameter', 'number', { unit: 'mm', decimals: 1, span: 1 }),
          champ('flux', 'Flux — fabricant, appellation, désignation', 'Flux', 'text', { span: 1 }),
          champ('faceGas', 'Gaz endroit — type, désignation', 'Shielding gas (face)', 'text', { span: 1 }),
          champ('faceFlow', 'Gaz endroit — débit', 'Shielding gas flow (face)', 'number', { unit: 'l/min', decimals: 1, span: 1 }),
          champ('rootGas', 'Gaz envers — type, désignation', 'Root gas', 'text', { span: 1 }),
          champ('rootFlow', 'Gaz envers — débit', 'Root gas flow', 'number', { unit: 'l/min', decimals: 1, span: 1 }),
          champ('plasmaGas', 'Gaz plasma — type, désignation, débit', 'Plasma gas', 'text', { span: 1 }),
          champ('current', 'Nature du courant', 'Type of current', 'text', { span: 1 }),
          champ('tungsten', 'Électrode tungstène (type et Ø)', 'Tungsten electrode', 'text', { span: 1 }),
          champ('polarity', 'Polarité', 'Electrode polarity', 'text', { span: 1 }),
          champ('amps', 'Intensité', 'Current', 'number', { unit: 'A', decimals: 0, span: 1 }),
          champ('volts', 'Tension à l’arc', 'Voltage', 'number', { unit: 'V', decimals: 1, span: 1 }),
          champ('speed', 'Vitesse d’exécution', 'Welding speed', 'number', { unit: 'mm/s', decimals: 2, span: 1 }),
          champ('heatInput', 'Apport de chaleur', 'Heat input', 'number', { unit: 'kJ/mm', decimals: 2, span: 1 }),
          champ('interpass', 'Température maximale entre passes', 'Interpass temperature', 'number', { unit: '°C', decimals: 0, span: 1 }),
          champ('equipment', 'Matériel de soudage', 'Welding equipment', 'text', { span: 1 }),
        ], 'Degré de mécanisation : M manuel, A automatique, TM totalement mécanisé, PM partiellement mécanisé. Apport de chaleur = k·U·I·10⁻³ / v.'),
        section('heat', 'Traitements thermiques', 'Heat treatments', [
          champ('preheat', 'Préchauffage', 'Preheat', 'enum', { options: OUI_NON, span: 3 }),
          champ('preheatTemp', 'Préchauffage — température', 'Preheat temperature', 'number', { unit: '°C', decimals: 0, span: 3 }),
          champ('postheat', 'Postchauffage', 'Postheat', 'enum', { options: OUI_NON, span: 2 }),
          champ('postheatTemp', 'Postchauffage — température', 'Postheat temperature', 'number', { unit: '°C', decimals: 0, span: 2 }),
          champ('postheatTime', 'Postchauffage — durée du maintien', 'Holding time', 'text', { span: 2 }),
          champ('pwht', 'Traitement thermique après soudage', 'PWHT', 'enum', { options: OUI_NON, span: 4 }),
          champ('pwhtTemp', 'TTAS — température de maintien', 'PWHT holding temperature', 'number', { unit: '°C', decimals: 0, span: 4 }),
          champ('heatingRate', 'TTAS — vitesse de montée', 'Heating rate', 'text', { span: 4 }),
        ]),
        tableau('ndt', '1 — Essais non destructifs', 'Non destructive tests', [
          champ('method', 'Méthode', 'Method', 'enum', { required: true, options: ['VT', 'PT', 'MT', 'RT', 'UT'], span: 2 }),
          champ('by', 'Exécuté par', 'Carried out by', 'text', { span: 4 }),
          champ('result', 'Résultat', 'Result', 'text', { required: true, span: 3 }),
          champ('report', 'N° de rapport', 'Report N°', 'text', { span: 3 }),
        ]),
        tableau('tensile', '2 — Essais de traction', 'Tensile tests', [
          champ('mark', 'Repère', 'Mark', 'text', { required: true, span: 1 }),
          champ('type', 'Nature', 'Type', 'enum', { options: ['Transversale', 'Cylindrique métal fondu'], span: 2 }),
          champ('sizes', 'Dimensions', 'Sizes', 'text', { span: 1 }),
          champ('temperature', 'Température d’essai', 'Test temperature', 'number', { unit: '°C', decimals: 0, span: 1 }),
          champ('rm', 'Rm', 'Rm', 'number', { unit: 'N/mm²', decimals: 0, span: 1 }),
          champ('re', 'Re', 'Re', 'number', { unit: 'N/mm²', decimals: 0, span: 1 }),
          champ('a', 'A', 'A', 'number', { unit: '%', decimals: 1, span: 1 }),
          champ('z', 'Z', 'Z', 'number', { unit: '%', decimals: 1, span: 1 }),
          champ('fracture', 'Localisation de la cassure', 'Fracture location', 'text', { span: 1 }),
          champ('remarks', 'Résultats et remarques', 'Results and remarks', 'text', { span: 2 }),
        ], 'Re, A et Z pour éprouvette cylindrique seulement.'),
        tableau('bend', '3 — Essais de pliage', 'Bend tests', [
          champ('mark', 'Repère', 'Mark', 'text', { required: true, span: 2 }),
          champ('orientation', 'Sens', 'Direction', 'enum', { options: ['Transversale', 'Longitudinale'], span: 2 }),
          champ('former', 'Diamètre du poinçon', 'Former diameter', 'number', { unit: 'mm', decimals: 0, span: 2 }),
          champ('side', 'Face tendue', 'Bent side', 'enum', { options: ['Endroit', 'Envers', 'Côté'], span: 2 }),
          champ('remarks', 'Résultats et remarques', 'Results and remarks', 'text', { span: 4 }),
        ]),
        tableau('impact', '4 — Essais de flexion par choc', 'Impact tests', [
          champ('mark', 'Repère de l’éprouvette', 'Specimen mark', 'text', { required: true, span: 2 }),
          champ('temperature', 'Température d’essai', 'Test temperature', 'number', { unit: '°C', decimals: 0, span: 2 }),
          champ('position', 'Position (P, M, R)', 'Specimen location', 'enum', { options: ['P — peau', 'M — mi-épaisseur', 'R — racine'], span: 2 }),
          champ('notch', 'Entaille', 'Notch location', 'enum', { options: ['Métal fondu (VWT)', 'ZAT (VHT)'], span: 2 }),
          champ('kcv', 'KCV individuelle', 'KCV individual', 'number', { unit: 'J/cm²', decimals: 0, span: 2 }),
          champ('remarks', 'Résultats et remarques', 'Results and remarks', 'text', { span: 2 }),
        ]),
        section('hardness', '5 — Duretés (HV 10)', 'Hardness (HV 10)', [
          champ('report', 'N° de rapport', 'Report N°', 'text', { span: 6 }),
          champ('maxAllowed', 'Valeur maximale admissible', 'Max. allowable value', 'number', { unit: 'HV', decimals: 0, span: 6 }),
        ]),
        tableau('hardnessSurveys', 'Filiations de dureté', 'Hardness surveys', [
          champ('survey', 'N° de filiation', 'Survey N°', 'text', { required: true, span: 3 }),
          champ('values', 'Valeurs obtenues', 'Results', 'text', { required: true, span: 5 }),
          champ('remarks', 'Résultats et remarques', 'Results and remarks', 'text', { span: 4 }),
        ]),
        tableau('macro', '6 — Examen macroscopique', 'Macroscopic examination', [
          champ('mark', 'Repère', 'Mark', 'text', { required: true, span: 3 }),
          champ('remarks', 'Remarques', 'Remarks', 'text', { span: 6 }),
          champ('result', 'Résultat', 'Result', 'text', { required: true, span: 3 }),
        ]),
        section('reports', 'Rapports d’essais et autres examens', 'Test reports and other examinations', [
          champ('tensileReport', 'Traction — n° de rapport', 'Tensile — report N°', 'text', { span: 4 }),
          champ('impactReport', 'Flexion par choc — n° de rapport', 'Impact — report N°', 'text', { span: 4 }),
          champ('macroReport', 'Macrographie — n° de rapport', 'Macro — report N°', 'text', { span: 4 }),
          champ('other', '7 — Autres examens et essais', 'Other examinations and tests', 'textarea', { span: 12 }),
        ], 'text'),
        {
          key: 'signatures',
          label: { fr: 'Certification', en: 'Certification' },
          type: 'signature-matrix',
          repeatable: false,
          reference: 'I2S TESTING, organisme agréé par l’État, certifie que les assemblages de qualification ont été préparés, soudés et contrôlés de façon satisfaisante selon les documents référencés. Le mode opératoire satisfait aux exigences essentielles de sécurité du paragraphe 3.1.2 de l’annexe I du décret 99-1046 du 13 décembre 1999 (directive 97/23/CE). Ce procès-verbal fait office d’attestation d’approbation.',
          signatories: [
            { fr: 'Organisme d’examen — représentant autorisé', en: 'Examining body — authorized representative' },
            { fr: 'Fabricant — représenté par', en: 'Manufacturer — represented by' },
          ],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR03-F02 — RAPPORT SUR NOTICE DE SÉCURITÉ INCENDIE
   *
   *  Le modèle n'est qu'un sommaire : présentation du projet, puis examen
   *  des notices de sécurité selon le RGC 2020. Ses rubriques deviennent
   *  les sections ; chaque disposition examinée reçoit un avis, et la
   *  conclusion reprend les trois avis du contrôle technique (PR03-F01).
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR03-F02',
    version: '00',
    title: 'Rapport sur notice de sécurité incendie',
    methodCode: 'CTC',
    paradigm: 'CRITERIA',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'header',
          label: { fr: 'Rapport de sécurité incendie' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'project', label: { fr: 'Projet' }, type: 'text', required: true, span: 6 },
            { key: 'owner', label: { fr: 'Maître d’ouvrage' }, type: 'ref', required: true, autofill: 'client', span: 6 },
            { key: 'affairNumber', label: { fr: 'N° d’affaire' }, type: 'ref', required: true, autofill: 'affairNumber', span: 3 },
            { key: 'reference', label: { fr: 'Référence' }, type: 'text', required: false, span: 3 },
            { key: 'index', label: { fr: 'Indice' }, type: 'text', required: true, span: 3 },
            { key: 'date', label: { fr: 'Date' }, type: 'date', required: true, autofill: 'date', span: 3 },
            { key: 'purpose', label: { fr: 'Objet du rapport' }, type: 'textarea', required: true, span: 12 },
          ],
        },
        {
          key: 'presentation',
          label: { fr: 'Section 1 — Présentation' },
          type: 'text',
          repeatable: false,
          fields: [
            { key: 'situation', label: { fr: 'Situation du projet' }, type: 'textarea', required: true, span: 12 },
            { key: 'regulations', label: { fr: 'Références réglementaires' }, type: 'textarea', required: true, span: 12 },
          ],
        },
        {
          key: 'documents',
          label: { fr: 'Documents examinés' },
          type: 'table',
          repeatable: true,
          minRows: 1,
          columns: [
            { key: 'document', label: { fr: 'Document' }, type: 'text', required: true, span: 6 },
            { key: 'index', label: { fr: 'Indice' }, type: 'text', required: false, span: 3 },
            { key: 'author', label: { fr: 'Émetteur' }, type: 'text', required: false, span: 3 },
          ],
        },
        {
          key: 'establishments',
          label: { fr: 'Identification des établissements' },
          type: 'table',
          repeatable: true,
          minRows: 1,
          columns: [
            { key: 'establishment', label: { fr: 'Établissement' }, type: 'text', required: true, span: 5 },
            { key: 'activity', label: { fr: 'Type ou activité' }, type: 'text', required: false, span: 4 },
            { key: 'category', label: { fr: 'Catégorie' }, type: 'text', required: false, span: 3 },
          ],
        },
        {
          key: 'notices',
          label: { fr: 'Section 2 — Notices de sécurité selon le RGC 2020' },
          type: 'table',
          repeatable: true,
          minRows: 1,
          help: 'F : favorable · D : défavorable · S : suspendu · SO : sans objet · C : conforme · NC : non conforme · PM : pour mémoire.',
          columns: [
            { key: 'provision', label: { fr: 'Disposition examinée' }, type: 'text', required: true, span: 5 },
            { key: 'opinion', label: { fr: 'Avis' }, type: 'enum', required: true, options: ['F', 'D', 'S', 'SO', 'C', 'NC', 'PM'], span: 2 },
            { key: 'comment', label: { fr: 'Observation' }, type: 'text', required: false, span: 5 },
          ],
        },
        {
          key: 'observations',
          label: { fr: 'Observations et réserves' },
          type: 'text',
          repeatable: false,
          fields: [
            { key: 'observations', label: { fr: 'Observations' }, type: 'textarea', required: false, span: 12 },
          ],
        },
        {
          key: 'conclusion',
          label: { fr: 'Conclusion' },
          type: 'verdict',
          repeatable: false,
          verdicts: [
            { fr: 'Avis favorable' },
            { fr: 'Avis favorable avec réserves' },
            { fr: 'Avis défavorable' },
          ],
        },
        {
          key: 'signatures',
          label: { fr: 'Visas' },
          type: 'signature-matrix',
          repeatable: false,
          signatories: [
            { fr: 'Rédacteur du rapport' },
            { fr: 'Vérificateur de conformité' },
            { fr: 'Représentant du client' },
          ],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR04-F01 — PLAN HSE GLOBAL
   *
   *  Le canevas n'est qu'un sommaire, à la numérotation incohérente (deux
   *  « 2 », un « 4.3 » sous la rubrique 5, un « 5.4 » sous la 6). Les
   *  rubriques sont renumérotées d'un seul tenant, et l'évaluation des
   *  risques reçoit une grille gravité × probabilité qu'il ne précisait pas.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR04-F01',
    version: '00',
    title: 'Plan HSE global',
    methodCode: 'HSE',
    paradigm: 'CRITERIA',
    applicationDate: '2026-09-21',
    schema: {
      sections: [
        HSE_PROJECT([
          hc('version', 'Indice de version', 'text', { required: true, span: 4 }),
          hc('date', 'Date', 'date', { required: true, autofill: 'date', span: 4 }),
          hc('approvedBy', 'Validé par', 'text', { span: 4 }),
        ]),
        hSection('introduction', '1 à 4 — Cadre du plan', [
          hc('introduction', '1 — Introduction', 'textarea', { span: 12 }),
          hc('purpose', '2 — Objet du plan HSE', 'textarea', { required: true, span: 12 }),
          hc('regulations', '3 — Cadre réglementaire', 'textarea', { required: true, span: 12 }),
          hc('documents', '4 — Références documentaires', 'textarea', { span: 12 }),
        ], 'text'),
        hTable('stakeholders', '5 — Intervenants du projet', [
          hc('company', 'Entreprise', 'text', { required: true, span: 4 }),
          hc('role', 'Rôle', 'enum', { required: true, options: ['Maître d’ouvrage', 'Maître d’œuvre', 'Entreprise principale', 'Sous-traitant', 'Supervision HSE', 'Autre'], span: 3 }),
          hc('manager', 'Responsable HSE', 'text', { span: 3 }),
          hc('phone', 'Téléphone', 'text', { span: 2 }),
        ], undefined, 1),
        hSection('organisation', '6 — Organisation des travaux', [
          hc('scope', '6.1 — Étendue des travaux', 'textarea', { required: true, span: 12 }),
          hc('planning', '6.2 — Planning, modes opératoires et ressources mobilisées', 'textarea', { span: 12 }),
        ], 'text'),
        hTable('risks', '6.3 — Évaluation des risques HSE', [
          hc('activity', 'Activité ou tâche', 'text', { required: true, span: 2 }),
          hc('hazard', 'Danger', 'text', { required: true, span: 2 }),
          hc('risk', 'Risque', 'text', { required: true, span: 2 }),
          hc('severity', 'Gravité', 'enum', { required: true, options: ['1', '2', '3', '4'], span: 1 }),
          hc('probability', 'Probabilité', 'enum', { required: true, options: ['1', '2', '3', '4'], span: 1 }),
          hc('criticality', 'Criticité', 'number', { required: true, decimals: 0, span: 1 }),
          hc('measures', 'Mesures de prévention et de protection', 'text', { required: true, span: 2 }),
          hc('residual', 'Risque résiduel', 'enum', { options: ['Acceptable', 'À surveiller', 'Inacceptable'], span: 1 }),
        ], 'Gravité et probabilité de 1 (faible) à 4 (très élevée) ; criticité = gravité × probabilité. Au-delà de 8, le risque doit être réduit avant le démarrage de la tâche.', 1),
        hSection('prevention', '7 — Mesures de prévention et de protection', [
          hc('training', '7.1 — Formation et sensibilisation des collaborateurs', 'textarea', { span: 12 }),
          hc('equipmentCheck', '7.2 — Contrôle des équipements et engins avant l’entrée sur le chantier', 'textarea', { span: 12 }),
          hc('environment', '7.3 — Gestion environnementale (déchets, rejets, pollution)', 'textarea', { span: 12 }),
          hc('reporting', '7.4 — Suivi, contrôle et reporting HSE', 'textarea', { span: 12 }),
        ], 'text', 'Le reporting s’appuie sur les rapports journalier, hebdomadaire et mensuel HSE (PR04-F02 à F04).'),
        hSection('emergency', '8 — Gestion des situations d’urgence', [
          hc('assemblyPoint', 'Point de rassemblement', 'text', { required: true }),
          hc('hospital', 'Structure de soins la plus proche', 'text', { required: true }),
          hc('contacts', 'Contacts d’urgence', 'textarea', { required: true, span: 12 }),
          hc('means', '8.1 — Moyens d’urgence disponibles sur le chantier', 'textarea', { span: 12 }),
          hc('fire', '8.2 — Procédure en cas d’incendie', 'textarea', { span: 12 }),
          hc('explosion', '8.3 — Procédure en cas d’explosion ou de risque d’explosion imminent', 'textarea', { span: 12 }),
          hc('spill', '8.4 — Procédure en cas de déversement de produit', 'textarea', { span: 12 }),
          hc('injury', '8.5 — Procédure en cas d’accident corporel ou de presque-accident', 'textarea', { span: 12 }),
        ]),
        hSection('conclusion', '9 — Conclusion', [hc('conclusion', 'Conclusion', 'textarea', { span: 12 })], 'text'),
        {
          key: 'signatures',
          label: { fr: 'Historique du document' },
          type: 'signature-matrix',
          repeatable: false,
          signatories: [{ fr: 'Rédigé par' }, { fr: 'Validé par' }],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR04-F02 — RAPPORT JOURNALIER HSE
   *
   *  Le canevas Word, complété de ce que le journal Excel du service
   *  suivait en plus : l'analyse des risques des tâches de la journée. Les
   *  effectifs sont comptés, pas listés : le journal relevait CIN et CNSS
   *  de chaque ouvrier, ce qu'un rapport de supervision n'a pas à porter.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR04-F02',
    version: '00',
    title: 'Rapport journalier HSE',
    methodCode: 'HSE',
    paradigm: 'CHECKLIST',
    applicationDate: '2026-09-21',
    schema: {
      sections: [
        HSE_PROJECT([
          hc('date', 'Date', 'date', { required: true, autofill: 'date', span: 4 }),
          hc('contractor', 'Contractant', 'text', { required: true, span: 4 }),
          hc('weather', 'Conditions météorologiques', 'text', { span: 4 }),
          hc('zone', 'Zone de l’activité', 'text', { required: true, span: 4 }),
          hc('newcomers', 'Nouveaux arrivants', 'number', { decimals: 0, span: 4 }),
          hc('headcount', 'Effectif', 'number', { required: true, decimals: 0, span: 4 }),
          hc('hours', 'Heures travaillées', 'number', { required: true, unit: 'h', decimals: 1, span: 4 }),
          hc('spa', 'Nombre de SPA', 'number', { decimals: 0, span: 4 }),
          hc('permits', 'Permis de travail délivrés', 'number', { decimals: 0, span: 4 }),
          hc('works', 'Description des travaux', 'textarea', { required: true, span: 12 }),
        ]),
        hTable('previousActions', 'Suivi des actions correctives antérieures', [
          hc('action', 'Action ouverte issue des rapports précédents', 'text', { required: true, span: 6 }),
          hc('status', 'Statut', 'enum', { required: true, options: STATUT_ACTION, span: 2 }),
          hc('reference', 'Référence du rapport hebdomadaire ou mensuel', 'text', { span: 4 }),
        ]),
        hSection('prevention', 'Mesures de prévention mises en œuvre', [
          hc('ppe', 'EPI utilisés', 'enum', { required: true, options: NOTE_HSE, span: 3 }),
          hc('marking', 'Balisage et signalisation', 'enum', { required: true, options: NOTE_HSE, span: 3 }),
          hc('checks', 'Contrôles effectués (équipements, gaz, atmosphère)', 'enum', { required: true, options: NOTE_HSE, span: 3 }),
          hc('briefings', 'Briefings sécurité avant travaux', 'enum', { required: true, options: NOTE_HSE, span: 3 }),
        ], 'conditions', NOTE_HSE_HELP),
        hSection('environment', 'Environnement', [
          hc('sorting', 'Tri des déchets', 'enum', { required: true, options: NOTE_HSE, span: 3 }),
          hc('housekeeping', 'Aspect, propreté, rangement', 'enum', { required: true, options: NOTE_HSE, span: 3 }),
          hc('wasteArea', 'Aire de stockage des déchets', 'enum', { required: true, options: NOTE_HSE, span: 3 }),
          hc('retention', 'Mise sous rétention des produits chimiques', 'enum', { required: true, options: NOTE_HSE, span: 3 }),
        ], 'conditions', NOTE_HSE_HELP),
        hTable('findings', 'Constats et actions après audit', [
          hc('theme', 'Mesure concernée', 'enum', { required: true, options: ['EPI', 'Balisage et signalisation', 'Contrôles', 'Briefings', 'Tri des déchets', 'Propreté et rangement', 'Aire de déchets', 'Rétention', 'Autre'], span: 2 }),
          hc('finding', 'Constat', 'text', { required: true, span: 3 }),
          hc('contractor', 'Contractant', 'text', { span: 2 }),
          hc('action', 'Décision ou action après audit', 'text', { required: true, span: 3 }),
          hc('deadline', 'Délai', 'text', { span: 2 }),
        ]),
        hTable('risks', 'Risques et situations observées', [
          hc('risk', 'Risque', 'enum', { required: true, options: ['Situation dangereuse', 'Incident ou accident survenu', 'Zone sensible (ATEX, circulation, coactivité)'], span: 3 }),
          hc('observation', 'Observations', 'text', { required: true, span: 3 }),
          hc('contractor', 'Contractant', 'text', { span: 2 }),
          hc('recommendation', 'Décision ou recommandation', 'text', { span: 2 }),
          hc('deadline', 'Délai', 'text', { span: 2 }),
        ], 'Un incident ou un accident fait en outre l’objet d’un rapport dédié (PR04-F05).'),
        hTable('taskRisks', 'Analyse des risques des tâches de la journée', [
          hc('task', 'Tâche élémentaire', 'text', { required: true, span: 3 }),
          hc('hazards', 'Dangers', 'text', { required: true, span: 3 }),
          hc('risks', 'Risques', 'text', { required: true, span: 3 }),
          hc('measures', 'Mesures préventives', 'text', { required: true, span: 3 }),
        ]),
        HSE_PHOTOS,
        {
          key: 'signatures',
          label: { fr: 'Visas' },
          type: 'signature-matrix',
          repeatable: false,
          signatories: [{ fr: 'Superviseur HSE' }, { fr: 'Représentant du contractant' }],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR04-F03 — RAPPORT HEBDOMADAIRE HSE
   *
   *  Les dix rubriques du canevas Excel. Les entreprises n'y sont plus des
   *  colonnes figées (STROB, CEGELEC, SGTI) mais des lignes, pour servir
   *  n'importe quel chantier ; les deux tableaux d'engins sont réunis.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR04-F03',
    version: '00',
    title: 'Rapport hebdomadaire HSE',
    methodCode: 'HSE',
    paradigm: 'CHECKLIST',
    applicationDate: '2026-09-21',
    schema: {
      sections: [
        HSE_PROJECT([
          hc('from', 'Semaine du', 'date', { required: true, span: 6 }),
          hc('to', 'au', 'date', { required: true, span: 6 }),
        ]),
        hseIndicators('semaine'),
        hTable('hours', '2 — Effectif et heures travaillées par entreprise', [
          hc('company', 'Entreprise', 'text', { required: true, span: 6 }),
          hc('headcount', 'Effectif', 'number', { required: true, decimals: 0, span: 3 }),
          hc('hours', 'Heures travaillées', 'number', { required: true, unit: 'h', decimals: 0, span: 3 }),
        ], undefined, 1),
        hTable('works', '3 — Travaux réalisés', [
          hc('company', 'Entreprise', 'text', { required: true, span: 4 }),
          hc('works', 'Travaux réalisés', 'text', { required: true, span: 8 }),
        ]),
        hTable('permits', '4 — Permis de travail', [
          hc('date', 'Date', 'text', { required: true, span: 3 }),
          hc('company', 'Entreprise', 'text', { required: true, span: 3 }),
          hc('permits', 'Permis de travail', 'number', { decimals: 0, span: 3 }),
          hc('authorisations', 'Autorisations de travail', 'number', { decimals: 0, span: 3 }),
        ]),
        hTable('animation', '5 et 6 — Animation et accueil sécurité', [
          hc('company', 'Entreprise', 'text', { required: true, span: 3 }),
          hc('inductions', 'Accueils sécurité', 'number', { decimals: 0, span: 3 }),
          hc('briefings', 'Briefings avant travaux', 'number', { decimals: 0, span: 3 }),
          hc('meetings', 'Réunions HSE', 'number', { decimals: 0, span: 3 }),
        ]),
        hTable('machines', '7 — Engins de chantier', [
          hc('designation', 'Désignation', 'text', { required: true, span: 2 }),
          hc('serial', 'N° de série ou de châssis', 'text', { span: 2 }),
          hc('company', 'Entreprise', 'text', { span: 2 }),
          hc('insurance', 'Fin d’assurance', 'text', { span: 2 }),
          hc('inspection', 'Fin de validité du contrôle réglementaire', 'text', { span: 2 }),
          hc('checklist', 'Check-list', 'enum', { required: true, options: ['Conforme', 'Non conforme'], span: 1 }),
          hc('observation', 'Observation', 'text', { span: 1 }),
        ], 'Un engin sans contrôle réglementaire en cours de validité n’entre pas sur le chantier (voir PR04-F10).'),
        hTable('nonConformities', '8 — Non-conformités HSE par entreprise', [
          hc('date', 'Date', 'text', { required: true, span: 1 }),
          hc('finding', 'Constat HSE', 'text', { required: true, span: 3 }),
          hc('action', 'Actions correctives', 'text', { required: true, span: 3 }),
          hc('contractor', 'Contractant', 'text', { span: 2 }),
          hc('nature', 'Nature', 'enum', { required: true, options: ['Anomalie', 'Incident potentiel ou situation dangereuse'], span: 2 }),
          hc('status', 'Statut', 'enum', { required: true, options: STATUT_ACTION, span: 1 }),
        ]),
        hTable('recap', '9 — Récapitulatif par entreprise', [
          hc('company', 'Entreprise', 'text', { required: true, span: 2 }),
          hc('headcount', 'Effectif (semaine)', 'number', { decimals: 0, span: 1 }),
          hc('hours', 'Heures (semaine)', 'number', { unit: 'h', decimals: 0, span: 1 }),
          hc('hoursTotal', 'Heures cumulées (chantier)', 'number', { unit: 'h', decimals: 0, span: 2 }),
          hc('incidents', 'Incidents', 'number', { decimals: 0, span: 1 }),
          hc('lostTime', 'Accidents avec arrêt', 'number', { decimals: 0, span: 1 }),
          hc('noLostTime', 'Accidents sans arrêt', 'number', { decimals: 0, span: 1 }),
          hc('firstAid', 'Soins', 'number', { decimals: 0, span: 1 }),
          hc('frequencyRate', 'Taux de fréquence', 'number', { decimals: 2, span: 2 }),
        ]),
        HSE_PHOTOS,
        {
          key: 'signatures',
          label: { fr: 'Visa' },
          type: 'signature-matrix',
          repeatable: false,
          signatories: [{ fr: 'Superviseur HSE' }],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR04-F04 — RAPPORT MENSUEL DE SUIVI HSE
   *
   *  Les neuf rubriques du sommaire du canevas PowerPoint, seule partie
   *  rédigée du modèle. Le taux de résolution des constats y devient un
   *  indicateur explicite.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR04-F04',
    version: '00',
    title: 'Rapport mensuel de suivi HSE',
    methodCode: 'HSE',
    paradigm: 'CHECKLIST',
    applicationDate: '2026-09-21',
    schema: {
      sections: [
        HSE_PROJECT([hc('month', 'Mois', 'text', { required: true, span: 12 })]),
        hSection('purpose', '1 — Objet du rapport', [hc('purpose', 'Objet du rapport', 'textarea', { required: true, span: 12 })], 'text'),
        hTable('stakeholders', '2 — Intervenants du projet', [
          hc('company', 'Entreprise', 'text', { required: true, span: 5 }),
          hc('role', 'Rôle', 'text', { required: true, span: 4 }),
          hc('manager', 'Responsable HSE', 'text', { span: 3 }),
        ], undefined, 1),
        hTable('works', '3 — Synthèse des travaux réalisés et des permis de travail', [
          hc('company', 'Entreprise', 'text', { required: true, span: 3 }),
          hc('works', 'Travaux réalisés', 'text', { required: true, span: 5 }),
          hc('permits', 'Permis de travail', 'number', { decimals: 0, span: 2 }),
          hc('authorisations', 'Autorisations de travail', 'number', { decimals: 0, span: 2 }),
        ]),
        hTable('hours', '4 — Évolution des heures travaillées et des effectifs par entreprise', [
          hc('company', 'Entreprise', 'text', { required: true, span: 4 }),
          hc('headcount', 'Effectif moyen', 'number', { decimals: 0, span: 2 }),
          hc('hours', 'Heures du mois', 'number', { unit: 'h', decimals: 0, span: 3 }),
          hc('hoursTotal', 'Heures cumulées', 'number', { unit: 'h', decimals: 0, span: 3 }),
        ], undefined, 1),
        { ...hseIndicators('mois'), label: { fr: '5 — Synoptique des indicateurs de sécurité' } },
        hTable('findings', '6 — Constats HSE relevés', [
          hc('finding', 'Constat', 'text', { required: true, span: 5 }),
          hc('company', 'Entreprise', 'text', { span: 2 }),
          hc('action', 'Action', 'text', { span: 3 }),
          hc('status', 'Statut', 'enum', { required: true, options: STATUT_ACTION, span: 2 }),
        ], 'Illustrer les constats marquants dans les photos du rapport.'),
        hSection('resolution', '7 — Taux de résolution mensuel des constats HSE', [
          hc('raised', 'Constats relevés', 'number', { required: true, decimals: 0, span: 4 }),
          hc('closed', 'Constats clos', 'number', { required: true, decimals: 0, span: 4 }),
          hc('rate', 'Taux de résolution', 'number', { required: true, unit: '%', decimals: 0, span: 4 }),
        ], 'conditions', 'Taux de résolution = constats clos / constats relevés.'),
        hSection('closing', '8 et 9 — Axes d’amélioration et conclusion', [
          hc('improvements', '8 — Axes d’amélioration', 'textarea', { required: true, span: 12 }),
          hc('conclusion', '9 — Conclusion', 'textarea', { required: true, span: 12 }),
        ], 'text'),
        HSE_PHOTOS,
        {
          key: 'signatures',
          label: { fr: 'Visas' },
          type: 'signature-matrix',
          repeatable: false,
          signatories: [{ fr: 'Rédigé par' }, { fr: 'Validé par' }],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR04-F05 — RAPPORT D'ACCIDENT OU D'INCIDENT
   *
   *  Ajouté : le canevas journalier signale les incidents sans les analyser.
   *  Ce rapport classe l'événement, décrit la victime éventuelle, cherche
   *  les causes par les 5 M et suit les actions jusqu'à leur clôture.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR04-F05',
    version: '00',
    title: 'Rapport d’accident ou d’incident',
    methodCode: 'HSE',
    paradigm: 'CHECKLIST',
    applicationDate: '2026-09-21',
    schema: {
      sections: [
        HSE_PROJECT([
          hc('eventDate', 'Date de l’événement', 'date', { required: true, span: 4 }),
          hc('eventTime', 'Heure', 'text', { required: true, span: 4 }),
          hc('reportDate', 'Date du rapport', 'date', { required: true, autofill: 'date', span: 4 }),
          hc('zone', 'Lieu ou zone', 'text', { required: true }),
          hc('company', 'Entreprise concernée', 'text', { required: true }),
          hc('classification', 'Classification', 'enum', { required: true, options: ['Situation dangereuse', 'Presque-accident', 'Incident matériel', 'Incident environnemental', 'Soins', 'Accident sans arrêt', 'Accident avec arrêt', 'Accident de trajet'], span: 12 }),
        ]),
        hSection('facts', 'Description des faits', [
          hc('description', 'Déroulement de l’événement', 'textarea', { required: true, span: 12 }),
          hc('task', 'Tâche en cours au moment des faits', 'text'),
          hc('witnesses', 'Témoins', 'text'),
          hc('immediate', 'Mesures immédiates prises', 'textarea', { required: true, span: 12 }),
        ], 'text'),
        hSection('victim', 'Victime', [
          hc('name', 'Nom', 'text'),
          hc('position', 'Fonction', 'text', { span: 3 }),
          hc('seniority', 'Ancienneté au poste', 'text', { span: 3 }),
          hc('injury', 'Nature des lésions', 'text'),
          hc('bodyPart', 'Siège des lésions', 'text'),
          hc('firstAid', 'Premiers soins prodigués', 'text'),
          hc('evacuated', 'Évacuation vers une structure de soins', 'boolean', { span: 3 }),
          hc('lostDays', 'Jours d’arrêt', 'number', { decimals: 0, span: 3 }),
        ], 'keyvalue', 'À renseigner seulement en cas de dommage corporel. Ne pas porter d’information médicale au-delà de ce qu’exige le suivi.'),
        hTable('causes', 'Analyse des causes (5 M)', [
          hc('family', 'Famille', 'enum', { required: true, options: ['Main-d’œuvre', 'Matériel', 'Méthode', 'Milieu', 'Matière'], span: 3 }),
          hc('cause', 'Cause identifiée', 'text', { required: true, span: 9 }),
        ], undefined, 1),
        hSection('rootCause', 'Cause racine', [hc('rootCause', 'Cause racine retenue', 'textarea', { required: true, span: 12 })], 'text'),
        hTable('actions', 'Plan d’actions', [
          hc('action', 'Action', 'text', { required: true, span: 4 }),
          hc('type', 'Type', 'enum', { required: true, options: ['Immédiate', 'Corrective', 'Préventive'], span: 2 }),
          hc('owner', 'Responsable', 'text', { required: true, span: 2 }),
          hc('deadline', 'Échéance', 'text', { required: true, span: 2 }),
          hc('status', 'Statut', 'enum', { required: true, options: STATUT_ACTION, span: 2 }),
        ], undefined, 1),
        HSE_PHOTOS,
        {
          key: 'signatures',
          label: { fr: 'Visas' },
          type: 'signature-matrix',
          repeatable: false,
          signatories: [{ fr: 'Superviseur HSE' }, { fr: 'Responsable de l’entreprise concernée' }, { fr: 'Direction de projet' }],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR04-F06 — RAPPORT D'INSPECTION HSE DE CHANTIER
   *
   *  Ajouté : visite inopinée ou planifiée, par thème de risque. Les
   *  réponses sont celles des vérifications réglementaires (SO, NA, C, NC),
   *  et chaque non-conformité est reportée avec sa criticité.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR04-F06',
    version: '00',
    title: 'Rapport d’inspection HSE de chantier',
    methodCode: 'HSE',
    paradigm: 'CHECKLIST',
    applicationDate: '2026-09-21',
    schema: {
      sections: [
        HSE_PROJECT([
          hc('date', 'Date de l’inspection', 'date', { required: true, autofill: 'date', span: 4 }),
          hc('kind', 'Nature', 'enum', { required: true, options: ['Planifiée', 'Inopinée'], span: 4 }),
          hc('contractor', 'Entreprise inspectée', 'text', { required: true, span: 4 }),
          hc('zone', 'Zones visitées', 'text', { span: 12 }),
        ]),
        {
          key: 'checks',
          label: { fr: 'Points inspectés' },
          type: 'checklist',
          repeatable: false,
          help: EILM_CHECKS_HELP,
          groups: [
            {
              key: 'organisation',
              label: { fr: 'Organisation et documents' },
              points: [
                { key: 'hse-plan', label: { fr: 'Plan HSE disponible et à jour' } },
                { key: 'risk-analyses', label: { fr: 'Analyses de risques et modes opératoires disponibles' } },
                { key: 'permits', label: { fr: 'Permis de travail affichés et en cours de validité' } },
                { key: 'inductions', label: { fr: 'Accueil sécurité des arrivants tracé' } },
                { key: 'postings', label: { fr: 'Affichage obligatoire en place' } },
                { key: 'hse-staff', label: { fr: 'Animateur HSE de l’entreprise présent' } },
              ],
            },
            {
              key: 'ppe',
              label: { fr: 'Équipements de protection individuelle' },
              points: [
                { key: 'helmet', label: { fr: 'Casque' } },
                { key: 'shoes', label: { fr: 'Chaussures de sécurité' } },
                { key: 'vest', label: { fr: 'Gilet haute visibilité' } },
                { key: 'glasses', label: { fr: 'Lunettes de protection' } },
                { key: 'gloves', label: { fr: 'Gants adaptés à la tâche' } },
                { key: 'hearing', label: { fr: 'Protections auditives' } },
                { key: 'harness', label: { fr: 'Harnais pour les travaux en hauteur' } },
              ],
            },
            {
              key: 'traffic',
              label: { fr: 'Circulation et balisage' },
              points: [
                { key: 'traffic-plan', label: { fr: 'Plan de circulation respecté' } },
                { key: 'work-marking', label: { fr: 'Zones de travail balisées' } },
                { key: 'separation', label: { fr: 'Séparation des piétons et des engins' } },
                { key: 'signage', label: { fr: 'Signalisation en place' } },
              ],
            },
            {
              key: 'height',
              label: { fr: 'Travaux en hauteur' },
              points: [
                { key: 'scaffolds', label: { fr: 'Échafaudages réceptionnés et étiquetés' } },
                { key: 'guardrails', label: { fr: 'Garde-corps en place' } },
                { key: 'anchors', label: { fr: 'Points d’ancrage et lignes de vie' } },
                { key: 'ladders', label: { fr: 'Échelles conformes et bien utilisées' } },
              ],
            },
            {
              key: 'lifting',
              label: { fr: 'Levage' },
              points: [
                { key: 'lifting-inspection', label: { fr: 'Appareils vérifiés, rapport en cours de validité' } },
                { key: 'accessories', label: { fr: 'Accessoires marqués et vérifiés' } },
                { key: 'banksman', label: { fr: 'Élingueur ou chef de manœuvre désigné' } },
                { key: 'lifting-zone', label: { fr: 'Zone de levage balisée, personne sous la charge' } },
              ],
            },
            {
              key: 'electrical',
              label: { fr: 'Électricité' },
              points: [
                { key: 'boxes', label: { fr: 'Coffrets de chantier protégés par différentiel 30 mA' } },
                { key: 'cables', label: { fr: 'Câbles en bon état et protégés' } },
                { key: 'earthing', label: { fr: 'Mises à la terre' } },
                { key: 'lockout', label: { fr: 'Consignations réalisées et tracées' } },
              ],
            },
            {
              key: 'confined',
              label: { fr: 'Fouilles et espaces confinés' },
              points: [
                { key: 'shoring', label: { fr: 'Blindage ou talutage des fouilles' } },
                { key: 'excavation-access', label: { fr: 'Accès et sorties des fouilles' } },
                { key: 'gas-test', label: { fr: 'Contrôle d’atmosphère avant entrée' } },
                { key: 'attendant', label: { fr: 'Surveillant extérieur présent' } },
              ],
            },
            {
              key: 'hot-work',
              label: { fr: 'Travaux par points chauds' },
              points: [
                { key: 'fire-permit', label: { fr: 'Permis de feu délivré' } },
                { key: 'extinguisher-near', label: { fr: 'Extincteur à proximité' } },
                { key: 'screens', label: { fr: 'Écrans et protection des matières combustibles' } },
                { key: 'fire-watch', label: { fr: 'Surveillance après travaux' } },
              ],
            },
            {
              key: 'chemicals',
              label: { fr: 'Produits chimiques' },
              points: [
                { key: 'sds', label: { fr: 'Fiches de données de sécurité disponibles' } },
                { key: 'labelling', label: { fr: 'Contenants étiquetés' } },
                { key: 'chemical-retention', label: { fr: 'Stockage sur rétention' } },
              ],
            },
            {
              key: 'machines',
              label: { fr: 'Engins' },
              points: [
                { key: 'machine-inspection', label: { fr: 'Vérification réglementaire en cours de validité' } },
                { key: 'driver', label: { fr: 'Conducteur autorisé' } },
                { key: 'reverse-alarm', label: { fr: 'Avertisseur de recul et gyrophare' } },
                { key: 'daily-check', label: { fr: 'Check-list quotidienne renseignée' } },
              ],
            },
            {
              key: 'emergency',
              label: { fr: 'Incendie et secours' },
              points: [
                { key: 'extinguishers', label: { fr: 'Extincteurs vérifiés et accessibles' } },
                { key: 'first-aid-kit', label: { fr: 'Trousse de secours complète' } },
                { key: 'first-aider', label: { fr: 'Secouriste désigné sur le chantier' } },
                { key: 'instructions', label: { fr: 'Consignes d’urgence affichées' } },
                { key: 'assembly', label: { fr: 'Point de rassemblement signalé' } },
              ],
            },
            {
              key: 'environment',
              label: { fr: 'Environnement et hygiène' },
              points: [
                { key: 'waste', label: { fr: 'Tri et évacuation des déchets' } },
                { key: 'housekeeping', label: { fr: 'Propreté et rangement' } },
                { key: 'sanitary', label: { fr: 'Installations sanitaires' } },
                { key: 'water', label: { fr: 'Eau potable disponible' } },
                { key: 'spill-kit', label: { fr: 'Kit antipollution' } },
              ],
            },
          ],
        },
        hTable('findings', 'Non-conformités relevées', [
          hc('finding', 'Constat', 'text', { required: true, span: 4 }),
          hc('criticality', 'Criticité', 'enum', { required: true, options: ['Mineure', 'Majeure', 'Critique — arrêt de l’activité'], span: 2 }),
          hc('contractor', 'Entreprise', 'text', { span: 2 }),
          hc('action', 'Action demandée', 'text', { required: true, span: 2 }),
          hc('deadline', 'Délai', 'text', { span: 2 }),
        ], 'Une criticité « critique » impose l’arrêt immédiat de l’activité concernée jusqu’à sa levée.'),
        hSection('observations', 'Observations', [hc('observations', 'Observations', 'textarea', { span: 12 })], 'text'),
        {
          key: 'conclusion',
          label: { fr: 'Conclusion' },
          type: 'verdict',
          repeatable: false,
          verdicts: [
            { fr: 'Chantier conforme' },
            { fr: 'Chantier conforme avec écarts à lever' },
            { fr: 'Chantier non conforme — arrêt de l’activité concernée' },
          ],
        },
        HSE_PHOTOS,
        {
          key: 'signatures',
          label: { fr: 'Visas' },
          type: 'signature-matrix',
          repeatable: false,
          signatories: [{ fr: 'Inspecteur HSE' }, { fr: 'Représentant de l’entreprise' }],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR04-F07 — PERMIS DE TRAVAIL
   *
   *  Ajouté : les rapports comptent les permis sans en avoir le modèle.
   *  Un permis couvre un ou plusieurs types de travaux dangereux, liste les
   *  mesures vérifiées avant délivrance, trace les mesures d'atmosphère et
   *  se clôt par la remise en état de la zone.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR04-F07',
    version: '00',
    title: 'Permis de travail',
    methodCode: 'HSE',
    paradigm: 'CHECKLIST',
    applicationDate: '2026-09-21',
    schema: {
      sections: [
        HSE_PROJECT([
          hc('number', 'N° de permis', 'text', { required: true, span: 4 }),
          hc('date', 'Date', 'date', { required: true, autofill: 'date', span: 4 }),
          hc('validity', 'Validité (de … à …)', 'text', { required: true, span: 4 }),
          hc('zone', 'Zone ou équipement', 'text', { required: true }),
          hc('company', 'Entreprise exécutante', 'text', { required: true }),
          hc('worksManager', 'Responsable des travaux', 'text', { required: true }),
          hc('workers', 'Nombre d’intervenants', 'number', { decimals: 0 }),
          hc('description', 'Description des travaux', 'textarea', { required: true, span: 12 }),
        ]),
        hSection('types', 'Type de travaux', [
          hc('hotWork', 'Travaux par points chauds (permis de feu)', 'boolean', { span: 4 }),
          hc('height', 'Travail en hauteur', 'boolean', { span: 4 }),
          hc('confinedSpace', 'Espace confiné', 'boolean', { span: 4 }),
          hc('electrical', 'Consignation électrique', 'boolean', { span: 4 }),
          hc('lifting', 'Levage', 'boolean', { span: 4 }),
          hc('excavation', 'Fouille ou excavation', 'boolean', { span: 4 }),
          hc('networks', 'Travaux à proximité de réseaux', 'boolean', { span: 4 }),
          hc('otherType', 'Autre', 'text', { span: 8 }),
        ]),
        hSection('measures', 'Mesures vérifiées avant délivrance', [
          hc('lockout', 'Consignation réalisée', 'boolean', { span: 4 }),
          hc('marking', 'Zone balisée', 'boolean', { span: 4 }),
          hc('extinguisher', 'Extincteur sur place', 'boolean', { span: 4 }),
          hc('gasTest', 'Mesure d’atmosphère réalisée', 'boolean', { span: 4 }),
          hc('specificPpe', 'EPI spécifiques fournis', 'boolean', { span: 4 }),
          hc('watcher', 'Surveillant désigné', 'boolean', { span: 4 }),
          hc('rescue', 'Moyens de secours disponibles', 'boolean', { span: 4 }),
          hc('riskAnalysis', 'Analyse de risques communiquée à l’équipe', 'boolean', { span: 4 }),
          hc('otherMeasures', 'Autres mesures', 'text', { span: 4 }),
        ], 'keyvalue', 'Le permis n’est délivré que si toutes les mesures applicables au type de travaux sont en place.'),
        hTable('gasTests', 'Mesures d’atmosphère', [
          hc('time', 'Heure', 'text', { required: true, span: 2 }),
          hc('oxygen', 'O₂', 'number', { unit: '%', decimals: 1, span: 2 }),
          hc('lel', 'LIE', 'number', { unit: '%', decimals: 0, span: 2 }),
          hc('h2s', 'H₂S', 'number', { unit: 'ppm', decimals: 0, span: 2 }),
          hc('co', 'CO', 'number', { unit: 'ppm', decimals: 0, span: 2 }),
          hc('operator', 'Opérateur', 'text', { span: 2 }),
        ], 'Seuils selon la procédure du site ; pour les travaux à chaud, LIE = 0 %.'),
        hSection('closure', 'Clôture du permis', [
          hc('endTime', 'Fin des travaux (heure)', 'text', { span: 4 }),
          hc('zoneRestored', 'Zone remise en état', 'boolean', { span: 4 }),
          hc('fireWatch', 'Surveillance après travaux à chaud', 'number', { unit: 'min', decimals: 0, span: 4 }),
        ]),
        {
          key: 'signatures',
          label: { fr: 'Visas' },
          type: 'signature-matrix',
          repeatable: false,
          signatories: [{ fr: 'Émetteur du permis' }, { fr: 'Responsable de l’exécution' }, { fr: 'Superviseur HSE' }],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR04-F08 — FICHE D'ACCUEIL SÉCURITÉ
   *
   *  Ajoutée : trace de l'accueil des nouveaux arrivants, que le journal du
   *  service consignait sans modèle. Pas de n° d'identité : le nom,
   *  l'entreprise et la fonction suffisent à prouver l'accueil.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR04-F08',
    version: '00',
    title: 'Fiche d’accueil sécurité',
    methodCode: 'HSE',
    paradigm: 'CHECKLIST',
    applicationDate: '2026-09-21',
    schema: {
      sections: [
        HSE_PROJECT([hc('date', 'Date', 'date', { required: true, autofill: 'date', span: 12 })]),
        hSection('modules', 'Modules traités', [
          hc('site', 'Présentation du chantier et de ses risques', 'boolean', { span: 6 }),
          hc('traffic', 'Règles de circulation', 'boolean', { span: 6 }),
          hc('ppe', 'EPI obligatoires', 'boolean', { span: 6 }),
          hc('permits', 'Permis de travail', 'boolean', { span: 6 }),
          hc('emergency', 'Consignes d’urgence et point de rassemblement', 'boolean', { span: 6 }),
          hc('waste', 'Gestion des déchets', 'boolean', { span: 6 }),
          hc('prohibitions', 'Interdictions (alcool, tabac, téléphone en zone de travail)', 'boolean', { span: 6 }),
          hc('reporting', 'Remontée des situations dangereuses', 'boolean', { span: 6 }),
          hc('other', 'Autres modules', 'text', { span: 12 }),
        ]),
        hTable('participants', 'Personnes accueillies', [
          hc('name', 'Nom et prénom', 'text', { required: true, span: 4 }),
          hc('company', 'Entreprise', 'text', { required: true, span: 3 }),
          hc('position', 'Fonction', 'text', { required: true, span: 3 }),
          hc('signed', 'Émargé', 'enum', { required: true, options: ['Oui', 'Non'], span: 2 }),
        ], undefined, 1),
        {
          key: 'signatures',
          label: { fr: 'Visa' },
          type: 'signature-matrix',
          repeatable: false,
          signatories: [{ fr: 'Animateur de l’accueil' }],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR04-F09 — COMPTE RENDU DE CAUSERIE SÉCURITÉ
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR04-F09',
    version: '00',
    title: 'Compte rendu de causerie sécurité',
    methodCode: 'HSE',
    paradigm: 'CHECKLIST',
    applicationDate: '2026-09-21',
    schema: {
      sections: [
        HSE_PROJECT([
          hc('date', 'Date', 'date', { required: true, autofill: 'date', span: 4 }),
          hc('company', 'Entreprise', 'text', { required: true, span: 4 }),
          hc('duration', 'Durée', 'number', { unit: 'min', decimals: 0, span: 4 }),
          hc('animator', 'Animateur', 'text', { required: true }),
          hc('topic', 'Thème', 'text', { required: true }),
        ]),
        hSection('content', 'Contenu', [
          hc('keyPoints', 'Points clés transmis', 'textarea', { required: true, span: 12 }),
          hc('questions', 'Questions et remarques des participants', 'textarea', { span: 12 }),
        ], 'text'),
        hTable('participants', 'Participants', [
          hc('name', 'Nom et prénom', 'text', { required: true, span: 4 }),
          hc('company', 'Entreprise', 'text', { required: true, span: 3 }),
          hc('position', 'Fonction', 'text', { span: 3 }),
          hc('signed', 'Émargé', 'enum', { required: true, options: ['Oui', 'Non'], span: 2 }),
        ], undefined, 1),
        {
          key: 'signatures',
          label: { fr: 'Visa' },
          type: 'signature-matrix',
          repeatable: false,
          signatories: [{ fr: 'Animateur' }],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR04-F10 — CONTRÔLE D'ENGIN AVANT ACCÈS AU CHANTIER
   *
   *  Ajouté : le plan HSE prévoit ce contrôle (rubrique 7.2) et le rapport
   *  hebdomadaire en suit le résultat, sans que la grille existe. Il ne
   *  remplace pas la vérification générale périodique (PR02-F20 à F28).
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR04-F10',
    version: '00',
    title: 'Contrôle d’engin avant accès au chantier',
    methodCode: 'HSE',
    paradigm: 'CHECKLIST',
    applicationDate: '2026-09-21',
    schema: {
      sections: [
        HSE_PROJECT([
          hc('date', 'Date du contrôle', 'date', { required: true, autofill: 'date', span: 6 }),
          hc('company', 'Entreprise', 'text', { required: true, span: 6 }),
        ]),
        hSection('machine', 'Engin et conducteur', [
          hc('designation', 'Désignation', 'text', { required: true, span: 4 }),
          hc('model', 'Marque et type', 'text', { span: 4 }),
          hc('serial', 'Immatriculation ou n° de série', 'text', { required: true, span: 4 }),
          hc('driver', 'Conducteur', 'text', { required: true, span: 4 }),
          hc('licence', 'Autorisation de conduite — n° et validité', 'text', { required: true, span: 8 }),
        ]),
        hSection('documents', 'Documents', [
          hc('insurance', 'Fin d’assurance', 'date', { required: true, span: 4 }),
          hc('technical', 'Fin de visite technique', 'date', { span: 4 }),
          hc('inspectionEnd', 'Fin de validité du contrôle réglementaire', 'date', { required: true, span: 4 }),
          hc('inspectionReport', 'Rapport de vérification réglementaire n°', 'text', { span: 12 }),
        ], 'keyvalue', 'Un document échu à la date du contrôle refuse l’accès.'),
        {
          key: 'checks',
          label: { fr: 'État de l’engin' },
          type: 'checklist',
          repeatable: false,
          help: EILM_CHECKS_HELP,
          groups: [
            {
              key: 'general',
              label: { fr: 'État général' },
              points: [
                { key: 'brakes', label: { fr: 'Freins de service et de stationnement' } },
                { key: 'steering', label: { fr: 'Direction' } },
                { key: 'tyres', label: { fr: 'Pneumatiques ou chenilles' } },
                { key: 'leaks', label: { fr: 'Absence de fuite (huile, carburant, hydraulique)' } },
                { key: 'mirrors', label: { fr: 'Rétroviseurs' } },
                { key: 'windows', label: { fr: 'Pare-brise et vitres' } },
              ],
            },
            {
              key: 'safety',
              label: { fr: 'Sécurité' },
              points: [
                { key: 'horn', label: { fr: 'Avertisseur sonore' } },
                { key: 'reverse-alarm', label: { fr: 'Avertisseur de recul' } },
                { key: 'beacon', label: { fr: 'Gyrophare' } },
                { key: 'lights', label: { fr: 'Feux' } },
                { key: 'seatbelt', label: { fr: 'Ceinture de sécurité' } },
                { key: 'extinguisher', label: { fr: 'Extincteur' } },
                { key: 'cab-protection', label: { fr: 'Structure de protection de la cabine (ROPS, FOPS)' } },
                { key: 'first-aid', label: { fr: 'Trousse de secours' } },
              ],
            },
            {
              key: 'equipment',
              label: { fr: 'Équipement de travail' },
              points: [
                { key: 'attachment', label: { fr: 'Flèche, godet, fourches ou accessoire' } },
                { key: 'hydraulics', label: { fr: 'Vérins et flexibles' } },
                { key: 'locks', label: { fr: 'Dispositifs de verrouillage' } },
              ],
            },
          ],
        },
        {
          key: 'decision',
          label: { fr: 'Décision' },
          type: 'verdict',
          repeatable: false,
          verdicts: [
            { fr: 'Accès autorisé' },
            { fr: 'Accès autorisé après levée des réserves' },
            { fr: 'Accès refusé' },
          ],
        },
        HSE_PHOTOS,
        {
          key: 'signatures',
          label: { fr: 'Visas' },
          type: 'signature-matrix',
          repeatable: false,
          signatories: [{ fr: 'Contrôleur HSE' }, { fr: 'Conducteur ou entreprise' }],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR03-F01 — CONTRÔLE TECHNIQUE (paradigme « critères »)
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR03-F01',
    version: '00',
    title: 'Rapport de contrôle technique de construction',
    methodCode: 'CTC',
    paradigm: 'CRITERIA',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        {
          key: 'header',
          label: { fr: 'Identification' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'client', label: { fr: 'Client' }, type: 'ref', required: true, autofill: 'client', span: 6 },
            { key: 'affairNumber', label: { fr: 'N° d’affaire' }, type: 'ref', required: true, autofill: 'affairNumber', span: 6 },
            { key: 'project', label: { fr: 'Ouvrage' }, type: 'text', required: true, span: 6 },
            { key: 'location', label: { fr: 'Lieu' }, type: 'ref', required: true, autofill: 'site', span: 6 },
            { key: 'activities', label: { fr: 'Activités réalisées' }, type: 'textarea', required: false, span: 12 },
            { key: 'externalDeliverables', label: { fr: 'Liste des livrables externes et origine' }, type: 'textarea', required: false, span: 12 },
          ],
        },
        {
          key: 'criteria',
          label: { fr: 'Critères d’acceptation' },
          type: 'criteria',
          repeatable: false,
          help: 'Chaque critère est déclaré applicable ou non, puis conforme ou non conforme.',
          criteria: [
            {
              key: 'calculation-hypotheses',
              label: { fr: 'Les hypothèses de calcul de l’ouvrage sont conformes aux référentiels applicables.' },
              standards: ['BAEL 91', 'Eurocodes', 'CM66', 'DTU', 'RPS 2011', 'NV65'],
            },
            {
              key: 'soil-report',
              label: { fr: 'Les fondations correspondent au rapport de sol établi par le laboratoire.' },
              standards: [],
            },
            {
              key: 'dimensioning',
              label: { fr: 'Le dimensionnement de l’ouvrage est conforme à sa typologie — béton armé, charpente métallique.' },
              standards: ['BAEL 91', 'Eurocodes', 'CM66', 'DTU'],
            },
            {
              key: 'materials',
              label: { fr: 'Le type de béton et la nature de l’acier sont adaptés à l’ouvrage : agressivité du milieu, distance à la mer, indications du rapport de sol.' },
              standards: ['NM 10.1.008'],
            },
            {
              key: 'waterproofing',
              label: { fr: 'Le complexe d’étanchéité est conforme aux exigences du CPS et à l’usage souhaité.' },
              standards: ['DTU 43'],
            },
            {
              key: 'fire-safety',
              label: { fr: 'Les dispositions de sécurité incendie sont conformes au décret applicable.' },
              standards: ['Décret 2-14-499'],
            },
          ],
        },
        {
          key: 'observations',
          label: { fr: 'Observations et réserves' },
          type: 'text',
          repeatable: false,
          fields: [
            { key: 'observations', label: { fr: 'Observations' }, type: 'textarea', required: false, span: 12 },
          ],
        },
        {
          key: 'conclusion',
          label: { fr: 'Avis' },
          type: 'verdict',
          repeatable: false,
          verdicts: [
            { fr: 'Avis favorable' },
            { fr: 'Avis favorable avec réserves' },
            { fr: 'Avis défavorable' },
          ],
        },
        {
          key: 'signatures',
          label: { fr: 'Visas' },
          type: 'signature-matrix',
          repeatable: false,
          signatories: [
            { fr: 'Rédacteur du rapport' },
            { fr: 'Vérificateur de conformité' },
            { fr: 'Représentant du client' },
          ],
        },
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR01-F04 — RESSUAGE (paradigme « mesures »)
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR01-F04',
    version: '00',
    title: 'Rapport d’examen par ressuage',
    titleEn: 'Report of Liquid Penetrant Examination',
    methodCode: 'PT',
    paradigm: 'MEASUREMENT',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        END_HEADER,
        {
          key: 'piece',
          label: { fr: 'Caractéristiques de l’élément', en: 'Characteristics of work piece' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'pieceType', label: { fr: 'Nature', en: 'Type' }, type: 'enum', required: true, options: ['Soudure', 'Pièce mécanique'], span: 3 },
            { key: 'jointNumber', label: { fr: 'N° de joint', en: 'Joint N°' }, type: 'text', required: false, span: 3 },
            { key: 'material', label: { fr: 'Matériau', en: 'Base material' }, type: 'text', required: true, span: 3 },
            { key: 'extent', label: { fr: 'Étendue de contrôle', en: 'Extend of inspection' }, type: 'text', required: true, span: 3 },
            { key: 'surfaceTemperature', label: { fr: 'Température de surface', en: 'Surface temperature' }, type: 'number', required: true, unit: '°C', span: 3 },
            { key: 'surfaceCondition', label: { fr: 'État de surface', en: 'Surface conditions' }, type: 'text', required: true, span: 3 },
          ],
        },
        {
          key: 'penetrant',
          label: { fr: 'Application du pénétrant', en: 'Penetrant application' },
          type: 'conditions',
          repeatable: false,
          fields: [
            { key: 'reference', label: { fr: 'Référence', en: 'Reference' }, type: 'text', required: true, span: 3 },
            { key: 'appliedBy', label: { fr: 'Application par', en: 'Penetrant application by' }, type: 'enum', required: true, options: ['Pinceau', 'Aérosol', 'Immersion', 'Autre'], span: 3 },
            { key: 'duration', label: { fr: 'Durée', en: 'Time' }, type: 'number', required: true, unit: 'mn', span: 3 },
            { key: 'removal', label: { fr: 'Mode d’élimination', en: 'Removal method' }, type: 'enum', required: true, options: ['Eau', 'Solvant', 'Émulsifiant', 'Autre'], span: 3 },
          ],
        },
        {
          key: 'developer',
          label: { fr: 'Application du révélateur', en: 'Developer application' },
          type: 'conditions',
          repeatable: false,
          fields: [
            { key: 'reference', label: { fr: 'Référence', en: 'Reference' }, type: 'text', required: true, span: 3 },
            { key: 'appliedBy', label: { fr: 'Application par', en: 'Developer application by' }, type: 'enum', required: true, options: ['Pinceau', 'Aérosol', 'Immersion', 'Autre'], span: 3 },
            { key: 'developingTime', label: { fr: 'Temps de révélation', en: 'Developing time' }, type: 'number', required: true, unit: 'mn', span: 3 },
            { key: 'finalCleaning', label: { fr: 'Nettoyage final', en: 'Final cleaning' }, type: 'text', required: false, span: 3 },
          ],
        },
        {
          key: 'observation',
          label: { fr: 'Conditions d’observation', en: 'Inspection sequence' },
          type: 'conditions',
          repeatable: false,
          fields: [
            ...LIGHT_FIELDS,
            { key: 'aspect', label: { fr: 'Aspect', en: 'Aspect' }, type: 'text', required: false, span: 4 },
            { key: 'stage', label: { fr: 'Stade de contrôle', en: 'Inspection stage' }, type: 'enum', required: true, options: ['Chanfrein avant soudage', '1re passe', 'Reprise envers', 'Final', 'Autre'], span: 6 },
          ],
        },
        {
          key: 'results',
          label: { fr: 'Résultats de l’interprétation', en: 'Interpretation results' },
          type: 'table',
          repeatable: true,
          minRows: 0,
          help: 'Chaque ligne devient une indication exploitable, transformable en non-conformité.',
          columns: [
            { key: 'mark', label: { fr: 'Repère pièce ou soudure', en: 'Mark of part or weld' }, type: 'text', required: true, span: 2 },
            { key: 'indicationType', label: { fr: 'Type des indications', en: 'Type of indications' }, type: 'enum', required: true, options: ['Linéaire', 'Non linéaire'], span: 2 },
            { key: 'location', label: { fr: 'Localisation', en: 'Location of indications' }, type: 'text', required: true, unit: 'mm', span: 2 },
            { key: 'dimensions', label: { fr: 'Dimensions avant meulage', en: 'Dimensions before grinding' }, type: 'number', required: false, unit: 'mm', decimals: 1, span: 2 },
            { key: 'comments', label: { fr: 'Observations', en: 'Comments' }, type: 'text', required: false, span: 2 },
            { key: 'decision', label: { fr: 'Décision', en: 'Decision' }, type: 'enum', required: true, options: ['Conforme', 'Non conforme'], span: 2 },
          ],
        },
        {
          key: 'photos',
          label: { fr: 'Photographies', en: 'Photographs' },
          type: 'photos',
          repeatable: true,
          minRows: 0,
        },
        END_SIGNATURES_3,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR01-F05 — MAGNÉTOSCOPIE (paradigme « mesures »)
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR01-F05',
    version: '00',
    title: 'Rapport d’examen par magnétoscopie',
    titleEn: 'Report of magnetic particle examination',
    methodCode: 'MT',
    paradigm: 'MEASUREMENT',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        END_HEADER,
        {
          key: 'piece',
          label: { fr: 'Caractéristiques de l’élément', en: 'Characteristics of work piece' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'baseMaterial', label: { fr: 'Matériaux de base', en: 'Base material' }, type: 'text', required: true, span: 3 },
            { key: 'weldMetal', label: { fr: 'Métal d’apport', en: 'Weld metal' }, type: 'text', required: false, span: 3 },
            { key: 'weldingProcess', label: { fr: 'Procédé de soudage', en: 'Welding process' }, type: 'text', required: false, span: 3 },
            { key: 'jointType', label: { fr: 'Type d’assemblage', en: 'Joint type' }, type: 'text', required: false, span: 3 },
          ],
        },
        {
          key: 'conditions',
          label: { fr: 'Conditions d’examen', en: 'Operating conditions' },
          type: 'conditions',
          repeatable: false,
          fields: [
            { key: 'surfaceCondition', label: { fr: 'État de surface', en: 'Surface conditions' }, type: 'enum', required: true, options: ['Grenaillée / sablée', 'Meulée / usinée', 'Brute'], span: 6 },
            { key: 'stage', label: { fr: 'Stade d’examen', en: 'Examination stage' }, type: 'enum', required: true, options: ['Final', 'Après réparation', 'Autre'], span: 6 },
          ],
        },
        {
          key: 'magnetisation',
          label: { fr: 'Magnétisation', en: 'Magnetisation' },
          type: 'conditions',
          repeatable: false,
          fields: [
            { key: 'apparatus', label: { fr: 'Appareil de magnétisation', en: 'Apparatus' }, type: 'enum', required: true, options: ['Électro-aimant', 'Aimant permanent'], span: 4 },
            { key: 'current', label: { fr: 'Type de courant', en: 'Type of current' }, type: 'enum', required: true, options: ['Alternatif', 'Continu', 'Pulsé', 'Redressé'], span: 4 },
            { key: 'method', label: { fr: 'Type de magnétisation', en: 'Magnetisation method' }, type: 'enum', required: true, options: ['Par passage de flux', 'Par passage de courant'], span: 4 },
            { key: 'indicator', label: { fr: 'Témoin de magnétisation', en: 'Magnetisation indicator' }, type: 'enum', required: true, options: ['Berthold', 'Autre'], span: 4 },
            { key: 'duration', label: { fr: 'Durée de magnétisation', en: 'Magnetising time' }, type: 'number', required: false, unit: 's', span: 4 },
            { key: 'pieceTemperature', label: { fr: 'Température de la pièce', en: 'Casing temperature' }, type: 'number', required: true, unit: '°C', span: 4 },
          ],
        },
        {
          key: 'product',
          label: { fr: 'Produit indicateur', en: 'Magnetic particle material' },
          type: 'conditions',
          repeatable: false,
          fields: [
            { key: 'brand', label: { fr: 'Marque', en: 'Trade mark' }, type: 'text', required: true, span: 3 },
            { key: 'type', label: { fr: 'Type', en: 'Type' }, type: 'text', required: true, span: 3 },
            { key: 'form', label: { fr: 'Forme', en: 'Form' }, type: 'enum', required: true, options: ['Sec', 'Humide', 'Fluorescent'], span: 3 },
            { key: 'contrastingBase', label: { fr: 'Base contrastante', en: 'Contrasting base' }, type: 'text', required: false, span: 3 },
          ],
        },
        {
          key: 'observation',
          label: { fr: 'Conditions d’observation et nettoyage final', en: 'Inspection sequence and final cleaning' },
          type: 'conditions',
          repeatable: false,
          fields: [
            ...LIGHT_FIELDS,
            { key: 'demagnetisation', label: { fr: 'Démagnétisation', en: 'Demagnetisation' }, type: 'enum', required: true, options: ['Oui', 'Non'], span: 2 },
            { key: 'cleaning', label: { fr: 'Nettoyage', en: 'Cleaning' }, type: 'text', required: false, span: 2 },
          ],
        },
        {
          key: 'results',
          label: { fr: 'Résultats de l’interprétation', en: 'Interpretation results' },
          type: 'table',
          repeatable: true,
          minRows: 0,
          help: 'Chaque ligne devient une indication exploitable, transformable en non-conformité.',
          columns: [
            { key: 'mark', label: { fr: 'Repère pièce ou soudure', en: 'Mark of part or weld' }, type: 'text', required: true, span: 2 },
            { key: 'defectType', label: { fr: 'Type de défaut', en: 'Type of defect' }, type: 'text', required: true, span: 2 },
            { key: 'location', label: { fr: 'Localisation', en: 'Location of indications' }, type: 'text', required: true, unit: 'mm', span: 2 },
            { key: 'dimensionsBefore', label: { fr: 'Dimensions avant meulage', en: 'Dimensions before grinding' }, type: 'number', required: false, unit: 'mm', decimals: 1, span: 2 },
            { key: 'lengthAfter', label: { fr: 'Longueur après meulage', en: 'Length after grinding' }, type: 'number', required: false, unit: 'mm', decimals: 1, span: 1 },
            { key: 'depthAfter', label: { fr: 'Profondeur après meulage', en: 'Depth after grinding' }, type: 'number', required: false, unit: 'mm', decimals: 1, span: 1 },
            { key: 'decision', label: { fr: 'Décision', en: 'Decision' }, type: 'enum', required: true, options: ['Conforme', 'Non conforme'], span: 2 },
          ],
        },
        {
          key: 'photos',
          label: { fr: 'Photographies', en: 'Photographs' },
          type: 'photos',
          repeatable: true,
          minRows: 0,
        },
        END_SIGNATURES_3,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR01-F08 — EXAMEN VISUEL (paradigme « mesures »)
   *  Le catalogue l'annonçait en check-list ; le modèle est en fait
   *  construit comme les autres examens de surface.
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR01-F08',
    version: '00',
    title: 'Rapport d’examen visuel',
    titleEn: 'Report of Visual Examination',
    methodCode: 'VT',
    paradigm: 'MEASUREMENT',
    applicationDate: '2022-01-10',
    schema: {
      sections: [
        END_HEADER,
        {
          key: 'piece',
          label: { fr: 'Caractéristiques de l’élément contrôlé', en: 'Characteristics of work piece' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'material', label: { fr: 'Matériau', en: 'Base material' }, type: 'text', required: true, span: 3 },
            { key: 'extent', label: { fr: 'Étendue du contrôle', en: 'Extent of inspection' }, type: 'text', required: true, span: 3 },
            { key: 'pieceType', label: { fr: 'Nature', en: 'Type' }, type: 'enum', required: true, options: ['Soudure', 'Autre'], span: 3 },
            { key: 'surfaceTemperature', label: { fr: 'Température de surface', en: 'Surface temperature' }, type: 'number', required: true, unit: '°C', span: 3 },
          ],
        },
        {
          key: 'conditions',
          label: { fr: 'Conditions d’examen', en: 'Operating conditions' },
          type: 'conditions',
          repeatable: false,
          fields: [
            { key: 'surfaceCondition', label: { fr: 'État de surface', en: 'Surface condition' }, type: 'enum', required: true, options: ['Grenaillée / sablée', 'Meulée / usinée', 'Brossée', 'Brute', 'Autre'], span: 12 },
          ],
        },
        {
          key: 'observation',
          label: { fr: 'Conditions d’observation', en: 'Inspection sequence' },
          type: 'conditions',
          repeatable: false,
          fields: [
            { key: 'lighting', label: { fr: 'Éclairage', en: 'Lighting' }, type: 'enum', required: true, options: ['Naturel', 'Artificiel'], span: 4 },
            { key: 'lightValue', label: { fr: 'Valeur contrôlée', en: 'Specified value' }, type: 'number', required: true, unit: 'Lux', span: 4 },
            { key: 'means', label: { fr: 'Moyens d’examen', en: 'Means of examination' }, type: 'enum', required: true, options: ['Œil nu', 'Loupe', 'Endoscope', 'Autre'], span: 4 },
          ],
        },
        {
          key: 'stage',
          label: { fr: 'Stade de contrôle', en: 'Stage of inspection' },
          type: 'conditions',
          repeatable: false,
          fields: [
            { key: 'stage', label: { fr: 'Stade', en: 'Stage' }, type: 'enum', required: true, options: ['Avant soudage', 'Pendant soudage', 'Après soudage', 'Après traitement thermique', 'Après réparation'], span: 6 },
            { key: 'repair', label: { fr: 'Réparation', en: 'Repair' }, type: 'enum', required: false, options: ['Partiellement réparée', 'Totalement réparée'], span: 6 },
          ],
        },
        {
          key: 'results',
          label: { fr: 'Résultats de l’interprétation', en: 'Interpretation results' },
          type: 'table',
          repeatable: true,
          minRows: 0,
          help: 'Groupes de défauts de la norme : chaque ligne devient une indication exploitable.',
          columns: [
            { key: 'mark', label: { fr: 'Repère pièce ou soudure', en: 'Mark of part or weld' }, type: 'text', required: true, span: 3 },
            { key: 'defectGroup', label: { fr: 'Groupe de défaut', en: 'Defect group' }, type: 'enum', required: true, options: ['Aucun', 'Gr. 1 — Fissures', 'Gr. 2 — Cavité', 'Gr. 3 — Inclusions solides', 'Gr. 4 — Manque de fusion et de pénétration', 'Gr. 5 — Défauts de forme et dimensionnels', 'Gr. 6 — Défauts divers'], span: 4 },
            { key: 'comments', label: { fr: 'Observations', en: 'Comments' }, type: 'text', required: false, span: 3 },
            { key: 'decision', label: { fr: 'Décision', en: 'Decision' }, type: 'enum', required: true, options: ['Conforme', 'Non conforme'], span: 2 },
          ],
        },
        {
          key: 'photos',
          label: { fr: 'Photographies', en: 'Photographs' },
          type: 'photos',
          repeatable: true,
          minRows: 0,
        },
        END_SIGNATURES_3,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR01-F22 — INTERPRÉTATION DE CLICHÉS RADIOGRAPHIQUES
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR01-F22',
    version: '00',
    title: 'Rapport d’interprétation de clichés radiographiques',
    titleEn: 'Interpretation of radiographs',
    methodCode: 'RT',
    paradigm: 'MEASUREMENT',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        END_HEADER,
        {
          key: 'source',
          label: { fr: 'Caractéristiques de la source de rayonnement', en: 'Characteristics of radiation source' },
          type: 'conditions',
          repeatable: false,
          fields: [
            { key: 'source', label: { fr: 'Source', en: 'Radiation source' }, type: 'enum', required: true, options: ['Ir 192', 'Co 60', 'Rayons X'], span: 3 },
            { key: 'activity', label: { fr: 'Activité', en: 'Activity' }, type: 'number', required: false, unit: 'Ci', decimals: 2, span: 3 },
            { key: 'voltage', label: { fr: 'Tension', en: 'Voltage' }, type: 'number', required: false, unit: 'kV', span: 3 },
            { key: 'current', label: { fr: 'Intensité', en: 'Current' }, type: 'number', required: false, unit: 'mA', decimals: 1, span: 3 },
            { key: 'equipment', label: { fr: 'Appareil utilisé', en: 'Equipment used' }, type: 'text', required: true, span: 4 },
            { key: 'focusSize', label: { fr: 'Dimension du foyer', en: 'Focus size' }, type: 'text', required: false, unit: 'mm', span: 4 },
            { key: 'sourceFilmDistance', label: { fr: 'Distance source-film', en: 'Source-film distance' }, type: 'number', required: true, unit: 'mm', span: 4 },
            { key: 'exposureTime', label: { fr: 'Temps d’exposition', en: 'Exposure time' }, type: 'text', required: false, span: 4 },
          ],
        },
        {
          key: 'film',
          label: { fr: 'Films, écrans, filtres et I.Q.I.', en: 'Film, screens, filters and penetrameters' },
          type: 'conditions',
          repeatable: false,
          fields: [
            { key: 'filmBrand', label: { fr: 'Marque du film', en: 'Film manufacturer' }, type: 'enum', required: true, options: ['Agfa', 'Kodak', 'Autre'], span: 3 },
            { key: 'filmType', label: { fr: 'Type de film', en: 'Film type' }, type: 'enum', required: true, options: ['D4', 'D5', 'D7', 'AA', 'M', 'MX', 'Autre'], span: 3 },
            { key: 'screenFront', label: { fr: 'Écran plomb antérieur', en: 'Front lead screen' }, type: 'number', required: false, unit: 'mm', decimals: 2, span: 2 },
            { key: 'screenIntermediate', label: { fr: 'Écran plomb intermédiaire', en: 'Intermediate lead screen' }, type: 'number', required: false, unit: 'mm', decimals: 2, span: 2 },
            { key: 'screenBack', label: { fr: 'Écran plomb postérieur', en: 'Back lead screen' }, type: 'number', required: false, unit: 'mm', decimals: 2, span: 2 },
            { key: 'iqiStandard', label: { fr: 'Référentiel I.Q.I.', en: 'IQI standard' }, type: 'enum', required: true, options: ['EN', 'ISO', 'AFNOR', 'ASTM', 'ASME', 'DIN'], span: 3 },
            { key: 'iqiSize', label: { fr: 'Dimension I.Q.I.', en: 'IQI size' }, type: 'enum', required: false, options: ['10x20', '10x40', 'Autre'], span: 3 },
            { key: 'filters', label: { fr: 'Filtres', en: 'Filters' }, type: 'text', required: false, span: 6 },
          ],
        },
        {
          key: 'workpiece',
          label: { fr: 'Caractéristiques de l’assemblage', en: 'Characteristics of workpiece' },
          type: 'conditions',
          repeatable: false,
          fields: [
            { key: 'material', label: { fr: 'Matériau radiographié', en: 'Radiographied base material' }, type: 'text', required: true, span: 3 },
            { key: 'thickness', label: { fr: 'Épaisseur radiographiée', en: 'Base material thickness' }, type: 'number', required: true, unit: 'mm', decimals: 2, span: 3 },
            { key: 'processFluid', label: { fr: 'Produit véhiculé', en: 'Process fluid' }, type: 'text', required: false, span: 3 },
            { key: 'jointType', label: { fr: 'Type d’assemblage', en: 'Workpiece type' }, type: 'enum', required: true, options: ['Tôle', 'Tube', 'Piquage'], span: 3 },
            { key: 'heatTreatment', label: { fr: 'Stade de contrôle', en: 'Stage of inspection' }, type: 'enum', required: true, options: ['Avant traitement thermique', 'Après traitement thermique'], span: 6 },
          ],
        },
        {
          key: 'technique',
          label: { fr: 'Technique de prise de vue', en: 'Radiographic technique' },
          type: 'conditions',
          repeatable: false,
          fields: [
            { key: 'wall', label: { fr: 'Paroi', en: 'Wall' }, type: 'enum', required: true, options: ['Simple paroi', 'Double paroi'], span: 6 },
            { key: 'arrangement', label: { fr: 'Disposition', en: 'Arrangement' }, type: 'enum', required: true, options: ['Source interne', 'Source externe', 'Panoramique', 'Contact', 'Ellipse', 'Plan'], span: 6 },
          ],
        },
        {
          key: 'results',
          label: { fr: 'Résultats de l’interprétation', en: 'Results of interpretation' },
          type: 'table',
          repeatable: true,
          minRows: 0,
          help: 'Une ligne par cliché : ajoutez une ligne par défaut relevé sur un même cliché.',
          columns: [
            { key: 'mark', label: { fr: 'Repère soudure et film', en: 'Weld and film number' }, type: 'text', required: true, span: 3 },
            { key: 'thickness', label: { fr: 'Épaisseur métal de base', en: 'Base metal thickness' }, type: 'number', required: false, unit: 'mm', decimals: 2, span: 1 },
            { key: 'iqi', label: { fr: 'Ø I.Q.I. trou/fil', en: 'IQI hole/wire' }, type: 'text', required: false, span: 1 },
            { key: 'density', label: { fr: 'Densité moyenne', en: 'Average density' }, type: 'number', required: false, decimals: 2, span: 2 },
            { key: 'defect', label: { fr: 'Défaut relevé', en: 'Defect' }, type: 'enum', required: true, options: ['Aucun', 'Fissures', 'Manque de fusion', 'Manque de pénétration', 'Soufflures', 'Nid de soufflures', 'Retassure', 'Inclusions solides', 'Caniveau', 'Excès de pénétration', 'Défaut d’alignement', 'Mauvaise reprise', 'Défauts divers'], span: 3 },
            { key: 'decision', label: { fr: 'Décision', en: 'Decision' }, type: 'enum', required: true, options: ['Conforme', 'Acceptable', 'Non acceptable'], span: 2 },
          ],
        },
        {
          key: 'photos',
          label: { fr: 'Photographies', en: 'Photographs' },
          type: 'photos',
          repeatable: true,
          minRows: 0,
        },
        END_SIGNATURES_3,
      ],
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  PR01-F26 — ESSAI DE DURETÉ
   * ═══════════════════════════════════════════════════════════════ */
  {
    formCode: 'PR01-F26',
    version: '00',
    title: 'Rapport d’essai de dureté',
    titleEn: 'Hardness test report',
    methodCode: 'HARD',
    paradigm: 'MEASUREMENT',
    applicationDate: '2022-10-01',
    schema: {
      sections: [
        END_HEADER,
        {
          key: 'piece',
          label: { fr: 'Caractéristiques de l’élément contrôlé', en: 'Characteristics of work piece' },
          type: 'keyvalue',
          repeatable: false,
          fields: [
            { key: 'baseMaterial', label: { fr: 'Métal de base', en: 'Base material' }, type: 'text', required: true, span: 3 },
            { key: 'thickness', label: { fr: 'Épaisseur', en: 'Thickness' }, type: 'number', required: true, unit: 'mm', decimals: 1, span: 3 },
            { key: 'weldType', label: { fr: 'Type de soudure', en: 'Type of weld' }, type: 'enum', required: false, options: ['BW', 'FW'], span: 2 },
            { key: 'weldingProcess', label: { fr: 'Procédé de soudage', en: 'Welding process' }, type: 'text', required: false, span: 2 },
            { key: 'consumable', label: { fr: 'Métal d’apport', en: 'Consumable' }, type: 'text', required: false, span: 2 },
          ],
        },
        {
          key: 'conditions',
          label: { fr: 'Conditions d’examen', en: 'Operating conditions' },
          type: 'conditions',
          repeatable: false,
          fields: [
            { key: 'surfaceCondition', label: { fr: 'État de surface', en: 'Surface condition' }, type: 'enum', required: true, options: ['Meulée / usinée', 'Polissage', 'Disque abrasif', 'Autre'], span: 6 },
            { key: 'surfaceTemperature', label: { fr: 'Température de surface', en: 'Surface temperature' }, type: 'number', required: true, unit: '°C', span: 6 },
          ],
        },
        {
          key: 'tester',
          label: { fr: 'Caractéristiques du duromètre', en: 'Characteristics of hardness tester' },
          type: 'conditions',
          repeatable: false,
          fields: [
            { key: 'brand', label: { fr: 'Marque', en: 'Brand' }, type: 'text', required: true, span: 3 },
            { key: 'model', label: { fr: 'Type', en: 'Model' }, type: 'text', required: true, span: 3 },
            { key: 'probe', label: { fr: 'Palpeur', en: 'Probe type' }, type: 'text', required: false, span: 3 },
            { key: 'scale', label: { fr: 'Échelle', en: 'Scale' }, type: 'enum', required: true, options: ['HB', 'HV', 'HRC', 'HRB'], span: 3 },
            { key: 'referenceBlock', label: { fr: 'Bloc de référence n°', en: 'Reference block' }, type: 'text', required: false, span: 6 },
            { key: 'referenceValue', label: { fr: 'Valeur de référence', en: 'Reference value' }, type: 'number', required: false, decimals: 1, span: 6 },
          ],
        },
        {
          key: 'results',
          label: { fr: 'Relevé des duretés', en: 'Hardness measurements' },
          type: 'table',
          repeatable: true,
          minRows: 0,
          help: 'Une ligne par point de mesure : zone du dessin de repérage (A à E) et rang du point.',
          columns: [
            { key: 'mark', label: { fr: 'Repère pièce ou soudure', en: 'Mark of part or weld' }, type: 'text', required: true, span: 3 },
            { key: 'zone', label: { fr: 'Zone', en: 'Area' }, type: 'enum', required: true, options: ['A', 'B', 'C', 'D', 'E'], span: 1 },
            { key: 'point', label: { fr: 'Point', en: 'Point' }, type: 'number', required: true, span: 1 },
            { key: 'value', label: { fr: 'Dureté relevée', en: 'Measured hardness' }, type: 'number', required: true, decimals: 1, span: 2 },
            { key: 'comments', label: { fr: 'Observations', en: 'Comments' }, type: 'text', required: false, span: 3 },
            { key: 'decision', label: { fr: 'Décision', en: 'Decision' }, type: 'enum', required: true, options: ['Conforme', 'Non conforme'], span: 2 },
          ],
        },
        {
          key: 'photos',
          label: { fr: 'Dessin de repérage et photographies', en: 'Drawing with numbered areas and photographs' },
          type: 'photos',
          repeatable: true,
          minRows: 0,
        },
        END_SIGNATURES_3,
      ],
    },
  },
];
