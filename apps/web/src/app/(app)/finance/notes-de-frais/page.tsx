import Link from 'next/link';
import type { Metadata } from 'next';
import { api, requireSession } from '@/lib/api';
import { can } from '@i2s/contracts';
import { EXPENSE_STATUS_LABELS, compactDh, date, monthLabel, moneyDh } from '@/lib/format';
import { OpenExpenseReport } from '@/components/open-expense-report';
import { AutoSubmitForm } from '@/components/auto-submit-form';
import {
  Card,
  DataTable,
  EmptyState,
  KpiCard,
  KpiRow,
  NextActionBanner,
  PageHeader,
  StatusBadge,
  Td,
  Th,
  type Tone,
} from '@/components/ui';

export const metadata: Metadata = { title: 'Notes de frais' };

interface ExpenseRow {
  id: string;
  number: string;
  employee: string;
  matricule: string;
  department: string | null;
  periodMonth: string;
  type: string;
  status: string;
  totalGross: number;
  netPayable: number;
  lineCount: number;
  capWarnings: number;
  paidAt: string | null;
}

interface ExpenseList {
  items: ExpenseRow[];
  total: number;
  facets: {
    statuses: Array<{ value: string; count: number }>;
    departments: Array<{ id: string; code: string; name: string }>;
  };
}

const FILTER_KEYS = ['q', 'status', 'month', 'departmentId'] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

const inputClass =
  'h-10 w-full rounded-[8px] border border-border-strong bg-surface px-3 text-[14px] outline-none focus:border-accent';

const TONE: Record<string, Tone> = {
  DRAFT: 'neutral',
  SUBMITTED: 'warning',
  CONFIRMED_N1: 'warning',
  CHECKED_HR_CG: 'warning',
  ACCOUNTED: 'info',
  APPROVED_DG: 'info',
  READY_TO_PAY: 'primary',
  PAID: 'success',
  REJECTED: 'danger',
};

/** Le circuit imposé : saisie N → N+1 → RH/CG → comptabilité → DG → règlement. */
const CIRCUIT = [
  'DRAFT',
  'SUBMITTED',
  'CONFIRMED_N1',
  'CHECKED_HR_CG',
  'ACCOUNTED',
  'APPROVED_DG',
  'READY_TO_PAY',
  'PAID',
];

