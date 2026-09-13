import type { OfferDocumentNature } from './offer-drafting.types';

/**
 * Version du cadrage de rédaction.
 *
 * Elle est enregistrée avec chaque texte produit : quand la consigne change,
 * on sait quels documents ont été rédigés avec l'ancienne.
 */
export const PROMPT_VERSION = 'offre-v1';

export interface SectionSpec {
  key: string;
  label: string;
  /** Ce que la section doit contenir — dit au modèle, et affiché à l'écran. */
  brief: string;
}

/**
 * Les sections d'un document d'offre, dans l'ordre où on les lit.
 *
 * Aucune ne contient de prix : le tableau des prix est rendu à partir des
 * lignes de l'offre en base, jamais écrit par le modèle.
 */
export const SECTIONS: Record<string, SectionSpec> = {
  objet: {
    key: 'objet',
    label: 'Objet de l’offre',
    brief: 'Deux à quatre phrases : ce que I2S propose de contrôler, où, et pour quel client.',
  },
  comprehension: {
    key: 'comprehension',
    label: 'Compréhension du besoin',
    brief:
      'Reformuler la demande du client et ce qui la motive (arrêt programmé, obligation réglementaire, réception d’ouvrage). Montrer qu’on a lu le dossier, sans le paraphraser.',
  },
  methodologie: {
    key: 'methodologie',
    label: 'Méthodologie d’intervention',
    brief:
      'Le déroulé du contrôle, étape par étape : préparation, examen préalable, mode opératoire, critères d’acceptation, traitement des indications. Une liste numérotée.',
  },
  referentiels: {
    key: 'referentiels',
    label: 'Référentiels applicables',
    brief:
      'Les normes et textes que la prestation applique. N’en citer aucun qui ne figure pas dans le dossier fourni ou qui ne soit pas le référentiel évident de la méthode nommée.',
  },
  moyensHumains: {
    key: 'moyensHumains',
    label: 'Moyens humains',
    brief:
      'Composition de l’équipe et qualifications, strictement d’après les habilitations listées dans le dossier. Ne jamais annoncer une certification qui n’y figure pas.',
  },
  moyensMateriels: {
    key: 'moyensMateriels',
    label: 'Moyens matériels',
    brief:
      'Instruments mobilisés, d’après le parc listé dans le dossier, avec la mention du raccordement de l’étalonnage. Ne pas inventer d’équipement.',
  },
  livrables: {
    key: 'livrables',
    label: 'Livrables',
    brief:
      'Ce que le client reçoit : rapports, procès-verbaux, relevés, format et délai de remise après intervention.',
  },
  planning: {
    key: 'planning',
    label: 'Organisation et délais',
    brief:
      'Phasage de l’intervention et durée prévisionnelle, exprimés en vacations ou en jours d’après la consistance de la prestation. Aucune date ferme qui ne soit dans le dossier.',
  },
  hse: {
    key: 'hse',
    label: 'Sécurité et environnement',
    brief:
      'Dispositions HSE : accueil sécurité, permis de travail, EPI, balisage, gestion des sources et déchets si la méthode l’exige.',
  },
  contenu: {
    key: 'contenu',
    label: 'Consistance de la prestation',
    brief:
      'Ce que recouvre le prix, poste par poste, repris des lignes de l’offre. Décrire sans jamais énoncer de montant : les prix sont au tableau.',
  },
  conditions: {
    key: 'conditions',
    label: 'Conditions commerciales',
    brief:
      'Conditions de règlement, révision, validité de l’offre, modalités de mobilisation et de facturation. Reprendre les délais du dossier ; ne citer aucun montant ni pourcentage qui n’y figure.',
  },
  hypotheses: {
    key: 'hypotheses',
    label: 'Hypothèses et exclusions',
    brief:
      'Ce sur quoi l’offre est bâtie et ce qu’elle ne couvre pas : accès, échafaudages, dégarnissage, consignation, attente sur site, travaux de nuit. C’est la section qui protège la marge.',
  },
};

