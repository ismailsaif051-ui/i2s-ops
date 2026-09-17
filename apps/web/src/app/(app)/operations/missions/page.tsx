import Link from 'next/link';
import { Fragment } from 'react';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { MISSION_STATUS_LABELS, date } from '@/lib/format';
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
import { AutoSubmitForm } from '@/components/auto-submit-form';

export const metadata: Metadata = { title: 'Missions' };

interface MissionList {
  items: MissionRow[];
  total: number;
  /** Absent le temps qu'un déploiement aligne l'API sur le web. */
  facets?: {
    statuses: Array<{ value: string; count: number }>;
    departments: Array<{ id: string; code: string; name: string }>;
  };
}

const FILTER_KEYS = ['q', 'status', 'departmentId', 'affairId'] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

const inputClass =
  'h-10 w-full rounded-[8px] border border-border-strong bg-surface px-3 text-[14px] outline-none focus:border-accent';

interface MissionRow {
  id: string;
  number: string;
  objective: string | null;
  status: string;
  affair: { id: string; number: string; title: string; client: { name: string } };
  site: { name: string; city: string | null } | null;
  department: string | null;
  vehicle: string | null;
  missionOrder: { number: string; status: string } | null;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  actualEndDate: string | null;
  reportDueDate: string | null;
  inspectors: string[];
  reportCount: number;
}

