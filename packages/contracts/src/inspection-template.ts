/**
 * Schéma des formulaires d'inspection.
 *
 * 61 modèles ont été recensés dans le référentiel I2S (20 CND, 39 EILM, 2 CTC).
 * Aucun n'est codé en dur : chacun est décrit par ce schéma, stocké en base et
 * versionné. Voir docs/08-MOTEUR-TEMPLATES.md.
 */
import { z } from 'zod';

/* ── Paradigmes ───────────────────────────────────────────────── */

export const PARADIGMS = ['MEASUREMENT', 'CHECKLIST', 'CRITERIA'] as const;
export type Paradigm = (typeof PARADIGMS)[number];

export const PARADIGM_LABELS: Record<Paradigm, string> = {
  MEASUREMENT: 'Mesures et indications',
  CHECKLIST: 'Check-list réglementaire',
  CRITERIA: 'Critères d’acceptation',
};

/* ── Verdicts ─────────────────────────────────────────────────── */

/** Verdict d'un point de contrôle réglementaire, tel qu'il figure sur les formulaires EILM. */
export const CHECK_VERDICTS = ['SO', 'NA', 'C', 'NC'] as const;
export type CheckVerdict = (typeof CHECK_VERDICTS)[number];

export const CHECK_VERDICT_LABELS: Record<CheckVerdict, string> = {
  SO: 'Sans objet',
  NA: 'Non appliqué',
  C: 'Conforme',
  NC: 'Non conforme',
};

/** Décision portée sur une indication END. */
export const INDICATION_DECISIONS = ['V', 'NV', 'C', 'NC'] as const;

/* ── Champs ───────────────────────────────────────────────────── */

export const FIELD_TYPES = [
  'text',
  'textarea',
  'number',
  'date',
  'enum',
  'multi-enum',
  'boolean',
  'verdict',
  'ref',
  'photo',
  'signature',
  'device',
  'standard-ref',
  'formula',
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

/** Libellé bilingue — les formulaires END d'I2S sont en français et en anglais. */
export const labelSchema = z.object({
  fr: z.string().min(1),
  en: z.string().optional(),
});
export type BilingualLabel = z.infer<typeof labelSchema>;

export const fieldSchema = z.object({
  key: z.string().regex(/^[a-zA-Z][\w.-]*$/, 'Clé de champ invalide.'),
  label: labelSchema,
  type: z.enum(FIELD_TYPES),
  required: z.boolean().default(false),
  /** Pré-rempli depuis la mission : l'inspecteur ne ressaisit jamais l'en-tête. */
  autofill: z
    .enum([
      'client',
      'affairNumber',
      'site',
      'inspector',
      'inspectorLevel',
      'date',
      'procedure',
      'standards',
      'asset',
      'manufacturer',
      'reportNumber',
    ])
    .optional(),
  unit: z.string().max(16).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  decimals: z.number().int().min(0).max(6).optional(),
  /** Hors de cette plage, l'indication est signalée automatiquement. */
  tolerance: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
  options: z.array(z.string()).optional(),
  /**
   * Champ calculé : l'expression est résolue par le serveur à chaque
   * enregistrement (voir `@i2s/calc`), jamais saisie à la main.
   */
  formula: z.string().optional(),
  placeholder: z.string().optional(),
  help: z.string().optional(),
  /** Largeur en colonnes de grille (1 à 12) pour le rendu. */
  span: z.number().int().min(1).max(12).default(6),
});
export type TemplateField = z.infer<typeof fieldSchema>;

/* ── Sections ─────────────────────────────────────────────────── */

export const SECTION_TYPES = [
  'keyvalue',
  'devices',
  'conditions',
  'table',
  'checklist',
  'criteria',
  'photos',
  'verdict',
  'signature-matrix',
  'text',
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export const checklistPointSchema = z.object({
  key: z.string(),
  label: labelSchema,
  /** État attendu, imprimé en regard du point sur le formulaire papier. */
  expected: z.string().optional(),
});

export const checklistGroupSchema = z.object({
  key: z.string(),
  label: labelSchema,
  /** Précision d'équipement, ex. « ALIMENTATION PAR CÂBLE ». */
  qualifier: z.string().optional(),
  points: z.array(checklistPointSchema).min(1),
});

export const criterionSchema = z.object({
  key: z.string(),
  label: labelSchema,
  /** Référentiel de calcul opposable, ex. « BAEL 91 », « RPS 2011 ». */
  standards: z.array(z.string()).default([]),
});

export const sectionSchema = z.object({
  key: z.string().regex(/^[a-zA-Z][\w.-]*$/),
  label: labelSchema,
  type: z.enum(SECTION_TYPES),
  fields: z.array(fieldSchema).optional(),
  columns: z.array(fieldSchema).optional(),
  groups: z.array(checklistGroupSchema).optional(),
  criteria: z.array(criterionSchema).optional(),
  /** Issues exclusives d'une section de conclusion. */
  verdicts: z.array(labelSchema).optional(),
  /** Colonnes de la matrice de visas. */
  signatories: z.array(labelSchema).optional(),
  repeatable: z.boolean().default(false),
  minRows: z.number().int().min(0).optional(),
  maxRows: z.number().int().min(1).optional(),
  /** Aide à la saisie, pour l'inspecteur seulement : jamais imprimée. */
  help: z.string().optional(),
  /**
   * Mention imprimée sur le rapport sous le titre de la section — les textes
   * réglementaires visés, par exemple. Distincte de l'aide, qui peut porter
   * des consignes internes sans place dans un document remis au client.
   */
  reference: z.string().optional(),
});
export type TemplateSection = z.infer<typeof sectionSchema>;

/* ── Formulaire ───────────────────────────────────────────────── */

export const templateSchemaSchema = z.object({
  sections: z.array(sectionSchema).min(1),
});
export type TemplateSchema = z.infer<typeof templateSchemaSchema>;

/**
 * Le service d'un formulaire se lit dans son code QMS : PR01 CND, PR02 EILM,
 * PR03 CTC, PR04 QHSE. Il ne dépend donc pas de la méthode, qu'un compte
 * rendu général peut ne pas avoir.
 *
 * PR04 est une proposition pour les rapports de supervision HSE, qui n'ont
 * pas encore de processus au référentiel qualité : à confirmer par le QHSE.
 */
export function departmentOfForm(formCode: string): 'CND' | 'EILM' | 'CTC' | 'QHSE' | null {
  if (formCode.startsWith('PR01')) return 'CND';
  if (formCode.startsWith('PR02')) return 'EILM';
  if (formCode.startsWith('PR03')) return 'CTC';
  if (formCode.startsWith('PR04')) return 'QHSE';
  return null;
}

export const TEMPLATE_STATUSES = ['DRAFT', 'PUBLISHED', 'SUPERSEDED'] as const;
export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number];

export const TEMPLATE_STATUS_LABELS: Record<TemplateStatus, string> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publié',
  SUPERSEDED: 'Remplacé',
};

