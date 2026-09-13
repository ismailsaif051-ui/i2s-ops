import Link from 'next/link';
import type { Metadata } from 'next';
import { can } from '@i2s/contracts';
import { api, requireSession } from '@/lib/api';
import { date } from '@/lib/format';
import { OpenNonConformity } from '@/components/non-conformity-actions';
import {
  Card,
  EmptyState,
  KpiCard,
  KpiRow,
  NextActionBanner,
  PageHeader,
  StatusBadge,
  type Tone,
} from '@/components/ui';

export const metadata: Metadata = { title: 'Non-conformités' };

interface NcRow {
  id: string;
  number: string;
  description: string;
  severity: string;
  status: string;
  affair: string | null;
  client: string | null;
  asset: string | null;
  owner: string | null;
  dueDate: string | null;
  closedAt: string | null;
  late: boolean;
  dueSoon: boolean;
  daysLeft: number | null;
}

const SEVERITY: Record<string, { label: string; tone: Tone }> = {
  CRITICAL: { label: 'Critique', tone: 'danger' },
  MAJOR: { label: 'Majeure', tone: 'warning' },
  MINOR: { label: 'Mineure', tone: 'info' },
  OBSERVATION: { label: 'Observation', tone: 'neutral' },
};

const STATUS: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: 'Ouverte', tone: 'danger' },
  ASSIGNED: { label: 'Affectée', tone: 'warning' },
  IN_PROGRESS: { label: 'En traitement', tone: 'warning' },
  EVIDENCE_PROVIDED: { label: 'Preuve fournie', tone: 'info' },
  VERIFICATION: { label: 'Vérification', tone: 'info' },
  CLOSED: { label: 'Clôturée', tone: 'success' },
  REJECTED: { label: 'Rejetée', tone: 'neutral' },
};

export default async function NonConformitiesPage() {
  const [session, { items }, affairs] = await Promise.all([
    requireSession(),
    api<{ items: NcRow[] }>('/non-conformities'),
    api<{ items: Array<{ id: string; number: string; client: { name: string } }> }>(
      '/affairs?limit=200',
    )
      .then((r) => r.items.map((a) => ({ id: a.id, number: a.number, client: a.client.name })))
      .catch(() => [] as Array<{ id: string; number: string; client: string }>),
  ]);

  const permissions = session.permissions as Parameters<typeof can>[0];
  const canCreate = can(permissions, 'non_conformity', 'CREATE');

  const employees = canCreate
    ? await api<{
        items: Array<{ id: string; firstName: string; lastName: string; department: string | null }>;
      }>('/employees?limit=200')
        .then((r) =>
          r.items.map((e) => ({
            id: e.id,
            name: `${e.lastName.toUpperCase()} ${e.firstName}`,
            department: e.department,
          })),
        )
        .catch(() => [])
    : [];

  const open = items.filter((n) => !['CLOSED', 'REJECTED'].includes(n.status));
  const critical = open.filter((n) => n.severity === 'CRITICAL');
  const overdue = open.filter((n) => n.late);

  return (
    <>
      <PageHeader
        eyebrow="Opérations"
        title="Non-conformités"
        description="Un écart porte un responsable, une échéance qui découle de sa gravité, et une action corrective à prouver. Il ne se clôture que sur preuve, et jamais par celui qui l’a traité."
        action={canCreate ? <OpenNonConformity affairs={affairs} employees={employees} /> : undefined}
      />

      <KpiRow>
        <KpiCard
          label="Ouvertes"
          value={open.length}
          tone={open.length > 0 ? 'warning' : 'success'}
        />
        <KpiCard
          label="Critiques"
          value={critical.length}
          tone={critical.length > 0 ? 'danger' : undefined}
          hint="arrêt d’exploitation possible"
        />
        <KpiCard
          label="Échéance dépassée"
          value={overdue.length}
          tone={overdue.length > 0 ? 'danger' : undefined}
        />
        <KpiCard label="Clôturées" value={items.length - open.length} tone="success" />
      </KpiRow>

      {critical.length > 0 && (
        <NextActionBanner
          tone="danger"
          title={`${critical.length} non-conformité(s) critique(s) ouverte(s)`}
          detail="Une non-conformité critique peut impliquer l’arrêt de l’équipement. Elle doit être traitée avant toute remise en service."
        />
      )}

      <Card title={`${items.length} non-conformités`}>
        {items.length === 0 ? (
          <EmptyState
            title="Aucune non-conformité"
            description="Les non-conformités naissent des observations relevées pendant les inspections."
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((nc) => (
              <li key={nc.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Link
                    href={`/operations/non-conformites/${nc.id}`}
                    className="ref text-[13px] font-medium hover:text-accent"
                  >
                    {nc.number}
                  </Link>
                  <StatusBadge tone={SEVERITY[nc.severity]?.tone ?? 'neutral'}>
                    {SEVERITY[nc.severity]?.label ?? nc.severity}
                  </StatusBadge>
                  <StatusBadge tone={STATUS[nc.status]?.tone ?? 'neutral'}>
                    {STATUS[nc.status]?.label ?? nc.status}
                  </StatusBadge>
                  {nc.late && (
                    <StatusBadge tone="danger">
                      En retard de {Math.abs(nc.daysLeft ?? 0)} jour(s)
                    </StatusBadge>
                  )}
                  {nc.dueSoon && <StatusBadge tone="warning">Échéance proche</StatusBadge>}
                  {nc.affair && (
                    <span className="ref text-[13px] text-subtle">
                      {nc.affair}
                      {nc.client ? ` · ${nc.client}` : ''}
                    </span>
                  )}
                </div>
                <p className="mt-2 max-w-[90ch] text-[14.5px] leading-relaxed">{nc.description}</p>
                <p className="mt-1.5 text-[13.5px] text-subtle">
                  Responsable : {nc.owner ?? 'non affecté'}
                  {nc.dueDate ? ` · Échéance ${date(nc.dueDate)}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
