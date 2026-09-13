/**
 * ═══════════════════════════════════════════════════════════════════════
 *  SAISIES DE DÉMONSTRATION — CONTENU ENTIÈREMENT FICTIF
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Remplit un formulaire à partir de son propre schéma, quel que soit son
 * paradigme. Le jeu de démonstration a besoin de rapports qui s'ouvrent
 * vraiment : un rapport sans saisie ne peut ni se relire, ni repartir en
 * correction, et le circuit de vérification s'arrête au premier écran.
 *
 * Rien ici n'invente de règle métier : la fonction ne fait que produire des
 * valeurs plausibles pour les champs que le schéma déclare.
 */
import type { Random } from './fixtures';

interface Label {
  fr: string;
  en?: string;
}

interface Field {
  key: string;
  label: Label;
  type: string;
  required?: boolean;
  options?: string[];
  unit?: string;
  autofill?: string;
}

interface Section {
  key: string;
  label: Label;
  type: string;
  fields?: Field[];
  columns?: Field[];
  groups?: Array<{ key: string; label: Label; points: Array<{ key: string; label: Label }> }>;
  criteria?: Array<{ key: string; label: Label; standards?: string[] }>;
  verdicts?: Label[];
  repeatable?: boolean;
  minRows?: number;
  maxRows?: number;
}

interface Schema {
  sections?: Section[];
}

export interface FillContext {
  client: string;
  affairNumber: string;
  site: string | null;
  inspector: string;
  date: Date;
  /** Instruments rattachés à la saisie, déjà libellés. */
  deviceLabel: string;
  /** Un écart introduit volontairement pour alimenter les non-conformités. */
  withFinding: boolean;
}

/** Valeurs d'en-tête que le serveur recopie depuis la mission. */
function autofillValue(source: string, ctx: FillContext): string | undefined {
  switch (source) {
    case 'client':
      return ctx.client;
    case 'affairNumber':
      return ctx.affairNumber;
    case 'site':
      return ctx.site ?? undefined;
    case 'inspector':
      return ctx.inspector;
    case 'date':
      return ctx.date.toLocaleDateString('fr-FR');
    default:
      return undefined;
  }
}

const TEXT_BY_KEY: Record<string, string[]> = {
  procedure: ['PR01 indice 03', 'PR02 indice 02', 'PR03 indice 04'],
  standard: [
    'EN ISO 17640:2018 — technique B, niveau d’acceptation 2',
    'NM 10.1.008 — contrôle des bétons durcis',
    'Arrêté du 9 juin 1993 — appareils de levage',
  ],
  material: [
    'Soudure circonférentielle — acier S355J2, épaisseur 12 mm',
    'Virole de bac de stockage — acier A283 Gr.C, épaisseur 8 mm',
    'Poutre de roulement — profilé HEB 300',
  ],
  manufacturer: ['CHAUDRONNERIE ATLAS', 'ATELIERS MÉCANIQUES DU DÉTROIT', 'STRUCTURES MAGHREB'],
  drawing: ['PL-2026-114 rév. B', 'PL-2026-207 rév. A', 'DS-441 rév. C'],
  block: ['V1 (ISO 2400)', 'V2 (ISO 7963)', 'Bloc à gradins 5-50 mm'],
  referenceBlock: ['V2 (ISO 7963)', 'Bloc étalon n° BE-118'],
  hole: ['Ø 3 mm à 15 mm de fond', 'Ø 2 mm à 25 mm de fond'],
  notch: ['Entaille 10 × 1 mm', 'Entaille 20 × 2 mm'],

  // Contrôle technique de construction (PR03-F01)
  project: [
    'Îlot résidentiel R+6 — 4 immeubles sur sous-sol commun',
    'Hangar industriel charpente métallique — portée 24 m',
    'Réservoir surélevé en béton armé — 500 m³',
  ],
  activities: [
    'Examen des notes de calcul et des plans de coffrage, visite de chantier au stade des fondations.',
    'Vérification de la conformité du ferraillage avant coulage, contrôle des enrobages.',
    'Examen du complexe d’étanchéité et des relevés en toiture-terrasse.',
  ],
  externalDeliverables: [
    'Rapport de sol LPEE n° 2026-118 ; notes de calcul BET STRUCTURA indice C.',
    'Étude géotechnique G2 AVP ; plans d’exécution BET ARCHIMED indice B.',
  ],
  observations: [
    'Aucune réserve bloquante à ce stade ; les points relevés sont repris au procès-verbal de visite.',
    'Les réserves émises lors de la visite précédente ont été levées.',
  ],

  // Appareils de levage (PR02-F40)
  type: ['Pont roulant bipoutre', 'Pont roulant monopoutre suspendu', 'Portique de manutention'],
  capacity: ['10 t', '16 t', '5 t', '32 t'],
  year: ['2014', '2018', '2009', '2021'],
  brand: ['DEMAG', 'ABUS', 'KONECRANES', 'STAHL'],
};

