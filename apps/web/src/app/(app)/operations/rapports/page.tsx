import Link from 'next/link';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import type { ReportStatus } from '@i2s/contracts';
import { REPORT_STATUS_LABELS, date, percent } from '@/lib/format';
import {
  Card, DataTable, EmptyState, KpiCard, KpiRow, NextActionBanner,
  PageHeader, StatusBadge, Td, Th, type Tone,
} from '@/components/ui';
import { AutoSubmitForm } from '@/components/auto-submit-form';

export const metadata: Metadata = { title: 'Rapports' };

interface ReportRow {
  id: string;
  number: string;
  status: ReportStatus;
  revision: number;
  type: { id: string; formCode: string; title: string; department: string | null } | null;
  affair: { number: string; title: string };
  client: { id: string; name: string };
  department: string | null;
  mission: { number: string; reportDueDate: string | null; actualEndDate: string | null };
  controlDate: string | null;
  author: string;
  checker: string | null;
  submittedAt: string | null;
  issuedAt: string | null;
  deliveredAt: string | null;
  onTime: boolean | null;
  overdueDays: number;
  late: boolean;
  canCheck: boolean;
  isAuthor: boolean;
}

interface Facet {
  id: string;
  name: string;
  count: number;
}

interface ReportList {
  items: ReportRow[];
  total: number;
  /** Absent le temps qu'un déploiement aligne l'API sur le web. */
  facets?: {
    templates: Array<{ id: string; formCode: string; title: string; department: string | null; count: number }>;
    statuses: Array<{ value: string; label: string; count: number }>;
    departments: Array<{ id: string; code: string; name: string; count: number }>;
    authors: Facet[];
    clients: Facet[];
    untyped: number;
  };
}

const TONE: Record<string, Tone> = {
  DRAFT: 'neutral',
  SUBMITTED: 'warning',
  UNDER_CHECK: 'warning',
  CORRECTION: 'danger',
  VALIDATED: 'info',
  ISSUED: 'success',
  ARCHIVED: 'neutral',
};

const FILTER_KEYS = [
  'q',
  'templateId',
  'status',
  'departmentId',
  'authorId',
  'clientId',
  'from',
  'to',
  'late',
] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

