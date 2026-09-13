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
} from '@/components/ui';
import { CertificationForm, type EmployeeOption } from '@/components/certification-form';

export const metadata: Metadata = { title: 'Habilitations' };

interface CertificationRow {
  id: string;
  employeeId: string;
  employee: string;
  matricule: string;
  department: string | null;
  isInspector: boolean;
  type: string;
  method: string | null;
  level: string | null;
  issuer: string | null;
  number: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  hasDocument: boolean;
  expired: boolean;
  dueSoon: boolean;
  daysLeft: number | null;
}

export default async function CertificationsPage() {
  const [session, data] = await Promise.all([
    requireSession(),
    api<{
      items: CertificationRow[];
      totals: { all: number; expired: number; dueSoon: number; inspectors: number };
      methods: string[];
    }>('/certifications'),
  ]);

  const permissions = session.permissions as Parameters<typeof can>[0];
  const canCreate = can(permissions, 'certification', 'CREATE');

  const employees = canCreate
    ? await api<{ items: Array<{ id: string; matricule: string; firstName: string; lastName: string }> }>(
        '/employees?limit=200',
      )
        .then((r) =>
          r.items.map((e) => ({
            id: e.id,
            matricule: e.matricule,
            name: `${e.lastName.toUpperCase()} ${e.firstName}`,
          })),
        )
        .catch(() => [] as EmployeeOption[])
    : [];

  const expired = data.items.filter((c) => c.expired);

  return (
    <>
      <PageHeader
        eyebrow="Ressources"
        title="Habilitations"
        description="Une habilitation périmée empêche d’affecter son porteur à une mission de la méthode concernée. Enregistrer le renouvellement est le seul geste qui rouvre cette affectation."
        action={canCreate ? <CertificationForm employees={employees} methods={data.methods} /> : undefined}
      />

      <KpiRow>
        <KpiCard label="Habilitations" value={data.totals.all} />
        <KpiCard
          label="Périmées"
          value={data.totals.expired}
          tone={data.totals.expired > 0 ? 'danger' : 'success'}
          hint="affectation bloquée"
        />
        <KpiCard
          label="À renouveler sous 60 j"
          value={data.totals.dueSoon}
          tone={data.totals.dueSoon > 0 ? 'warning' : undefined}
        />
        <KpiCard label="Inspecteurs habilités" value={data.totals.inspectors} />
      </KpiRow>

      {expired.length > 0 && (
        <NextActionBanner
          tone="danger"
          title={`${expired.length} habilitation(s) périmée(s)`}
          detail={`${expired
            .slice(0, 4)
            .map((c) => `${c.employee} — ${c.type}${c.method ? ` ${c.method}` : ''}`)
            .join(' · ')}. Le planning refuse d’affecter ces personnes à la méthode concernée.`}
        />
      )}

      <Card title={`${data.items.length} habilitation(s)`}>
        {data.items.length === 0 ? (
          <EmptyState
            title="Aucune habilitation enregistrée"
            description="Sans habilitation enregistrée, le planning ne peut pas vérifier qu’un inspecteur est certifié pour la méthode qu’on lui confie."
          />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>Titulaire</Th>
                <Th>Service</Th>
                <Th>Type</Th>
                <Th>Méthode</Th>
                <Th>Niveau</Th>
                <Th>Organisme</Th>
                <Th>N°</Th>
                <Th>Échéance</Th>
                <Th>Certificat</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id} className={c.expired ? 'bg-danger-soft' : undefined}>
                  <Td>{c.employee}</Td>
                  <Td>{c.department ?? <span className="text-subtle">—</span>}</Td>
                  <Td>{c.type}</Td>
                  <Td mono>{c.method ?? <span className="text-subtle">—</span>}</Td>
                  <Td mono>{c.level ?? <span className="text-subtle">—</span>}</Td>
                  <Td>{c.issuer ?? <span className="text-subtle">—</span>}</Td>
                  <Td mono>{c.number ?? <span className="text-subtle">—</span>}</Td>
                  <Td>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="tnum">{date(c.expiresAt)}</span>
                      {c.expired ? (
                        <StatusBadge tone="danger">
                          {c.daysLeft === null
                            ? 'sans échéance'
                            : `périmée depuis ${Math.abs(c.daysLeft)} j`}
                        </StatusBadge>
                      ) : c.dueSoon ? (
                        <StatusBadge tone="warning">{c.daysLeft} j restants</StatusBadge>
                      ) : null}
                    </span>
                  </Td>
                  <Td>
                    {c.hasDocument ? (
                      <span className="text-[13.5px] text-success">joint</span>
                    ) : (
                      <span className="text-[13.5px] text-subtle">absent</span>
                    )}
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
