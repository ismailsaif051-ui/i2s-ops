import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface StoredFile {
  /** Chemin relatif à la racine de stockage. Jamais un chemin absolu en base. */
  storageKey: string;
  sha256: string;
  size: number;
}

/**
 * Stockage des fichiers de la GED.
 *
 * Les fichiers vivent hors de la base, rangés par empreinte : deux versions
 * identiques d'un même document occupent une seule place, et une empreinte
 * qui ne correspond plus au contenu signale une altération.
 *
 * L'implémentation est un disque local, volontairement : elle peut être
 * remplacée par un stockage objet sans toucher au reste du code, puisque rien
 * d'autre ne connaît le chemin des fichiers.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly root: string;

  constructor(config: ConfigService) {
    // Un chemin relatif se résout depuis le répertoire de travail du service.
    // En développement, le lanceur passe un chemin absolu : sans quoi la GED
    // se rangerait dans apps/api, là où l'API démarre.
    this.root = resolve(config.get<string>('STORAGE_ROOT', 'storage'));
    this.logger.log(`GED : ${this.root}`);
  }

  /** Range un contenu et renvoie de quoi le retrouver et le vérifier. */
  async put(content: Buffer, extension: string): Promise<StoredFile> {
    const sha256 = createHash('sha256').update(content).digest('hex');

    // Deux niveaux d'arborescence : un répertoire de 65 536 fichiers reste
    // lisible, un million dans un seul répertoire ne l'est plus.
    const storageKey = join(sha256.slice(0, 2), sha256.slice(2, 4), `${sha256}${extension}`);
    const target = this.absolute(storageKey);

    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);

    return { storageKey, sha256, size: content.byteLength };
  }

  /**
   * Relit un contenu et vérifie son empreinte.
   *
   * Un fichier qui ne correspond plus à son empreinte n'est pas servi : mieux
   * vaut une erreur qu'un rapport d'inspection silencieusement altéré.
   */
  async get(storageKey: string, expectedSha256?: string): Promise<Buffer> {
    const content = await readFile(this.absolute(storageKey));

    if (expectedSha256) {
      const actual = createHash('sha256').update(content).digest('hex');
      if (actual !== expectedSha256) {
        this.logger.error(`Empreinte incohérente pour ${storageKey}`);
        throw new InternalServerErrorException(
          'Le fichier stocké ne correspond plus à son empreinte. Contactez l’administrateur.',
        );
      }
    }

    return content;
  }

  /**
   * Chemin absolu d'une clé, avec garde-fou : une clé forgée ne doit pas
   * pouvoir sortir de la racine de stockage.
   */
  private absolute(storageKey: string): string {
    const target = resolve(this.root, storageKey);
    if (target !== this.root && !target.startsWith(this.root + sep)) {
      throw new InternalServerErrorException('Clé de stockage invalide.');
    }
    return target;
  }
}