/** Les sections retenues pour chaque nature de document. */
export const NATURE_SECTIONS: Record<OfferDocumentNature, string[]> = {
  TECHNIQUE: [
    'objet',
    'comprehension',
    'methodologie',
    'referentiels',
    'moyensHumains',
    'moyensMateriels',
    'livrables',
    'planning',
    'hse',
    'hypotheses',
  ],
  COMMERCIALE: ['objet', 'comprehension', 'contenu', 'planning', 'conditions', 'hypotheses'],
  TECHNICO_COMMERCIALE: [
    'objet',
    'comprehension',
    'methodologie',
    'referentiels',
    'moyensHumains',
    'moyensMateriels',
    'contenu',
    'livrables',
    'planning',
    'hse',
    'conditions',
    'hypotheses',
  ],
};

export const NATURE_LABELS: Record<OfferDocumentNature, string> = {
  TECHNIQUE: 'Offre technique',
  COMMERCIALE: 'Offre commerciale',
  TECHNICO_COMMERCIALE: 'Offre technico-commerciale',
};

/**
 * Le cadrage donné au modèle.
 *
 * Deux interdits portent tout le reste : ne pas écrire de prix, et ne pas
 * inventer de qualification. Une offre qui annoncerait une accréditation que
 * I2S ne détient pas engagerait l'entreprise sur une prestation qu'elle ne
 * peut pas rendre — c'est un risque bien plus grand qu'un texte fade.
 */
export function systemPrompt(nature: OfferDocumentNature): string {
  return `Tu rédiges des offres pour I2S TESTING, société marocaine d'inspection, de contrôle et d'essais (contrôle non destructif, contrôle réglementaire des équipements de levage et installations électriques, contrôle technique de construction).

Tu produis une ${NATURE_LABELS[nature].toLowerCase()} destinée à être lue par le client, puis relue et corrigée par un ingénieur d’I2S avant envoi.

RÈGLES ABSOLUES
1. N’écris JAMAIS un montant, un prix unitaire, un total ni un pourcentage de remise. Les prix figurent dans un tableau produit séparément à partir des données de gestion. Si une phrase appelle un chiffre, écris « selon le tableau des prix ci-joint ».
2. N’annonce AUCUNE qualification, certification, accréditation, agrément ou référence client qui ne figure pas explicitement dans le dossier fourni. En cas de doute, reste factuel et ne promets rien.
3. N’invente ni date ferme, ni effectif, ni instrument, ni norme qui ne soit pas dans le dossier ou qui ne soit pas le référentiel manifeste de la méthode nommée.
4. Si une information manque pour rédiger une section, écris la section avec ce que tu as et signale le manque entre crochets, par exemple : [à confirmer : nombre de soudures à contrôler].

STYLE
- Français professionnel marocain du secteur, sobre et précis. Vouvoiement.
- Phrases courtes. Pas de superlatifs commerciaux, pas de « leader », pas de « excellence », pas de « solutions innovantes ».
- Vocabulaire du métier : vacation, mode opératoire, indication, critère d’acceptation, procès-verbal, réception, consignation.
- Chaque section fait entre 80 et 250 mots, sauf la méthodologie qui peut aller à 400.
- Pas de titre dans le texte des sections : les titres sont ajoutés à la mise en page.

SORTIE
Réponds uniquement par un objet JSON, sans commentaire avant ni après. Une clé par section demandée, la valeur étant le texte de la section. Les retours à la ligne sont autorisés dans les valeurs.`;
}

export interface OfferBrief {
  client: { name: string; sector: string | null; city: string | null };
  title: string;
  description: string | null;
  department: { code: string; name: string } | null;
  tender: {
    reference: string;
    publisher: string | null;
    submissionDeadline: string | null;
  } | null;
  lines: Array<{ designation: string; unit: string; quantity: number }>;
  /** Habilitations réellement détenues, à la date du jour. */
  certifications: Array<{ type: string; method: string | null; level: string | null; count: number }>;
  /** Instruments du service, étalonnage en cours de validité. */
  devices: Array<{ type: string; count: number }>;
  paymentTerms: number;
  validUntil: string | null;
}