function textFor(field: Field, ctx: FillContext, rng: Random): string {
  const pool = TEXT_BY_KEY[field.key];
  if (pool) return rng.pick(pool);

  // À défaut d'un vocabulaire connu, une valeur courte et lisible vaut mieux
  // qu'un « lorem ipsum » que personne ne saurait interpréter en démonstration.
  return `${field.label.fr} — relevé du ${ctx.date.toLocaleDateString('fr-FR')}`;
}

function fieldValue(field: Field, ctx: FillContext, rng: Random): unknown {
  const autofilled = field.autofill ? autofillValue(field.autofill, ctx) : undefined;
  if (autofilled !== undefined) return autofilled;

  switch (field.type) {
    case 'device':
      return ctx.deviceLabel;
    case 'number':
      return rng.int(1, 60);
    case 'boolean':
      return true;
    case 'date':
      return ctx.date.toISOString().slice(0, 10);
    case 'enum':
      return field.options?.length ? rng.pick(field.options) : null;
    case 'multi-enum':
      return field.options?.length ? [rng.pick(field.options)] : [];
    case 'verdict':
      return ctx.withFinding ? 'NC' : 'C';
    case 'photo':
    case 'signature':
    case 'formula':
      return null;
    default:
      return textFor(field, ctx, rng);
  }
}

function tableRows(section: Section, ctx: FillContext, rng: Random): Array<Record<string, unknown>> {
  const min = Math.max(section.minRows ?? 1, 1);
  const max = Math.min(section.maxRows ?? min + 1, min + 2);
  const count = rng.int(min, Math.max(min, max));

  return Array.from({ length: count }, () => {
    const row: Record<string, unknown> = {};
    for (const column of section.columns ?? []) {
      row[column.key] = fieldValue(column, ctx, rng);
    }
    return row;
  });
}

/**
 * Produit le contenu d'une saisie conforme au schéma du formulaire.
 *
 * `withFinding` place un seul écart, sur le premier point de contrôle
 * rencontré : c'est ce qui alimente les rapports renvoyés en correction et les
 * non-conformités, sans rendre la saisie illisible.
 */
export function fillInspection(
  schema: Schema,
  ctx: FillContext,
  rng: Random,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  let findingPlaced = false;

  for (const section of schema.sections ?? []) {
    switch (section.type) {
      case 'table': {
        data[section.key] = tableRows(section, ctx, rng);
        break;
      }

      case 'checklist': {
        const record: Record<string, string> = {};
        for (const group of section.groups ?? []) {
          for (const point of group.points) {
            if (ctx.withFinding && !findingPlaced) {
              record[point.key] = 'NC';
              findingPlaced = true;
            } else {
              record[point.key] = rng.chance(0.08) ? 'SO' : 'C';
            }
          }
        }
        data[section.key] = record;
        break;
      }

      case 'criteria': {
        const record: Record<string, { applicable: boolean; conform: boolean | null }> = {};
        for (const criterion of section.criteria ?? []) {
          if (ctx.withFinding && !findingPlaced) {
            record[criterion.key] = { applicable: true, conform: false };
            findingPlaced = true;
          } else {
            record[criterion.key] = { applicable: true, conform: true };
          }
        }
        data[section.key] = record;
        break;
      }

      case 'verdict': {
        const verdicts = section.verdicts ?? [];
        if (verdicts.length === 0) break;
        // Un écart interdit une conclusion « sans réserve » : on prend alors la
        // dernière issue proposée, qui est la plus restrictive des formulaires.
        data[section.key] = ctx.withFinding
          ? (verdicts[verdicts.length - 1]?.fr ?? null)
          : (verdicts[0]?.fr ?? null);
        break;
      }

      case 'photos':
      case 'signature-matrix':
        break;

      default: {
        const record: Record<string, unknown> = {};
        for (const field of section.fields ?? []) {
          const value = fieldValue(field, ctx, rng);
          if (value !== null) record[field.key] = value;
        }
        if (Object.keys(record).length > 0) data[section.key] = record;
      }
    }
  }

  return data;
}
