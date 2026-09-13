import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ApiError, api } from '@/lib/api';
import { date } from '@/lib/format';
import { Card, PageHeader, StatusBadge, type Tone } from '@/components/ui';
import {
  NonConformityActions,
  NonConformitySteps,
  type EmployeeOption,
} from '@/components/non-conformity-actions';

export const metadata: Metadata = { title: 'Non-conformité' };

interface NonConformity {
  id: string;
  number: string;
  description: string;
  severity: string;
  status: string;
  dueDate: string | null;
  daysLeft: number | null;
  late: boolean;
  correctiveAction: string | null;
  verificationComment: string | null;
  hasEvidence: boolean;
  affair: { id: string; number: string; title: string; client: string } | null;
  asset: { tag: string; designation: string | null } | null;
  owner: { id: string; matricule: string; name: string } | null;
  openedBy: string | null;
  closedBy: string | null;
  closedAt: string | null;
  origin: {
    reference: string;
    comment: string | null;
    mission: string;
    report: string | null;
    date: string;
  } | null;
  actions: { assign: boolean; start: boolean; evidence: boolean; verify: boolean };
}

const SEVERITY: Record<string, { label: string; tone: Tone }> = {
  CRITICAL: { label: 'Critique', tone: 'danger' },
  MAJOR: { label: 'Majeure', tone: 'warning' },
  MINOR: { label: 'Mineure', tone: 'info' },
  OBSERVATION: { label: 'Observation', tone: 'neutral' },
};

export default async function NonConformityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let nc: NonConformity;
  try {
    nc = await api<NonConformity>(`/non-conformities/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const employees = nc.actions.assign
    ? await api<{ items: Array<{ id: string; firstName: string; lastName: string; department: string | null }> }>(
        '/employees?limit=200',
      )
        .then((r) =>
          r.items.map((e) => ({
            id: e.id,
            name: `${e.lastName.toUpperCase()} ${e.firstName}`,
            department: e.department,
          })),
        )
        .catch(() => [] as EmployeeOption[])
    : [];

  const severity = SEVERITY[nc.severity] ?? { label: nc.severity, tone: 'neutral' as Tone };

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/operations/non-conformites" className="hover:text-text">
            ‹ Non-conformités
          </Link>
        }
        title={nc.number}
        description={nc.description}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={severity.tone}>{severity.label}</StatusBadge>
            {nc.status !== 'CLOSED' && nc.daysLeft !== null && (
              <StatusBadge tone={nc.late ? 'danger' : nc.daysLeft <= 7 ? 'warning' : 'neutral'}>
                {nc.late
                  ? `En retard de ${Math.abs(nc.daysLeft)} jour(s)`
                  : `${nc.daysLeft} jour(s) restant(s)`}
              </StatusBadge>
            )}
          </div>
        }
      />

      <div className="mb-5">
        <NonConformitySteps status={nc.status} />
      </div>

      {nc.late && nc.status !== 'CLOSED' && (
        <div className="mb-5 rounded-[12px] border border-danger/30 bg-danger-soft px-5 py-4">
          <p className="text-[15px] font-medium text-danger">Échéance dépassée</p>
          <p className="mt-1 text-[14px] text-muted">
            Cet écart devait être levé le {date(nc.dueDate)}. Un écart en retard se voit en
            audit — il vaut mieux le traiter ou motiver son report.
          </p>
        </div>
      )}

      {nc.verificationComment && nc.status !== 'CLOSED' && (
        <div className="mb-5 rounded-[12px] border border-warning/30 bg-warning-soft px-5 py-4">
          <p className="text-[15px] font-medium text-warning">Levée refusée</p>
          <p className="mt-1 text-[14px] text-muted">{nc.verificationComment}</p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-5">
          <Card title="Constat">
            <p className="px-5 py-4 text-[15px]">{nc.description}</p>
          </Card>

          {nc.origin && (
            <Card title="Origine">
              <dl className="flex flex-col divide-y divide-border">
                {[
                  ['Observation', nc.origin.reference],
                  ['Mission', nc.origin.mission],
                  ['Rapport', nc.origin.report ?? '—'],
                  ['Date de l’essai', date(nc.origin.date)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-3 px-5 py-3">
                    <dt className="text-[13.5px] text-muted">{label}</dt>
                    <dd className="ref text-right text-[14.5px]">{value}</dd>
                  </div>
                ))}
              </dl>
              {nc.origin.comment && (
                <p className="border-t border-border px-5 py-3 text-[14px] text-muted">
                  {nc.origin.comment}
                </p>
              )}
            </Card>
          )}

          {nc.correctiveAction && (
            <Card
              title="Action corrective"
              action={
                nc.hasEvidence ? (
                  <StatusBadge tone="success">Preuve jointe</StatusBadge>
                ) : (
                  <StatusBadge tone="warning">Sans preuve</StatusBadge>
                )
              }
            >
              <p className="px-5 py-4 text-[15px]">{nc.correctiveAction}</p>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <NonConformityActions
            ncId={nc.id}
            status={nc.status}
            actions={nc.actions}
            employees={employees}
            hasEvidence={nc.hasEvidence}
          />

          <Card title="Fiche">
            <dl className="flex flex-col divide-y divide-border">
              {[
                ['Gravité', severity.label],
                ['Échéance', date(nc.dueDate)],
                ['Responsable', nc.owner?.name ?? 'à désigner'],
                ['Ouvert par', nc.openedBy ?? '—'],
                [
                  'Affaire',
                  nc.affair ? `${nc.affair.number} — ${nc.affair.client}` : '—',
                ],
                [
                  'Équipement',
                  nc.asset ? `${nc.asset.tag}${nc.asset.designation ? ` — ${nc.asset.designation}` : ''}` : '—',
                ],
                ['Clôturé par', nc.closedBy ?? '—'],
                ['Clôturé le', nc.closedAt ? date(nc.closedAt) : '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 px-5 py-3">
                  <dt className="text-[13.5px] text-muted">{label}</dt>
                  <dd className="text-right text-[14.5px]">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
