import Link from 'next/link';
import { can, type Action, type Resource } from '@i2s/contracts';
import { requireSession } from '@/lib/api';

/**
 * Bouton d'ouverture, affiché seulement à qui a le droit correspondant.
 *
 * Exigence du cahier des charges §21 : aucun bouton ne doit mener à un refus.
 * Le droit est celui que l'API exigera, pas une approximation d'interface.
 */
export async function CreateLink({
  href,
  label,
  resource,
  action = 'CREATE',
}: {
  href: string;
  label: string;
  resource: Resource;
  action?: Action;
}) {
  const session = await requireSession();
  const permissions = session.permissions as Parameters<typeof can>[0];

  if (!can(permissions, resource, action)) return null;

  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center rounded-[10px] bg-accent px-4 text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-accent-hover"
    >
      {label}
    </Link>
  );
}
