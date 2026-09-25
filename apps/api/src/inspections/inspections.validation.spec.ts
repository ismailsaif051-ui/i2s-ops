import { describe, expect, it } from 'vitest';
import { TEMPLATES } from '../../../../packages/db/prisma/report-templates';
import { InspectionsService } from './inspections.service';

/**
 * La validation est le dernier filet avant qu'un rapport ne parte en
 * vérification. Elle est ici éprouvée sur les formulaires du référentiel
 * eux-mêmes, et non sur un schéma d'exemple : un formulaire ajouté demain
 * entre dans ce test sans qu'on y touche.
 *
 * Deux exigences se répondent : une saisie complète doit passer — sinon
 * l'inspecteur est bloqué sur le terrain sans savoir pourquoi — et une
 * saisie vide doit être retenue, section par section.
 */

type Champ = { key: string; type: string; required?: boolean; options?: string[] };
type Section = {
  key: string;
  type: string;
  fields?: Champ[];
  columns?: Champ[];
  minRows?: number;
  groups?: Array<{ points: Array<{ key: string }> }>;
  verdicts?: Array<{ fr: string }>;
  criteria?: Array<{ key: string }>;
};

function valeur(champ: Champ): unknown {
  switch (champ.type) {
    case 'number': return 12;
    case 'boolean': return true;
    case 'date': return '2026-09-21';
    case 'enum': return champ.options?.[0] ?? 'Valeur';
    default: return `Valeur ${champ.key}`;
  }
}

/** Saisie complète : tout ce que le formulaire demande, et rien de plus. */
function saisieComplete(sections: Section[]): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const s of sections) {
    if (s.type === 'table') {
      const lignes = Math.max(s.minRows ?? 0, 1);
      data[s.key] = Array.from({ length: lignes }, () =>
        Object.fromEntries((s.columns ?? []).map((c) => [c.key, valeur(c)])),
      );
    } else if (s.type === 'checklist') {
      data[s.key] = Object.fromEntries(
        (s.groups ?? []).flatMap((g) => g.points).map((p) => [p.key, 'C']),
      );
    } else if (s.type === 'verdict') {
      data[s.key] = s.verdicts?.[0]?.fr ?? '';
    } else if (s.type === 'criteria') {
      data[s.key] = Object.fromEntries(
        (s.criteria ?? []).map((c) => [c.key, { applicable: true, conform: true }]),
      );
    } else if (s.fields) {
      data[s.key] = Object.fromEntries(s.fields.map((f) => [f.key, valeur(f)]));
    }
  }
  return data;
}

/** Service isolé : la validation ne lit que l'inspection et ses instruments. */
function service(template: (typeof TEMPLATES)[number], data: Record<string, unknown>) {
  const sections = (template.schema as { sections: Section[] }).sections;
  const instrument = sections.some((s) => s.type === 'devices')
    ? [
        {
          measuringDevice: {
            code: 'APP-001',
            // Étalonnage valide après la date de l'essai : la règle bloquante
            // de l'étalonnage n'est pas l'objet de ce test.
            calibrationValidUntil: new Date('2027-01-01'),
          },
        },
      ]
    : [];

  const prisma = {
    inspection: {
      findUniqueOrThrow: async () => ({
        id: 'test',
        date: new Date('2026-09-21'),
        data,
        template,
        devices: instrument,
      }),
    },
  };

  // Seules la base et les instruments comptent ici : la GED et le stockage
  // ne sont pas sollicités par la validation.
  return new InspectionsService(prisma as never, {} as never, {} as never, {} as never, {} as never);
}

describe('validation des saisies, sur les formulaires du référentiel', () => {
  it.each(TEMPLATES.map((t) => [t.formCode, t] as const))(
    '%s accepte une saisie complète',
    async (_code, template) => {
      const sections = (template.schema as { sections: Section[] }).sections;
      const { issues, canSubmit } = await service(template, saisieComplete(sections)).validate('test');

      expect(issues.filter((i) => i.blocking)).toEqual([]);
      expect(canSubmit).toBe(true);
    },
  );

  it.each(TEMPLATES.map((t) => [t.formCode, t] as const))(
    '%s retient une saisie vide',
    async (_code, template) => {
      const { canSubmit } = await service(template, {}).validate('test');
      expect(canSubmit).toBe(false);
    },
  );

  /** Saisie complète, moins les sections d'un type : le reste est en ordre. */
  function saisieSauf(sections: Section[], type: string): Record<string, unknown> {
    const data = saisieComplete(sections);
    for (const s of sections.filter((x) => x.type === type)) delete data[s.key];
    return data;
  }

  const avec = (type: string) =>
    TEMPLATES.filter((t) =>
      (t.schema as { sections: Section[] }).sections.some((s) => s.type === type),
    ).map((t) => [t.formCode, t] as const);

  /**
   * Regression : une check-list dont aucun point n'était renseigné passait
   * pour un rapport complet — un pont roulant pouvait partir en vérification
   * sans qu'aucun de ses 57 points ait été examiné.
   */
  it.each(avec('checklist'))('%s retient une check-list sans réponse', async (_code, template) => {
    const sections = (template.schema as { sections: Section[] }).sections;
    const { issues, canSubmit } = await service(template, saisieSauf(sections, 'checklist')).validate('test');

    expect(canSubmit).toBe(false);
    expect(issues.some((i) => i.blocking && /points? de contrôle/i.test(i.message))).toBe(true);
  });

  it.each(avec('verdict'))('%s retient une conclusion vide', async (_code, template) => {
    const sections = (template.schema as { sections: Section[] }).sections;
    const { issues, canSubmit } = await service(template, saisieSauf(sections, 'verdict')).validate('test');

    expect(canSubmit).toBe(false);
    expect(issues.some((i) => i.blocking && /conclusion/i.test(i.message))).toBe(true);
  });

  it.each(avec('criteria'))('%s retient un critère non tranché', async (_code, template) => {
    const sections = (template.schema as { sections: Section[] }).sections;
    const { issues, canSubmit } = await service(template, saisieSauf(sections, 'criteria')).validate('test');

    expect(canSubmit).toBe(false);
    expect(issues.some((i) => i.blocking && /critère/i.test(i.message))).toBe(true);
  });

  /**
   * Regression : les colonnes obligatoires d'un tableau n'étaient pas
   * contrôlées — une ligne d'indication entièrement vide valait mesure faite.
   */
  it.each(
    TEMPLATES.filter((t) =>
      (t.schema as { sections: Section[] }).sections.some(
        (s) => s.type === 'table' && (s.columns ?? []).some((c) => c.required),
      ),
    ).map((t) => [t.formCode, t] as const),
  )('%s retient une ligne de tableau sans ses colonnes obligatoires', async (_code, template) => {
    const sections = (template.schema as { sections: Section[] }).sections;
    const data = saisieComplete(sections);
    for (const s of sections.filter((x) => x.type === 'table')) {
      data[s.key] = [{}];
    }

    const { issues, canSubmit } = await service(template, data).validate('test');

    expect(canSubmit).toBe(false);
    expect(issues.some((i) => i.blocking && /colonne\(s\)? obligatoire/i.test(i.message))).toBe(true);
  });
});
