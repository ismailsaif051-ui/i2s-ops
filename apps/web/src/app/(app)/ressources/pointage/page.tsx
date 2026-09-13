import Link from 'next/link';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { moneyDh } from '@/lib/format';
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
} from '@/components/ui';
import { TimesheetWeek, type WeekPayload } from '@/components/timesheet-week';
import { TimesheetMonth, type PendingRow } from '@/components/timesheet-month';
import { can } from '@i2s/contracts';
import { requireSession } from '@/lib/api';

export const metadata: Metadata = { title: 'Pointage' };

interface TimesheetGrid {
  month: string;
  label: string;
  workingDays: number;
  columns: Array<{ date: string; isWorkingDay: boolean; label: string | null; weekday: number }>;
  rows: Array<{
    employeeId: string;
    matricule: string;
    name: string;
    department: string | null;
    isInspector: boolean;
    cells: Record<string, { category: string; status: string; ref: string | null }>;
    counts: Record<string, number>;
    idleCost: number;
  }>;
  categoryLabels: Record<string, string>;
}



/** Une lettre par nature de journée — lisible même sur une colonne de 24 px. */
const MARK: Record<string, { letter: string; className: string }> = {
  MISSION_BILLABLE: { letter: 'F', className: 'bg-accent text-white' },
  MISSION_NON_BILLABLE: { letter: 'N', className: 'bg-accent-soft text-accent' },
  SITE_WAITING: { letter: 'A', className: 'bg-warning-soft text-warning' },
  WEATHER: { letter: 'I', className: 'bg-warning-soft text-warning' },
  TRAINING: { letter: 'Fo', className: 'bg-info-soft text-info' },
  LEAVE: { letter: 'C', className: 'bg-neutral-soft text-neutral' },
  SICK: { letter: 'M', className: 'bg-neutral-soft text-neutral' },
  OTHER: { letter: '·', className: 'bg-surface-2 text-muted' },
  UNASSIGNED: {
    letter: '',
    className: 'border border-dashed border-danger/45 bg-surface',
  },
};

