import { describe, expect, it } from 'vitest';
import {
  ACTIONABLE_LOST_CAUSES,
  LOST_CAUSES,
  LOST_CAUSE_LABELS,
  OPPORTUNITY_STAGES,
  STAGE_LABELS,
  STAGE_PROBABILITY,
  followUpSchema,
  loseSchema,
  offerSchema,
  opportunitySchema,
  opportunityUpdateSchema,
  startOfDay,
  tenderSchema,
} from './commercial.service';

/** Premier message de refus, celui que l'écran affiche. */
function refusal(result: { success: boolean; error?: { issues: Array<{ message: string }> } }) {
  return result.success ? null : (result.error?.issues[0]?.message ?? null);
}

describe('tunnel commercial', () => {
  it('nomme chaque étape en français, sans en oublier', () => {
    // Les libellés voyagent avec la liste : l'écran n'invente aucun mot.
    for (const stage of OPPORTUNITY_STAGES) {
      expect(STAGE_LABELS[stage], `étape ${stage} sans libellé`).toBeTruthy();
      expect(STAGE_PROBABILITY[stage], `étape ${stage} sans probabilité`).toBeTypeOf('number');
    }
  });

  it('pondère le pipeline dans le sens de l’avancement', () => {
    // Une consultation ne vaut pas une offre envoyée, qui ne vaut pas une
    // négociation : sans cette progression, le pipeline pondéré ne dit rien.
    const ouvertes = OPPORTUNITY_STAGES.filter((s) => s !== 'WON' && s !== 'LOST');

    for (let i = 1; i < ouvertes.length; i += 1) {
      expect(
        STAGE_PROBABILITY[ouvertes[i]],
        `${ouvertes[i]} devrait valoir plus que ${ouvertes[i - 1]}`,
      ).toBeGreaterThan(STAGE_PROBABILITY[ouvertes[i - 1]]);
    }

    expect(STAGE_PROBABILITY.WON).toBe(100);
    expect(STAGE_PROBABILITY.LOST).toBe(0);
  });

  it('refuse une offre sans ligne', () => {
    // Le montant d'une offre se calcule sur ses lignes. Sans ligne, il n'y a
    // pas de montant à défendre devant le client.
    expect(refusal(offerSchema.safeParse({ lines: [] }))).toBe(
      'Une offre sans ligne n’a pas de montant.',
    );
  });

  it('refuse une ligne d’offre sans quantité', () => {
    const sansQuantite = offerSchema.safeParse({
      lines: [{ designation: 'Contrôle par ultrasons', quantity: 0, unitPrice: 1800 }],
    });
    expect(refusal(sansQuantite)).toBe('La quantité doit être positive.');

    const negative = offerSchema.safeParse({
      lines: [{ designation: 'Contrôle par ultrasons', quantity: -3, unitPrice: 1800 }],
    });
    expect(negative.success).toBe(false);
  });

  it('accepte une ligne d’offre complète et convertit les nombres saisis', () => {
    // Un formulaire HTML envoie des chaînes : le schéma les convertit, sinon
    // le montant serait calculé sur du texte.
    const parsed = offerSchema.parse({
      lines: [
        { designation: 'Contrôle par ultrasons', unit: 'vacation', quantity: '12', unitPrice: '1800' },
      ],
    });

    expect(parsed.lines[0].quantity).toBe(12);
    expect(parsed.lines[0].unitPrice).toBe(1800);
  });

  it('exige une référence d’appel d’offres', () => {
    // Sans référence, le dossier n'est pas retrouvable chez l'émetteur.
    expect(refusal(tenderSchema.safeParse({ reference: '  ' }))).toBe(
      'La référence de l’appel d’offres est obligatoire.',
    );
    expect(tenderSchema.safeParse({ reference: 'AO 42/2026' }).success).toBe(true);
  });

  it('exige de dire ce que la relance a donné', () => {
    // Une relance sans compte rendu n'apprend rien au dossier.
    expect(refusal(followUpSchema.safeParse({ outcome: 'ok' }))).toBe(
      'Notez ce que la relance a donné.',
    );
    expect(followUpSchema.safeParse({ outcome: 'Décision reportée au comité.' }).success).toBe(true);
  });

  it('exige de décrire l’opportunité', () => {
    expect(
      refusal(
        opportunitySchema.safeParse({ clientId: '01a07b42-6e07-7fb0-9909-f65731eb71a3', title: 'x' }),
      ),
    ).toBe('Décrivez l’opportunité.');
  });

  it('interdit de changer de client en cours de route', () => {
    // Une opportunité appartient à un client : la déplacer fausserait
    // l'historique commercial des deux.
    expect('clientId' in opportunityUpdateSchema.shape).toBe(false);
    expect('stage' in opportunityUpdateSchema.shape).toBe(true);
  });

  it('borne la probabilité saisie à la main entre 0 et 100', () => {
    const trop = opportunitySchema.safeParse({
      clientId: '01a07b42-6e07-7fb0-9909-f65731eb71a3',
      title: 'Requalification des équipements sous pression',
      probability: 140,
    });
    expect(trop.success).toBe(false);
  });

  it('refuse une perte sans cause ni motif', () => {
    // Une perte non expliquée sort de l'analyse : on ne saurait plus si le
    // problème vient des prix, des délais ou des références.
    expect(refusal(loseSchema.safeParse({ reason: 'Trop cher' }))).toBe(
      'Indiquez la cause de la perte.',
    );
    expect(refusal(loseSchema.safeParse({ cause: 'PRIX', reason: '  ' }))).toContain(
      'Le motif est obligatoire',
    );
    expect(
      loseSchema.safeParse({ cause: 'PRIX', reason: 'Écart de 12 % avec le concurrent retenu.' })
        .success,
    ).toBe(true);
  });

  it('refuse une cause de perte inventée', () => {
    // Les causes viennent du serveur : un écran ne peut pas en créer une
    // nouvelle, sinon les totaux de l'année ne s'additionnent plus.
    expect(loseSchema.safeParse({ cause: 'PAS_DE_CHANCE', reason: 'Perdu de peu.' }).success).toBe(
      false,
    );
  });

  it('nomme chaque cause de perte, et sait celles sur lesquelles agir', () => {
    for (const cause of LOST_CAUSES) {
      expect(LOST_CAUSE_LABELS[cause], `cause ${cause} sans libellé`).toBeTruthy();
    }

    // Un projet abandonné par le client n'est pas une contre-performance
    // commerciale : le compter comme telle fausserait la lecture.
    expect(ACTIONABLE_LOST_CAUSES).not.toContain('PROJET_ABANDONNE');
    expect(ACTIONABLE_LOST_CAUSES).not.toContain('CONCURRENT_EN_PLACE');
    expect(ACTIONABLE_LOST_CAUSES).toContain('PRIX');
    expect(ACTIONABLE_LOST_CAUSES.every((c) => LOST_CAUSES.includes(c))).toBe(true);
  });

  it('ramène une date au début du jour, en UTC', () => {
    // Les échéances se comparent en jours entiers : une remise des offres au
    // 14 septembre l'est jusqu'à minuit, quelle que soit l'heure de la saisie.
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    expect(iso(startOfDay(new Date('2026-09-14T23:30:00.000Z')))).toBe('2026-09-14');
    expect(iso(startOfDay(new Date('2026-09-14T00:00:00.000Z')))).toBe('2026-09-14');
  });
});
