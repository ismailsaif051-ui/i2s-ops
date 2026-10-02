/**
 * Lance I2S-System sur ce poste en mode PRODUCTION — rapide.
 *
 *   node scripts/local.mjs            compile tout, puis démarre
 *   node scripts/local.mjs --rapide   redémarre sans recompiler (après une
 *                                     première compilation)
 *
 * `npm run dev` est fait pour modifier le code : chaque page y est compilée
 * à la première ouverture, puis recompilée à chaque changement — 2 à 6
 * secondes par page. Ici, tout est compilé une fois à l'avance, comme sur
 * l'hébergement : les pages s'ouvrent en 0,2 à 0,8 seconde (mesuré le
 * 2 octobre 2026 sur ce poste, même base, mêmes données).
 *
 * Après une modification du code, relancer sans --rapide pour recompiler.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import net from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const BIN = {
  tsc: join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
  next: join(root, 'node_modules', 'next', 'dist', 'bin', 'next'),
  nest: join(root, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js'),
  prisma: join(root, 'node_modules', 'prisma', 'build', 'index.js'),
};
const skipBuild = process.argv.includes('--rapide');

const readEnvValue = (key, fallback) => {
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return fallback;
  const match = new RegExp(`^${key}\\s*=\\s*"?([^"\\n]+)"?`, 'm').exec(readFileSync(envPath, 'utf8'));
  return match?.[1]?.trim() || fallback;
};
// LOCAL_WEB_PORT / LOCAL_API_PORT : pour essayer à côté d'un « npm run dev » déjà lancé.
const API_PORT = process.env.LOCAL_API_PORT ?? readEnvValue('PORT', '4000');
const WEB_PORT = process.env.LOCAL_WEB_PORT ?? '3000';

function stop(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

function run(label, args, cwd, env = process.env) {
  console.log(`→ ${label}`);
  const started = Date.now();
  const result = spawnSync(process.execPath, args, { cwd, env, stdio: 'inherit', shell: false });
  if (result.status !== 0) stop(`${label} a échoué (code ${result.status}).`);
  console.log(`  ✔ ${Math.round((Date.now() - started) / 1000)} s`);
}

/** Un port déjà pris veut dire qu'une autre copie tourne (souvent « npm run dev »). */
function portBusy(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port: Number(port), host: '127.0.0.1' });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}

if (!existsSync(join(root, '.env'))) stop('Aucun fichier .env à la racine du projet.');
for (const port of [WEB_PORT, API_PORT]) {
  if (await portBusy(port)) {
    stop(
      `Le port ${port} est déjà utilisé : l'application tourne sans doute déjà (npm run dev).\n` +
        '  Fermez-la (Ctrl+C dans sa fenêtre), puis relancez cette commande.',
    );
  }
}

const production = { ...process.env, NODE_ENV: 'production' };

if (skipBuild) {
  if (!existsSync(join(root, 'apps', 'api', 'dist', 'main.js')) || !existsSync(join(root, 'apps', 'web', '.next-build'))) {
    stop('Rien n’est encore compilé : lancez d’abord « node scripts/local.mjs » sans --rapide.');
  }
} else {
  console.log('Compilation (2 à 4 minutes la première fois)…\n');
  run('Paquet @i2s/contracts', [BIN.tsc, '-p', join(root, 'packages', 'contracts', 'tsconfig.json')], root);
  run('Paquet @i2s/calc', [BIN.tsc, '-p', join(root, 'packages', 'calc', 'tsconfig.json')], root);
  run('Client de base de données', [BIN.prisma, 'generate', '--schema', join(root, 'packages', 'db', 'prisma', 'schema.prisma')], root);
  run('API', [BIN.nest, 'build'], join(root, 'apps', 'api'), production);
  run('Interface', [BIN.next, 'build'], join(root, 'apps', 'web'), {
    ...production,
    API_URL: `http://localhost:${API_PORT}/api/v1`,
  });
}

const services = [
  {
    name: 'api',
    color: '\x1b[36m',
    args: [join(root, 'apps', 'api', 'dist', 'main.js')],
    cwd: join(root, 'apps', 'api'),
    env: { ...production, PORT: API_PORT, STORAGE_ROOT: process.env.STORAGE_ROOT ?? join(root, 'storage') },
  },
  {
    name: 'web',
    color: '\x1b[35m',
    args: [BIN.next, 'start', '-p', WEB_PORT],
    cwd: join(root, 'apps', 'web'),
    env: { ...production, PORT: WEB_PORT, API_URL: `http://localhost:${API_PORT}/api/v1` },
  },
];

console.log('\n→ Démarrage en mode production\n');
const children = services.map(({ name, color, args, cwd, env }) => {
  const child = spawn(process.execPath, args, { cwd, env, shell: false });
  const prefix = `${color}[${name}]\x1b[0m `;
  for (const [stream, target] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
    stream.on('data', (chunk) => {
      for (const line of chunk.toString().split('\n')) if (line.trim()) target.write(prefix + line + '\n');
    });
  }
  child.on('exit', (code) => {
    console.log(`${prefix}arrêté (code ${code ?? 0})`);
    for (const other of children) if (other !== child && !other.killed) other.kill();
    process.exitCode = code ?? 0;
  });
  return child;
});

setTimeout(() => {
  console.log(`\n✔ I2S-System : http://localhost:${WEB_PORT}   (Ctrl+C pour arrêter)\n`);
}, 4000);

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    for (const child of children) if (!child.killed) child.kill();
  });
}
