import type { Metadata } from 'next';
import { can } from '@i2s/contracts';
import { api, requireSession } from '@/lib/api';
import { date, moneyDh } from '@/lib/format';
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
import {
  AdvanceDecision,
  AdvanceRequestForm,
  type EmployeeOption,
} from '@/components/advance-forms';

export const metadata: Metadata = { title: 'Avances' };

interface AdvanceRow {
  id: string;
  employee: string;
  matricule: string;
  department: string | null;
  date: string;
  amount: number;
  settledAmount: number;
  outstanding: number;
  reason: string | null;
  affair: string | null;
  status: string;
  requestedBy: string | null;
  approvedBy: string | null;
  paidAt: string | null;
  rejectReason: string | null;
  isMine: boolean;
}

const STATUS: Record<string, { label: string; tone: Tone }> = {
  REQUESTED: { label: 'Demandée', tone: 'warning' },
  APPROVED: { label: 'Accordée', tone: 'info' },
  PAID: { label: 'Versée', tone: 'success' },
  PARTIALLY_SETTLED: { label: 'Partiellement soldée', tone: 'info' },
  SETTLED: { label: 'Soldée', tone: 'neutral' },
  CANCELLED: { label: 'Refusée', tone: 'danger' },
};

export default async function AdvancesPage() {
  const [session, data] = await Promise.all([
    requireSession(),
    api<{
      items: AdvanceRow[];
      totals: { all: number; pending: number; toPay: number; outstanding: number };
    }>('/advances'),
  ]);

  const permissions = session.permissions as Parameters<typeof can>[0];
  const canCreate = can(permissions, 'advance', 'CREATE');
  const canApprove = can(permissions, 'advance', 'APPROVE');
  const canPay = session.roles.some((r) => r.code === 'RAF' || r.code === 'ADMIN');

  const [employees, affairs] = canCreate
    ? await Promise.all([
        api<{ items: Array<{ id: string; matricule: string; firstName: string; lastName: string }> }>(
          '/employees?limit=200',
        )
          .then((r) =>
            r.items.map((e) => ({
              id: e.id,
              matricule: e.matricule,
              name: `${e.lastName.toUpperCase()} ${e.firstName}`,
            })),
          )
          .catch(() => [] as EmployeeOption[]),
        api<{ items: Array<{ id: string; number: string; client: { name: string } }> }>(
          '/affairs?limit=200',
        )
          .then((r) => r.items.map((a) => ({ id: a.id, number: a.number, client: a.client.name })))
          .catch(() => [] as Array<{ id: string; number: string; client: string }>),
      ])
    : [[] as EmployeeOption[], [] as Array<{ id: string; number: string; client: string }>];

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Avances sur frais"
        description="De la trésorerie sortie avant justificatif. Elle se retient ensuite sur les notes de frais de l’intéressé, automatiquement — sans quoi l’entreprise paierait deux fois."
        action={canCreate ? <AdvanceRequestForm employees={employees} affairs={affairs} /> : undefined}
      />

      <KpiRow>
        <KpiCard label="Avances" value={data.totals.all} />
        <KpiCard
          label="En attente d’accord"
          value={data.totals.pending}
          tone={data.totals.pending > 0 ? 'warning' : undefined}
        />
        <KpiCard
          label="À verser"
          value={data.totals.toPay}
          tone={data.totals.toPay > 0 ? 'info' : undefined}
          hint="accordées, non versées"
        />
        <KpiCard
          label="Reste à récupérer"
          value={moneyDh(data.totals.outstanding)}
          tone={data.totals.outstanding > 0 ? 'warning' : undefined}
          hint="sur les notes de frais à venir"
        />
      </KpiRow>

      {canApprove && data.totals.pending > 0 && (
        <NextActionBanner
          tone="warning"
          title={`${data.totals.pending} demande(s) en attente`}
          detail="Celui qui a enregistré la demande ne l’accorde pas : sur de la trésorerie, la séparation des tâches n’est pas une formalité."
        />
      )}

      <Card title={`${data.items.length} avance(s)`}>
        {data.items.length === 0 ? (
          <EmptyState
            title="Aucune avance"
            description="Une avance se demande pour une mission éloignée, puis se retient sur la note de frais du mois."
          />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>Bénéficiaire</Th>
                <Th>Service</Th>
                <Th>Date</Th>
                <Th>Motif</Th>
                <Th>Affaire</Th>
                <Th align="right">Montant</Th>
                <Th align="right">Soldé</Th>
                <Th align="right">Reste</Th>
                <Th>Statut</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((advance) => {
                const status = STATUS[advance.status] ?? {
                  label: advance.status,
                  tone: 'neutral' as Tone,
                };

                return (
                  <tr key={advance.id}>
                    <Td>
                      {advance.employee}
                      {advance.isMine && <span className="ml-2 text-[13px] text-subtle">vous</span>}
                    </Td>
                    <Td>{advance.department ?? <span className="text-subtle">—</span>}</Td>
                    <Td mono>{date(advance.date)}</Td>
                    <Td>
                      {advance.reason ?? <span className="text-subtle">—</span>}
                      {advance.rejectReason && (
                        <span className="mt-0.5 block text-[13px] text-danger">
                          {advance.rejectReason}
                        </span>
                      )}
                    </Td>
                    <Td mono>{advance.affair ?? <span className="text-subtle">—</span>}</Td>
                    <Td mono align="right">
                      {moneyDh(advance.amount)}
                    </Td>
                    <Td mono align="right">
                      {advance.settledAmount > 0 ? (
                        moneyDh(advance.settledAmount)
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </Td>
                    <Td mono align="right">
                      {advance.outstanding > 0 ? (
                        <span className="font-medium">{moneyDh(advance.outstanding)}</span>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </Td>
                    <Td>
                      <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                    </Td>
                    <Td>
                      <AdvanceDecision
                        advanceId={advance.id}
                        status={advance.status}
                        canApprove={canApprove && !advance.isMine}
                        canPay={canPay}
                      />
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
