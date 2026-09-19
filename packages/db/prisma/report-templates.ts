/**
 * Formulaires d'inspection construits, saisissables dans l'application.
 *
 * Structures relevées une à une sur les modèles du référentiel I2S
 * (`05_PROCEDURES`), dont les fichiers Excel et Word font foi :
 *   PR01-F02  Examen par ultrasons                  → mesures et indications
 *   PR01-F04  Examen par ressuage                   → mesures et indications
 *   PR01-F05  Examen par magnétoscopie              → mesures et indications
 *   PR01-F08  Examen visuel                         → mesures et indications
 *   PR01-F22  Interprétation de clichés radio       → mesures et indications
 *   PR01-F26  Essai de dureté                       → mesures et indications
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
 *   PR02-F20  Pelle de chargement                   → engin de chantier
 *   PR02-F21  Porte automatique                     → check-list propre
 *   PR02-F23  Niveleuse                             → engin de chantier
 *   PR02-F24  Machine mobile de forage              → engin de chantier
 *   PR02-F25  Compresseur mobile                    → engin de chantier
 *   PR02-F26  Compacteur mobile                     → engin de chantier
 *   PR02-F27  Groupe électrogène                    → liste continue
 *   PR02-F28  Bétonnière                            → engin de chantier
 *   PR02-F35  Stop-chute                            → accessoire
 *   PR02-F38  Chariot de manutention à mât          → check-list réglementaire
 *   PR02-F39  Mise en service pont roulant          → check-list et épreuves
 *   PR02-F40  Vérification périodique pont roulant  → check-list réglementaire
 *   PR02-F41  Vérin hydraulique                     → accessoire
 *   PR02-F42  Centrale hydraulique                  → accessoire
 *   PR03-F01  Rapport de contrôle technique         → critères d'acceptation
 *
 * Les six formulaires END du lot L1 sont couverts, ainsi que les appareils de
 * levage et les engins de chantier du lot EILM.
 *
 * Les autres formulaires du catalogue (`report-forms.ts`) restent en brouillon
 * tant que leur structure n'a pas été relevée : ils classent les rapports sans
 * pouvoir être saisis.
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
  methodCode: string;
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
 */
