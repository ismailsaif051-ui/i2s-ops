'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { NAVIGATION, ROLE_LABELS, can, type RoleCode, type SessionUser } from '@i2s/contracts';
import {
  IconAffairs,
  IconBell,
  IconChevronRight,
  IconClose,
  IconCommercial,
  IconDocuments,
  IconFinance,
  IconHome,
  IconKey,
  IconLogout,
  IconMenu,
  IconOperations,
  IconOverview,
  IconProductivity,
  IconProfitability,
  IconQuality,
  IconResources,
  IconSettings,
} from '@/components/icons';

/**
 * Rubriques dépliées, par utilisateur et par navigateur — une préférence
 * d'affichage, elle ne remonte pas au serveur.
 */
const EXPANDED_KEY = 'i2s-system.nav-expanded';

type Icon = (props: { size?: number; className?: string }) => React.ReactNode;

/** Pilotage : entrées directes. Libellés du modèle Clarté. */
const PILOTAGE: Record<string, { label: string; icon: Icon; also?: string[] }> = {
  '/cockpit': { label: 'Vue d’ensemble', icon: IconOverview },
  // « Jours non affectés » reste accessible depuis la page Productivité.
  '/pilotage/productivite': {
    label: 'Productivité',
    icon: IconProductivity,
    also: ['/pilotage/jours-non-affectes'],
  },
  '/pilotage/rentabilite': { label: 'Rentabilité', icon: IconProfitability },
  '/pilotage/qualite': { label: 'Qualité', icon: IconQuality },
};

/** Activité : une rubrique par domaine, dépliable si elle a plusieurs pages. */
const ACTIVITE: Array<{ key: string; icon: Icon }> = [
  { key: 'commercial', icon: IconCommercial },
  { key: 'affaires', icon: IconAffairs },
  { key: 'operations', icon: IconOperations },
  { key: 'finance', icon: IconFinance },
  { key: 'ressources', icon: IconResources },
  { key: 'ged', icon: IconDocuments },
];