export default async function TimesheetPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; semaine?: string; employe?: string }>;
}) {
  const params = await searchParams;
  const query = params.month ? `?month=${encodeURIComponent(params.month)}` : '';

  // La semaine à pointer d'abord : c'est le geste quotidien. La grille du mois
  // suit, pour qui pilote plutôt qu'il ne saisit.
  const weekQuery = new URLSearchParams();
  if (params.semaine) weekQuery.set('week', params.semaine);
  if (params.employe) weekQuery.set('employeeId', params.employe);

  const [session, data, week, pending] = await Promise.all([
    requireSession(),
    api<TimesheetGrid>(`/timesheets${query}`),
    api<WeekPayload>(`/timesheets/week${weekQuery.size > 0 ? `?${weekQuery}` : ''}`).catch(
      () => null,
    ),
    api<{ month: string; items: PendingRow[] }>(
      `/timesheets/pending${params.month ? `?month=${params.month}` : ''}`,
    ).catch(() => null),
  ]);

  const permissions = session.permissions as Parameters<typeof can>[0];

  const dayFormat = new Intl.DateTimeFormat('fr-FR', { day: '2-digit' });

  const totals = data.rows.reduce(
    (acc, row) => {
      for (const [category, n] of Object.entries(row.counts)) {
        acc.counts[category] = (acc.counts[category] ?? 0) + n;
      }
      acc.idleCost += row.idleCost;
      return acc;
    },
    { counts: {} as Record<string, number>, idleCost: 0 },
  );

  const billed = totals.counts.MISSION_BILLABLE ?? 0;
  const unassigned = totals.counts.UNASSIGNED ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Ressources"
        title="Pointage"
        description="Le pointage se déduit du planning : une journée affectée à une mission est pointée sur cette mission, et ce qui reste d’un jour ouvré est une journée non affectée. On ne corrige que ce que le terrain a démenti ; le chef de département vise le mois."
        action={
          <span className="rounded-[10px] border border-border-strong bg-surface px-4 py-2 text-[14px]">
            {data.label} · {data.workingDays} jours ouvrés
          </span>
        }
      />

      <div className="mb-5">
        <TimesheetMonth
          month={pending?.month ?? data.month}
          pending={pending?.items ?? []}
          canGenerate={can(permissions, 'timesheet', 'APPROVE')}
          canValidate={can(permissions, 'timesheet', 'APPROVE')}
        />
      </div>

      {week?.employee && (
        <div className="mb-5">
          <TimesheetWeek payload={week} />
        </div>
      )}

      <KpiRow>
        <KpiCard label="Collaborateurs pointés" value={data.rows.length} />
        <KpiCard label="Journées facturables" value={billed} hint="catégorie « mission facturable »" />
        <KpiCard
          label="Journées non affectées"
          value={unassigned}
          tone={unassigned > 0 ? 'danger' : undefined}
          href="/pilotage/jours-non-affectes"
        />
        <KpiCard
          label="Coût d'inactivité"
          value={moneyDh(totals.idleCost)}
          tone={totals.idleCost > 0 ? 'danger' : undefined}
          hint="coût journalier à la date"
        />
      </KpiRow>

      <Card title={`Grille mensuelle — ${data.label}`}>
        {data.rows.length === 0 ? (
          <EmptyState
            title="Aucun pointage sur ce mois"
            description="Les journées sont générées automatiquement depuis le calendrier ouvré dès qu’un employé est enregistré."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 border-b border-border bg-surface px-5 py-3 text-left text-[13px] font-medium text-subtle">
                    Collaborateur
                  </th>
                  {data.columns.map((column) => (
                    <th
                      key={column.date}
                      className={`border-b border-border px-0.5 py-2 text-center text-[12px] font-medium ${
                        column.isWorkingDay ? 'text-subtle' : 'bg-surface-2 text-subtle/60'
                      }`}
                      title={column.label ?? undefined}
                    >
                      {dayFormat.format(new Date(column.date))}
                    </th>
                  ))}
                  {['F', 'A', 'C', 'Non aff.'].map((h) => (
                    <th
                      key={h}
                      className="border-b border-border px-2 py-3 text-right text-[13px] font-medium text-subtle"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.employeeId}>
                    <td className="sticky left-0 z-10 border-b border-border bg-surface px-5 py-2.5">
                      <span className="block font-medium">{row.name}</span>
                      <span className="block text-[12.5px] text-subtle">
                        {row.department ?? '—'}
                        {row.isInspector ? '' : ' · support'}
                      </span>
                    </td>

                    {data.columns.map((column) => {
                      const cell = row.cells[column.date];
                      if (!column.isWorkingDay) {
                        return (
                          <td key={column.date} className="border-b border-border bg-surface-2 px-0.5 py-1.5" />
                        );
                      }
                      const mark = cell ? (MARK[cell.category] ?? MARK.OTHER!) : MARK.UNASSIGNED!;
                      const tooltip = cell
                        ? [data.categoryLabels[cell.category] ?? cell.category, cell.ref]
                            .filter(Boolean)
                            .join(' — ')
                        : 'Non affecté';

                      return (
                        <td key={column.date} className="border-b border-border px-0.5 py-1.5">
                          <span
                            title={tooltip}
                            className={`flex h-7 w-6 items-center justify-center rounded-[5px] text-[11px] font-semibold ${mark.className}`}
                          >
                            {mark.letter}
                          </span>
                        </td>
                      );
                    })}

                    <td className="tnum border-b border-border px-2 py-2.5 text-right">
                      {row.counts.MISSION_BILLABLE ?? 0}
                    </td>
                    <td className="tnum border-b border-border px-2 py-2.5 text-right">
                      {(row.counts.SITE_WAITING ?? 0) + (row.counts.WEATHER ?? 0)}
                    </td>
                    <td className="tnum border-b border-border px-2 py-2.5 text-right">
                      {(row.counts.LEAVE ?? 0) + (row.counts.SICK ?? 0)}
                    </td>
                    <td className="tnum border-b border-border px-2 py-2.5 text-right">
                      <span className={(row.counts.UNASSIGNED ?? 0) > 0 ? 'font-semibold text-danger' : ''}>
                        {row.counts.UNASSIGNED ?? 0}
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
          { letter: 'F', className: 'bg-accent text-white', label: 'Mission facturable' },
          { letter: 'N', className: 'bg-accent-soft text-accent', label: 'Mission non facturable' },
          { letter: 'A', className: 'bg-warning-soft text-warning', label: 'Attente ou intempérie' },
          { letter: 'Fo', className: 'bg-info-soft text-info', label: 'Formation' },
          { letter: 'C', className: 'bg-neutral-soft text-neutral', label: 'Congé ou maladie' },
          {
            letter: '',
            className: 'border border-dashed border-danger/45 bg-surface',
            label: 'Non affecté',
          },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-2">
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-[5px] text-[11px] font-semibold ${item.className}`}
            >
              {item.letter}
            </span>
            {item.label}
          </span>
        ))}
      </div>
    </>
  );
}
