import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ApiError, api } from '@/lib/api';
import { MISSION_STATUS_LABELS, date, moneyDh } from '@/lib/format';
import { Card, EmptyState, PageHeader, StatusBadge, type Tone } from '@/components/ui';
import {
  MissionOrderPanel,
  MissionTeam,
  type EmployeeOption,
  type TeamMember,
} from '@/components/mission-team';

export const metadata: Metadata = { title: 'Mission' };

const TONE: Record<string, Tone> = {
  REQUESTED: 'neutral',
  PLANNED: 'neutral',
  ASSIGNED: 'info',
  CONFIRMED: 'warning',
  ORDER_ISSUED: 'success',
  IN_PROGRESS: 'success',
  COMPLETED: 'success',
  REPORTED: 'success',
  CLOSED: 'neutral',
  POSTPONED: 'warning',
  CANCELLED: 'danger',
};

interface MissionDetail {
  id: string;
  number: string;
  status: string;
  objective: string | null;
  instructions: string | null;
  serviceType: string | null;
  billable: boolean;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  reportDueDate: string | null;
  affair: { id: string; number: string; title: string; client: string };
  department: { id: string; code: string; name: string } | null;
  site: { id: string; name: string; city: string | null } | null;
  team: TeamMember[];
  missionOrder: {
    id: string;
    number: string;
    status: string;
    object: string;
    instructions: string | null;
    hseInstructions: string | null;
    signedAt: string | null;
    signatureHash: string | null;
  } | null;
  inspections: Array<{ id: string; status: string }>;
  reports: Array<{ id: string; number: string; status: string }>;
  expenseLines: Array<{
    id: string;
    date: string;
    amount: number;
    status: string;
    category: string;
    expenseReport: { id: string; number: string; status: string };
  }>;
  actions: { assign: boolean; issueOrder: boolean; signOrder: boolean };
}

interface Options {
  employees: EmployeeOption[];
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[12.5px] uppercase tracking-[0.04em] text-subtle">{label}</span>
      <span className="text-[14.5px]">{children}</span>
    </div>
  );
}

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let mission: MissionDetail;
  try {
    mission = await api<MissionDetail>(`/missions/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  // Les intervenants ne sont chargés que si l'écran peut les proposer.
  const options = mission.actions.assign
    ? await api<Options>('/missions/options').catch(() => ({ employees: [] as EmployeeOption[] }))
    : { employees: [] as EmployeeOption[] };

  const dash = <span className="text-subtle">—</span>;

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/operations/missions" className="hover:text-text">
            ‹ Missions
          </Link>
        }
        title={mission.number}
        description={`${mission.affair.client} · affaire ${mission.affair.number} · ${mission.affair.title}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge tone={TONE[mission.status] ?? 'neutral'}>
              {MISSION_STATUS_LABELS[mission.status] ?? mission.status}
            </StatusBadge>
            {!mission.billable && <StatusBadge tone="neutral">non facturable</StatusBadge>}
          </div>
        }
      />

      <Card title="Intervention">
        <div className="grid grid-cols-2 gap-5 px-5 py-5 md:grid-cols-4">
          <Line label="Objet">{mission.objective ?? dash}</Line>
          <Line label="Service">{mission.department?.code ?? dash}</Line>
          <Line label="Site">{mission.site?.name ?? dash}</Line>
          <Line label="Prestation">{mission.serviceType ?? dash}</Line>
          <Line label="Début prévu">{date(mission.plannedStartDate)}</Line>
          <Line label="Fin prévue">{date(mission.plannedEndDate)}</Line>
          <Line label="Fin réelle">{date(mission.actualEndDate)}</Line>
          <Line label="Rapport dû le">{date(mission.reportDueDate)}</Line>
        </div>
        {mission.instructions && (
          <div className="border-t border-border px-5 py-4">
            <p className="text-[13px] uppercase tracking-[0.04em] text-subtle">Consignes</p>
            <p className="mt-1 whitespace-pre-line text-[14.5px]">{mission.instructions}</p>
          </div>
        )}
      </Card>

      <div className="mt-5 flex flex-col gap-5">
        <MissionTeam
          missionId={mission.id}
          employees={options.employees}
          team={mission.team}
          actions={mission.actions}
          missionEnd={mission.plannedEndDate?.slice(0, 10) ?? null}
          department={mission.department?.code ?? null}
        />

        <MissionOrderPanel
          missionId={mission.id}
          order={mission.missionOrder}
          actions={mission.actions}
          defaultObject={mission.objective ?? mission.affair.title}
        />

        <Card
          title="Frais de mission"
          action={
            <Link
              href="/finance/notes-de-frais"
              className="text-[13px] font-medium text-accent hover:underline"
            >
              Déclarer un frais
            </Link>
          }
        >
          {mission.expenseLines.length === 0 ? (
            <EmptyState
              title="Aucun frais déclaré"
              description="Les dépenses liées à cette mission (carburant, péage, hébergement…) se déclarent depuis Notes de frais, en choisissant cette mission dans la liste."
            />
          ) : (
            <ul className="divide-y divide-border">
              {mission.expenseLines.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className="w-24 text-[13px] text-subtle">{date(l.date)}</span>
                  <span className="flex-1 text-[14px]">{l.category}</span>
                  <span className="ref text-[14px] font-medium">{moneyDh(l.amount)}</span>
                  <Link
                    href={`/finance/notes-de-frais/${l.expenseReport.id}`}
                    className="text-[13px] text-accent hover:underline"
                  >
                    {l.expenseReport.number}
                  </Link>
                  <StatusBadge tone={l.status === 'REJECTED' ? 'danger' : 'neutral'}>
                    {l.status === 'PENDING' ? 'en attente' : l.status === 'ACCEPTED' ? 'acceptée' : 'rejetée'}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Saisies et rapports">
          {mission.inspections.length === 0 && mission.reports.length === 0 ? (
            <EmptyState
              title="Rien de saisi"
              description="La saisie terrain s’ouvre dès que l’ordre de mission est signé, pour les inspecteurs affectés."
            />
          ) : (
            <ul className="divide-y divide-border">
              {mission.reports.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <Link
                    href={`/operations/rapports/${r.id}`}
                    className="ref text-[14px] font-medium hover:text-accent"
                  >
                    {r.number}
                  </Link>
                  <StatusBadge tone="neutral">{r.status}</StatusBadge>
                </li>
              ))}
              {mission.inspections
                .filter((i) => i.status === 'DRAFT')
                .map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <Link
                      href={`/operations/inspections/${i.id}`}
                      className="text-[14px] hover:text-accent"
                    >
                      Saisie en cours
                    </Link>
                    <StatusBadge tone="warning">Brouillon</StatusBadge>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
