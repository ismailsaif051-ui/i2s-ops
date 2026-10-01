import { describe, expect, it } from 'vitest';
import { parseAmount, parseDay, readCostSheet, resolveColumns } from './daily-cost-sheet';

const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : d);

describe('lecture du classeur de coûts journaliers', () => {
  it('lit les montants tels que la paie les écrit', () => {
    expect(parseAmount(1250)).toBe(1250);
    expect(parseAmount('1 250,50')).toBe(1250.5);
    expect(parseAmount('1.250,50')).toBe(1250.5);
    expect(parseAmount('1,250.50')).toBe(1250.5);
    expect(parseAmount('900 DH')).toBe(900);
    expect(parseAmount('1 100')).toBe(1100);
    expect(parseAmount({ formula: 'A1*1.05', result: 945 })).toBe(945);
  });

  it('distingue une cellule vide d’un montant illisible', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount(undefined)).toBeNull();
    expect(parseAmount('neuf cents')).toBeNaN();
  });

  it('lit les dates Excel, JJ/MM/AAAA et AAAA-MM-JJ', () => {
    expect(day(parseDay(new Date(Date.UTC(2026, 0, 1))))).toBe('2026-01-01');
    expect(day(parseDay('01/04/2026'))).toBe('2026-04-01');
    expect(day(parseDay('1/4/2026'))).toBe('2026-04-01');
    expect(day(parseDay('2026-07-01'))).toBe('2026-07-01');
    expect(day(parseDay(46023))).toBe('2026-01-01');
  });

  it('refuse une date impossible plutôt que de la décaler', () => {
    expect(Number.isNaN(parseDay('31/02/2026')!.getTime())).toBe(true);
    expect(Number.isNaN(parseDay('demain')!.getTime())).toBe(true);
  });

  it('retrouve les colonnes sans tenir compte des accents ni de l’apostrophe', () => {
    const { columns, missing } = resolveColumns([
      'MATRICULE',
      'Coût actuel',
      'Nouveau cout journalier',
      'Date d’effet',
    ]);
    expect(missing).toEqual([]);
    expect(columns.amount).toBe('Nouveau cout journalier');
    expect(columns.validFrom).toBe('Date d’effet');
  });

  it('ne prend jamais « Coût actuel » pour le nouveau coût', () => {
    expect(resolveColumns(['Matricule', 'Coût actuel', 'Date d’effet']).missing).toEqual([
      'Nouveau coût journalier',
    ]);
  });

  it('ignore les lignes du modèle laissées vides et signale les incomplètes', () => {
    const { rows } = readCostSheet(
      [
        {
          Matricule: 'I2S-001',
          'Nouveau coût journalier': null,
          'Date d’effet': '',
        },
        {
          Matricule: 'I2S-002',
          'Nouveau coût journalier': '950',
          'Date d’effet': '01/01/2026',
        },
        { Matricule: 'I2S-003', 'Nouveau coût journalier': '950' },
        {
          Matricule: 'I2S-004',
          'Nouveau coût journalier': '-5',
          'Date d’effet': '01/01/2026',
        },
      ],
      'Import du fichier « x.xlsx »',
    );

    expect(rows[0].error).toBeUndefined();
    expect(rows[0].amount).toBeNull();
    expect(rows[1]).toMatchObject({
      row: 3,
      amount: 950,
      reason: 'Import du fichier « x.xlsx »',
    });
    expect(rows[2].error).toBe('Date d’effet manquante.');
    expect(rows[3].error).toBe('Le coût journalier doit être positif.');
  });

  it('garde le motif saisi et arrondit au centime', () => {
    const { rows } = readCostSheet(
      [
        {
          Matricule: 7,
          'Coût journalier': 912.345,
          "Date d'effet": '01/01/2026',
          Motif: 'Augmentation annuelle',
        },
      ],
      'défaut',
    );
    expect(rows[0]).toMatchObject({
      matricule: '7',
      amount: 912.35,
      reason: 'Augmentation annuelle',
    });
  });
});