export default async function ExpenseReportsPage({
  searchParams,
}: {
  searchParams: Promise<Partial<Record<FilterKey, string>>>;
}) {
  const params = await searchParams;

  const active: Partial<Record<FilterKey, string>> = {};
  for (const key of FILTER_KEYS) {
    const value = params[key]?.trim();
    if (value) active[key] = value;
  }
  const filtered = Object.keys(active).length > 0;

  const query = new URLSearchParams({ ...active, limit: '300' });
  const [session, data] = await Promise.all([
    requireSession(),
    api<ExpenseList>(`/expense-reports?${query.toString()}`),
  ]);
  const { items, facets } = data;

  const permissions = session.permissions as Parameters<typeof can>[0];
  const canCreate = can(permissions, 'expense_report', 'CREATE');
  const canExport = can(permissions, 'expense_report', 'EXPORT');

  const pending = items.filter(
    (r) => !['PAID', 'REJECTED', 'DRAFT'].includes(r.status),
  );
  const paid = items.filter((r) => r.status === 'PAID');
  const warnings = items.reduce((s, r) => s + r.capWarnings, 0);
  const pendingAmount = pending.reduce((s, r) => s + r.netPayable, 0);

  const exportHref = filtered ? `/api/frais/export?${query.toString()}` : '/api/frais/export';

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Notes de frais"
        description="Circuit à cinq visas. Les plafonds de la procédure sont contrôlés automatiquement : 100 DH/jour véhicule personnel, 150 DH/nuitée, 100 DH/mois lavage, 300 DH/mois achats."
        action={
          <div className="flex items-center gap-2">
            {canExport && (
              <a
                href={exportHref}
                className="inline-flex h-10 items-center rounded-[10px] border border-border-strong bg-surface px-4 text-[14px] font-medium text-text shadow-sm transition-colors hover:border-accent hover:text-accent"
              >
                Exporter Excel
              </a>
            )}
            {canCreate && <OpenExpenseReport />}
          </div>
        }
      />

      <KpiRow>
        <KpiCard
          label={filtered ? 'Notes sélectionnées' : 'Notes'}
          value={data.total}
          hint={filtered ? 'selon les filtres' : 'dans votre périmètre'}
        />
        <KpiCard
          label="En attente de visa"
          value={pending.length}
          tone={pending.length > 0 ? 'warning' : undefined}
          hint={compactDh(pendingAmount)}
        />
        <KpiCard label="Réglées" value={paid.length} tone="success" />
        <KpiCard
          label="Dépassements signalés"
          value={warnings}
          tone={warnings > 0 ? 'danger' : undefined}
          hint="lignes au-dessus du plafond"
        />
      </KpiRow>

      {pending.length > 0 && !filtered && (
        <NextActionBanner
          tone="warning"
          title={`${pending.length} note(s) de frais attendent un visa`}
          detail="Rappel des délais : validation N+1 sous 3 jours ouvrés, contrôle RH et contrôle de gestion sous 5 jours ouvrés, virement le 15 du mois."
        />
      )}

      <Card
        title="Filtrer les notes"
        action={
          filtered ? (
            <Link
              href="/finance/notes-de-frais"
              className="text-[13.5px] font-medium text-accent hover:underline"
            >
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
                placeholder="N° de note, collaborateur, matricule…"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-medium text-muted">Statut</span>
              <select name="status" defaultValue={active.status ?? ''} className={inputClass}>
                <option value="">Tous les statuts</option>
                {facets.statuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {EXPENSE_STATUS_LABELS[s.value] ?? s.value} ({s.count})
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

            <label className="flex flex-col gap-1">
              <span className="text-[12.5px] font-medium text-muted">Mois</span>
              <input type="month" name="month" defaultValue={active.month ?? ''} className={inputClass} />
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

      <div className="mt-5">
      <Card
        title={
          filtered
            ? `${data.total} note(s) sélectionnée(s)${items.length < data.total ? ` — ${items.length} affichées` : ''}`
            : `${items.length} notes de frais`
        }
      >
        {items.length === 0 ? (
          filtered ? (
            <EmptyState
              title="Aucune note ne correspond à ces filtres"
              description="Élargissez la sélection ou retirez un filtre."
              action={
                <Link
                  href="/finance/notes-de-frais"
                  className="inline-flex h-10 items-center rounded-[10px] border border-border-strong bg-surface px-4 text-[14px] font-medium transition-colors hover:bg-surface-2"
                >
                  Effacer les filtres
                </Link>
              }
            />
          ) : (
          <EmptyState
            title="Aucune note de frais"
            description="Les frais de mission se déclarent depuis le mobile, à la fin de chaque intervention."
          />
          )
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>N°</Th>
                <Th>Collaborateur</Th>
                <Th>Dép.</Th>
                <Th>Période</Th>
                <Th align="right">Lignes</Th>
                <Th align="right">Total brut</Th>
                <Th align="right">Net à payer</Th>
                <Th>Avancement du circuit</Th>
                <Th>Statut</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((report) => {
                const step = Math.max(0, CIRCUIT.indexOf(report.status));
                return (
                  <tr key={report.id}>
                    <Td mono>{report.number}</Td>
                    <Td>
                      <span className="font-medium">{report.employee}</span>
                      <span className="ml-2 ref text-[11px] text-subtle">
                        {report.matricule}
                      </span>
                    </Td>
                    <Td>{report.department ?? '—'}</Td>
                    <Td>{monthLabel(report.periodMonth)}</Td>
                    <Td align="right" mono>
                      {report.lineCount}
                      {report.capWarnings > 0 && (
                        <span className="ml-1.5 text-danger" title="Dépassement de plafond">
                          ⚠{report.capWarnings}
                        </span>
                      )}
                    </Td>
                    <Td align="right" mono>{moneyDh(report.totalGross)}</Td>
                    <Td align="right" mono>{moneyDh(report.netPayable)}</Td>
                    <Td>
                      <span className="flex gap-0.5" title={`Étape ${step + 1} sur ${CIRCUIT.length}`}>
                        {CIRCUIT.map((_, i) => (
                          <span
                            key={i}
                            className={`h-1.5 w-3 rounded-[1px] ${
                              i <= step
                                ? report.status === 'REJECTED'
                                  ? 'bg-danger'
                                  : 'bg-primary'
                                : 'bg-surface-3'
                            }`}
                          />
                        ))}
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge tone={TONE[report.status] ?? 'neutral'}>
                        {EXPENSE_STATUS_LABELS[report.status] ?? report.status}
                      </StatusBadge>
                      {report.paidAt && (
                        <span className="ml-2 text-[11.5px] text-subtle">{date(report.paidAt)}</span>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        )}
      </Card>
      </div>
    </>
  );
}
