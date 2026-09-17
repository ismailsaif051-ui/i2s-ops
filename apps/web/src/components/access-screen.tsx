import Link from 'next/link';

/**
 * Écran d'une page que l'on ne peut pas afficher — refus d'accès ou adresse
 * inconnue. Ce n'est pas une panne : l'écran le dit, et propose un retour.
 */
export function AccessScreen({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-[56ch] flex-col items-start gap-4 px-5 py-16">
      <p className="text-[12.5px] font-medium uppercase tracking-wide text-accent">{eyebrow}</p>
      <h1 className="text-[24px] font-semibold leading-tight">{title}</h1>
      <p className="text-[14.5px] leading-relaxed text-muted">{children}</p>
      <Link
        href="/cockpit"
        className="inline-flex h-10 items-center rounded-[10px] border border-border-strong bg-surface px-4 text-[14px] font-medium transition-colors hover:bg-surface-2"
      >
        Retour au Dashboard
      </Link>
    </div>
  );
}

export function ForbiddenScreen() {
  return (
    <AccessScreen eyebrow="Accès refusé" title="Vous n’avez pas accès à cette page">
      Votre rôle ne permet pas de consulter cet écran ou cet enregistrement. Si vous en avez besoin
      pour votre travail, demandez l’accès à l’administrateur de la plateforme.
    </AccessScreen>
  );
}

export function NotFoundScreen() {
  return (
    <AccessScreen eyebrow="Page introuvable" title="Cette page n’existe pas ou plus">
      L’adresse est peut-être erronée, ou l’enregistrement a été supprimé ou se trouve hors de votre
      périmètre.
    </AccessScreen>
  );
}
