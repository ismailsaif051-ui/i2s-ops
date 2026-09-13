import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { moneyDh, percent } from '@/lib/format';
import {
  Card,
  EmptyState,
  KpiCard,
  KpiRow,
  NextActionBanner,
  PageHeader,
} from '@/components/ui';

export const metadata: Metadata = { title: 'Planning' };

type ConflictKind = 'DOUBLE_BOOKING' | 'LEAVE_OVERLAP' | 'EXPIRED_CERTIFICATION';

interface Cell {
  date: string;
  isWorkingDay: boolean;
  holidayLabel: string | null;
  category: string | null;
  missionNumber: string | null;
  affairNumber: string | null;
  clientName: string | null;
  siteName: string | null;
  billable: boolean;
  conflicts: ConflictKind[];
}

interface Row {
  employeeId: string;
  matricule: string;
  name: string;
  position: string | null;
  department: { code: string; name: string } | null;
  cells: Cell[];
  workedDays: number;
  unassignedDays: number;
  conflictCount: number;
  loadRate: number;
}

interface Planning {
  period: { from: string; to: string };
  columns: Array<{ date: string; isWorkingDay: boolean; label: string | null }>;
  rows: Row[];
  totals: { inspectors: number; conflicts: number; unassignedDays: number; available: number };
}

const CONFLICT_LABELS: Record<ConflictKind, string> = {
  DOUBLE_BOOKING: 'Double affectation',
  LEAVE_OVERLAP: 'Mission posée sur un congé',
  EXPIRED_CERTIFICATION: 'Certification expirée à cette date',
};

