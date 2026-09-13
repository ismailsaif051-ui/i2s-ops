'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { NAVIGATION, ROLE_LABELS, can, type RoleCode, type SessionUser } from '@i2s/contracts';

/**
 * Le menu est CONSTRUIT à partir des droits effectifs de l'utilisateur.
 * Une entrée dont le droit manque n'est pas grisée : elle est absente
 * (docs/06-SITEMAP-UX.md §2).
 */
export function AppShell({
  session,
  unreadCount,
  isDemo = false,
  children,
}: {
  session: SessionUser;
  unreadCount: number;
  isDemo?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const permissions = session.permissions as Parameters<typeof can>[0];

  const groups = NAVIGATION.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.requires || can(permissions, item.requires.resource, item.requires.action),
    ),
  })).filter((group) => group.items.length > 0);

  const displayName = session.employee
    ? `${session.employee.firstName} ${session.employee.lastName}`
    : session.email;

  const initials = session.employee
    ? `${session.employee.firstName[0] ?? ''}${session.employee.lastName[0] ?? ''}`.toUpperCase()
    : session.email.slice(0, 2).toUpperCase();

  const primaryRole = session.roles[0]?.code as RoleCode | undefined;

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[268px_minmax(0,1fr)]">
      <aside
        className={`${open ? 'block' : 'hidden'} border-r border-rail-border bg-rail lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-y-auto`}
      >
        <div className="px-6 pb-5 pt-6">
          <p className="flex items-baseline gap-2 text-[21px] font-semibold tracking-[-0.02em] text-[var(--rail-text-strong)]">
            I2S OPS
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          </p>
          <p className="mt-0.5 text-[13px] text-rail-muted">
            {session.companies[0]?.name ?? 'I2S TESTING'}
          </p>
        </div>

        <nav className="px-3 pb-6">
          {groups.map((group) => (
            <div key={group.key} className="mb-5">
              <p className="px-3 pb-1.5 text-[12.5px] font-medium text-rail-muted">{group.label}</p>
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`mb-0.5 block rounded-[10px] px-3 py-2 text-[14.5px] transition-colors ${
                      active
                        ? 'bg-rail-active font-medium text-accent'
                        : 'text-rail-text hover:bg-surface-2 hover:text-[var(--rail-text-strong)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-surface px-5 py-3 lg:px-8">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-[10px] border border-border-strong px-3 py-1.5 text-[14px] lg:hidden"
            aria-expanded={open}
          >
            Menu
          </button>

          <div className="ml-auto flex items-center gap-5">
            <Link
              href="/notifications"
              className="flex items-center gap-2 text-[14px] text-muted transition-colors hover:text-text"
            >
              Notifications
              {unreadCount > 0 && (
                <span className="tnum inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[12px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>

            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-[13px] font-semibold text-primary"
                aria-hidden="true"
              >
                {initials}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="text-[14px] font-medium">{displayName}</p>
                <p className="text-[12.5px] text-subtle">
                  {primaryRole ? (ROLE_LABELS[primaryRole] ?? primaryRole) : '—'}
                  {session.employee?.departmentCode ? ` · ${session.employee.departmentCode}` : ''}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="rounded-[10px] border border-border-strong px-3 py-1.5 text-[14px] transition-colors hover:bg-surface-2"
            >
              Déconnexion
            </button>
          </div>
        </header>

        {isDemo && (
          <p className="border-b border-border bg-warning-soft px-5 py-2 text-center text-[13.5px] text-warning lg:px-8">
            Données de démonstration — clients, affaires, montants et personnes sont fictifs
          </p>
        )}

        <main className="px-5 py-8 lg:px-8">
          <div className="mx-auto max-w-[1320px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
