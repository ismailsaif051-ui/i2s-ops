/**
 * Redéfinit le mot de passe d'un compte.
 *
 * Le seed ne touche jamais à un compte existant : sans cette commande, un mot
 * de passe perdu ferme la plateforme à son administrateur. Le nouveau mot de
 * passe est tapé ici, jamais passé en argument ni en variable d'environnement
 * — un argument se retrouve dans l'historique du terminal et dans la liste des
 * processus.
 *
 *   npm run db:reset-admin                        (admin@i2s-testing.ma)
 *   npm run db:reset-admin -- autre@i2s-testing.ma
 */
import { createInterface } from 'node:readline';
import { hash } from '@node-rs/argon2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Longueur minimale : elle vaut mieux que la complexité pour résister au cassage. */
const LONGUEUR_MINIMALE = 12;

/** Saisie masquée : le mot de passe ne s'affiche pas, même à l'écran de la personne. */
function demanderMotDePasse(invite: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(
        new Error(
          'Cette commande a besoin d’un terminal interactif : lancez-la depuis une fenêtre de terminal.',
        ),
      );
      return;
    }

    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const sortie = process.stdout;

    // On masque ce qui est tapé en interceptant l'écho de readline.
    const ecrire = (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput.bind(rl);
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (chaine: string) => {
      if (chaine.includes(invite)) ecrire(chaine);
      else sortie.write('');
    };

    rl.question(invite, (reponse) => {
      sortie.write('\n');
      rl.close();
      resolve(reponse);
    });
  });
}

async function main() {
  const email = (process.argv[2] ?? 'admin@i2s-testing.ma').trim().toLowerCase();

  const utilisateur = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, status: true, lockedUntil: true },
  });

  if (!utilisateur) {
    throw new Error(
      `Aucun compte « ${email} ». Vérifiez l’adresse, ou lancez le seed pour créer l’administrateur.`,
    );
  }

  console.log(`\n  Compte : ${utilisateur.email} (${utilisateur.status})`);
  console.log('  Le mot de passe saisi ne s’affiche pas.\n');

  const motDePasse = await demanderMotDePasse('  Nouveau mot de passe : ');
  if (motDePasse.length < LONGUEUR_MINIMALE) {
    throw new Error(`Mot de passe trop court : ${LONGUEUR_MINIMALE} caractères au minimum.`);
  }

  const confirmation = await demanderMotDePasse('  Confirmation          : ');
  if (motDePasse !== confirmation) throw new Error('Les deux saisies diffèrent : rien n’a été modifié.');

  const passwordHash = await hash(motDePasse, { memoryCost: 19456, timeCost: 2, parallelism: 1 });

  await prisma.user.update({
    where: { id: utilisateur.id },
    data: {
      passwordHash,
      // Le compte est rouvert : un mot de passe perdu s'accompagne souvent
      // d'un verrouillage après tentatives infructueuses.
      mustChangePassword: false,
      failedAttempts: 0,
      lockedUntil: null,
      status: 'ACTIVE',
    },
  });

  console.log('\n✓ Mot de passe redéfini. Il n’est enregistré nulle part en clair.\n');
}

main()
  .catch((e) => {
    console.error(`\n✗ ${(e as Error).message}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
