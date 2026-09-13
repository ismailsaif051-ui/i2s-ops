import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ApiError, api } from '@/lib/api';
import { date, moneyDh } from '@/lib/format';
import {
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  StatusBadge,
  Td,
  Th,
  type Tone,
} from '@/components/ui';
import {
  ExpenseActions,
  ExpenseLineForm,
  RemoveLineButton,
  type Category,
  type ExpenseLine,
  type Issue,
  type MissionOption,
} from '@/components/expense-report-form';

export const metadata: Metadata = { title: 'Note de frais' };

interface ExpenseReport {
  id: string;
  number: string;
  status: string;
  type: string;
  month: string;
  employee: { matricule: string; name: string; department: string | null };
  totalGross: number;
  advanceDeduction: number;
  netPayable: number;
  paidAt: string | null;
  bankReference: string | null;
  rejectReason: string | null;
  lines: ExpenseLine[];
  approvals: Array<{
    step: number;
    roleCode: string;
    decision: string;
    comment: string | null;
    decidedAt: string;
  }>;
  issues: Issue[];
  currentStep: { label: string; roles: string[] } | null;
  actions: { edit: boolean; submit: boolean; decide: boolean; pay: boolean };
}

const STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: 'En saisie', tone: 'neutral' },
  SUBMITTED: { label: 'Transmise', tone: 'warning' },
  CONFIRMED_N1: { label: 'Confirmée par le responsable', tone: 'warning' },
  CHECKED_HR_CG: { label: 'Contrôlée RH / CG', tone: 'info' },
  ACCOUNTED: { label: 'Comptabilisée', tone: 'info' },
  APPROVED_DG: { label: 'Approuvée DG', tone: 'info' },
  READY_TO_PAY: { label: 'Bon à payer', tone: 'success' },
  PAID: { label: 'Réglée', tone: 'success' },
  REJECTED: { label: 'Rejetée', tone: 'danger' },
};

const ROLE_LABELS: Record<string, string> = {
  DEPT_HEAD: 'chef de département',
  ACCOUNT_MANAGER: 'chargé d’affaires',
  HR: 'ressources humaines',
  CONTROLLER: 'contrôle de gestion',
  RAF: 'RAF',
  DG: 'direction générale',
};

export default async function ExpenseReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let report: ExpenseReport;
  try {
    report = await api<ExpenseReport>(`/expense-reports/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const [{ items: categories }, missions] = await Promise.all([
    api<{ items: Category[] }>('/expense-reports/categories'),
    report.actions.edit
      ? api<{ items: MissionOption[] }>(`/expense-reports/${id}/missions`)
          .then((r) => r.items)
          .catch(() => [] as MissionOption[])
      : Promise.resolve([] as MissionOption[]),
  ]);

  const status = STATUS[report.status] ?? { label: report.status, tone: 'neutral' as Tone };
  const warnings = report.issues.filter((i) => !i.blocking);

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/finance/notes-de-frais" className="hover:text-text">
            ‹ Notes de frais
          </Link>
        }
        title={report.number}
        description={`${report.employee.name} · ${report.employee.department ?? '—'} · ${
          report.type === 'MISSION' ? 'frais de mission' : 'frais hors mission'
        } · ${report.month}`}
        action={<StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
      />

      {report.rejectReason && (
        <div className="mb-5 rounded-[12px] border border-danger/30 bg-danger-soft px-5 py-4">
          <p className="text-[15px] font-medium text-danger">Note renvoyée</p>
          <p className="mt-1 text-[14px] text-muted">{report.rejectReason}</p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-5">
          {report.actions.edit && (
            <ExpenseLineForm
              reportId={report.id}
              categories={categories}
              missions={missions as MissionOption[]}
              reportType={report.type}
            />
          )}

          <Card title={`Dépenses — ${report.lines.length}`}>
            {report.lines.length === 0 ? (
              <EmptyState
                title="Aucune dépense"
                description="Ajoutez les dépenses du mois. Chaque nature a ses règles : justificatif obligatoire, plafond journalier ou mensuel."
              />
            ) : (
              <DataTable>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Nature</Th>
                    <Th>Libellé</Th>
                    <Th>Mission</Th>
                    <Th>Justificatif</Th>
                    <Th align="right">Montant</Th>
                    {report.actions.edit && <Th />}
                  </tr>
                </thead>
                <tbody>
                  {report.lines.map((line) => (
                    <tr key={line.id}>
                      <Td mono>{date(line.date)}</Td>
                      <Td>{line.category.label}</Td>
                      <Td>
                        {line.description ?? <span className="text-subtle">—</span>}
                        {line.comment && (
                          <span className="mt-0.5 block text-[13px] text-subtle">{line.comment}</span>
                        )}
                      </Td>
                      <Td mono>{line.mission ?? <span className="text-subtle">—</span>}</Td>
                      <Td>
                        {line.hasReceipt ? (
                          <span className="text-[13.5px] text-success">joint</span>
                        ) : (
                          <span className="text-[13.5px] text-subtle">absent</span>
                        )}
                      </Td>
                      <Td mono align="right">
                        {moneyDh(line.amount)}
                      </Td>
                      {report.actions.edit && (
                        <Td>
                          <RemoveLineButton reportId={report.id} lineId={line.id} />
                        </Td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            )}
          </Card>

          {report.approvals.length > 0 && (
            <Card title="Circuit de visa">
              <ul className="flex flex-col divide-y divide-border">
                {report.approvals.map((a, index) => (
                  <li key={`${a.step}-${index}`} className="flex flex-wrap items-baseline gap-3 px-5 py-3">
                    <span className="ref text-[13px] text-subtle">étape {a.step}</span>
                    <StatusBadge tone={a.decision === 'APPROVED' ? 'success' : 'danger'}>
                      {a.decision === 'APPROVED' ? 'Visée' : 'Rejetée'}
                    </StatusBadge>
                    <span className="text-[14px]">{ROLE_LABELS[a.roleCode] ?? a.roleCode}</span>
                    <span className="ref text-[13.5px] text-subtle">{date(a.decidedAt)}</span>
                    {a.comment && (
                      <span className="w-full text-[13.5px] text-muted">{a.comment}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <ExpenseActions
            reportId={report.id}
            status={report.status}
            currentStep={report.currentStep}
            actions={report.actions}
            issues={report.issues}
          />

          <Card title="Montants">
            <dl className="flex flex-col divide-y divide-border">
              {[
                ['Total des dépenses', moneyDh(report.totalGross)],
                ['Avances déduites', report.advanceDeduction > 0 ? `− ${moneyDh(report.advanceDeduction)}` : '—'],
                ['Net à payer', moneyDh(report.netPayable)],
                ['Réglée le', report.paidAt ? date(report.paidAt) : '—'],
                ['Référence', report.bankReference ?? '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 px-5 py-3">
                  <dt className="text-[13.5px] text-muted">{label}</dt>
                  <dd className="tnum text-right text-[14.5px]">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {warnings.length > 0 && (
            <Card title="Signalements">
              <ul className="flex flex-col gap-2 px-5 py-4">
                {warnings.map((w, index) => (
                  <li key={`${w.line}-${index}`} className="text-[13.5px] text-muted">
                    <span className="font-medium">{w.line}</span> — {w.message}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
