'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />
    </svg>
  );
}

/**
 * Sélecteur de période et export de la Vue d'ensemble.
 *
 * Le mois choisi vit dans l'adresse (?month=AAAA-MM) : la page se partage et
 * se recharge telle quelle. Seuls les mois écoulés sont proposés — un mois à
 * venir n'a pas encore de chiffres.
 */
export function PeriodControls({
  current,
  months,
  tab = 'synthese',
}: {
  current: string;
  months: Array<{ value: string; label: string }>;
  /** Onglet ouvert, conservé quand on change de mois. */
  tab?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="relative flex h-10 items-center gap-2 rounded-[8px] border border-border bg-surface pl-3 text-[14px] text-text hover:border-border-strong focus-within:border-accent">
        <CalendarIcon />
        <span className="sr-only">Période</span>
        <select
          id="periode"
          value={current}
          disabled={pending}
          onChange={(e) =>
            startTransition(() =>
              router.push(`/cockpit?month=${e.target.value}${tab === 'synthese' ? '' : `&tab=${tab}`}`),
            )
          }
          className="h-full cursor-pointer appearance-none bg-transparent pr-9 font-medium capitalize outline-none disabled:cursor-wait"
          aria-describedby="periode-aide"
        >
          {months.map((m) => (
            <option key={m.value} value={m.value} className="capitalize">
              {m.label}
            </option>
          ))}
        </select>
        <svg className="pointer-events-none absolute right-3 text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </label>
      <a
        href={`/api/analytics/dashboard/export?month=${current}`}
        className="flex h-10 items-center gap-2 rounded-[8px] border border-border bg-surface px-3.5 text-[14px] font-medium text-text hover:border-border-strong hover:bg-surface-2"
      >
        <DownloadIcon />
        Exporter
      </a>
      <span id="periode-aide" className="sr-only">
        Les cumuls « année » vont du 1er janvier à la fin du mois choisi.
      </span>
      {pending && (
        <span role="status" className="text-[13px] text-muted">
          Mise à jour…
        </span>
      )}
    </div>
  );
}
