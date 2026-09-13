import Link from 'next/link';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { compactDh, date, moneyDh } from '@/lib/format';
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
  type Tone,
} from '@/components/ui';

export const metadata: Metadata = { title: 'Factures' };

interface InvoiceRow {
  id: string;
  number: string;
  client: string;
  affair: { id: string; number: string; title: string } | null;
  issueDate: string;
  dueDate: string;
  totalHT: number;
  totalTTC: number;
  paid: number;
  balance: number;
  status: string;
  overdueDays: number;
  attachmentCount: number;
}

const LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  ISSUED: 'Émise',
  SENT: 'Envoyée',
  PARTIALLY_PAID: 'Partiellement payée',
  PAID: 'Payée',
  OVERDUE: 'Échue',
  CANCELLED: 'Annulée',
};

const TONE: Record<string, Tone> = {
  DRAFT: 'neutral',
  ISSUED: 'info',
  SENT: 'info',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  OVERDUE: 'danger',
  CANCELLED: 'neutral',
};

export default async function InvoicesPage() {
  const { items } = await api<{ items: InvoiceRow[] }>('/invoices');

  const paid = items.filter((i) => i.status === 'PAID');
  const overdue = items.filter((i) => i.status === 'OVERDUE');
  const totalHT = items.reduce((s, i) => s + i.totalHT, 0);
  const outstanding = items.reduce((s, i) => s + i.balance, 0);

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Factures"
        description="Une facture se construit par regroupement d’attachements validés. Chaque ligne conserve le lien vers les attachements qui la justifient."
      />

      <KpiRow>
        <KpiCard label="Factures" value={items.length} />
        <KpiCard label="Chiffre d’affaires facturé" value={compactDh(totalHT)} hint="hors taxes" />
        <KpiCard label="Réglées" value={paid.length} tone="success" />
        <KpiCard
          label="Échues"
          value={overdue.length}
          tone={overdue.length > 0 ? 'danger' : undefined}
          href="/finance/encaissements"
        />
        <KpiCard
          label="Reste à encaisser"
          value={compactDh(outstanding)}
          tone={outstanding > 0 ? 'warning' : undefined}
          href="/finance/encaissements"
        />
      </KpiRow>

      <Card title={`${items.length} factures`}>
        {items.length === 0 ? (
          <EmptyState
            title="Aucune facture"
            description="Une facture ne peut être émise qu’à partir d’attachements validés."
            action={
              <Link
                href="/finance/attachements"
                className="inline-block rounded-[8px] border border-border-strong bg-surface px-3 py-1.5 text-[14px] hover:bg-surface-2"
              >
                Voir les attachements
              </Link>
            }
          />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>N° facture</Th>
                <Th>Client</Th>
                <Th>Affaire</Th>
                <Th>Émission</Th>
                <Th>Échéance</Th>
                <Th align="right">Montant HT</Th>
                <Th align="right">TTC</Th>
                <Th align="right">Solde</Th>
                <Th>Statut</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((invoice) => (
                <tr key={invoice.id}>
                  <Td mono>
                    <Link href={`/finance/factures/${invoice.id}`} className="hover:text-accent">
                      {invoice.number}
                    </Link>
                    {invoice.attachmentCount > 0 && (
                      <span
                        className="ml-2 text-subtle"
                        title={`${invoice.attachmentCount} attachement(s) regroupé(s)`}
                      >
                        ×{invoice.attachmentCount}
                      </span>
                    )}
                  </Td>
                  <Td>{invoice.client}</Td>
                  <Td mono>
                    {invoice.affair ? (
                      <Link
                        href={`/affaires/${invoice.affair.id}`}
                        className="text-accent hover:underline"
                      >
                        {invoice.affair.number}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </Td>
                  <Td mono>{date(invoice.issueDate)}</Td>
                  <Td mono>
                    {date(invoice.dueDate)}
                    {invoice.overdueDays > 0 && (
                      <span className="ml-1.5 text-danger">+{invoice.overdueDays} j</span>
                    )}
                  </Td>
                  <Td align="right" mono>
                    {moneyDh(invoice.totalHT)}
                  </Td>
                  <Td align="right" mono>
                    {moneyDh(invoice.totalTTC)}
                  </Td>
                  <Td align="right" mono>
                    <span className={invoice.balance > 0 ? 'font-semibold text-warning' : 'text-subtle'}>
                      {invoice.balance > 0 ? moneyDh(invoice.balance) : '—'}
                    </span>
                  </Td>
                  <Td>
                    <StatusBadge tone={TONE[invoice.status] ?? 'neutral'}>
                      {LABELS[invoice.status] ?? invoice.status}
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