const isOn = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/**
 * Cadre de l'application — modèle « Clarté V2 » (DESIGN-I2S-CLARTE.md).
 *
 * Le menu est CONSTRUIT à partir des droits effectifs de l'utilisateur : une
 * entrée dont le droit manque n'est pas grisée, elle est absente
 * (docs/06-SITEMAP-UX.md §2). Aucune destination existante n'a été retirée :
 * seules l'organisation et la présentation changent.
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
  const [profileOpen, setProfileOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const menuButton = useRef<HTMLButtonElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(EXPANDED_KEY) ?? 'null');
      if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
        setExpanded(stored as Record<string, boolean>);
      }
    } catch {
      // Stockage indisponible : les rubriques suivent la page ouverte.
    }
  }, []);

  // Panneau mobile : Échap le ferme et rend le focus au bouton d'ouverture.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (open) {
        setOpen(false);
        menuButton.current?.focus();
      }
      setProfileOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Le menu du profil se ferme au clic ailleurs.
  useEffect(() => {
    if (!profileOpen) return;
    function onClick(event: MouseEvent) {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [profileOpen]);

  // Changer de page referme le panneau mobile.
  useEffect(() => {
    setOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  const permissions = session.permissions as Parameters<typeof can>[0];
  const allowed = NAVIGATION.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.requires || can(permissions, item.requires.resource, item.requires.action),
    ),
  })).filter((group) => group.items.length > 0);
  const byKey = new Map(allowed.map((g) => [g.key, g]));

  const pilotage = (byKey.get('pilotage')?.items ?? []).filter((item) => PILOTAGE[item.href]);
  const activite = ACTIVITE.flatMap(({ key, icon }) => {
    const group = byKey.get(key);
    return group ? [{ ...group, icon }] : [];
  });
  const admin = byKey.get('admin');

  // Fil d'Ariane : rubrique / page, déduits de la navigation.
  const crumb = (() => {
    for (const item of pilotage) {
      const meta = PILOTAGE[item.href]!;
      if (isOn(pathname, item.href) || meta.also?.some((h) => isOn(pathname, h))) {
        const sub = meta.also?.find((h) => isOn(pathname, h));
        const subLabel = sub ? byKey.get('pilotage')?.items.find((i) => i.href === sub)?.label : null;
        return { group: 'Pilotage', page: subLabel ?? meta.label };
      }
    }
    for (const group of [...activite, ...(admin ? [{ ...admin, label: 'Paramètres' }] : [])]) {
      const hit = [...group.items].sort((a, b) => b.href.length - a.href.length).find((i) => isOn(pathname, i.href));
      if (hit) return { group: group.label, page: hit.label === group.label ? null : hit.label };
    }
    if (isOn(pathname, '/notifications')) return { group: 'Notifications', page: null };
    return null;
  })();

  const displayName = session.employee
    ? `${session.employee.firstName} ${session.employee.lastName}`
    : (ROLE_LABELS[session.roles[0]?.code as RoleCode] ?? 'Utilisateur');
  const initials = session.employee
    ? `${session.employee.firstName[0] ?? ''}${session.employee.lastName[0] ?? ''}`.toUpperCase()
    : session.email.slice(0, 2).toUpperCase();
  const primaryRole = session.roles[0]?.code as RoleCode | undefined;

  function toggle(key: string, holdsActive: boolean) {
    setExpanded((current) => {
      const isOpen = current[key] ?? holdsActive;
      const next = { ...current, [key]: !isOpen };
      try {
        localStorage.setItem(EXPANDED_KEY, JSON.stringify(next));
      } catch {
        // Sans mémoire : le dépliage vaut pour la session en cours.
      }
      return next;
    });
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  const entryBase =
    'group relative flex min-h-[44px] items-center gap-3 rounded-[8px] px-3 text-[14.5px] transition-colors duration-150';
  const entryState = (active: boolean) =>
    active
      ? 'bg-rail-active font-medium text-accent before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-brand'
      : 'text-rail-text hover:bg-[#e7e9e4] hover:text-[var(--rail-text-strong)]';

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-6 pb-5 pt-6">
        <Link href="/cockpit" className="block" aria-label="I2S TESTING — Vue d’ensemble">
          {/* Logo officiel, fichier haute définition, ratio conservé. */}
          <img src="/brand/logo-i2s-testing.png" alt="I2S TESTING — Safer. Better. Further." width={224} height={59} className="h-auto w-[200px] lg:w-[224px]" />
        </Link>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            menuButton.current?.focus();
          }}
          className="rounded-[8px] p-2 text-rail-text hover:bg-[#e7e9e4] lg:hidden"
          aria-label="Fermer le menu"
        >
          <IconClose />
        </button>
      </div>

      <div className="mx-4 mb-5 rounded-[10px] border border-border bg-surface px-4 py-3">
        <p className="text-[14px] font-semibold leading-tight">I2S-System</p>
        <p className="text-[12.5px] text-muted">{session.companies[0]?.name ?? 'I2S TESTING'}</p>
      </div>

      <nav aria-label="Navigation principale" className="flex-1 overflow-y-auto px-4 pb-4">
        {pilotage.length > 0 && (
          <div className="mb-5">
            <p className="mb-1.5 px-3 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-rail-muted">Pilotage</p>
            {pilotage.map((item) => {
              const meta = PILOTAGE[item.href]!;
              const active = isOn(pathname, item.href) || !!meta.also?.some((h) => isOn(pathname, h));
              const Icon = meta.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`${entryBase} ${entryState(active)}`}
                >
                  <Icon className="shrink-0" />
                  {meta.label}
                </Link>
              );
            })}
          </div>
        )}

        {activite.length > 0 && (
          <div className="mb-5">
            <p className="mb-1.5 px-3 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-rail-muted">Activité</p>
            {activite.map((group) => {
              const Icon = group.icon;
              const holdsActive = group.items.some((i) => isOn(pathname, i.href));

              // Une seule page : lien direct, sans chevron.
              if (group.items.length === 1) {
                const item = group.items[0]!;
                return (
                  <Link
                    key={group.key}
                    href={item.href}
                    aria-current={holdsActive ? 'page' : undefined}
                    className={`${entryBase} ${entryState(holdsActive)}`}
                  >
                    <Icon className="shrink-0" />
                    {group.label === 'Documents' ? 'Documents' : group.label}
                  </Link>
                );
              }

              const isOpen = expanded[group.key] ?? holdsActive;
              return (
                <div key={group.key}>
                  <button
                    type="button"
                    onClick={() => toggle(group.key, holdsActive)}
                    aria-expanded={isOpen}
                    aria-controls={`nav-${group.key}`}
                    className={`${entryBase} w-full ${
                      holdsActive && !isOpen ? entryState(true) : `${holdsActive ? 'font-medium text-[var(--rail-text-strong)]' : 'text-rail-text'} hover:bg-[#e7e9e4]`
                    }`}
                  >
                    <Icon className="shrink-0" />
                    <span className="flex-1 text-left">{group.label}</span>
                    <IconChevronRight
                      size={16}
                      className={`shrink-0 text-rail-muted transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}
                    />
                  </button>
                  <div id={`nav-${group.key}`} hidden={!isOpen} className="mb-1 ml-[22px] border-l border-rail-border pl-3">
                    {group.items.map((item) => {
                      const active = isOn(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          className={`block rounded-[8px] px-3 py-2 text-[14px] transition-colors duration-150 ${
                            active
                              ? 'bg-rail-active font-medium text-accent'
                              : 'text-rail-text hover:bg-[#e7e9e4] hover:text-[var(--rail-text-strong)]'
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </nav>

      <div className="border-t border-rail-border px-4 pb-4 pt-3">
        {admin && (
          <div className="mb-2">
            {(() => {
              const holdsActive = admin.items.some((i) => isOn(pathname, i.href));
              const isOpen = expanded.admin ?? holdsActive;
              return (
                <>
                  <button
                    type="button"
                    onClick={() => toggle('admin', holdsActive)}
                    aria-expanded={isOpen}
                    aria-controls="nav-admin"
                    className={`${entryBase} w-full ${holdsActive && !isOpen ? entryState(true) : 'text-rail-text hover:bg-[#e7e9e4]'}`}
                  >
                    <IconSettings className="shrink-0" />
                    <span className="flex-1 text-left">Paramètres</span>
                    <IconChevronRight size={16} className={`shrink-0 text-rail-muted transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`} />
                  </button>
                  <div id="nav-admin" hidden={!isOpen} className="mb-1 ml-[22px] border-l border-rail-border pl-3">
                    {admin.items.map((item) => {
                      const active = isOn(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          className={`block rounded-[8px] px-3 py-2 text-[14px] transition-colors duration-150 ${
                            active ? 'bg-rail-active font-medium text-accent' : 'text-rail-text hover:bg-[#e7e9e4]'
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            className="flex w-full items-center gap-3 rounded-[10px] px-2 py-2 text-left transition-colors hover:bg-[#e7e9e4]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[13px] font-semibold text-text" aria-hidden="true">
              {initials}
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[14px] font-semibold">{displayName}</span>
              <span className="block truncate text-[12.5px] text-muted">{session.email}</span>
            </span>
            <IconChevronRight size={16} className="shrink-0 text-rail-muted" />
          </button>

          {profileOpen && (
            <div role="menu" className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-[10px] border border-border bg-surface shadow-[var(--shadow-menu)]">
              <p className="border-b border-border px-4 py-3 text-[13px] text-muted">
                {primaryRole ? (ROLE_LABELS[primaryRole] ?? primaryRole) : '—'}
                {session.employee?.departmentCode ? ` · ${session.employee.departmentCode}` : ''}
              </p>
              <Link role="menuitem" href="/changer-mot-de-passe" className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] hover:bg-surface-2">
                <IconKey size={18} /> Changer le mot de passe
              </Link>
              <button role="menuitem" type="button" onClick={logout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[14px] text-accent hover:bg-surface-2">
                <IconLogout size={18} /> Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)] min-[1440px]:grid-cols-[280px_minmax(0,1fr)]">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-[8px] focus:bg-surface focus:px-4 focus:py-2 focus:shadow-[var(--shadow-menu)]">
        Aller au contenu
      </a>

      {/* Menu : colonne fixe sur grand écran, panneau ouvrable en dessous. */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[280px] max-w-[88vw] border-r border-rail-border bg-rail shadow-[var(--rail-shadow)] transition-transform duration-150 lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:w-auto lg:max-w-none lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebar}
      </aside>
      {open && (
        <button type="button" aria-label="Fermer le menu" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/30 lg:hidden" />
      )}

      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-surface px-4 md:px-6 min-[1440px]:px-8">
          <button
            ref={menuButton}
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-[8px] p-2 text-text hover:bg-surface-2 lg:hidden"
            aria-label="Ouvrir le menu"
            aria-expanded={open}
          >
            <IconMenu />
          </button>

          <nav aria-label="Fil d’Ariane" className="flex min-w-0 items-center gap-2 text-[14px]">
            <Link href="/cockpit" className="shrink-0 text-muted hover:text-text" aria-label="Accueil">
              <IconHome size={18} />
            </Link>
            {crumb && (
              <>
                <IconChevronRight size={14} className="shrink-0 text-subtle" />
                <span className={crumb.page ? 'truncate text-muted' : 'truncate font-medium'}>{crumb.group}</span>
                {crumb.page && (
                  <>
                    <span className="text-subtle" aria-hidden="true">/</span>
                    <span className="truncate font-medium">{crumb.page}</span>
                  </>
                )}
              </>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/notifications"
              className="relative rounded-[8px] p-2.5 text-text transition-colors hover:bg-surface-2"
              aria-label={unreadCount > 0 ? `Notifications : ${unreadCount} non lue(s)` : 'Notifications'}
            >
              <IconBell />
              {unreadCount > 0 && (
                <span className="tnum absolute right-1 top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            {isDemo && (
              <span
                className="rounded-[8px] border border-accent px-3 py-1.5 text-[13.5px] font-semibold text-accent"
                title="Données de démonstration — clients, affaires, montants et personnes sont fictifs"
              >
                Démo
              </span>
            )}
          </div>
        </header>

        <main id="contenu" className="flex-1 px-4 py-6 md:px-6 md:py-7 min-[1440px]:px-8 min-[1440px]:py-8">
          <div className="mx-auto max-w-[1360px]">{children}</div>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface px-4 py-3 text-[12.5px] text-muted md:px-6 min-[1440px]:px-8">
          <p>
            <span className="font-semibold tracking-[0.04em] text-text">I2S TESTING</span>
            <span className="mx-2 text-border-strong" aria-hidden="true">|</span>
            Safer. Better. Further.
          </p>
          {isDemo && <p>Données de démonstration — clients, affaires, montants et personnes sont fictifs.</p>}
        </footer>
      </div>
    </div>
  );
}