function MissionRowLine({ m }: { m: MissionRow }) {
  return (
    <tr>
      <Td mono>
        <Link href={`/operations/missions/${m.id}`} className="hover:text-accent">
          {m.number}
        </Link>
      </Td>
      <Td>
        <Link href={`/affaires/${m.affair.id}`} className="ref text-[12px] text-primary hover:underline">
          {m.affair.number}
        </Link>
        <span className="ml-2 text-subtle">{m.affair.client.name}</span>
      </Td>
      <Td className="max-w-[240px]">
        <span className="line-clamp-1">{m.objective ?? '—'}</span>
      </Td>
      <Td>{m.inspectors.join(', ') || '—'}</Td>
      <Td>{m.site?.name ?? '—'}</Td>
      <Td mono>
        {date(m.plannedStartDate)} → {date(m.plannedEndDate)}
      </Td>
      <Td mono>
        {m.missionOrder ? (
          <span title={`Statut : ${m.missionOrder.status}`}>{m.missionOrder.number}</span>
        ) : (
          <span className="text-subtle">—</span>
        )}
      </Td>
      <Td>
        <StatusBadge tone={STATUS_TONE[m.status] ?? 'neutral'}>
          {MISSION_STATUS_LABELS[m.status] ?? m.status}
        </StatusBadge>
      </Td>
    </tr>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  REQUESTED: 'neutral',
  PLANNED: 'info',
  ASSIGNED: 'info',
  CONFIRMED: 'info',
  ORDER_ISSUED: 'primary',
  IN_PROGRESS: 'primary',
  COMPLETED: 'success',
  REPORTED: 'success',
  CLOSED: 'success',
  POSTPONED: 'warning',
  CANCELLED: 'danger',
};

type GroupKey = 'department' | 'status';

export default async function MissionsPage({
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
    params.groupBy === 'department' || params.groupBy === 'status' ? params.groupBy : null;

  const query = new URLSearchParams({ ...active, limit: '150' });
  // Le web et l'API se déploient séparément : pendant le court décalage, la
  // liste doit s'afficher sans ses compteurs plutôt que de ne pas s'afficher.
  const {
    items,
    total,
    facets = { statuses: [], departments: [] },
  } = await api<MissionList>(`/missions?${query.toString()}`);

  const groups = groupBy
    ? (() => {
        const map = new Map<string, { label: string; rows: MissionRow[] }>();
        for (const m of items) {
          const key = groupBy === 'department' ? (m.department ?? '—') : m.status;
          const label =
            groupBy === 'department'
              ? (m.department ?? 'Sans département')
              : (MISSION_STATUS_LABELS[m.status] ?? m.status);
          if (!map.has(key)) map.set(key, { label, rows: [] });
          map.get(key)!.rows.push(m);
        }
        return [...map.values()].sort((a, b) => b.rows.length - a.rows.length);
      })()
    : null;

  const inProgress = items.filter((m) => m.status === 'IN_PROGRESS').length;
  const today = new Date();
  const lateReports = items.filter(
    (m) =>
      m.actualEndDate &&
      m.reportCount === 0 &&
      m.reportDueDate &&
      new Date(m.reportDueDate) < today,
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Opérations"
        title="Missions"
        description="Chaque mission confirmée génère un ordre de mission signé, réserve un véhicule et ouvre une échéance de remise de rapport à 21 jours ouvrés."
        action={
          <CreateLink
            href="/operations/missions/nouvelle"
            label="Planifier une mission"
            resource="mission"
          />
        }
      />

      <KpiRow>
        <KpiCard
          label={filtered ? 'Missions sélectionnées' : 'Missions'}
          value={total}
          hint={filtered ? 'selon les filtres' : 'dans votre périmètre'}
        />
        <KpiCard label="En cours" value={inProgress} tone={inProgress > 0 ? 'primary' : undefined} />
        <KpiCard
          label="Rapport en retard"
          value={lateReports}
          tone={lateReports > 0 ? 'danger' : undefined}
          hint="mission terminée, délai QMS dépassé"
        />
      </KpiRow>

      <Card
        title="Filtrer les missions"
        action={
          filtered ? (
            <Link
              href="/operations/missions"
              className="text-[13.5px] font-medium text-accent hover:underline"
            >
              Effacer les filtres
            </Link>
          ) : undefined
        }
      >
        <AutoSubmitForm className="flex flex-col gap-3 px-5 py-4">
          <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr]">
            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-medium text-muted">Recherche</span>
              <input
                type="search"
                name="q"
                defaultValue={active.q ?? ''}
                placeholder="N° de mission, objet…"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-medium text-muted">Statut</span>
              <select name="status" defaultValue={active.status ?? ''} className={inputClass}>
                <option value="">Tous les statuts</option>
                {facets.statuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {MISSION_STATUS_LABELS[s.value] ?? s.value} ({s.count})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-medium text-muted">Département</span>
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
                <option value="department">Département</option>
                <option value="status">Statut</option>
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
            ? `${total} mission(s) sélectionnée(s)${items.length < total ? ` — ${items.length} affichées` : ''}`
            : `${items.length} missions${items.length < total ? ` sur ${total}` : ''}`
        }
      >
        {items.length === 0 ? (
          filtered ? (
            <EmptyState
              title="Aucune mission ne correspond à ces filtres"
              description="Élargissez la sélection ou retirez un filtre."
              action={
                <Link
                  href="/operations/missions"
                  className="inline-flex h-10 items-center rounded-[10px] border border-border-strong bg-surface px-4 text-[14px] font-medium transition-colors hover:bg-surface-2"
                >
                  Effacer les filtres
                </Link>
              }
            />
          ) : (
          <EmptyState
            title="Aucune mission"
            description="Les missions se créent depuis une affaire en cours, puis s’affectent depuis le planning."
          />
          )
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>N° mission</Th>
                <Th>Affaire</Th>
                <Th>Objet</Th>
                <Th>Inspecteur</Th>
                <Th>Site</Th>
                <Th>Période</Th>
                <Th>OM</Th>
                <Th>Statut</Th>
              </tr>
            </thead>
            <tbody>
              {groups
                ? groups.map((group) => (
                    <Fragment key={group.label}>
                      <tr>
                        <td
                          colSpan={8}
                          className="border-b border-border bg-surface-2 px-5 py-2 text-[13px] font-medium text-muted"
                        >
                          {group.label} · {group.rows.length}
                        </td>
                      </tr>
                      {group.rows.map((m) => (
                        <MissionRowLine key={m.id} m={m} />
                      ))}
                    </Fragment>
                  ))
                : items.map((m) => <MissionRowLine key={m.id} m={m} />)}
            </tbody>
          </DataTable>
        )}
      </Card>
      </div>
    </>
  );
}
