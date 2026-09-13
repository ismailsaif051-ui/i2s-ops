import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ApiError, api } from '@/lib/api';
import { AFFAIR_COMMERCIAL_LABELS, AFFAIR_WORKS_LABELS, money } from '@/lib/format';
import {
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  StatusBadge,
  Td,
  Th,
} from '@/components/ui';
import { ContactForm } from '@/components/client-form';

export const metadata: Metadata = { title: 'Client' };

interface ClientDetail {
  id: string;
  code: string;
  name: string;
  type: string;
  ice: string | null;
  sector: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  paymentTerms: number;
  owner: { id: string; name: string } | null;
  contacts: Array<{
    id: string;
    name: string;
    role: string | null;
    email: string | null;
    phone: string | null;
    isPrimary: boolean;
  }>;
  affairs: Array<{
    id: string;
    number: string;
    title: string;
    commercialStatus: string;
    worksStatus: string;
    amount: string | null;
  }>;
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[12.5px] uppercase tracking-[0.04em] text-subtle">{label}</span>
      <span className="text-[14.5px]">{children}</span>
    </div>
  );
}

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let client: ClientDetail;
  try {
    client = await api<ClientDetail>(`/clients/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const dash = <span className="text-subtle">—</span>;

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/commercial/clients" className="hover:text-text">
            ‹ Clients
          </Link>
        }
        title={client.name}
        description={`Code ${client.code}${client.sector ? ` · ${client.sector}` : ''}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge tone={client.type === 'CLIENT' ? 'success' : 'neutral'}>
              {client.type === 'CLIENT' ? 'Client' : 'Prospect'}
            </StatusBadge>
            <Link
              href={`/affaires/nouvelle?client=${client.id}`}
              className="inline-flex h-10 items-center rounded-[10px] bg-accent px-4 text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-accent-hover"
            >
              Ouvrir une affaire
            </Link>
          </div>
        }
      />

      <Card title="Coordonnées">
        <div className="grid grid-cols-2 gap-5 px-5 py-5 md:grid-cols-4">
          <Line label="ICE">{client.ice ?? dash}</Line>
          <Line label="Ville">{client.city ?? dash}</Line>
          <Line label="Téléphone">{client.phone ?? dash}</Line>
          <Line label="Courriel">{client.email ?? dash}</Line>
          <Line label="Adresse">{client.address ?? dash}</Line>
          <Line label="Délai de règlement">{client.paymentTerms} jours</Line>
          <Line label="Chargé de compte">{client.owner?.name ?? dash}</Line>
        </div>
      </Card>

      <div className="mt-5 flex flex-col gap-5">
        <Card title="Contacts" action={<ContactForm clientId={client.id} />}>
          {client.contacts.length === 0 ? (
            <EmptyState
              title="Aucun contact"
              description="Le contact principal reçoit les rapports émis. Ajoutez-en un avant la première remise."
            />
          ) : (
            <ul className="divide-y divide-border">
              {client.contacts.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className="text-[14.5px] font-medium">{c.name}</span>
                  {c.role && <span className="text-[13.5px] text-muted">{c.role}</span>}
                  {c.email && <span className="text-[13.5px] text-subtle">{c.email}</span>}
                  {c.phone && <span className="text-[13.5px] text-subtle">{c.phone}</span>}
                  {c.isPrimary && <StatusBadge tone="accent">Principal</StatusBadge>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`Affaires — ${client.affairs.length}`}>
          {client.affairs.length === 0 ? (
            <EmptyState
              title="Aucune affaire"
              description="Une affaire porte le Code Affaire auquel se rattachent missions, temps passé, frais et facturation."
            />
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <Th>Code</Th>
                  <Th>Désignation</Th>
                  <Th>Commercial</Th>
                  <Th>Travaux</Th>
                  <Th align="right">Montant</Th>
                </tr>
              </thead>
              <tbody>
                {client.affairs.map((a) => (
                  <tr key={a.id}>
                    <Td mono>
                      <Link href={`/affaires/${a.id}`} className="hover:text-accent">
                        {a.number}
                      </Link>
                    </Td>
                    <Td>{a.title}</Td>
                    <Td>{AFFAIR_COMMERCIAL_LABELS[a.commercialStatus] ?? a.commercialStatus}</Td>
                    <Td>{AFFAIR_WORKS_LABELS[a.worksStatus] ?? a.worksStatus}</Td>
                    <Td mono align="right">
                      {a.amount ? money(Number(a.amount)) : dash}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>
      </div>
    </>
  );
}