/**
 * Matrice de visas commune aux rapports d'essai END, relevée telle quelle sur
 * les formulaires PR01-F02 à F27.
 */
export const END_SIGNATORIES: BilingualLabel[] = [
  { fr: 'Examen effectué par', en: 'Examination carried on by' },
  { fr: 'Rapport établi par', en: 'Report established by' },
  { fr: 'Client / tierce partie', en: 'Customer / third party' },
  { fr: 'Client final', en: 'End customer' },
];

/**
 * En-tête commun à tous les formulaires END. Entièrement pré-rempli depuis la
 * mission — application directe du principe « une donnée, une seule saisie ».
 */
export const END_HEADER_FIELDS: TemplateField[] = [
  { key: 'client', label: { fr: 'Client', en: 'Customer' }, type: 'ref', required: true, autofill: 'client', span: 4 },
  { key: 'affairNumber', label: { fr: 'N° d’affaire', en: 'Transaction N°' }, type: 'ref', required: true, autofill: 'affairNumber', span: 4 },
  { key: 'procedure', label: { fr: 'Instruction de référence', en: 'Procedure N°' }, type: 'text', required: true, autofill: 'procedure', span: 4 },
  { key: 'manufacturer', label: { fr: 'Fabricant', en: 'Manufacturer' }, type: 'text', required: false, autofill: 'manufacturer', span: 4 },
  { key: 'place', label: { fr: 'Lieu de contrôle', en: 'Place of inspection' }, type: 'ref', required: true, autofill: 'site', span: 4 },
  { key: 'standard', label: { fr: 'Spécification applicable', en: 'Examination according to' }, type: 'standard-ref', required: true, autofill: 'standards', span: 4 },
  { key: 'drawing', label: { fr: 'Plan de référence', en: 'Drawing N°' }, type: 'text', required: false, span: 6 },
  { key: 'material', label: { fr: 'Matériel examiné', en: 'Material examined' }, type: 'ref', required: true, autofill: 'asset', span: 6 },
];
