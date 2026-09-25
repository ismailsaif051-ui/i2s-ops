/**
 * Champs calculés d'un formulaire d'inspection.
 *
 * Le formulaire porte la formule ; ce module la résout sur une saisie. Le
 * serveur recalcule à chaque enregistrement : ce qui est imprimé au rapport
 * ne dépend donc jamais de ce que le navigateur a bien voulu envoyer.
 *
 * Une référence se lit ainsi, depuis un champ comme depuis une ligne de
 * tableau :
 *   tc                     un champ de la même section, ou une colonne de la
 *                          même ligne ;
 *   tank.tankHeight        un champ d'une autre section ;
 *   measures[].thickness   toute une colonne d'un tableau, pour les agrégats.
 */
import { evaluateFormula, type FormulaValue } from './formula';

export interface FormulaField {
  key: string;
  type: string;
  formula?: string;
  decimals?: number;
}

export interface FormulaSection {
  key: string;
  type: string;
  fields?: FormulaField[];
  columns?: FormulaField[];
}

type Donnees = Record<string, unknown>;

const estNombre = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Convertit ce qui est saisi en nombre : les listes déroulantes rendent du texte. */
function versNombre(valeur: unknown): number | null {
  if (estNombre(valeur)) return valeur;
  if (typeof valeur === 'string' && valeur.trim() !== '') {
    const n = Number(valeur.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Résout une référence dans la saisie complète, puis dans la ligne courante. */
function resoudre(data: Donnees, ligne: Donnees | null, path: string[]): FormulaValue {
  const tete = path[0];
  if (tete === undefined) return null;

  if (path.length === 1 && ligne && tete in ligne) return versNombre(ligne[tete]);

  const suite = path[1];

  if (tete.endsWith('[]')) {
    const colonne = data[tete.slice(0, -2)];
    if (!Array.isArray(colonne) || suite === undefined || path.length !== 2) return null;
    return colonne
      .map((row) => versNombre((row as Donnees | null)?.[suite]))
      .filter((v): v is number => v !== null);
  }

  if (suite === undefined) return ligne ? null : versNombre(data[tete]);

  const section = data[tete];
  if (!section || typeof section !== 'object' || Array.isArray(section)) return null;
  return versNombre((section as Donnees)[suite]);
}

/**
 * Remplit les champs calculés d'une saisie et rend une copie. Trois passes :
 * un champ calculé peut en utiliser un autre — le taux de résolution se lit
 * sur des constats eux-mêmes comptés.
 */
export function applyFormulas(sections: FormulaSection[], data: Donnees): Donnees {
  let resultat: Donnees = { ...data };

  for (let passe = 0; passe < 3; passe++) {
    const avant = JSON.stringify(resultat);
    const suivant: Donnees = { ...resultat };

    for (const section of sections) {
      const calculees = (section.columns ?? []).filter((c) => c.formula);
      if (section.type === 'table' && calculees.length > 0) {
        const lignes = Array.isArray(suivant[section.key]) ? (suivant[section.key] as Donnees[]) : [];
        suivant[section.key] = lignes.map((ligne) => {
          const copie = { ...ligne };
          for (const colonne of calculees) {
            copie[colonne.key] = calculer(colonne, suivant, copie);
          }
          return copie;
        });
        continue;
      }

      const champs = (section.fields ?? []).filter((f) => f.formula);
      if (champs.length === 0) continue;

      const valeurs = { ...((suivant[section.key] ?? {}) as Donnees) };
      for (const champ of champs) {
        // La section courante est aussi lisible sans la nommer.
        valeurs[champ.key] = calculer(champ, { ...suivant, ...valeurs }, null);
      }
      suivant[section.key] = valeurs;
    }

    resultat = suivant;
    if (JSON.stringify(resultat) === avant) break;
  }

  return resultat;
}

function calculer(champ: FormulaField, data: Donnees, ligne: Donnees | null): number | null {
  const valeur = evaluateFormula(champ.formula!, (path) => resoudre(data, ligne, path));
  if (valeur === null) return null;
  if (typeof champ.decimals === 'number') {
    const facteur = 10 ** champ.decimals;
    return Math.round(valeur * facteur) / facteur;
  }
  return valeur;
}
