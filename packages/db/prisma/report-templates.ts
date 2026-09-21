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
 *
 * Les six formulaires END du lot L1 sont couverts, ainsi que l’ensemble des
 * formulaires EILM.
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
  help: `Référence réglementaire : ${textes}`,
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
          help: 'Code du travail, art. 281 et 282 ; essais selon l’annexe A de la NF EN 795:2012 (hors dispositifs de types B et E) ; règlements (UE) 2016/425 et 305/2011, décision déléguée (UE) 2018/771.',
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
          help: 'Référence réglementaire : arrêté viziriel du 09/09/1953 et arrêté du 03/11/1953.',
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
          help: 'I2S TESTING, organisme vérificateur agréé, déclare avoir vérifié l’installation électrique du risque déclaré par l’assuré, que cette vérification a donné lieu à un rapport détaillé remis à l’assuré, qu’elle n’a révélé aucune non-conformité majeure à la réglementation marocaine, et atteste que l’installation est conforme aux textes visés. Attestation établie pour servir et valoir ce que de droit.',
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
          help: 'Contrôle du système de protection cathodique des canalisations enterrées.',
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
          help: 'Fait à Mohammedia.',
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
          help: 'Vérification effectuée en application de l’arrêté du 28 juin 1938 (protection des travailleurs), des arrêtés du 15/07/1967 et du 02/10/1971 (installations de 1re et 2e catégories), du décret n° 2-22-630 du 17/11/2022 et de l’arrêté n° 2538-23 du 11/10/2023. Normes NM 06-1-102 à 106, NM 06-1-028, NM 06-1-040 ; NF C 15-100, NF C 13-100, NF C 13-200, ou leurs équivalences.',
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
          help: 'Article 6 de l’arrêté du 7 septembre 1954 modifiant l’arrêté du 9 avril 1953. Vérification générale périodique : examen de l’état de conservation avec essais de fonctionnement.',
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
          help: 'Toujours visés : article 6 de l’arrêté du 7 septembre 1954 modifiant l’arrêté du 9 avril 1953 ; décret n° 2-14-499 sur la sécurité incendie des constructions (ascenseurs en immeuble de grande hauteur). Cocher les textes supplémentaires.',
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
          help: 'Fait à Mohammedia.',
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