/** Une couleur par nature de journée, doublée d'une trame pour le daltonisme. */
function cellStyle(cell: Cell): { className: string; label: string } {
  if (cell.conflicts.length > 0) {
    return {
      className: 'bg-danger-soft text-danger ring-1 ring-inset ring-danger',
      label: 'Conflit',
    };
  }
  if (!cell.isWorkingDay) {
    return { className: 'bg-surface-2 text-subtle', label: cell.holidayLabel ?? 'Non ouvré' };
  }

  switch (cell.category) {
    case 'MISSION_BILLABLE':
      return { className: 'bg-accent text-white', label: 'Mission facturable' };
    case 'MISSION_NON_BILLABLE':
      return { className: 'bg-accent-soft text-accent', label: 'Mission non facturable' };
    case 'SITE_WAITING':
      return { className: 'bg-warning-soft text-warning', label: 'Attente chantier' };
    case 'WEATHER':
      return { className: 'bg-warning-soft text-warning', label: 'Intempérie' };
    case 'TRAINING':
      return { className: 'bg-info-soft text-info', label: 'Formation' };
    case 'LEAVE':
      return { className: 'bg-neutral-soft text-neutral', label: 'Congé' };
    case 'SICK':
      return { className: 'bg-neutral-soft text-neutral', label: 'Maladie' };
    case 'OTHER':
      return { className: 'bg-surface-2 text-muted', label: 'Autre' };
    case 'UNASSIGNED':
    default:
      // Volontairement dessiné comme un trou : c'est le message de l'écran.
      return {
        className: 'border border-dashed border-danger/45 bg-surface text-subtle',
        label: 'Non affecté',
      };
  }
}

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; weeks?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.from) query.set('from', params.from);
  query.set('weeks', params.weeks ?? '2');

  const data = await api<Planning>(`/planning?${query.toString()}`);

  const weekdayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
  const dayFormat = new Intl.DateTimeFormat('fr-FR', { day: '2-digit' });

  return (
    <>
      <PageHeader
        eyebrow="Opérations"
        title="Planning des inspecteurs"
        description="Les conflits sont détectés côté serveur : double affectation, mission posée sur un congé, certification expirée à la date de l’intervention."
      />

      <KpiRow>
        <KpiCard label="Inspecteurs" value={data.totals.inspectors} hint="dans votre périmètre" />
        <KpiCard
          label="Sans aucune affectation"
          value={data.totals.available}
          tone={data.totals.available > 0 ? 'warning' : undefined}
          hint="disponibles sur la période"
        />
        <KpiCard
          label="Jours non affectés"
          value={data.totals.unassignedDays}
          tone={data.totals.unassignedDays > 0 ? 'danger' : undefined}
          href="/pilotage/jours-non-affectes"
        />
        <KpiCard
          label="Conflits détectés"
          value={data.totals.conflicts}
          tone={data.totals.conflicts > 0 ? 'danger' : 'success'}
        />
      </KpiRow>

      {data.totals.conflicts > 0 && (
        <NextActionBanner
          tone="danger"
          title={`${data.totals.conflicts} conflit(s) de planning`}
          detail="Une mission ne peut pas être confirmée tant que le conflit n’est pas levé. Survolez la case en rouge pour en connaître la cause."
        />
      )}

      <Card title="Grille">
        {data.rows.length === 0 ? (
          <EmptyState
            title="Aucun inspecteur à planifier"
            description="Créez les fiches employés et marquez-les comme inspecteurs pour les voir apparaître ici."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 border-b border-border bg-surface px-5 py-3 text-left text-[13px] font-medium text-subtle">
                    Inspecteur
                  </th>
                  {data.columns.map((column) => {
                    const d = new Date(column.date);
                    return (
                      <th
                        key={column.date}
                        className={`border-b border-border px-1 py-2 text-center text-[12px] font-medium ${
                          column.isWorkingDay ? 'text-subtle' : 'bg-surface-2 text-subtle/70'
                        }`}
                        title={column.label ?? undefined}
                      >
                        <span className="block capitalize">{weekdayFormat.format(d).slice(0, 3)}</span>
                        <span className="block text-[13px] text-text">{dayFormat.format(d)}</span>
                      </th>
                    );
                  })}
                  <th className="border-b border-border px-4 py-3 text-right text-[13px] font-medium text-subtle">
                    Charge
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.employeeId}>
                    <td className="sticky left-0 z-10 border-b border-border bg-surface px-5 py-2.5">
                      <span className="block font-medium">{row.name}</span>
                      <span className="block text-[12.5px] text-subtle">
                        {row.department?.code ?? '—'}
                        {row.position ? ` · ${row.position}` : ''}
                      </span>
                    </td>

                    {row.cells.map((cell) => {
                      const style = cellStyle(cell);
                      const tooltip = [
                        style.label,
                        cell.missionNumber && `${cell.missionNumber} — ${cell.clientName ?? ''}`,
                        cell.siteName,
                        ...cell.conflicts.map((c) => `⚠ ${CONFLICT_LABELS[c]}`),
                      ]
                        .filter(Boolean)
                        .join('\n');

                      return (
                        <td key={cell.date} className="border-b border-border px-0.5 py-1.5">
                          <span
                            title={tooltip}
                            className={`flex h-8 items-center justify-center rounded-[6px] text-[11px] font-medium ${style.className}`}
                          >
                            {cell.conflicts.length > 0
                              ? '⚠'
                              : cell.category === 'MISSION_BILLABLE' ||
                                  cell.category === 'MISSION_NON_BILLABLE'
                                ? (cell.affairNumber?.split('/')[1] ?? '●')
                                : ''}
                          </span>
                        </td>
                      );
                    })}

                    <td className="tnum border-b border-border px-4 py-2.5 text-right">
                      <span
                        className={
                          row.loadRate === 0
                            ? 'font-semibold text-danger'
                            : row.loadRate >= 70
                              ? 'text-success'
                              : 'text-warning'
                        }
                      >
                        {percent(row.loadRate, 0)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-muted">
        {[
          { className: 'bg-accent', label: 'Mission facturable' },
          { className: 'bg-accent-soft', label: 'Mission non facturable' },
          { className: 'bg-warning-soft', label: 'Attente chantier / intempérie' },
          { className: 'bg-info-soft', label: 'Formation' },
          { className: 'bg-neutral-soft', label: 'Congé ou maladie' },
          { className: 'border border-dashed border-danger/45 bg-surface', label: 'Non affecté' },
          { className: 'bg-danger-soft ring-1 ring-inset ring-danger', label: 'Conflit' },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-2">
            <span className={`inline-block h-4 w-7 rounded-[4px] ${item.className}`} />
            {item.label}
          </span>
        ))}
      </div>

      <p className="mt-4 max-w-[74ch] text-[13.5px] text-subtle">
        Le chiffre inscrit dans une case de mission est le numéro d’ordre de l’affaire. Le
        glisser-déposer pour affecter arrive avec l’écran de mission ; pour l’instant la grille est
        en lecture, et sert à repérer les trous et les conflits.
      </p>
    </>
  );
}
