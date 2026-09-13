import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { Card, DataTable, EmptyState, PageHeader, Td, Th } from '@/components/ui';

export const metadata: Metadata = { title: "Journal d'audit" };

interface AuditRow {
  id: string;
  entity: string;
  entityId: string | null;
  action: string;
  before: unknown;
  after: unknown;
  reason: string | null;
  userEmail: string | null;
  ip: string | null;
  occurredAt: string;
}

export default async function AuditPage() {
  const { items } = await api<{ items: AuditRow[] }>('/audit?limit=100');

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Journal d'audit"
        description="Journal en ajout seul : aucune entrée ne peut être modifiée ni supprimée. Chaque opération sensible conserve la valeur avant et après."
      />

      <Card title={`${items.length} dernières opérations`}>
        {items.length === 0 ? (
          <EmptyState
            title="Aucune opération enregistrée"
            description="Le journal se remplit dès la première connexion et à chaque action sensible."
          />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>Horodatage</Th>
                <Th>Utilisateur</Th>
                <Th>Objet</Th>
                <Th>Action</Th>
                <Th>Avant → Après</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <Td mono>
                    {new Date(row.occurredAt).toLocaleString('fr-FR', {
                      dateStyle: 'short',
                      timeStyle: 'medium',
                    })}
                  </Td>
                  <Td>
                    {row.userEmail ?? <span className="text-subtle">système</span>}
                    {row.ip && (
                      <span className="ml-1.5 ref text-[11px] text-subtle">
                        {row.ip}
                      </span>
                    )}
                  </Td>
                  <Td mono>{row.entity}</Td>
                  <Td mono>{row.action}</Td>
                  <Td>
                    {row.before || row.after ? (
                      <code className="block max-w-[46ch] overflow-x-auto whitespace-pre-wrap break-words rounded-[4px] bg-surface-2 px-2 py-1 ref text-[11px]">
                        {formatChange(row.before)} → {formatChange(row.after)}
                      </code>
                    ) : (
                      <span className="text-subtle">—</span>
                    )}
                    {row.reason && (
                      <p className="mt-1 text-[12px] text-muted">Motif : {row.reason}</p>
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

function formatChange(value: unknown): string {
  if (value === null || value === undefined) return '∅';
  const json = JSON.stringify(value);
  return json.length > 120 ? `${json.slice(0, 120)}…` : json;
}
