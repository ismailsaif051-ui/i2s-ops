/**
 * Démarre l'instance PostgreSQL locale du projet.
 *
 * Elle vit dans `.pgdata`, sur le port 5433, et ne survit pas à un
 * redémarrage du poste : ce script la relance sans rien réinstaller.
 *
 *   npm run db:start
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createConnection } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dataDir = join(root, '.pgdata');
const logFile = join(dataDir, 'serveur.log');
const PORT = 5433;

/** Le port répond-il déjà ? */
function listening() {
  return new Promise((resolve) => {
    const socket = createConnection({ host: '127.0.0.1', port: PORT });
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.setTimeout(1500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

/** Emplacement de pg_ctl, d'après la version notée dans le répertoire. */
function findPgCtl() {
  const version = existsSync(join(dataDir, 'PG_VERSION'))
    ? readFileSync(join(dataDir, 'PG_VERSION'), 'utf8').trim()
    : null;

  const candidates = [
    version ? `C:\\Program Files\\PostgreSQL\\${version}\\bin\\pg_ctl.exe` : null,
    ...['18', '17', '16', '15'].map((v) => `C:\\Program Files\\PostgreSQL\\${v}\\bin\\pg_ctl.exe`),
  ].filter(Boolean);

  return candidates.find((path) => existsSync(path)) ?? null;
}

async function main() {
  if (!existsSync(dataDir)) {
    console.error(
      'Aucune instance locale dans .pgdata. Lancez d’abord : npm run db:setup',
    );
    process.exit(1);
  }

  if (await listening()) {
    console.log(`La base répond déjà sur le port ${PORT}.`);
    return;
  }

  const pgCtl = findPgCtl();
  if (!pgCtl) {
    console.error(
      'pg_ctl est introuvable. Vérifiez que PostgreSQL est installé dans C:\\Program Files\\PostgreSQL.',
    );
    process.exit(1);
  }

  console.log('Démarrage de la base…');
  const result = spawnSync(pgCtl, ['-D', dataDir, '-l', logFile, 'start'], {
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    console.error(`Échec du démarrage : ${result.error.message}`);
    process.exit(1);
  }

  // pg_ctl rend la main avant que le port n'accepte les connexions.
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await listening()) {
      console.log(`Base prête sur le port ${PORT}.`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.error(`La base n’a pas répondu sur le port ${PORT}. Voyez ${logFile}.`);
  process.exit(1);
}

main();
