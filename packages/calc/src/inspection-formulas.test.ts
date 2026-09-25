import { describe, expect, it } from 'vitest';
import { applyFormulas, type FormulaSection } from './inspection-formulas';

describe('applyFormulas', () => {
  /** Thermographie : l'écart de température se lit dans la ligne elle-même. */
  it('calcule une colonne à partir de sa propre ligne', () => {
    const sections: FormulaSection[] = [
      {
        key: 'thermograms',
        type: 'table',
        columns: [
          { key: 'tr', type: 'number' },
          { key: 'tc', type: 'number' },
          { key: 'deltaT', type: 'formula', formula: 'tc - tr', decimals: 1 },
        ],
      },
    ];

    const data = applyFormulas(sections, {
      thermograms: [
        { tr: 37, tc: 45.8 },
        { tr: 20, tc: 20 },
        { tr: 30 },
      ],
    });

    expect(data.thermograms).toEqual([
      { tr: 37, tc: 45.8, deltaT: 8.8 },
      { tr: 20, tc: 20, deltaT: 0 },
      { tr: 30, deltaT: null },
    ]);
  });

  it('agrège une colonne de tableau dans une autre section', () => {
    const sections: FormulaSection[] = [
      {
        key: 'measures',
        type: 'table',
        columns: [
          { key: 'zone', type: 'text' },
          { key: 'thickness', type: 'number' },
        ],
      },
      {
        key: 'summary',
        type: 'conditions',
        fields: [
          { key: 'contractualThickness', type: 'number' },
          { key: 'measureCount', type: 'formula', formula: 'count(measures[].thickness)', decimals: 0 },
          {
            key: 'below80',
            type: 'formula',
            formula: 'countBelow(measures[].thickness, 0.8 * contractualThickness)',
            decimals: 0,
          },
          { key: 'average', type: 'formula', formula: 'avg(measures[].thickness)', decimals: 0 },
        ],
      },
    ];

    const data = applyFormulas(sections, {
      measures: [
        { zone: 'A', thickness: 300 },
        { zone: 'B', thickness: 250 },
        { zone: 'C', thickness: 180 },
      ],
      summary: { contractualThickness: 300 },
    });

    expect(data.summary).toEqual({
      contractualThickness: 300,
      measureCount: 3,
      below80: 1,
      average: 243,
    });
  });

  /** Le taux de résolution se lit sur des constats eux-mêmes comptés. */
  it('enchaîne deux champs calculés', () => {
    const sections: FormulaSection[] = [
      { key: 'findings', type: 'table', columns: [{ key: 'closed', type: 'number' }] },
      {
        key: 'resolution',
        type: 'conditions',
        fields: [
          { key: 'raised', type: 'formula', formula: 'count(findings[].closed)', decimals: 0 },
          { key: 'closed', type: 'formula', formula: 'sum(findings[].closed)', decimals: 0 },
          { key: 'rate', type: 'formula', formula: 'round(100 * closed / raised, 0)', decimals: 0 },
        ],
      },
    ];

    const data = applyFormulas(sections, { findings: [{ closed: 1 }, { closed: 0 }, { closed: 1 }, { closed: 1 }] });

    expect(data.resolution).toEqual({ raised: 4, closed: 3, rate: 75 });
  });

  it('laisse la saisie intacte et ne calcule rien sans formule', () => {
    const sections: FormulaSection[] = [
      { key: 'header', type: 'keyvalue', fields: [{ key: 'client', type: 'text' }] },
    ];
    const donnees = { header: { client: 'Client' }, autre: [1, 2] };

    expect(applyFormulas(sections, donnees)).toEqual(donnees);
  });

  /** Une liste déroulante rend du texte : « 3 » doit compter comme trois. */
  it('accepte une valeur saisie sous forme de texte', () => {
    const sections: FormulaSection[] = [
      {
        key: 'risks',
        type: 'table',
        columns: [
          { key: 'severity', type: 'enum' },
          { key: 'probability', type: 'enum' },
          { key: 'criticality', type: 'formula', formula: 'severity * probability', decimals: 0 },
        ],
      },
    ];

    const data = applyFormulas(sections, { risks: [{ severity: '3', probability: '4' }] });

    expect(data.risks).toEqual([{ severity: '3', probability: '4', criticality: 12 }]);
  });
});
