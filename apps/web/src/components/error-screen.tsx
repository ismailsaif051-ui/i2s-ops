'use client';

import { startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

/**
 * Écran affiché quand une page ne se charge pas.
 *
 * Sans lui, Next.js affichait une phrase technique en anglais sur fond blanc.
 * La cause la plus fréquente est bénigne — le service redémarre après une
 * période sans usage — et l'utilisateur doit le savoir pour ne pas croire
 * l'application cassée.
 */
export function ErrorScreen({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="mx-auto flex max-w-[56ch] flex-col items-start gap-4 px-5 py-16">
      <p className="text-[12.5px] font-medium uppercase tracking-wide text-accent">
        Page indisponible
      </p>
      <h1 className="text-[24px] font-semibold leading-tight">
        Cette page n’a pas pu se charger
      </h1>
      <p className="text-[14.5px] leading-relaxed text-muted">
        Le plus souvent, le service redémarre après une période sans activité, ce qui prend
        jusqu’à une minute. Réessayez dans un instant. Si le problème persiste, transmettez la
        référence ci-dessous à l’administrateur.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {/* Une erreur rendue côté serveur ne se rejoue qu'en redemandant la page. */}
        <Button variant="primary" onClick={() => startTransition(() => { router.refresh(); reset(); })}>
          Réessayer
        </Button>
        <a
          href="/cockpit"
          className="inline-flex h-10 items-center rounded-[10px] border border-border-strong bg-surface px-4 text-[14px] font-medium transition-colors hover:bg-surface-2"
        >
          Retour au Dashboard
        </a>
      </div>

      {error.digest && (
        <p className="ref text-[12px] text-subtle">Référence : {error.digest}</p>
      )}
    </div>
  );
}
