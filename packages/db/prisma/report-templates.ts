/**
 * Formulaires d'inspection construits, saisissables dans l'application.
 *
 * Structures relevées une à une sur les modèles du référentiel I2S
 * (`05_PROCEDURES`), dont les fichiers Excel et Word font foi :
 *   PR01-F02  Examen par ultrasons                  → mesures et indications
 *   PR01-F04  Examen par ressuage                   → mesures et indications
 *   PR01-F05  Examen par magnétoscopie              → mesures et indications
 *   PR02-F40  Vérification périodique pont roulant  → check-list réglementaire
 *   PR03-F01  Rapport de contrôle technique         → critères d'acceptation
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
            { key: 'nature', label: { fr: 'Nature de l’intervention' }, type: 'enum', required: true, options: ['Vérification réglementaire périodique', 'Mise en service', 'Remise en service'], span: 6 },
            { key: 'date', label: { fr: 'Date de vérification' }, type: 'date', required: true, autofill: 'date', span: 6 },
          ],
        },
        {
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
        },
        {
          key: 'checks',
          label: { fr: 'Vérifications et inspections de l’appareil et de ses aménagements' },
          type: 'checklist',
          repeatable: false,
          help: 'SO : sans objet · NA : non appliqué · C : conforme · NC : non conforme',
          groups: [
            {
              key: 'electrical',
              label: { fr: 'Installations électriques' },
              qualifier: 'Alimentation par câble',
              points: [
                { key: 'protection-live', label: { fr: 'Protection contre les contacts directs avec les conducteurs nus sous tension' }, expected: 'Aspect général satisfaisant' },
                { key: 'lockable-isolator', label: { fr: 'Séparation générale verrouillable' }, expected: 'Bon fonctionnement' },
                { key: 'cabin-protection', label: { fr: 'Protection contre les contacts avec les pièces nues sous tension en cabine' }, expected: 'Aspect général satisfaisant' },
                { key: 'earthing', label: { fr: 'Mises à la terre des masses métalliques fixes ou mobiles' }, expected: 'Réalisées correctement' },
              ],
            },
            {
              key: 'structure',
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
          ],
        },
        {
          key: 'observations',
          label: { fr: 'Observations' },
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
          help: 'Un seul point de contrôle non conforme interdit la conclusion « sans réserve ».',
          verdicts: [
            { fr: 'Appareil apte au service sans réserve' },
            { fr: 'Appareil apte au service avec réserves à lever' },
            { fr: 'Appareil inapte au service nécessitant l’arrêt' },
          ],
        },
        {
          key: 'photos',
          label: { fr: 'Photographies' },
          type: 'photos',
          repeatable: true,
          minRows: 0,
        },
        {
          key: 'signatures',
          label: { fr: 'Visas' },
          type: 'signature-matrix',
          repeatable: false,
          signatories: [
            { fr: 'Vérification effectuée par' },
            { fr: 'Rapport vérifié par' },
            { fr: 'Représentant du client' },
          ],
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
];
