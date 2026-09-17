import Link from 'next/link';
import { Fragment } from 'react';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import {
  AFFAIR_COMMERCIAL_LABELS,
  AFFAIR_WORKS_LABELS,
  compactDh,
  moneyDh,
  percent,
  points,
} from '@/lib/format';
import {
  Card,
  DataTable,
  EmptyState,
  KpiCard,
  KpiRow,
  PageHeader,
  StatusBadge,
  Td,
  Th,
  type Tone,
} from '@/components/ui';
import { CreateLink } from '@/components/create-link';
import { ExportLink } from '@/components/export-link';
import { AutoSubmitForm } from '@/components/auto-submit-form';

export const metadata: Metadata = { title: 'Affaires' };

interface AffairRow {
  id: string;
  number: string;
  title: string;
  status: string;
  commercialStatus?: string;
  worksStatus?: string;
  client: { id: string; name: string };
  department: string | null;
  accountManager: string | null;
  contractAmount: number | null;
  invoiced: number;
  consumedDays: number;
  marginRate: number | null;
  budgetMarginRate: number | null;
  counts: { missions: number; reports: number; invoices: number };
}

interface AffairList {
  items: AffairRow[];
  total: number;
  /** Absent le temps qu'un déploiement aligne l'API sur le web. */
  facets?: {
    commercialStatuses: Array<{ value: string | null; count: number }>;
    worksStatuses: Array<{ value: string | null; count: number }>;
    departments: Array<{ id: string; code: string; name: string }>;
  };
}

const FILTER_KEYS = ['q', 'commercialStatus', 'worksStatus', 'departmentId'] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

const inputClass =
  'h-10 w-full rounded-[8px] border border-border-strong bg-surface px-3 text-[14px] outline-none focus:border-accent';

function AffairRowLine({ affair }: { affair: AffairRow }) {
  const gap =
    affair.marginRate !== null && affair.budgetMarginRate !== null
      ? affair.marginRate - affair.budgetMarginRate
      : null;
  return (
    <tr>
      <Td mono>
        <Link href={`/affaires/${affair.id}`} className="text-primary hover:underline">
          {affair.number}
        </Link>
      </Td>
      <Td>{affair.client.name}</Td>
      <Td className="max-w-[320px]">
        <span className="line-clamp-2">{affair.title}</span>
      </Td>
      <Td>{affair.department ?? '—'}</Td>
      <Td>
        {affair.commercialStatus ? (
          <StatusBadge tone={COMMERCIAL_TONE[affair.commercialStatus] ?? 'neutral'}>
            {AFFAIR_COMMERCIAL_LABELS[affair.commercialStatus] ?? affair.commercialStatus}
          </StatusBadge>
        ) : (
          '—'
        )}
      </Td>
      <Td>
        {affair.worksStatus ? (
          <StatusBadge tone={WORKS_TONE[affair.worksStatus] ?? 'neutral'}>
            {AFFAIR_WORKS_LABELS[affair.worksStatus] ?? affair.worksStatus}
          </StatusBadge>
        ) : (
          '—'
        )}
      </Td>
      <Td align="right" mono>
        {moneyDh(affair.contractAmount)}
      </Td>
      <Td align="right" mono>
        {moneyDh(affair.invoiced)}
      </Td>
      <Td align="right">
        {affair.marginRate === null ? (
          <span className="text-subtle">—</span>
        ) : (
          <span className="flex items-center justify-end gap-2">
            <span className="tnum ref text-[12px]">{percent(affair.marginRate, 0)}</span>
            {gap !== null && gap < -5 && <StatusBadge tone="danger">{points(gap)}</StatusBadge>}
          </span>
        )}
      </Td>
    </tr>
  );
}

const COMMERCIAL_TONE: Record<string, Tone> = {
  GAGNEE: 'success',
  SUIVANT_OP: 'warning',
  PERDUE_ANNULEE: 'danger',
  DP: 'neutral',
};

const WORKS_TONE: Record<string, Tone> = {
  NON_DEMARRE: 'neutral',
  EN_COURS: 'info',
  A_FACTURER: 'warning',
  FAC_PARTIELLE: 'warning',
  FAC_TOTALE: 'success',
  PERDU_ANNULE: 'danger',
};

