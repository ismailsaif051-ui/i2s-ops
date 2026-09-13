import { describe, expect, it } from 'vitest';
import {
  NATURE_LABELS,
  NATURE_SECTIONS,
  type OfferBrief,
  PROMPT_VERSION,
  SECTIONS,
  parseSections,
  systemPrompt,
  userPrompt,
} from './offer-drafting.prompt';
import { OFFER_NATURES, draftSchema } from './offer-drafting.types';

const brief: OfferBrief = {
  client: { name: 'PETROMED TERMINAL', sector: 'Stockage pétrolier', city: 'Mohammedia' },
  title: 'Inspection périodique des bacs de stockage',
  description: 'Arrêt programmé du dépôt en mars.',
  department: { code: 'CND', name: 'Contrôle Non Destructif & Pression' },
  tender: {
    reference: 'AO 12/2026 — PMT',
    publisher: 'PETROMED TERMINAL — Achats',
    submissionDeadline: '2026-10-15',
  },
  lines: [
    { designation: 'Mesure d’épaisseur par ultrasons', unit: 'vacation', quantity: 40 },
    { designation: 'Ressuage sur piquages', unit: 'vacation', quantity: 12 },
  ],
  certifications: [{ type: 'COFREND', method: 'UT', level: '2', count: 3 }],
  devices: [{ type: 'Ultrasons', count: 4 }],
  paymentTerms: 60,
  validUntil: '2026-12-01',
};

describe('rédaction assistée des offres', () => {
  it('nomme chaque nature de document et lui donne ses sections', () => {
    for (const nature of OFFER_NATURES) {
      expect(NATURE_LABELS[nature], `nature ${nature} sans libellé`).toBeTruthy();
      expect(NATURE_SECTIONS[nature].length, `nature ${nature} sans section`).toBeGreaterThan(0);

      for (const key of NATURE_SECTIONS[nature]) {
        expect(SECTIONS[key], `section ${key} inconnue`).toBeTruthy();
      }
    }
  });

  it('tient les prix hors de l’offre technique', () => {
    // Une offre technique se juge sur la méthode, pas sur le prix : les deux
    // documents partent souvent dans deux plis séparés.
    expect(NATURE_SECTIONS.TECHNIQUE).not.toContain('conditions');
    expect(NATURE_SECTIONS.TECHNIQUE).not.toContain('contenu');
    expect(NATURE_SECTIONS.TECHNICO_COMMERCIALE).toContain('conditions');
  });

  it('interdit au modèle d’écrire un chiffre ou d’inventer une qualification', () => {
    // Ce sont les deux risques réels : un prix faux sur un document client, et
    // une accréditation annoncée que I2S ne détient pas.
    const system = systemPrompt('TECHNICO_COMMERCIALE');

    expect(system).toContain('N’écris JAMAIS un montant');
    expect(system).toContain('N’annonce AUCUNE qualification');
    expect(system).toContain('relue et corrigée par un ingénieur');
  });

  it('ne remet au modèle que des faits, jamais les prix', () => {
    const prompt = userPrompt('TECHNICO_COMMERCIALE', brief);

    // Les quantités servent à dimensionner la méthode ; les prix restent au
    // tableau, construit à partir de la base.
    expect(prompt).toContain('40 vacation');
    expect(prompt).toContain('COFREND UT niveau 2 : 3 agent(s)');
    expect(prompt).toContain('Ultrasons : 4 instrument(s) étalonné(s)');
    expect(prompt).toContain('AO 12/2026 — PMT');
    expect(prompt).not.toMatch(/prix unitaire|P\.U\.|DH/);
  });

  it('dit au modèle qu’il s’agit d’une consultation directe quand il n’y a pas d’appel d’offres', () => {
    const prompt = userPrompt('COMMERCIALE', { ...brief, tender: null });

    expect(prompt).toContain('CONSULTATION DIRECTE');
    expect(prompt).not.toContain('AO 12/2026');
  });

  it('signale au modèle ce que le service ne détient pas', () => {
    // Mieux vaut « aucune habilitation enregistrée » qu'un silence : le modèle
    // ne doit pas combler le vide par une qualification imaginaire.
    const prompt = userPrompt('TECHNIQUE', { ...brief, certifications: [], devices: [] });

    expect(prompt).toContain('aucune habilitation enregistrée');
    expect(prompt).toContain('aucun instrument étalonné');
  });

  it('lit la réponse du modèle même encadrée de texte', () => {
    const raw = `Voici le document.
{"objet":"Contrôle des bacs.","comprehension":"Arrêt de mars.","contenu":"Deux postes.","planning":"Six vacations.","conditions":"Règlement à 60 jours.","hypotheses":"Hors échafaudage."}
Bonne lecture.`;

    const sections = parseSections(raw, 'COMMERCIALE');

    expect(Object.keys(sections)).toEqual(NATURE_SECTIONS.COMMERCIALE);
    expect(sections.objet).toBe('Contrôle des bacs.');
  });

  it('écarte les clés que le modèle ajouterait de lui-même', () => {
    // Une clé inattendue n'entrera pas dans le document du client.
    const raw =
      '{"objet":"A","comprehension":"B","contenu":"C","planning":"D","conditions":"E","hypotheses":"F","prixTotal":"1 200 000 DH"}';

    const sections = parseSections(raw, 'COMMERCIALE');

    expect(sections).not.toHaveProperty('prixTotal');
    expect(Object.keys(sections)).toEqual(NATURE_SECTIONS.COMMERCIALE);
  });

  it('refuse une réponse vide ou illisible', () => {
    expect(() => parseSections('désolé, je ne peux pas', 'TECHNIQUE')).toThrow(
      /pas renvoyé de texte exploitable/,
    );
    expect(() => parseSections('{ pas du json }', 'TECHNIQUE')).toThrow(/mal formé/);
    expect(() => parseSections('{"autre":"x"}', 'TECHNIQUE')).toThrow(/aucune section/);
  });

  it('complète les sections manquantes par du vide, jamais par du remplissage', () => {
    // Une section absente doit rester visiblement vide : la relecture la
    // refusera, plutôt que de laisser passer un texte inventé.
    const sections = parseSections('{"objet":"Contrôle des bacs."}', 'TECHNIQUE');

    expect(sections.objet).toBe('Contrôle des bacs.');
    expect(sections.methodologie).toBe('');
  });

  it('refuse une nature inventée', () => {
    expect(draftSchema.safeParse({ nature: 'POETIQUE' }).success).toBe(false);
    expect(draftSchema.safeParse({ nature: 'TECHNIQUE' }).success).toBe(true);
  });

  it('marque la version du cadrage', () => {
    // Enregistrée avec chaque texte : quand la consigne change, on sait quels
    // documents ont été rédigés avec l'ancienne.
    expect(PROMPT_VERSION).toMatch(/^offre-v\d+$/);
  });
});
