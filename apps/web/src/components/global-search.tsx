'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface SearchPage {
  href: string;
  label: string;
  group: string;
}

interface Hit {
  id: string;
  label: string;
  detail: string;
  href: string;
}

interface Group {
  key: string;
  label: string;
  hits: Hit[];
}

function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  );
}

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Recherche globale (Ctrl K ou ⌘ K).
 *
 * Deux sources : les pages du menu auxquelles l'utilisateur a droit, filtrées
 * ici, et les dossiers (affaires, clients, missions, rapports, factures,
 * employés), cherchés par l'API dans le périmètre de l'utilisateur. Rien
 * n'est modifié depuis cette fenêtre : chaque résultat ouvre sa fiche.
 */
export function GlobalSearch({ pages }: { pages: SearchPage[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const [isMac, setIsMac] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const listId = 'recherche-resultats';

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setGroups([]);
      setFailed(false);
    }
  }, [open]);
  // Le focus est donné à l'apparition du champ (autoFocus) : rien de ce qui
  // est tapé juste après Ctrl K ne se perd.

  // Dossiers : interrogés après une courte pause de frappe.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setGroups([]);
      setLoading(false);
      setFailed(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!response.ok) throw new Error(String(response.status));
        setGroups((await response.json()) as Group[]);
        setFailed(false);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setGroups([]);
          setFailed(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const pageHits = useMemo(() => {
    const q = normalize(query.trim());
    if (q.length < 1) return [];
    return pages
      .filter((p) => normalize(`${p.label} ${p.group}`).includes(q))
      .slice(0, 5)
      .map((p) => ({ id: p.href, label: p.label, detail: p.group, href: p.href }));
  }, [pages, query]);

  const sections: Group[] = [
    ...(pageHits.length > 0 ? [{ key: 'pages', label: 'Pages', hits: pageHits }] : []),
    ...groups,
  ];
  const flat = sections.flatMap((s) => s.hits);

  useEffect(() => setActive(0), [query, groups.length]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function go(hit: Hit) {
    setOpen(false);
    router.push(hit.href);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => (flat.length === 0 ? 0 : (i + 1) % flat.length));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (flat.length === 0 ? 0 : (i - 1 + flat.length) % flat.length));
    } else if (event.key === 'Enter' && flat[active]) {
      event.preventDefault();
      go(flat[active]);
    }
  }

  const shortcut = isMac ? '⌘ K' : 'Ctrl K';
  let index = -1;

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 items-center gap-2.5 rounded-[8px] border border-border bg-surface-2 px-3 text-[14px] text-muted transition-colors hover:border-border-strong hover:text-text md:w-[340px] min-[1440px]:w-[420px]"
        aria-label={`Rechercher dans I2S (${shortcut})`}
      >
        <SearchIcon />
        <span className="hidden md:inline">Rechercher dans I2S…</span>
        <kbd className="ml-auto hidden rounded-[5px] border border-border-strong bg-surface px-1.5 py-0.5 text-[11.5px] font-medium text-subtle md:inline">
          {shortcut}
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/35 px-4 pt-[10vh]" onMouseDown={close}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Recherche globale"
            className="w-full max-w-[640px] overflow-hidden rounded-[12px] border border-border bg-surface shadow-[var(--shadow-menu)]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <span className="text-muted">
                <SearchIcon size={20} />
              </span>
              <input
                ref={input}
                autoFocus
                id="recherche-globale"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Affaire, client, mission, rapport, facture, employé ou page…"
                className="h-14 w-full bg-transparent text-[16px] text-text outline-none placeholder:text-subtle"
                role="combobox"
                aria-expanded={flat.length > 0}
                aria-controls={listId}
                aria-activedescendant={flat[active] ? `hit-${active}` : undefined}
                autoComplete="off"
                spellCheck={false}
              />
              <button type="button" onClick={close} className="rounded-[6px] border border-border px-2 py-1 text-[12px] text-muted hover:text-text">
                Échap
              </button>
            </div>

            <div id={listId} role="listbox" aria-label="Résultats" className="max-h-[60vh] overflow-y-auto py-2">
              {query.trim().length === 0 && (
                <p className="px-4 py-3 text-[14px] text-muted">
                  Tapez au moins deux caractères : numéro d’affaire (26/0142), client, mission (MIS-26-…),
                  facture (F-26-…), matricule ou nom.
                </p>
              )}
              {sections.map((section) => (
                <div key={section.key} role="group" aria-label={section.label} className="pb-1">
                  <p className="px-4 pb-1 pt-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-subtle">
                    {section.label}
                  </p>
                  {section.hits.map((hit) => {
                    index += 1;
                    const i = index;
                    return (
                      <button
                        key={`${section.key}-${hit.id}`}
                        id={`hit-${i}`}
                        type="button"
                        role="option"
                        aria-selected={i === active}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => go(hit)}
                        className={`flex w-full items-baseline gap-3 px-4 py-2.5 text-left ${i === active ? 'bg-accent-soft' : ''}`}
                      >
                        <span className={`ref shrink-0 text-[14.5px] font-medium ${i === active ? 'text-accent' : 'text-text'}`}>
                          {hit.label}
                        </span>
                        <span className="min-w-0 truncate text-[13.5px] text-muted">{hit.detail}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
              {query.trim().length >= 2 && loading && flat.length === 0 && (
                <p className="px-4 py-3 text-[14px] text-muted" role="status">Recherche…</p>
              )}
              {query.trim().length >= 2 && !loading && failed && (
                <p className="px-4 py-3 text-[14px] text-danger" role="alert">La recherche n’a pas abouti. Réessayez dans un instant.</p>
              )}
              {query.trim().length >= 2 && !loading && !failed && flat.length === 0 && (
                <p className="px-4 py-3 text-[14px] text-muted" role="status">Aucun résultat pour « {query.trim()} » dans votre périmètre.</p>
              )}
            </div>

            <p className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border bg-surface-2 px-4 py-2 text-[12px] text-subtle">
              <span>↑ ↓ pour choisir</span>
              <span>Entrée pour ouvrir</span>
              <span>Échap pour fermer</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
