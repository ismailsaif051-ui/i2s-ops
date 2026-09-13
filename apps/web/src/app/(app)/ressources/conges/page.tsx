import type { Metadata } from 'next';
import { can } from '@i2s/contracts';
import { api, requireSession } from '@/lib/api';
import { date } from '@/lib/format';
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
  LeaveDecision,
  LeaveRequestForm,
  type LeaveTypeOption,
} from '@/components/leave-request-form';

export const metadata: Metadata = { title: 'Congés' };

interface LeaveRow {
  id: string;
  employeeId: string;
  employee: string;
  matricule: string;
  department: string | null;
  type: string;
  typeLabel: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  reason: string | null;
  decidedAt: string | null;
  isMine: boolean;
}

const STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: 'Brouillon', tone: 'neutral' },
  SUBMITTED: { label: 'En attente', tone: 'warning' },
  APPROVED: { label: 'Accordé', tone: 'success' },
  REJECTED: { label: 'Refusé', tone: 'danger' },
  CANCELLED: { label: 'Retiré', tone: 'neutral' },
};

export default async function LeavesPage() {
  const [session, data] = await Promise.all([
    requireSession(),
    api<{
      year: number;
      items: LeaveRow[];
      totals: { all: number; pending: number; approvedDays: number };
      types: LeaveTypeOption[];
    }>('/leaves'),
  ]);

  const permissions = session.permissions as Parameters<typeof can>[0];
  const canCreate = can(permissions, 'leave', 'CREATE');
  const canApprove = can(permissions, 'leave', 'APPROVE');

  const pending = data.items.filter((l) => l.status === 'SUBMITTED');
  const mine = data.items.filter((l) => l.isMine);
  const myApprovedDays = mine
    .filter((l) => l.status === 'APPROVED')
    .reduce((sum, l) => sum + l.days, 0);

  return (
    <>
      <PageHeader
        eyebrow="Ressources"
        title="Congés"
        description="Le nombre de jours se compte sur le calendrier de la société : un pont férié ne se déduit pas du solde. Un congé accordé devient une journée d’absence au pointage, sans nouvelle saisie."
        action={canCreate ? <LeaveRequestForm types={data.types} /> : undefined}
      />

      <KpiRow>
        <KpiCard label="Demandes" value={data.totals.all} hint={`année ${data.year}`} />
        <KpiCard
          label="En attente"
          value={data.totals.pending}
          tone={data.totals.pending > 0 ? 'warning' : undefined}
        />
        <KpiCard label="Jours accordés" value={data.totals.approvedDays} hint="dans votre périmètre" />
        <KpiCard label="Mes jours accordés" value={myApprovedDays} />
      </KpiRow>

      {canApprove && pending.length > 0 && (
        <NextActionBanner
          tone="warning"
          title={`${pending.length} demande(s) en attente de décision`}
          detail="Un congé accordé se répercute seul sur le pointage. Vérifiez qu’aucune mission n’est planifiée sur la période."
        />
      )}

      <Card title={`${data.items.length} demande(s) — ${data.year}`}>
        {data.items.length === 0 ? (
          <EmptyState
            title="Aucune demande"
            description="Les congés posés apparaissent ici, avec leur décompte en jours ouvrés."
          />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>Collaborateur</Th>
                <Th>Service</Th>
                <Th>Nature</Th>
                <Th>Du</Th>
                <Th>Au</Th>
                <Th align="right">Jours</Th>
                <Th>Motif</Th>
                <Th>Statut</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((leave) => {
                const status = STATUS[leave.status] ?? {
                  label: leave.status,
                  tone: 'neutral' as Tone,
                };

                return (
                  <tr key={leave.id}>
                    <Td>
                      {leave.employee}
                      {leave.isMine && <span className="ml-2 text-[13px] text-subtle">vous</span>}
                    </Td>
                    <Td>{leave.department ?? <span className="text-subtle">—</span>}</Td>
                    <Td>{leave.typeLabel}</Td>
                    <Td mono>{date(leave.startDate)}</Td>
                    <Td mono>{date(leave.endDate)}</Td>
                    <Td mono align="right">
                      {leave.days}
                    </Td>
                    <Td>{leave.reason ?? <span className="text-subtle">—</span>}</Td>
                    <Td>
                      <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                    </Td>
                    <Td>
                      {leave.status === 'SUBMITTED' && (
                        <LeaveDecision
                          leaveId={leave.id}
                          canApprove={canApprove && !leave.isMine}
                          canCancel={leave.isMine}
                        />
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
