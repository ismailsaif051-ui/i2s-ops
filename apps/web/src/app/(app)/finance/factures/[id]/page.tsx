import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ApiError, api } from '@/lib/api';
import { date, money } from '@/lib/format';
import {
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  StatusBadge,
  Td,
  Th,
  type Tone,
} from '@/components/ui';
import { InvoiceActions } from '@/components/billing-actions';

export const metadata: Metadata = { title: 'Facture' };

const LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  ISSUED: 'Émise',
  SENT: 'Envoyée',
  PARTIALLY_PAID: 'Partiellement réglée',
  PAID: 'Soldée',
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

const METHODS: Record<string, string> = {
  TRANSFER: 'Virement',
  CHECK: 'Chèque',
  BILL_OF_EXCHANGE: 'Effet',
  CASH: 'Espèces',
  CARD: 'Carte',
};

interface InvoiceDetail {
  id: string;
  number: string;
  status: string;
  issueDate: string;
  dueDate: string;
  totalHT: number;
  vatRate: number;
  totalTTC: number;
  paid: number;
  remaining: number;
  overdue: boolean;
  notes: string | null;
  client: { id: string; name: string; paymentTerms: number };
  affair: { id: string; number: string; title: string } | null;
  lines: Array<{
    position: number;
    designation: string;
    quantity: number;
    unitPrice: number;
    amountHT: number;
  }>;
  payments: Array<{
    id: string;
    date: string;
    amount: number;
    method: string;
    bankReference: string | null;
  }>;
  attachments: Array<{ id: string; number: string; totalHT: number }>;
  actions: { issue: boolean; pay: boolean };
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[12.5px] uppercase tracking-[0.04em] text-subtle">{label}</span>
      <span className="text-[14.5px]">{children}</span>
    </div>
  );
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let invoice: InvoiceDetail;
  try {
    invoice = await api<InvoiceDetail>(`/invoices/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const dash = <span className="text-subtle">—</span>;

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/finance/factures" className="hover:text-text">
            ‹ Factures
          </Link>
        }
        title={invoice.number}
        description={`${invoice.client.name}${invoice.affair ? ` · affaire ${invoice.affair.number}` : ''}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge tone={TONE[invoice.status] ?? 'neutral'}>
              {LABELS[invoice.status] ?? invoice.status}
            </StatusBadge>
            {invoice.overdue && <StatusBadge tone="danger">échue</StatusBadge>}
          </div>
        }
      />

      <Card title="Montants">
        <div className="grid grid-cols-2 gap-5 px-5 py-5 md:grid-cols-4">
          <Line label="Total HT">{money(invoice.totalHT)}</Line>
          <Line label={`TVA ${invoice.vatRate} %`}>
            {money(invoice.totalTTC - invoice.totalHT)}
          </Line>
          <Line label="Total TTC">
            <span className="font-medium">{money(invoice.totalTTC)}</span>
          </Line>
          <Line label="Reste dû">
            <span className={invoice.remaining > 0 ? 'font-medium text-danger' : ''}>
              {money(invoice.remaining)}
            </span>
          </Line>
          <Line label="Émise le">{date(invoice.issueDate)}</Line>
          <Line label="Échéance">{date(invoice.dueDate)}</Line>
          <Line label="Délai contractuel">{invoice.client.paymentTerms} jours</Line>
          <Line label="Attachements">
            {invoice.attachments.length === 0
              ? dash
              : invoice.attachments.map((a) => (
                  <Link
                    key={a.id}
                    href={`/finance/attachements/${a.id}`}
                    className="ref mr-2 hover:text-accent"
                  >
                    {a.number}
                  </Link>
                ))}
          </Line>
        </div>
      </Card>

      <div className="mt-5 flex flex-col gap-5">
        <Card title={`${invoice.lines.length} ligne(s)`}>
          <DataTable>
            <thead>
              <tr>
                <Th>Désignation</Th>
                <Th align="right">Quantité</Th>
                <Th align="right">Prix unitaire</Th>
                <Th align="right">Montant HT</Th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line) => (
                <tr key={line.position}>
                  <Td>{line.designation}</Td>
                  <Td mono align="right">
                    {line.quantity}
                  </Td>
                  <Td mono align="right">
                    {money(line.unitPrice)}
                  </Td>
                  <Td mono align="right">
                    {money(line.amountHT)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </Card>

        <InvoiceActions
          invoiceId={invoice.id}
          actions={invoice.actions}
          remaining={invoice.remaining}
        />

        <Card title={`Règlements — ${money(invoice.paid)} encaissés`}>
          {invoice.payments.length === 0 ? (
            <EmptyState
              title="Aucun règlement"
              description="Les règlements enregistrés ici mettent à jour le solde et le statut de la facture."
            />
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Moyen</Th>
                  <Th>Référence</Th>
                  <Th align="right">Montant</Th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((payment) => (
                  <tr key={payment.id}>
                    <Td mono>{date(payment.date)}</Td>
                    <Td>{METHODS[payment.method] ?? payment.method}</Td>
                    <Td mono>{payment.bankReference ?? dash}</Td>
                    <Td mono align="right">
                      {money(payment.amount)}
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
