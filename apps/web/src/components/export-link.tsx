import { can, type Resource } from '@i2s/contracts';
import { requireSession } from '@/lib/api';

/**
 * Lien d'extraction Excel, affiché seulement à qui a le droit EXPORT sur la
 * ressource — même principe que CreateLink (cahier des charges §21 : aucun
 * bouton ne doit mener à un refus).
 */
export async function ExportLink({
  href,
  label = 'Exporter Excel',
  resource,
}: {
  href: string;
  label?: string;
  resource: Resource;
}) {
  const session = await requireSession();
  const permissions = session.permissions as Parameters<typeof can>[0];

  if (!can(permissions, resource, 'EXPORT')) return null;

  return (
    <a
      href={href}
      className="inline-flex h-10 items-center rounded-[10px] border border-border-strong bg-surface px-4 text-[14px] font-medium text-text shadow-sm transition-colors hover:border-accent hover:text-accent"
    >
      {label}
    </a>
  );
}