const inputClass =
  'h-10 w-full rounded-[8px] border border-border-strong bg-surface px-3 text-[14px] outline-none focus:border-accent';

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Partial<Record<FilterKey, string>>>;
}) {
  const params = await searchParams;

  // Seuls les filtres réellement renseignés comptent.
  const active: Partial<Record<FilterKey, string>> = {};
  for (const key of FILTER_KEYS) {
    const value = params[key]?.trim();
    if (value) active[key] = value;
  }
  const filtered = Object.keys(active).length > 0;

  const query = new URLSearchParams({ ...active, limit: '300' });
  const data = await api<ReportList>(`/reports?${query.toString()}`);
  // Le web et l'API se déploient séparément : pendant le court décalage, la
  // liste doit s'afficher sans ses compteurs plutôt que de ne pas s'afficher.
  const {
    items,
    facets = {
      templates: [],
      statuses: [],
      departments: [],
      authors: [],
      clients: [],
      untyped: 0,
    },
  } = data;

  /** L'adresse de la page avec un filtre changé, les autres gardés. */
  const hrefWith = (patch: Partial<Record<FilterKey, string | null>>) => {
    const next = new URLSearchParams(active as Record<string, string>);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    return qs ? `/operations/rapports?${qs}` : '/operations/rapports';
  };

  const deptName = new Map(facets.departments.map((d) => [d.code, d.name]));
  const typesByDept = new Map<string, NonNullable<ReportList['facets']>['templates']>();
  for (const t of facets.templates) {
    const key = t.department ?? 'Autres';
    typesByDept.set(key, [...(typesByDept.get(key) ?? []), t]);
  }

  const pending = items.filter((r) => ['SUBMITTED', 'UNDER_CHECK', 'CORRECTION'].includes(r.status));
  const delivered = items.filter((r) => r.onTime !== null);
  const onTime = delivered.filter((r) => r.onTime).length;
  const overdue = items.filter((r) => r.overdueDays > 0).length;
  const rate = delivered.length > 0 ? (onTime / delivered.length) * 100 : 0;
  const selectedType = facets.templates.find((t) => t.id === active.templateId) ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Opérations"
        title="Rapports d'inspection"
        description="Un rapport est vérifié par une personne distincte de son rédacteur, puis émis. L'objectif qualité est une remise sous 21 jours ouvrés."
      />

      <KpiRow>
        <KpiCard
          label={filtered ? 'Rapports sélectionnés' : 'Rapports'}
          value={data.total}
          hint={filtered ? 'selon les filtres' : undefined}
        />
        <KpiCard
          label="En attente de contrôle"
          value={pending.length}
          tone={pending.length > 0 ? 'warning' : undefined}
        />
        <KpiCard
          label="Remis dans le délai"
          value={percent(rate, 0)}
          tone={rate >= 90 ? 'success' : rate >= 75 ? 'warning' : 'danger'}
          hint={`${onTime} sur ${delivered.length} rapports remis`}
        />
        <KpiCard
          label="En retard, pas encore remis"
          value={overdue}
          tone={overdue > 0 ? 'danger' : undefined}
          hint="échéance de 21 jours ouvrés dépassée"
        />
      </KpiRow>

      {pending.length > 0 && !filtered && (
        <NextActionBanner
          tone="warning"
          title={`${pending.length} rapport(s) à vérifier`}
          detail="La vérification produit un enregistrement visé — vérificateur obligatoirement différent du rédacteur."
        />
      )}

      {/* ── Filtres ──────────────────────────────────────────────── */}

      <Card
        title="Filtrer les rapports"
        action={
          filtered ? (
            <Link href="/operations/rapports" className="text-[13.5px] font-medium text-accent hover:underline">
              Effacer les filtres
            </Link>
          ) : undefined
        }
      >
        <AutoSubmitForm className="flex flex-col gap-3 px-5 py-4">
          <div className="grid gap-3 md:grid-cols-[1.2fr_1.6fr_1fr]">
            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-medium text-muted">Recherche</span>
              <input
                type="search"
                name="q"
                defaultValue={active.q ?? ''}
                placeholder="N° de rapport, d’affaire, client…"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-medium text-muted">Type de rapport</span>
              <select name="templateId" defaultValue={active.templateId ?? ''} className={inputClass}>
                <option value="">Tous les types</option>
                {[...typesByDept.entries()].map(([dept, types]) => (
                  <optgroup key={dept} label={deptName.get(dept) ?? dept}>
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.formCode} — {t.title} ({t.count})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-medium text-muted">Statut</span>
              <select name="status" defaultValue={active.status ?? ''} className={inputClass}>
                <option value="">Tous les statuts</option>
                {facets.statuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label} ({s.count})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_1.2fr_1.2fr_0.9fr_0.9fr_auto]">
            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-medium text-muted">Service</span>
              <select name="departmentId" defaultValue={active.departmentId ?? ''} className={inputClass}>
                <option value="">Tous</option>
                {facets.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} ({d.count})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-medium text-muted">Inspecteur</span>
              <select name="authorId" defaultValue={active.authorId ?? ''} className={inputClass}>
                <option value="">Tous</option>
                {facets.authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.count})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-medium text-muted">Client</span>
              <select name="clientId" defaultValue={active.clientId ?? ''} className={inputClass}>
                <option value="">Tous</option>
                {facets.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.count})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-medium text-muted">Contrôle du</span>
              <input type="date" name="from" defaultValue={active.from ?? ''} className={inputClass} />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-medium text-muted">au</span>
              <input type="date" name="to" defaultValue={active.to ?? ''} className={inputClass} />
            </label>

            <label className="flex items-end gap-2 pb-2.5">
              <input
                type="checkbox"
                name="late"
                value="1"
                defaultChecked={active.late === '1'}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              <span className="text-[14px]">Hors délai</span>
            </label>
          </div>

          <div>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-[8px] bg-accent px-4 text-[13.5px] font-medium text-white hover:bg-accent-hover"
            >
              Filtrer
            </button>
          </div>
        </AutoSubmitForm>
      </Card>

      {/* ── Accès direct par type ────────────────────────────────── */}

      {facets.templates.length > 0 && (
        <div className="mt-5">
          <Card title="Par type de rapport">
            <div className="flex flex-col gap-4 px-5 py-4">
              {[...typesByDept.entries()].map(([dept, types]) => (
                <div key={dept}>
                  <p className="mb-2 text-[12.5px] font-medium uppercase tracking-[0.04em] text-subtle">
                    {deptName.get(dept) ?? dept}
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {types.map((t) => {
                      const selected = t.id === active.templateId;
                      return (
                        <li key={t.id}>
                          <Link
                            href={hrefWith({ templateId: selected ? null : t.id })}
                            title={t.title}
                            className={`inline-flex items-center gap-2 rounded-[8px] border px-3 py-1.5 text-[13.5px] transition-colors ${
                              selected
                                ? 'border-accent bg-accent-soft text-accent'
                                : 'border-border-strong bg-surface hover:bg-surface-2'
                            }`}
                          >
                            <span className="ref">{t.formCode}</span>
                            <span className="max-w-[220px] truncate text-muted">{t.title}</span>
                            <span className="tnum text-subtle">{t.count}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              {facets.untyped > 0 && (
                <p className="text-[13px] text-subtle">
                  {facets.untyped} rapport(s) ne sont rattachés à aucun modèle.
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ── Liste ────────────────────────────────────────────────── */}

      <div className="mt-5">
        <Card
          title={
            selectedType
              ? `${data.total} rapport(s) « ${selectedType.formCode} — ${selectedType.title} »`
              : `${data.total} rapport(s)${items.length < data.total ? ` — ${items.length} affichés` : ''}`
          }
        >
          {items.length === 0 ? (
            filtered ? (
              <EmptyState
                title="Aucun rapport ne correspond à ces filtres"
                description="Élargissez la période ou retirez un filtre."
                action={
                  <Link
                    href="/operations/rapports"
                    className="inline-flex h-10 items-center rounded-[10px] border border-border-strong bg-surface px-4 text-[14px] font-medium transition-colors hover:bg-surface-2"
                  >
                    Effacer les filtres
                  </Link>
                }
              />
            ) : (
              <EmptyState
                title="Aucun rapport"
                description="Les rapports sont saisis depuis le mobile inspecteur, à partir des modèles du référentiel qualité."
              />
            )
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <Th>N° rapport</Th>
                  <Th>Type</Th>
                  <Th>Client · affaire</Th>
                  <Th>Contrôle</Th>
                  <Th>Rédacteur</Th>
                  <Th>Vérificateur</Th>
                  <Th>Échéance</Th>
                  <Th>Remis le</Th>
                  <Th>Délai</Th>
                  <Th>Statut</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <Td mono>
                      <Link href={`/operations/rapports/${r.id}`} className="hover:text-accent">
                        {r.number}
                      </Link>
                    </Td>
                    <Td className="max-w-[240px]">
                      {r.type ? (
                        <Link
                          href={hrefWith({ templateId: r.type.id })}
                          title={`Voir tous les rapports ${r.type.formCode}`}
                          className="group block"
                        >
                          <span className="ref text-[13px] group-hover:text-accent">{r.type.formCode}</span>
                          <span className="block truncate text-[12.5px] text-subtle">{r.type.title}</span>
                        </Link>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </Td>
                    <Td className="max-w-[200px]">
                      <span className="line-clamp-1">{r.client.name}</span>
                      <span className="ref block text-[12px] text-subtle">{r.affair.number}</span>
                    </Td>
                    <Td mono>{date(r.controlDate)}</Td>
                    <Td>{r.author}</Td>
                    <Td>{r.checker ?? <span className="text-subtle">non assigné</span>}</Td>
                    <Td mono>{date(r.mission.reportDueDate)}</Td>
                    <Td mono>{date(r.deliveredAt)}</Td>
                    <Td>
                      {r.onTime !== null ? (
                        <StatusBadge tone={r.onTime ? 'success' : 'danger'}>
                          {r.onTime ? 'Dans le délai' : 'Hors délai'}
                        </StatusBadge>
                      ) : r.overdueDays > 0 ? (
                        <StatusBadge tone="danger">En retard · {r.overdueDays} j</StatusBadge>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </Td>
                    <Td>
                      <StatusBadge tone={TONE[r.status] ?? 'neutral'}>
                        {REPORT_STATUS_LABELS[r.status] ?? r.status}
                      </StatusBadge>
                    </Td>
                    <Td>
                      {r.canCheck ? (
                        <Link
                          href={`/operations/rapports/${r.id}`}
                          className="text-[13.5px] font-medium text-accent hover:underline"
                        >
                          Vérifier
                        </Link>
                      ) : r.isAuthor && r.status === 'CORRECTION' ? (
                        <Link
                          href={`/operations/rapports/${r.id}`}
                          className="text-[13.5px] font-medium text-danger hover:underline"
                        >
                          À reprendre
                        </Link>
                      ) : null}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>
      </div>
    </>
  );
}
