/**
 * Prépare la base de développement : création si absente, application du
 * schéma, puis chargement des référentiels.
 *
 *   npm run db:setup
 *
 * Aucun appel de shell : Prisma et tsx sont lancés directement par
 * l'exécutable Node courant.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

// fileURLToPath décode les échappements : le dossier « I2S OPS » contient un
// espace, qu'un simple `url.pathname` laisserait en « %20 ».
const root = dirname(dirname(fileURLToPath(import.meta.url)));

const PRISMA = join(root, 'node_modules', 'prisma', 'build', 'index.js');
const TSX = join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const SCHEMA = join(root, 'packages', 'db', 'prisma', 'schema.prisma');

function readEnv() {
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) {
    console.error('\n✗ Aucun fichier .env. Copiez .env.example vers .env.\n');
    process.exit(1);
  }
  const entries = readFileSync(envPath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const eq = line.indexOf('=');
      return [line.slice(0, eq).trim(), line.slice(eq + 1).trim().replace(/^"|"$/g, '')];
    });
  return Object.fromEntries(entries);
}

function run(label, args) {
  console.log(`\n→ ${label}`);
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit', shell: false });
  if (result.error) {
    console.error(`\n✗ ${label} : ${result.error.message}\n`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`\n✗ ${label} a échoué (code ${result.status}).\n`);
    process.exit(result.status ?? 1);
  }
}

const env = readEnv();
const url = env.DATABASE_URL;

if (!url || url.includes('REMPLACER_MOT_DE_PASSE') || url.includes('<MOT_DE_PASSE>')) {
  console.error(
    '\n✗ DATABASE_URL n’est pas renseigné.\n' +
      '  Ouvrez .env et remplacez le mot de passe PostgreSQL dans DATABASE_URL.\n',
  );
  process.exit(1);
}

const parsed = new URL(url);
const dbName = decodeURIComponent(parsed.pathname.slice(1));

console.log(`→ Base cible : ${dbName} sur ${parsed.hostname}:${parsed.port || 5432}\n`);

// 1. Créer la base si elle n'existe pas (connexion sur la base « postgres »).
const admin = new Client({
  host: parsed.hostname,
  port: Number(parsed.port || 5432),
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database: 'postgres',
});

try {
  await admin.connect();
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (exists.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${dbName}"`);
    console.log(`  Base "${dbName}" créée.`);
  } else {
    console.log(`  Base "${dbName}" déjà présente.`);
  }
} catch (error) {
  console.error(`\n✗ Connexion à PostgreSQL impossible : ${error.message}`);
  console.error('  Vérifiez le mot de passe dans .env et que le service PostgreSQL tourne.\n');
  process.exit(1);
} finally {
  await admin.end().catch(() => {});
}

run('Application du schéma Prisma', [PRISMA, 'db', 'push', '--schema', SCHEMA, '--skip-generate']);
run('Chargement des référentiels', [TSX, join(root, 'packages', 'db', 'prisma', 'seed.ts')]);

console.log('\n✓ Base prête. Jeu de simulation : npm run db:demo\n');
