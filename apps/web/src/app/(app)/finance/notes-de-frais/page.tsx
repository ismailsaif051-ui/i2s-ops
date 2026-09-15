import Link from 'next/link';
import type { Metadata } from 'next';
import { api, requireSession } from '@/lib/api';
import { can } from '@i2s/contracts';
import { EXPENSE_STATUS_LABELS, compactDh, date, monthLabel, moneyDh } from '@/lib/format';
import { OpenExpenseReport } from '@/components/open-expense-report';
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

export default async function ExpenseReportsPage() {
  const [session, { items }] = await Promise.all([
    requireSession(),
    api<{ items: ExpenseRow[] }>('/expense-reports'),
  ]);

  const permissions = session.permissions as Parameters<typeof can>[0];
  const canCreate = can(permissions, 'expense_report', 'CREATE');
  const canExport = can(permissions, 'expense_report', 'EXPORT');

  const pending = items.filter(
    (r) => !['PAID', 'REJECTED', 'DRAFT'].includes(r.status),
  );
  const paid = items.filter((r) => r.status === 'PAID');
  const warnings = items.reduce((s, r) => s + r.capWarnings, 0);
  const pendingAmount = pending.reduce((s, r) => s + r.netPayable, 0);

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
                href="/api/frais/export"
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
        <KpiCard label="Notes" value={items.length} hint="dans votre périmètre" />
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

      {pending.length > 0 && (
        <NextActionBanner
          tone="warning"
          title={`${pending.length} note(s) de frais attendent un visa`}
          detail="Rappel des délais : validation N+1 sous 3 jours ouvrés, contrôle RH et contrôle de gestion sous 5 jours ouvrés, virement le 15 du mois."
        />
      )}

      <Card title={`${items.length} notes de frais`}>
        {items.length === 0 ? (
          <EmptyState
            title="Aucune note de frais"
            description="Les frais de mission se déclarent depuis le mobile, à la fin de chaque intervention."
          />
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
    </>
  );
}
