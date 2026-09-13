import Link from 'next/link';
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

export const metadata: Metadata = { title: 'Missions' };

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

export default async function MissionsPage() {
  const { items } = await api<{ items: MissionRow[] }>('/missions?limit=150');

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
        <KpiCard label="Missions" value={items.length} hint="dans votre périmètre" />
        <KpiCard label="En cours" value={inProgress} tone={inProgress > 0 ? 'primary' : undefined} />
        <KpiCard
          label="Rapport en retard"
          value={lateReports}
          tone={lateReports > 0 ? 'danger' : undefined}
          hint="mission terminée, délai QMS dépassé"
        />
      </KpiRow>

      <Card title={`${items.length} missions`}>
        {items.length === 0 ? (
          <EmptyState
            title="Aucune mission"
            description="Les missions se créent depuis une affaire en cours, puis s’affectent depuis le planning."
          />
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
              {items.map((m) => (
                <tr key={m.id}>
                  <Td mono>
                    <Link href={`/operations/missions/${m.id}`} className="hover:text-accent">
                      {m.number}
                    </Link>
                  </Td>
                  <Td>
                    <Link
                      href={`/affaires/${m.affair.id}`}
                      className="ref text-[12px] text-primary hover:underline"
                    >
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
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>
    </>
  );
}