type GroupKey = 'department' | 'commercialStatus';

export default async function AffairsPage({
  searchParams,
}: {
  searchParams: Promise<Partial<Record<FilterKey, string>> & { groupBy?: string }>;
}) {
  const params = await searchParams;

  const active: Partial<Record<FilterKey, string>> = {};
  for (const key of FILTER_KEYS) {
    const value = params[key]?.trim();
    if (value) active[key] = value;
  }
  const filtered = Object.keys(active).length > 0;
  const groupBy: GroupKey | null =
    params.groupBy === 'department' || params.groupBy === 'commercialStatus'
      ? params.groupBy
      : null;

  const query = new URLSearchParams({ ...active, limit: '200' });
  // Le web et l'API se déploient séparément : pendant le court décalage, la
  // liste doit s'afficher sans ses compteurs plutôt que de ne pas s'afficher.
  const {
    items,
    total,
    facets = { commercialStatuses: [], worksStatuses: [], departments: [] },
  } = await api<AffairList>(`/affairs?${query.toString()}`);
  const exportHref = filtered ? `/api/affairs/export?${query.toString()}` : '/api/affairs/export';

  const groups = groupBy
    ? (() => {
        const map = new Map<
          string,
          { label: string; rows: AffairRow[]; contractAmount: number; invoiced: number }
        >();
        for (const a of items) {
          const key =
            groupBy === 'department' ? (a.department ?? '—') : (a.commercialStatus ?? '—');
          const label =
            groupBy === 'department'
              ? (a.department ?? 'Sans service')
              : a.commercialStatus
                ? (AFFAIR_COMMERCIAL_LABELS[a.commercialStatus] ?? a.commercialStatus)
                : 'Non défini';
          if (!map.has(key)) map.set(key, { label, rows: [], contractAmount: 0, invoiced: 0 });
          const g = map.get(key)!;
          g.rows.push(a);
          g.contractAmount += a.contractAmount ?? 0;
          g.invoiced += a.invoiced;
        }
        return [...map.values()].sort((a, b) => b.rows.length - a.rows.length);
      })()
    : null;

  const won = items.filter((a) => a.commercialStatus === 'GAGNEE');
  const awaiting = items.filter((a) => a.commercialStatus === 'SUIVANT_OP');
  const atRisk = items.filter(
    (a) =>
      a.marginRate !== null &&
      a.budgetMarginRate !== null &&
      a.marginRate - a.budgetMarginRate < -5,
  );
  const totalContract = won.reduce((s, a) => s + (a.contractAmount ?? 0), 0);
  const totalInvoiced = items.reduce((s, a) => s + a.invoiced, 0);

  return (
    <>
      <PageHeader
        eyebrow="Portefeuille"
        title="Affaires"
        description="Deux axes de statut indépendants, comme au registre de suivi : l’avancement commercial d’un côté, l’état des travaux et de la facturation de l’autre."
        action={
          <div className="flex items-center gap-2">
            <ExportLink href={exportHref} resource="affair" />
            <CreateLink href="/affaires/nouvelle" label="Ouvrir une affaire" resource="affair" />
          </div>
        }
      />

      <KpiRow>
        <KpiCard label="Affaires gagnées" value={won.length} hint="bon de commande reçu" />
        <KpiCard
          label="Suivant offre de prix"
          value={awaiting.length}
          tone={awaiting.length > 0 ? 'warning' : undefined}
          hint="commande attendue"
        />
        <KpiCard label="Montant gagné" value={compactDh(totalContract)} hint="cumul HT" />
        <KpiCard label="Facturé" value={compactDh(totalInvoiced)} hint="cumul HT" />
        <KpiCard
          label="Sous la marge budgétée"
          value={atRisk.length}
          tone={atRisk.length > 0 ? 'danger' : undefined}
          hint="écart supérieur à 5 points"
        />
      </KpiRow>

      <Card
        title="Filtrer les affaires"
        action={
          filtered ? (
            <Link href="/affaires" className="text-[13.5px] font-medium text-accent hover:underline">
              Effacer les filtres
            </Link>
          ) : undefined
        }
      >
        <AutoSubmitForm className="flex flex-col gap-3 px-5 py-4">
          <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-medium text-muted">Recherche</span>
              <input
                type="search"
                name="q"
                defaultValue={active.q ?? ''}
                placeholder="N° d’affaire, désignation, client…"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-medium text-muted">Statut commercial</span>
              <select
                name="commercialStatus"
                defaultValue={active.commercialStatus ?? ''}
                className={inputClass}
              >
                <option value="">Tous</option>
                {facets.commercialStatuses
                  .filter((s): s is { value: string; count: number } => s.value !== null)
                  .map((s) => (
                    <option key={s.value} value={s.value}>
                      {AFFAIR_COMMERCIAL_LABELS[s.value] ?? s.value} ({s.count})
                    </option>
                  ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-medium text-muted">État travaux</span>
              <select name="worksStatus" defaultValue={active.worksStatus ?? ''} className={inputClass}>
                <option value="">Tous</option>
                {facets.worksStatuses
                  .filter((s): s is { value: string; count: number } => s.value !== null)
                  .map((s) => (
                    <option key={s.value} value={s.value}>
                      {AFFAIR_WORKS_LABELS[s.value] ?? s.value} ({s.count})
                    </option>
                  ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-medium text-muted">Service pilote</span>
              <select name="departmentId" defaultValue={active.departmentId ?? ''} className={inputClass}>
                <option value="">Tous</option>
                {facets.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-medium text-muted">Regrouper par</span>
              <select name="groupBy" defaultValue={groupBy ?? ''} className={inputClass}>
                <option value="">Aucun regroupement</option>
                <option value="department">Service pilote</option>
                <option value="commercialStatus">Statut commercial</option>
              </select>
            </label>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-[8px] bg-accent px-4 text-[13.5px] font-medium text-white hover:bg-accent-hover"
            >
              Filtrer
            </button>
          </div>
        </AutoSubmitForm>
      </Card>

      <div className="mt-5">
      <Card
        title={
          filtered
            ? `${total} affaire(s) sélectionnée(s)${items.length < total ? ` — ${items.length} affichées` : ''}`
            : `${items.length} affaires${items.length < total ? ` sur ${total}` : ''}`
        }
      >
        {items.length === 0 ? (
          filtered ? (
            <EmptyState
              title="Aucune affaire ne correspond à ces filtres"
              description="Élargissez la sélection ou retirez un filtre."
              action={
                <Link
                  href="/affaires"
                  className="inline-flex h-10 items-center rounded-[10px] border border-border-strong bg-surface px-4 text-[14px] font-medium transition-colors hover:bg-surface-2"
                >
                  Effacer les filtres
                </Link>
              }
            />
          ) : (
          <EmptyState
            title="Aucune affaire"
            description="Une affaire naît d’une offre gagnée, ou se crée directement à réception d’un bon de commande."
          />
          )
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>N° affaire</Th>
                <Th>Client</Th>
                <Th>Désignation</Th>
                <Th>Sce</Th>
                <Th>Statut affaire</Th>
                <Th>État travaux</Th>
                <Th align="right">Montant</Th>
                <Th align="right">Facturé</Th>
                <Th align="right">Marge</Th>
              </tr>
            </thead>
            <tbody>
              {groups
                ? groups.map((group) => (
                    <Fragment key={group.label}>
                      <tr>
                        <td
                          colSpan={9}
                          className="border-b border-border bg-surface-2 px-5 py-2 text-[13px] font-medium text-muted"
                        >
                          <span className="tnum">
                            {group.label} · {group.rows.length} · {moneyDh(group.contractAmount)}{' '}
                            gagné · {moneyDh(group.invoiced)} facturé
                          </span>
                        </td>
                      </tr>
                      {group.rows.map((affair) => (
                        <AffairRowLine key={affair.id} affair={affair} />
                      ))}
                    </Fragment>
                  ))
                : items.map((affair) => <AffairRowLine key={affair.id} affair={affair} />)}
            </tbody>
          </DataTable>
        )}
      </Card>

      <p className="mt-4 max-w-[74ch] text-[12.5px] text-subtle">
        La marge affichée ici est indicative : elle confronte le facturé au seul coût de
        main-d’œuvre. Le détail complet — frais, véhicules, sous-traitance, comparaison au budget —
        se trouve sur la fiche de chaque affaire.
      </p>
      </div>
    </>
  );
}
