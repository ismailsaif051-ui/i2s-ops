/**
 * Démarre l'API et l'interface ensemble, après avoir compilé les paquets
 * partagés (types, schémas Zod et moteur de calcul).
 *
 *   npm run dev
 *
 * Aucun appel de shell : les outils sont des fichiers JavaScript lancés
 * directement par l'exécutable Node courant. Cela évite toute dépendance à
 * `cmd.exe` ou `/bin/sh`, qui ne sont pas disponibles dans tous les
 * environnements de lancement.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// `fileURLToPath` décode les caractères échappés : le dossier « I2S OPS »
// contient un espace, qu'un simple `url.pathname` laisserait en « %20 ».
const root = dirname(dirname(fileURLToPath(import.meta.url)));

const BIN = {
  tsc: join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
  next: join(root, 'node_modules', 'next', 'dist', 'bin', 'next'),
  nest: join(root, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js'),
};

for (const [name, path] of Object.entries(BIN)) {
  if (!existsSync(path)) {
    console.error(`\n✗ Outil introuvable : ${name} (${path})`);
    console.error('  Lancez « npm install » à la racine du dépôt.\n');
    process.exit(1);
  }
}

/** Exécute un script Node et rend la main, ou interrompt en cas d'échec. */
function runSync(label, args, cwd) {
  const result = spawnSync(process.execPath, args, { cwd, stdio: 'inherit', shell: false });
  if (result.error) {
    console.error(`\n✗ ${label} : ${result.error.message}\n`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`\n✗ ${label} a échoué (code ${result.status}).\n`);
    process.exit(result.status ?? 1);
  }
}

/** L'API refuse de démarrer sans base : on prévient avant, pas après. */
function isDatabaseConfigured() {
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) {
    console.log('\n⚠  Aucun fichier .env. Copiez .env.example vers .env avant de continuer.\n');
    return false;
  }
  const match = /DATABASE_URL\s*=\s*"?([^"\n]+)"?/.exec(readFileSync(envPath, 'utf8'));
  const url = match?.[1] ?? '';
  if (!url || url.includes('REMPLACER_MOT_DE_PASSE') || url.includes('<MOT_DE_PASSE>')) {
    console.log('\n┌───────────────────────────────────────────────────────────────┐');
    console.log('│  Base de données non configurée                                │');
    console.log('├───────────────────────────────────────────────────────────────┤');
    console.log('│  Ouvrez .env, renseignez le mot de passe PostgreSQL dans       │');
    console.log('│  DATABASE_URL, puis lancez :                                   │');
    console.log('│      npm run db:setup                                          │');
    console.log('│      npm run db:demo     (jeu de simulation, facultatif)       │');
    console.log('│                                                                │');
    console.log("│  L'interface démarre quand même : la page de connexion         │");
    console.log("│  s'affiche, mais l'authentification restera indisponible.      │");
    console.log('└───────────────────────────────────────────────────────────────┘\n');
    return false;
  }
  return true;
}

console.log('→ Compilation des paquets partagés');
runSync('Compilation de @i2s/contracts', [BIN.tsc, '-p', join(root, 'packages', 'contracts', 'tsconfig.json')]);
runSync('Compilation de @i2s/calc', [BIN.tsc, '-p', join(root, 'packages', 'calc', 'tsconfig.json')]);

const databaseReady = isDatabaseConfigured();

/**
 * Le port de chaque service est imposé explicitement.
 * Un lanceur externe peut définir `PORT` dans l'environnement ; cette variable
 * prime sur le fichier .env côté NestJS, et ferait écouter l'API sur le port
 * de l'interface.
 */
const readEnvValue = (key, fallback) => {
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return fallback;
  const match = new RegExp(`^${key}\\s*=\\s*"?([^"\\n]+)"?`, 'm').exec(readFileSync(envPath, 'utf8'));
  return match?.[1]?.trim() || fallback;
};

const API_PORT = readEnvValue('PORT', '4000');
const WEB_PORT = '3000';

const services = [
  {
    name: 'api',
    color: '\x1b[36m',
    enabled: databaseReady,
    args: [BIN.nest, 'start', '--watch'],
    cwd: join(root, 'apps', 'api'),
    env: {
      ...process.env,
      PORT: API_PORT,
      // La GED vit à la racine du dépôt, pas dans le dossier du service :
      // l'API démarre dans apps/api, un chemin relatif s'y perdrait.
      STORAGE_ROOT: process.env.STORAGE_ROOT ?? join(root, 'storage'),
    },
  },
  {
    name: 'web',
    color: '\x1b[35m',
    enabled: true,
    args: [BIN.next, 'dev', '-p', WEB_PORT],
    cwd: join(root, 'apps', 'web'),
    env: {
      ...process.env,
      PORT: WEB_PORT,
      NEXT_PUBLIC_API_URL:
        process.env.NEXT_PUBLIC_API_URL ?? `http://localhost:${API_PORT}/api/v1`,
    },
  },
];

console.log('→ Démarrage\n');

const children = services
  .filter((service) => service.enabled)
  .map(({ name, color, args, cwd, env }) => {
    const child = spawn(process.execPath, args, { cwd, env, shell: false });
    const prefix = `${color}[${name}]\x1b[0m `;

    const forward = (stream, target) => {
      stream.on('data', (chunk) => {
        for (const line of chunk.toString().split('\n')) {
          if (line.trim()) target.write(prefix + line + '\n');
        }
      });
    };

    forward(child.stdout, process.stdout);
    forward(child.stderr, process.stderr);

    child.on('error', (error) => {
      console.error(`${prefix}démarrage impossible : ${error.message}`);
    });
    child.on('exit', (code) => {
      if (code !== 0 && code !== null) console.error(`${prefix}arrêté (code ${code})`);
    });

    return child;
  });

const stop = () => {
  for (const child of children) child.kill();
  process.exit(0);
};

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
