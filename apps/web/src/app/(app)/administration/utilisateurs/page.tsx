import type { Metadata } from 'next';
import { ROLE_LABELS, type RoleCode } from '@i2s/contracts';
import { api } from '@/lib/api';
import {
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  StatusBadge,
  Td,
  Th,
} from '@/components/ui';

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

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Utilisateurs"
        description="Un compte est rattaché à un employé et porte un ou plusieurs rôles, éventuellement par département."
      />

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
