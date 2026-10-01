/**
 * Lecture d'un classeur de coûts journaliers.
 *
 * Le fichier vient d'un tableur rempli à la main, souvent par la paie : les
 * montants arrivent en nombre ou en texte (« 1 250,50 DH »), les dates en
 * date Excel, en JJ/MM/AAAA ou en AAAA-MM-JJ. Tout ce qui ne se lit pas sans
 * ambiguïté est refusé avec la raison — jamais deviné : une erreur ici fausse
 * toutes les marges de l'employé.
 */

export interface CostSheetRow {
  /** Numéro de ligne dans le classeur (l'en-tête est la ligne 1). */
  row: number;
  matricule: string;
  /** `null` : cellule vide — la ligne est ignorée (rien à changer). */
  amount: number | null;
  validFrom: Date | null;
  reason: string;
  error?: string;
}

/** Intitulés acceptés, comparés sans accents ni casse. */
const HEADERS = {
  matricule: ['matricule'],
  amount: ['nouveau cout journalier', 'cout journalier', 'nouveau cout', 'cout journalier (dh)'],
  validFrom: [
    "date d'effet",
    "date de prise d'effet",
    'a partir du',
    'date debut',
    'valable a partir du',
  ],
  reason: ['motif'],
} as const;

export function normalizeHeader(header: string): string {
  return header
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’`´]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Valeur d'une cellule ExcelJS : formule, texte enrichi, lien… ramenés à leur valeur. */
function unwrap(value: unknown): unknown {
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const v = value as {
      result?: unknown;
      text?: unknown;
      richText?: Array<{ text: string }>;
    };
    if (v.result !== undefined) return unwrap(v.result);
    if (Array.isArray(v.richText)) return v.richText.map((part) => part.text).join('');
    if (v.text !== undefined) return unwrap(v.text);
  }
  return value;
}

/**
 * Montant en dirhams. Accepte « 1250 », « 1 250,50 », « 1.250,50 »,
 * « 1,250.50 », « 1250 DH ». `null` si la cellule est vide, `NaN` si illisible.
 */
export function parseAmount(raw: unknown): number | null {
  const value = unwrap(raw);
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;

  let text = String(value)
    .replace(/\s| | /g, '')
    .replace(/(dh|mad|dhs)$/i, '');
  if (text === '') return null;

  const comma = text.lastIndexOf(',');
  const dot = text.lastIndexOf('.');
  if (comma >= 0 && dot >= 0) {
    // Le dernier séparateur est le séparateur décimal.
    text = comma > dot ? text.replace(/\./g, '').replace(',', '.') : text.replace(/,/g, '');
  } else if (comma >= 0) {
    text = text.replace(',', '.');
  }

  return /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : Number.NaN;
}

/** Date du jour, à minuit UTC. `null` si vide, date invalide si illisible. */
export function parseDay(raw: unknown): Date | null {
  const value = unwrap(raw);
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  // Numéro de série Excel (jours depuis le 30/12/1899).
  if (typeof value === 'number') {
    return new Date(Date.UTC(1899, 11, 30) + Math.round(value) * 86_400_000);
  }

  const text = String(value).trim();
  let match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text);
  if (match) return checked(Number(match[3]), Number(match[2]), Number(match[1]));

  match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
  if (match) return checked(Number(match[1]), Number(match[2]), Number(match[3]));

  return new Date(Number.NaN);
}

/** Refuse le 31/02 plutôt que de le glisser au 3 mars. */
function checked(year: number, month: number, day: number): Date {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? date
    : new Date(Number.NaN);
}

/** Retrouve les colonnes utiles quel que soit leur ordre ; signale celles qui manquent. */
export function resolveColumns(headers: string[]): {
  columns: Partial<Record<keyof typeof HEADERS, string>>;
  missing: string[];
} {
  const columns: Partial<Record<keyof typeof HEADERS, string>> = {};
  for (const header of headers) {
    const key = normalizeHeader(header);
    for (const [field, names] of Object.entries(HEADERS) as Array<
      [keyof typeof HEADERS, readonly string[]]
    >) {
      if (!columns[field] && names.includes(key)) columns[field] = header;
    }
  }

  const missing: string[] = [];
  if (!columns.matricule) missing.push('Matricule');
  if (!columns.amount) missing.push('Nouveau coût journalier');
  if (!columns.validFrom) missing.push('Date d’effet');
  return { columns, missing };
}

export function readCostSheet(
  rows: Array<Record<string, unknown>>,
  defaultReason: string,
): { rows: CostSheetRow[]; missing: string[] } {
  const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const { columns, missing } = resolveColumns(headers);
  if (missing.length > 0) return { rows: [], missing };

  const result = rows.map((record, index): CostSheetRow => {
    const row = index + 2;
    const matricule = String(unwrap(record[columns.matricule!]) ?? '').trim();
    const amount = parseAmount(record[columns.amount!]);
    const validFrom = parseDay(record[columns.validFrom!]);
    const reasonCell = columns.reason ? String(unwrap(record[columns.reason]) ?? '').trim() : '';
    const reason = reasonCell.length >= 3 ? reasonCell : defaultReason;

    const base = { row, matricule, amount, validFrom, reason };

    // Ligne du modèle laissée vide : rien à changer pour cet employé.
    if (amount === null && validFrom === null) return base;

    if (!matricule) return { ...base, error: 'Matricule manquant.' };
    if (amount === null) return { ...base, error: 'Nouveau coût journalier manquant.' };
    if (Number.isNaN(amount))
      return {
        ...base,
        error: 'Montant illisible — attendu par exemple 1250 ou 1 250,50.',
      };
    if (amount <= 0) return { ...base, error: 'Le coût journalier doit être positif.' };
    if (amount >= 1e10) return { ...base, error: 'Montant hors limites.' };
    if (validFrom === null) return { ...base, error: 'Date d’effet manquante.' };
    if (Number.isNaN(validFrom.getTime())) {
      return { ...base, error: 'Date d’effet illisible — attendu JJ/MM/AAAA.' };
    }
    return { ...base, amount: Math.round(amount * 100) / 100 };
  });

  return { rows: result, missing };
}
