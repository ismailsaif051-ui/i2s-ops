import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ApiError, api } from '@/lib/api';
import { date, moneyDh } from '@/lib/format';
import { Card, EmptyState, PageHeader, StatusBadge } from '@/components/ui';
import { EmployeeBankForm } from '@/components/employee-bank-form';

export const metadata: Metadata = { title: 'Employé' };

interface EmployeeDetail {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  bankName: string | null;
  bankRib: string | null;
  hireDate: string | null;
  contractType: string | null;
  isInspector: boolean;
  status: 'ACTIVE' | 'ON_LEAVE' | 'LEFT';
  department: { id: string; code: string; name: string } | null;
  manager: { id: string; firstName: string; lastName: string } | null;
  dailyCosts: Array<{ amount: string; validFrom: string; validTo: string | null }>;
  actions: { update: boolean };
}

const STATUS: Record<EmployeeDetail['status'], { label: string; tone: 'success' | 'warning' | 'neutral' }> =
  {
    ACTIVE: { label: 'Actif', tone: 'success' },
    ON_LEAVE: { label: 'En congé', tone: 'warning' },
    LEFT: { label: 'Sorti', tone: 'neutral' },
  };

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[12.5px] uppercase tracking-[0.04em] text-subtle">{label}</span>
      <span className="text-[14.5px]">{children}</span>
    </div>
  );
}

export default async function EmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let employee: EmployeeDetail;
  try {
    employee = await api<EmployeeDetail>(`/employees/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const dash = <span className="text-subtle">—</span>;
  const status = STATUS[employee.status];

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/ressources/employes" className="hover:text-text">
            ‹ Employés
          </Link>
        }
        title={`${employee.lastName.toUpperCase()} ${employee.firstName}`}
        description={`${employee.matricule} · ${employee.position ?? 'Fonction non renseignée'}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            {employee.isInspector && <StatusBadge tone="primary">Inspecteur</StatusBadge>}
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-5">
          <Card title="Informations">
            <div className="grid grid-cols-2 gap-5 px-5 py-5 md:grid-cols-3">
              <Line label="Département">{employee.department?.name ?? dash}</Line>
              <Line label="Responsable">
                {employee.manager
                  ? `${employee.manager.lastName.toUpperCase()} ${employee.manager.firstName}`
                  : dash}
              </Line>
              <Line label="Type de contrat">{employee.contractType ?? dash}</Line>
              <Line label="Embauché le">{date(employee.hireDate)}</Line>
              <Line label="Email">{employee.email ?? dash}</Line>
              <Line label="Téléphone">{employee.phone ?? dash}</Line>
            </div>
          </Card>

          <Card title="Coût journalier">
            {employee.dailyCosts.length === 0 ? (
              <EmptyState
                title="Aucun coût journalier"
                description="Sans coût journalier, aucune marge n’est calculable pour cet employé sur ses affaires et missions."
              />
            ) : (
              <ul className="divide-y divide-border">
                {employee.dailyCosts.map((c, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <span className="ref text-[14px] font-medium">{moneyDh(Number(c.amount))}</span>
                    <span className="text-[13.5px] text-muted">
                      depuis {date(c.validFrom)}
                      {c.validTo ? ` · jusqu’au ${date(c.validTo)}` : ' · en cours'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <EmployeeBankForm
            employeeId={employee.id}
            bankName={employee.bankName}
            bankRib={employee.bankRib}
            editable={employee.actions.update}
          />
        </div>
      </div>
    </>
  );
}