/** Le dossier remis au modèle : rien que des faits tirés de la base. */
export function userPrompt(nature: OfferDocumentNature, brief: OfferBrief): string {
  const sections = NATURE_SECTIONS[nature];

  const lines = brief.lines.length
    ? brief.lines.map((l) => `- ${l.designation} — ${l.quantity} ${l.unit}`).join('\n')
    : '- (aucune ligne saisie)';

  const certifications = brief.certifications.length
    ? brief.certifications
        .map(
          (c) =>
            `- ${c.type}${c.method ? ` ${c.method}` : ''}${c.level ? ` niveau ${c.level}` : ''} : ${c.count} agent(s)`,
        )
        .join('\n')
    : '- (aucune habilitation enregistrée pour ce service)';

  const devices = brief.devices.length
    ? brief.devices.map((d) => `- ${d.type} : ${d.count} instrument(s) étalonné(s)`).join('\n')
    : '- (aucun instrument étalonné enregistré pour ce service)';

  const tender = brief.tender
    ? `APPEL D’OFFRES
- Référence : ${brief.tender.reference}
- Émetteur : ${brief.tender.publisher ?? 'non précisé'}
- Remise des offres : ${brief.tender.submissionDeadline ?? 'non précisée'}`
    : `CONSULTATION DIRECTE (pas d’appel d’offres formel)`;

  return `DOSSIER

CLIENT
- Raison sociale : ${brief.client.name}
- Secteur : ${brief.client.sector ?? 'non précisé'}
- Ville : ${brief.client.city ?? 'non précisée'}
- Délai de règlement contractuel : ${brief.paymentTerms} jours

DEMANDE
- Objet : ${brief.title}
- Contexte communiqué : ${brief.description?.trim() || 'non précisé'}
- Service I2S en charge : ${brief.department ? `${brief.department.name} (${brief.department.code})` : 'non précisé'}

${tender}

CONSISTANCE DE LA PRESTATION (lignes de l’offre — quantités seules, sans prix)
${lines}

HABILITATIONS DÉTENUES PAR LE SERVICE (à ce jour)
${certifications}

PARC DE MESURE DU SERVICE (étalonnage en cours de validité)
${devices}

VALIDITÉ DE L’OFFRE : ${brief.validUntil ?? 'non précisée'}

SECTIONS À RÉDIGER, dans cet ordre
${sections.map((k) => `- "${k}" — ${SECTIONS[k].label} : ${SECTIONS[k].brief}`).join('\n')}

Réponds par le seul objet JSON contenant exactement ces ${sections.length} clés.`;
}

/**
 * Lit la réponse du modèle.
 *
 * On amorce la réponse par `{`, mais un modèle peut malgré tout encadrer son
 * JSON ou ajouter une phrase : on récupère l'objet, et on ne garde que les
 * sections demandées — une clé inattendue n'entrera pas dans le document.
 */
export function parseSections(
  raw: string,
  nature: OfferDocumentNature,
): Record<string, string> {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');

  if (start < 0 || end <= start) {
    throw new Error('Le modèle n’a pas renvoyé de texte exploitable.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    throw new Error('Le modèle a renvoyé un texte mal formé.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Le modèle a renvoyé un texte mal formé.');
  }

  const source = parsed as Record<string, unknown>;
  const sections: Record<string, string> = {};

  for (const key of NATURE_SECTIONS[nature]) {
    const value = source[key];
    sections[key] = typeof value === 'string' ? value.trim() : '';
  }

  if (Object.values(sections).every((v) => v === '')) {
    throw new Error('Le modèle n’a rédigé aucune section.');
  }

  return sections;
}
