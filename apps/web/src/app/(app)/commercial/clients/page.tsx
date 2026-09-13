import Link from 'next/link';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { Card, DataTable, EmptyState, KpiCard, KpiRow, PageHeader, StatusBadge, Td, Th } from '@/components/ui';
import { CreateLink } from '@/components/create-link';

export const metadata: Metadata = { title: 'Clients' };

interface ClientRow {
  id: string;
  code: string;
  name: string;
  sector: string | null;
  city: string | null;
  type: string;
  paymentTerms: number;
  primaryContact: string | null;
  affairCount: number;
  invoiceCount: number;
}

export default async function ClientsPage() {
  const { items } = await api<{ items: ClientRow[] }>('/clients');
  const clients = items.filter((c) => c.type === 'CLIENT').length;

  return (
    <>
      <PageHeader
        eyebrow="Commercial"
        title="Clients"
        description="Portefeuille clients et prospects, avec le délai de paiement contractuel qui pilote les échéances de facturation."
        action={
          <CreateLink
            href="/commercial/clients/nouveau"
            label="Nouveau client"
            resource="client"
          />
        }
      />

      <KpiRow>
        <KpiCard label="Comptes" value={items.length} />
        <KpiCard label="Clients actifs" value={clients} />
        <KpiCard label="Prospects" value={items.length - clients} />
      </KpiRow>

      <Card title={`${items.length} comptes`}>
        {items.length === 0 ? (
          <EmptyState title="Aucun client" description="Créez un client, puis une opportunité." />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Raison sociale</Th>
                <Th>Secteur</Th>
                <Th>Ville</Th>
                <Th>Contact principal</Th>
                <Th align="right">Délai</Th>
                <Th align="right">Affaires</Th>
                <Th align="right">Factures</Th>
                <Th>Type</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <Td mono>{c.code}</Td>
                  <Td>
                    <Link
                      href={`/commercial/clients/${c.id}`}
                      className="font-medium hover:text-accent"
                    >
                      {c.name}
                    </Link>
                  </Td>
                  <Td>{c.sector ?? '—'}</Td>
                  <Td>{c.city ?? '—'}</Td>
                  <Td>{c.primaryContact ?? '—'}</Td>
                  <Td align="right" mono>{c.paymentTerms} j</Td>
                  <Td align="right" mono>{c.affairCount}</Td>
                  <Td align="right" mono>{c.invoiceCount}</Td>
                  <Td>
                    <StatusBadge tone={c.type === 'CLIENT' ? 'success' : 'neutral'}>
                      {c.type === 'CLIENT' ? 'Client' : 'Prospect'}
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
