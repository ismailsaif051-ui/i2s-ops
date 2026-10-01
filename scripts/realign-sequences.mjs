/**
 * Remet les compteurs de numérotation après le dernier numéro existant.
 *
 * Un compteur en retard sur les numéros déjà attribués fait échouer toute
 * création (affaire, mission, rapport, facture…) sur une contrainte d'unicité.
 * C'est arrivé avec le jeu de démonstration : son recalage lisait les numéros
 * de travers et laissait tous les compteurs à 1. Ce script corrige une base
 * déjà remplie, et tourne à chaque démarrage sur Render.
 *
 * Il est sans risque : un compteur ne recule JAMAIS. Il n'avance que s'il est
 * en retard, et seulement jusqu'au numéro qui suit le dernier de l'année.
 *
 * Usage autonome : node scripts/realign-sequences.mjs  (DATABASE_URL requis)
 */
import { pathToFileURL } from 'node:url';
import { PrismaClient } from '@prisma/client';

/** Motifs par défaut — repris de packages/contracts/src/numbering.ts. */
const PATTERNS = {
  AFFAIR: '{YY}/{SEQ}',
  MISSION: 'MIS-{YY}-{SEQ}',
  MISSION_ORDER: 'OM-{YY}-{SEQ}',
  REPORT: '{FORM}-{YY}-{SEQ}',
  ATTACHMENT: 'ATT-{YY}-{SEQ}',
  INVOICE: 'F-{YY}-{SEQ}',
  NON_CONFORMITY: 'NC-{YY}-{SEQ}',
  OFFER: 'OFF-{YY}-{SEQ}',
};

/** Table qui porte les numéros de chaque compteur. */
const TABLES = {
  AFFAIR: 'affair',
  MISSION: 'mission',
  MISSION_ORDER: 'missionOrder',
  REPORT: 'report',
  ATTACHMENT: 'attachmentSheet',
  INVOICE: 'invoice',
  NON_CONFORMITY: 'nonConformity',
  OFFER: 'offer',
};

/**
 * Le rang d'un numéro de l'année, ou null s'il n'est pas de l'année.
 * « MIS-26-0342 » → 342 pour 2026 ; « MIS-25-0012 » → null.
 */
export function rankOf(number, pattern, year) {
  const yy = String(year % 100).padStart(2, '0');
  const source = pattern
    .replace(/[.*+?^$()|[\]\\]/g, '\\$&')
    .replace('\\{FORM\\}', '.+')
    .replace('{FORM}', '.+')
    .replace('{YY}', yy)
    .replace('{SEQ}', '(\\d+)');
  const match = new RegExp(`^${source}$`).exec(number);
  return match ? Number.parseInt(match[1], 10) : null;
}

export async function realignSequences(prisma, year = new Date().getFullYear()) {
  const changes = [];

  for (const [scope, pattern] of Object.entries(PATTERNS)) {
    const sequences = await prisma.numberSequence.findMany({ where: { scope, year } });
    if (sequences.length === 0) continue;

    for (const sequence of sequences) {
      // Les numéros sont uniques dans toute la base : tous comptent, quelle
      // que soit la société — sinon deux sociétés se disputeraient un numéro.
      const rows = await prisma[TABLES[scope]].findMany({ select: { number: true } });

      const last = rows.reduce((max, row) => {
        const rank = rankOf(row.number, sequence.pattern || pattern, year);
        return rank !== null && rank > max ? rank : max;
      }, 0);

      // Jamais en arrière : seulement si le compteur est en retard.
      if (sequence.next <= last) {
        await prisma.numberSequence.update({
          where: { id: sequence.id },
          data: { next: last + 1 },
        });
        changes.push(`${scope} ${sequence.next} → ${last + 1}`);
      }
    }
  }

  return changes;
}

// Exécution autonome.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const prisma = new PrismaClient();
  try {
    const changes = await realignSequences(prisma);
    console.log(
      changes.length > 0
        ? `Compteurs recalés : ${changes.join(' · ')}`
        : 'Compteurs déjà à jour : aucun n’était en retard.',
    );
  } finally {
    await prisma.$disconnect();
  }
}
