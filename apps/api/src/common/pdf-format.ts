/**
 * Montants des documents PDF.
 *
 * Le formatage français sépare les milliers par une espace fine insécable
 * (U+202F). Helvetica, la police de base de pdfkit, ne possède pas ce
 * caractère : il ressort en glyphe cassé au milieu des montants, sur des
 * pièces qui partent au client ou en comptabilité. On le remplace donc par
 * une espace ordinaire.
 *
 * Cette règle vivait recopiée dans chaque générateur, sous forme de
 * caractères invisibles dans une expression régulière — un reformatage du
 * fichier les aurait effacés sans bruit, et le dernier générateur écrit
 * l'avait tout simplement oubliée.
 */
export function dh(amount: number): string {
  const formatted = amount
    .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .replace(/[  ]/g, ' ');
  return `${formatted} DH`;
}
