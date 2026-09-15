import type { Metadata } from 'next';
import { ROLE_LABELS, type RoleCode } from '@i2s/contracts';
import { ApiError, api } from '@/lib/api';
import {
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  StatusBadge,
  Td,
  Th,
} from '@/components/ui';
import {
  CreateUserForm,
  type DepartmentOption,
  type EmployeeOption,
} from '@/components/create-user-form';

export const metadata: Metadata = { title: 'Utilisateurs' };

interface UserRow {
  id: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'LOCKED';
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  employee: { matricule: string; firstName: string; lastName: string } | null;
  roles: Array<{ code: string; name: string }>;
}

const STATUS: Record<UserRow['status'], { label: string; tone: 'success' | 'neutral' | 'danger' }> = {
  ACTIVE: { label: 'Actif', tone: 'success' },
  SUSPENDED: { label: 'Suspendu', tone: 'neutral' },
  LOCKED: { label: 'Verrouillé', tone: 'danger' },
};

export default async function UsersPage() {
  const { items } = await api<{ items: UserRow[] }>('/users?limit=200');

  let options: { employees: EmployeeOption[]; departments: DepartmentOption[] } | null = null;
  try {
    options = await api<{ employees: EmployeeOption[]; departments: DepartmentOption[] }>(
      '/users/options',
    );
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 403)) throw error;
  }

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Utilisateurs"
        description="Un compte est rattaché à un employé et porte un ou plusieurs rôles, éventuellement par département."
      />

      {options && (
        <div className="mb-5">
          <CreateUserForm employees={options.employees} departments={options.departments} />
        </div>
      )}

      <Card title={`Comptes — ${items.length}`}>
        {items.length === 0 ? (
          <EmptyState title="Aucun compte" description="Créez les comptes depuis l’API ou le seed." />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>Adresse</Th>
                <Th>Employé</Th>
                <Th>Rôles</Th>
                <Th>Dernière connexion</Th>
                <Th>Statut</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((user) => (
                <tr key={user.id}>
                  <Td mono>{user.email}</Td>
                  <Td>
                    {user.employee
                      ? `${user.employee.lastName.toUpperCase()} ${user.employee.firstName}`
                      : '—'}
                  </Td>
                  <Td>
                    <span className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <StatusBadge key={role.code} tone="primary">
                          {ROLE_LABELS[role.code as RoleCode] ?? role.name}
                        </StatusBadge>
                      ))}
                    </span>
                  </Td>
                  <Td mono>
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString('fr-FR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : 'jamais'}
                  </Td>
                  <Td>
                    <span className="flex flex-wrap gap-1">
                      <StatusBadge tone={STATUS[user.status].tone}>
                        {STATUS[user.status].label}
                      </StatusBadge>
                      {user.mustChangePassword && (
                        <StatusBadge tone="warning">Mot de passe à changer</StatusBadge>
                      )}
                    </span>
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
