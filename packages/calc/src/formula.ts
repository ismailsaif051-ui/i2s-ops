/**
 * Évaluateur des formules des formulaires d'inspection.
 *
 * Une formule est écrite dans le formulaire lui-même — « tc - tr »,
 * « severity * probability », « 100 * closed / raised » — et calculée ici,
 * sans dépendre d'aucune base. L'inspecteur ne pose plus ces opérations à la
 * main sur un rapport réglementaire.
 *
 * Le langage est volontairement pauvre : nombres, quatre opérations,
 * parenthèses, quelques fonctions, et des références aux champs du
 * formulaire. Aucune expression n'est exécutée comme du code — un formulaire
 * est une donnée, et un modèle publié ne doit jamais pouvoir exécuter quoi
 * que ce soit sur le serveur.
 */

/** Valeur lisible depuis une formule : un champ, ou une colonne entière. */
export type FormulaValue = number | number[] | null;

/** Résout une référence « a.b.c » en valeur ; `null` si elle n'est pas saisie. */
export type FormulaScope = (path: string[]) => FormulaValue;

type Token =
  | { kind: 'number'; value: number }
  | { kind: 'name'; value: string }
  | { kind: 'op'; value: string };

const OPERATORS = new Set(['+', '-', '*', '/', '(', ')', ',']);

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < source.length) {
    const c = source[i] as string;

    if (c === ' ' || c === '\t' || c === '\n') {
      i++;
    } else if (OPERATORS.has(c)) {
      tokens.push({ kind: 'op', value: c });
      i++;
    } else if (/[0-9.]/.test(c)) {
      const match = /^[0-9]*\.?[0-9]+/.exec(source.slice(i));
      if (!match) throw new Error(`Nombre invalide à la position ${i}.`);
      tokens.push({ kind: 'number', value: Number(match[0]) });
      i += match[0].length;
    } else if (/[A-Za-z_]/.test(c)) {
      const match = /^[A-Za-z_][\w.-]*(\[\])?(\.[\w-]+)*/.exec(source.slice(i));
      if (!match) throw new Error(`Référence invalide à la position ${i}.`);
      tokens.push({ kind: 'name', value: match[0] });
      i += match[0].length;
    } else {
      throw new Error(`Caractère inattendu « ${c} » dans la formule.`);
    }
  }

  return tokens;
}

const nombre = (v: FormulaValue): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

const vecteur = (v: FormulaValue): number[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === 'number' && Number.isFinite(x)) : [];

/**
 * Fonctions disponibles. Les agrégats travaillent sur une colonne de tableau,
 * les autres sur des nombres. Une valeur manquante rend tout le calcul
 * indéterminé : mieux vaut une case vide qu'un chiffre faux sur un rapport.
 */
const FUNCTIONS: Record<string, (args: FormulaValue[]) => FormulaValue> = {
  abs: (args) => { const x = nombre(args[0] ?? null); return x === null ? null : Math.abs(x); },
  min: (args) => (args.some((a) => nombre(a) === null) ? null : Math.min(...args.map((a) => nombre(a) as number))),
  max: (args) => (args.some((a) => nombre(a) === null) ? null : Math.max(...args.map((a) => nombre(a) as number))),
  round: (args) => {
    const v = nombre(args[0] ?? null);
    if (v === null) return null;
    const decimals = nombre(args[1] ?? null) ?? 0;
    const facteur = 10 ** decimals;
    return Math.round(v * facteur) / facteur;
  },
  sum: (args) => vecteur(args[0] ?? null).reduce((total, x) => total + x, 0),
  count: (args) => vecteur(args[0] ?? null).length,
  avg: (args) => {
    const values = vecteur(args[0] ?? null);
    return values.length === 0 ? null : values.reduce((t, x) => t + x, 0) / values.length;
  },
  /** Nombre de valeurs strictement inférieures au seuil. */
  countBelow: (args) => {
    const limite = nombre(args[1] ?? null);
    return limite === null ? null : vecteur(args[0] ?? null).filter((x) => x < limite).length;
  },
  /** Nombre de valeurs comprises entre deux bornes, incluses. */
  countBetween: (args) => {
    const min = nombre(args[1] ?? null);
    const max = nombre(args[2] ?? null);
    return min === null || max === null ? null : vecteur(args[0] ?? null).filter((x) => x >= min && x <= max).length;
  },
};

class Parser {
  private position = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly scope: FormulaScope,
  ) {}

  parse(): FormulaValue {
    const value = this.expression();
    if (this.position < this.tokens.length) throw new Error('Formule mal formée.');
    return value;
  }

  private peek(): Token | undefined {
    return this.tokens[this.position];
  }

  private eat(value: string): boolean {
    const token = this.peek();
    if (token?.kind === 'op' && token.value === value) {
      this.position++;
      return true;
    }
    return false;
  }

  private expression(): FormulaValue {
    let left = this.term();
    for (;;) {
      if (this.eat('+')) left = this.arithmetic(left, this.term(), (a, b) => a + b);
      else if (this.eat('-')) left = this.arithmetic(left, this.term(), (a, b) => a - b);
      else return left;
    }
  }

  private term(): FormulaValue {
    let left = this.factor();
    for (;;) {
      if (this.eat('*')) left = this.arithmetic(left, this.factor(), (a, b) => a * b);
      else if (this.eat('/')) {
        const right = this.factor();
        // Division par zéro : indéterminée, pas « Infinity » sur un rapport.
        left = this.arithmetic(left, right, (a, b) => (b === 0 ? Number.NaN : a / b));
      } else return left;
    }
  }

  private factor(): FormulaValue {
    if (this.eat('-')) {
      const value = nombre(this.factor());
      return value === null ? null : -value;
    }
    return this.primary();
  }

  private arithmetic(a: FormulaValue, b: FormulaValue, operation: (x: number, y: number) => number): FormulaValue {
    const left = nombre(a);
    const right = nombre(b);
    if (left === null || right === null) return null;
    const result = operation(left, right);
    return Number.isFinite(result) ? result : null;
  }

  private primary(): FormulaValue {
    const token = this.peek();
    if (!token) throw new Error('Formule incomplète.');

    if (token.kind === 'number') {
      this.position++;
      return token.value;
    }

    if (token.kind === 'name') {
      this.position++;
      if (this.eat('(')) {
        const fonction = FUNCTIONS[token.value];
        if (!fonction) throw new Error(`Fonction inconnue : ${token.value}.`);
        const args: FormulaValue[] = [];
        if (!this.eat(')')) {
          do {
            args.push(this.expression());
          } while (this.eat(','));
          if (!this.eat(')')) throw new Error('Parenthèse fermante manquante.');
        }
        return fonction(args);
      }
      return this.scope(token.value.split('.'));
    }

    if (this.eat('(')) {
      const value = this.expression();
      if (!this.eat(')')) throw new Error('Parenthèse fermante manquante.');
      return value;
    }

    throw new Error(`Élément inattendu « ${token.value} » dans la formule.`);
  }
}

/**
 * Calcule une formule. Rend `null` dès qu'une valeur manque : une case vide
 * se voit et se corrige, un zéro imprimé au rapport passe inaperçu.
 * Une formule mal écrite lève : elle est le fait du formulaire, pas de la
 * saisie, et doit être vue à la publication.
 */
export function evaluateFormula(expression: string, scope: FormulaScope): number | null {
  const value = new Parser(tokenize(expression), scope).parse();
  return nombre(value);
}
