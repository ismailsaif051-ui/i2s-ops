import Link from 'next/link';
import { Card, PageHeader, StatusBadge } from '@/components/ui';

/**
 * Page d'un module non encore construit.
 *
 * Le cahier des charges (§21) interdit les boutons qui ne font rien. Plutôt
 * que de laisser une entrée de menu mener à une erreur 404, on affiche ce que
 * le module fera, dans quelle phase, et ce sur quoi il s'appuiera — ainsi le
 * plan reste lisible et rien n'est présenté comme fonctionnel.
 */
export function ModuleAVenir({
  eyebrow,
  title,
  phase,
  summary,
  capabilities,
  dependsOn,
}: {
  eyebrow: string;
  title: string;
  phase: 'MVP' | 'V2' | 'V3';
  summary: string;
  capabilities: string[];
  dependsOn?: { label: string; href: string }[];
}) {
  const tone = phase === 'MVP' ? 'warning' : phase === 'V2' ? 'info' : 'neutral';

  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={summary} />

      <Card
        title="Module à construire"
        action={<StatusBadge tone={tone}>Prévu en {phase}</StatusBadge>}
      >
        <div className="px-5 py-5">
          <p className="mb-3 text-[14.5px] font-medium">Ce que ce module fera</p>
          <ul className="mb-6 flex flex-col gap-2">
            {capabilities.map((c) => (
              <li key={c} className="flex gap-3 text-[14.5px] leading-relaxed text-muted">
                <span className="equerre mt-1.5 shrink-0" aria-hidden="true" />
                <span>{c}</span>
              </li>
            ))}
          </ul>

          {dependsOn && dependsOn.length > 0 && (
            <>
              <p className="mb-2 text-[14.5px] font-medium">
                En attendant, ces écrans couvrent une partie du besoin
              </p>
              <ul className="flex flex-wrap gap-2">
                {dependsOn.map((d) => (
                  <li key={d.href}>
                    <Link
                      href={d.href}
                      className="inline-block rounded-[8px] border border-border-strong bg-surface px-3 py-1.5 text-[14px] transition-colors hover:bg-surface-2"
                    >
                      {d.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Card>

      <p className="mt-5 max-w-[74ch] text-[13.5px] text-subtle">
        Cette page est un jalon de la feuille de route, pas une fonctionnalité. Rien de ce qui
        s’affiche ici n’est actif, et aucune donnée n’est présentée comme réelle.
      </p>
    </>
  );
}
