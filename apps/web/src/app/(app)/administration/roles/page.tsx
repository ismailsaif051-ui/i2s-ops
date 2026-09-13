import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { Card, DataTable, PageHeader, StatusBadge, Td, Th } from '@/components/ui';

export const metadata: Metadata = { title: 'Rôles & droits' };

interface RoleRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  rank: number;
  permissions: Array<{
    scope: string;
    permission: { resource: string; action: string };
  }>;
  _count: { userRoles: number };
}

const SCOPE_LABELS: Record<string, string> = {
  ALL: 'Groupe',
  COMPANY: 'Société',
  DEPARTMENT: 'Département',
  TEAM: 'Équipe',
  OWN: 'Personnel',
};

const ACTION_LABELS: Record<string, string> = {
  VIEW: 'Consulter',
  CREATE: 'Créer',
  UPDATE: 'Modifier',
  DELETE: 'Supprimer',
  APPROVE: 'Valider',
  EXPORT: 'Exporter',
  DOWNLOAD: 'Télécharger',
};

export default async function RolesPage() {
  const roles = await api<RoleRow[]>('/roles');

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Rôles & droits"
        description="Une autorisation est le triplet rôle × action × périmètre. Le périmètre est appliqué dans la requête, pas seulement dans l’interface."
      />

      <div className="flex flex-col gap-4">
        {roles.map((role) => {
          const byResource = new Map<string, { actions: string[]; scope: string }>();
          for (const p of role.permissions) {
            const entry = byResource.get(p.permission.resource) ?? { actions: [], scope: p.scope };
            entry.actions.push(p.permission.action);
            byResource.set(p.permission.resource, entry);
          }
          const resources = [...byResource.entries()].sort(([a], [b]) => a.localeCompare(b));

          return (
            <Card
              key={role.id}
              title={
                <span className="flex flex-wrap items-baseline gap-2">
                  {role.name}
                  <span className="ref text-[11px] font-normal text-subtle">
                    {role.code}
                  </span>
                </span>
              }
              action={
                <span className="flex items-center gap-2 text-[12px] text-subtle">
                  <span className="tnum">{role.permissions.length} droits</span>
                  <StatusBadge tone={role._count.userRoles > 0 ? 'primary' : 'neutral'}>
                    {role._count.userRoles} compte{role._count.userRoles > 1 ? 's' : ''}
                  </StatusBadge>
                </span>
              }
            >
              {role.description && (
                <p className="border-b border-border px-4 py-2.5 text-[13px] text-muted">
                  {role.description}
                </p>
              )}
              <DataTable>
                <thead>
                  <tr>
                    <Th>Ressource</Th>
                    <Th>Actions</Th>
                    <Th>Périmètre</Th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map(([resource, entry]) => (
                    <tr key={resource}>
                      <Td mono>{resource}</Td>
                      <Td>
                        <span className="flex flex-wrap gap-1">
                          {entry.actions.map((a) => (
                            <span
                              key={a}
                              className="rounded-[3px] bg-surface-2 px-1.5 py-0.5 text-[11.5px]"
                            >
                              {ACTION_LABELS[a] ?? a}
                            </span>
                          ))}
                        </span>
                      </Td>
                      <Td>
                        <StatusBadge tone={entry.scope === 'ALL' ? 'primary' : 'neutral'}>
                          {SCOPE_LABELS[entry.scope] ?? entry.scope}
                        </StatusBadge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </Card>
          );
        })}
      </div>
    </>
  );
}
