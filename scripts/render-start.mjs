/**
 * Démarrage de l'API sur un hébergement (Render).
 *
 * Sur un serveur neuf, la base est vide : sans tables ni comptes, l'API
 * répondrait mais personne ne pourrait se connecter. Ce script prépare la
 * base à chaque démarrage, puis lance l'API :
 *
 *   1. schéma à jour (sans jamais effacer de données) ;
 *   2. référentiels — rôles, départements, modèles de rapports, compte
 *      administrateur — sans rien écraser de ce qui existe ;
 *   3. jeu de démonstration, SEULEMENT si LOAD_DEMO=true ET que la base ne
 *      contient encore aucune affaire : il efface tout avant de se charger,
 *      il ne doit donc jamais passer sur des données saisies.
 *
 * Usage : node scripts/render-start.mjs  (depuis la racine du dépôt)
 */
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { realignSequences } from './realign-sequences.mjs';

const SCHEMA = 'packages/db/prisma/schema.prisma';

function run(label, command, args, env = process.env) {
  console.log(`\n▶ ${label}`);
  const started = Date.now();
  const result = spawnSync(command, args, { stdio: 'inherit', env, shell: process.platform === 'win32' });
  if (result.status !== 0) {
    console.error(`✖ ${label} — échec (code ${result.status}). L'API ne démarre pas.`);
    process.exit(result.status ?? 1);
  }
  console.log(`✔ ${label} (${Math.round((Date.now() - started) / 1000)} s)`);
}

/**
 * Met le schéma à jour sans jamais accepter de perte de données.
 *
 * Prisma refuse par prudence toute modification qu'il classe « avec perte
 * possible ». Une seule catégorie est acceptée ici : l'ajout d'une règle
 * d'unicité. Elle ne supprime rien — elle passe, ou elle échoue s'il existe
 * des doublons, et l'API ne démarre pas. Toute autre alerte (suppression de
 * colonne, de table, changement de type) arrête le démarrage : c'est à une
 * personne de décider.
 */
function pushSchema(environment) {
  console.log('\n▶ Schéma de la base');
  const started = Date.now();
  const args = ['prisma', 'db', 'push', '--schema', SCHEMA, '--skip-generate'];
  const first = spawnSync('npx', args, {
    env: environment,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  const output = `${first.stdout ?? ''}${first.stderr ?? ''}`;

  if (first.status === 0) {
    process.stdout.write(output);
    console.log(`✔ Schéma de la base (${Math.round((Date.now() - started) / 1000)} s)`);
    return;
  }

  const warnings = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('•'));
  const onlyUniqueAdded =
    output.includes('data loss') &&
    warnings.length > 0 &&
    warnings.every((line) => line.startsWith('• A unique constraint covering'));

  if (!onlyUniqueAdded) {
    process.stdout.write(output);
    console.error(`✖ Schéma de la base — échec (code ${first.status}). L'API ne démarre pas.`);
    process.exit(first.status ?? 1);
  }

  console.log(`• Ajout de règle(s) d’unicité, sans suppression de données :\n  ${warnings.join('\n  ')}`);
  run('Schéma de la base (règles d’unicité)', 'npx', [...args, '--accept-data-loss'], environment);
}

// Un seul mot de passe à saisir sur Render : il sert aux comptes de
// démonstration et, à défaut d'un mot de passe dédié, au compte administrateur
// (qui devra de toute façon le changer à sa première connexion).
const env = { ...process.env };
if (!env.SEED_ADMIN_PASSWORD && env.DEMO_PASSWORD) env.SEED_ADMIN_PASSWORD = env.DEMO_PASSWORD;

pushSchema(env);
run('Référentiels et compte administrateur', 'npx', ['tsx', 'packages/db/prisma/seed.ts'], env);

if (env.LOAD_DEMO === 'true') {
  const prisma = new PrismaClient();
  const affairs = await prisma.affair.count().catch(() => -1);
  await prisma.$disconnect();

  if (affairs === 0) {
    run('Jeu de démonstration (première fois seulement)', 'npx', ['tsx', 'packages/db/prisma/seed-demo.ts'], env);
  } else {
    console.log(`\n• Jeu de démonstration non rechargé : la base contient déjà ${affairs} affaire(s).`);
  }
}

// Des compteurs en retard sur les numéros existants feraient échouer toute
// création. Un compteur ne recule jamais : cette étape est sans risque.
{
  console.log('\n▶ Compteurs de numérotation');
  const prisma = new PrismaClient();
  try {
    const changes = await realignSequences(prisma);
    console.log(changes.length > 0 ? `✔ Recalés : ${changes.join(' · ')}` : '✔ Déjà à jour');
  } catch (error) {
    // Un échec ici ne doit pas empêcher l'API de démarrer.
    console.error(`• Recalage des compteurs impossible : ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

console.log('\n▶ Démarrage de l’API');
const api = spawnSync('node', ['apps/api/dist/main.js'], { stdio: 'inherit', env });
process.exit(api.status ?? 0);