const PONT_GROUPS = [
  {
    key: 'electrical',
    label: { fr: 'Installations électriques' },
    qualifier: 'Alimentation par câble',
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
    qualifier: 'Mécano-soudé',
    points: [
      { key: 'rails', label: { fr: 'Rails et poutres de roulement' }, expected: 'Aspect général satisfaisant' },
      { key: 'posts', label: { fr: 'Poteaux et corbeaux' }, expected: 'Aspect général satisfaisant' },
      { key: 'buffers', label: { fr: 'Butoirs amortisseurs' }, expected: 'En place, correctement fixés' },
    ],
  },
  {
    key: 'frame',
    label: { fr: 'Charpente' },
    qualifier: 'Poutre caisson',
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
    qualifier: 'Câble IWRC',
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
    qualifier: 'Boîtier pendentif',
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
    qualifier: 'Moteur, frein, réducteur, tambour rainuré',
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
    qualifier: 'Moteurs électriques asynchrones',
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
    qualifier: 'Moteurs électriques asynchrones',
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
    qualifier: 'Plaque constructeur',
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
  help: `Textes de référence : ${textes}`,
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
 * appareils, il ajoute la ville et l'interlocuteur rencontré sur place. Le
 * harnais seul ne demande pas d'interlocuteur.
 */
const accessoireClient = (textes: string, interlocuteur = true) => ({
  key: 'client',
  label: { fr: 'Références client' },
  type: 'keyvalue',
  repeatable: false,
  help: `Référence réglementaire : ${textes}`,
  fields: [
    { key: 'establishment', label: { fr: 'Établissement' }, type: 'ref', required: true, autofill: 'client', span: 6 },
    { key: 'address', label: { fr: 'Adresse' }, type: 'text', required: false, span: 6 },
    { key: 'city', label: { fr: 'Ville' }, type: 'text', required: false, span: 4 },
    { key: 'nature', label: { fr: 'Nature de la vérification' }, type: 'enum', required: true, options: ['Vérification générale périodique', 'Mise en service', 'Remise en service'], span: 4 },
    { key: 'location', label: { fr: 'Lieu d’intervention' }, type: 'ref', required: true, autofill: 'site', span: 4 },
    ...(interlocuteur
      ? [{ key: 'contact', label: { fr: 'Interlocuteur sur place' }, type: 'text', required: false, span: 4 }]
      : []),
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
  help: `Textes de référence : ${textes}`,
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
            { key: 'transducer', label: { fr: 'Traducteur', en: 'Transducer' }, type: 'text', required: true, span: 3 },
            { key: 'range', label: { fr: 'Distance', en: 'Range' }, type: 'number', required: true, unit: 'mm', span: 2 },
            { key: 'gain', label: { fr: 'Gain', en: 'Gain' }, type: 'number', required: true, unit: 'dB', decimals: 1, span: 2 },
            { key: 'transfer', label: { fr: 'Transfert', en: 'Correcting transfer' }, type: 'number', required: false, unit: 'dB', decimals: 1, span: 2 },
            { key: 'evaluation', label: { fr: 'Évaluation', en: 'Evaluation' }, type: 'number', required: false, unit: 'dB', decimals: 1, span: 1.5 },
            { key: 'detection', label: { fr: 'Détection', en: 'Detection' }, type: 'number', required: false, unit: 'dB', decimals: 1, span: 1.5 },
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
          help: 'Texte de référence : Arrêté viziriel du 09 septembre 1953.',
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
          help: 'Articles 281 à 291 du code du travail marocain ; arrêté n° 93-08 du 12 mai 2008. La mission ne couvre ni la conformité aux règles de conception, ni les mesures d’organisation.',
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
        accessoireClient(ARRETE_1953_CODE_TRAVAIL, false),
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
          help: 'Référence réglementaire : Code du travail marocain, art. 281 et 282 (maintien en état des équipements) ; EN 360.',
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
          help: 'Fait à Mohammedia.',
          signatories: [{ fr: 'Chef du service EILM' }],
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
            { key: 'dimensionsBefore', label: { fr: 'Dimensions avant meulage', en: 'Dimensions before grinding' }, type: 'number', required: false, unit: 'mm', decimals: 1, span: 1.5 },
            { key: 'lengthAfter', label: { fr: 'Longueur après meulage', en: 'Length after grinding' }, type: 'number', required: false, unit: 'mm', decimals: 1, span: 1.5 },
            { key: 'depthAfter', label: { fr: 'Profondeur après meulage', en: 'Depth after grinding' }, type: 'number', required: false, unit: 'mm', decimals: 1, span: 1.5 },
            { key: 'decision', label: { fr: 'Décision', en: 'Decision' }, type: 'enum', required: true, options: ['Conforme', 'Non conforme'], span: 1.5 },
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
            { key: 'mark', label: { fr: 'Repère soudure et film', en: 'Weld and film number' }, type: 'text', required: true, span: 2.5 },
            { key: 'thickness', label: { fr: 'Épaisseur métal de base', en: 'Base metal thickness' }, type: 'number', required: false, unit: 'mm', decimals: 2, span: 1.5 },
            { key: 'iqi', label: { fr: 'Ø I.Q.I. trou/fil', en: 'IQI hole/wire' }, type: 'text', required: false, span: 1.5 },
            { key: 'density', label: { fr: 'Densité moyenne', en: 'Average density' }, type: 'number', required: false, decimals: 2, span: 1.5 },
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
            { key: 'zone', label: { fr: 'Zone', en: 'Area' }, type: 'enum', required: true, options: ['A', 'B', 'C', 'D', 'E'], span: 1.5 },
            { key: 'point', label: { fr: 'Point', en: 'Point' }, type: 'number', required: true, span: 1.5 },
            { key: 'value', label: { fr: 'Dureté relevée', en: 'Measured hardness' }, type: 'number', required: true, decimals: 1, span: 2 },
            { key: 'comments', label: { fr: 'Observations', en: 'Comments' }, type: 'text', required: false, span: 2 },
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
