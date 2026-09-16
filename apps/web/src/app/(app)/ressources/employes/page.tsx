import type { Metadata } from 'next';
import Link from 'next/link';
import { api, requireSession } from '@/lib/api';
import { can } from '@i2s/contracts';
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
} from '@/components/ui';
import { ImportEmployeesForm } from '@/components/import-employees-form';

export const metadata: Metadata = { title: 'Employés' };

interface EmployeeRow {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  position: string | null;
  isInspector: boolean;
  status: 'ACTIVE' | 'ON_LEAVE' | 'LEFT';
  department: { id: string; code: string; name: string } | null;
  currentDailyCost: { amount: string; validFrom: string } | null;
}

const STATUS: Record<EmployeeRow['status'], { label: string; tone: 'success' | 'warning' | 'neutral' }> =
  {
    ACTIVE: { label: 'Actif', tone: 'success' },
    ON_LEAVE: { label: 'En congé', tone: 'warning' },
    LEFT: { label: 'Sorti', tone: 'neutral' },
  };

export default async function EmployeesPage() {
  const [session, { items }] = await Promise.all([
    requireSession(),
    api<{ items: EmployeeRow[] }>('/employees?limit=200'),
  ]);

  const permissions = session.permissions as Parameters<typeof can>[0];
  const canExport = can(permissions, 'employee', 'EXPORT');
  const canCreate = can(permissions, 'employee', 'CREATE');
  const inspectors = items.filter((e) => e.isInspector).length;
  const withoutCost = items.filter((e) => !e.currentDailyCost).length;

  return (
    <>
      <PageHeader
        eyebrow="Ressources"
        title="Employés"
        description="Le coût journalier est historisé par période de validité : une modification ouvre une nouvelle période et n’écrase jamais l’historique."
        action={
          <div className="flex items-center gap-2">
            {canExport && (
              <a
                href="/api/employees/export"
                className="inline-flex h-10 items-center rounded-[10px] border border-border-strong bg-surface px-4 text-[14px] font-medium text-text shadow-sm transition-colors hover:border-accent hover:text-accent"
              >
                Exporter Excel
              </a>
            )}
            {canCreate && <ImportEmployeesForm />}
          </div>
        }
      />

      <KpiRow>
        <KpiCard label="Effectif" value={items.length} hint="dans votre périmètre" />
        <KpiCard label="Inspecteurs" value={inspectors} hint="affectables en mission" />
        <KpiCard
          label="Sans coût journalier"
          value={withoutCost}
          tone={withoutCost > 0 ? 'danger' : undefined}
          hint={
            withoutCost > 0
              ? 'Aucune marge calculable pour ces employés'
              : 'Tous les coûts sont renseignés'
          }
        />
      </KpiRow>

      <Card title={`Liste — ${items.length} employé${items.length > 1 ? 's' : ''}`}>
        {items.length === 0 ? (
          <EmptyState
            title="Aucun employé enregistré"
            description="Créez les fiches employés, puis renseignez le coût journalier de chacun : c’est la donnée qui rend calculables la productivité, le coût d’inactivité et la marge par affaire."
          />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>Matricule</Th>
                <Th>Nom</Th>
                <Th>Fonction</Th>
                <Th>Département</Th>
                <Th>Rôle terrain</Th>
                <Th align="right">Coût journalier</Th>
                <Th>Statut</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((employee) => (
                <tr key={employee.id}>
                  <Td mono>
                    <Link href={`/ressources/employes/${employee.id}`} className="hover:text-accent">
                      {employee.matricule}
                    </Link>
                  </Td>
                  <Td>
                    <Link
                      href={`/ressources/employes/${employee.id}`}
                      className="font-medium hover:text-accent"
                    >
                      {employee.lastName.toUpperCase()} {employee.firstName}
                    </Link>
                  </Td>
                  <Td>{employee.position ?? '—'}</Td>
                  <Td>{employee.department?.code ?? '—'}</Td>
                  <Td>
                    {employee.isInspector ? (
                      <StatusBadge tone="primary">Inspecteur</StatusBadge>
                    ) : (
                      <span className="text-subtle">Support</span>
                    )}
                  </Td>
                  <Td align="right" mono>
                    {employee.currentDailyCost ? (
                      <>
                        {Number(employee.currentDailyCost.amount).toLocaleString('fr-MA')} DH
                        <span className="ml-1.5 text-subtle">
                          depuis{' '}
                          {new Date(employee.currentDailyCost.validFrom).toLocaleDateString('fr-FR')}
                        </span>
                      </>
                    ) : (
                      <span className="text-danger">à définir</span>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge tone={STATUS[employee.status].tone}>
                      {STATUS[employee.status].label}
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
