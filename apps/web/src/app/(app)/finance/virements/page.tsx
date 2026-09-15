import Link from 'next/link';
import type { Metadata } from 'next';
import { ApiError, api } from '@/lib/api';
import { date, moneyDh } from '@/lib/format';
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
import { CreateBatchForm, type CandidateLine } from '@/components/payment-batch-form';

export const metadata: Metadata = { title: 'Ordres de virement' };

interface BatchRow {
  id: string;
  number: string;
  status: 'DRAFT' | 'VALIDATED' | 'PAID';
  totalAmount: number;
  reportCount: number;
  createdAt: string;
  validatedAt: string | null;
  paidAt: string | null;
}

const STATUS: Record<BatchRow['status'], { label: string; tone: Tone }> = {
  DRAFT: { label: 'En préparation', tone: 'neutral' },
  VALIDATED: { label: 'Validé, en attente', tone: 'warning' },
  PAID: { label: 'Réglé', tone: 'success' },
};

export default async function PaymentBatchesPage() {
  const { items } = await api<{ items: BatchRow[] }>('/payment-batches?limit=100');

  let candidates: CandidateLine[] | null = null;
  try {
    candidates = await api<CandidateLine[]>('/payment-batches/candidates');
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 403)) throw error;
  }

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Ordres de virement"
        description="RH regroupe les notes « bon à payer » en un lot ; RAF exécute le virement du lot en une fois."
      />

      {candidates && (
        <div className="mb-5">
          <CreateBatchForm candidates={candidates} />
        </div>
      )}

      <Card title={`Lots — ${items.length}`}>
        {items.length === 0 ? (
          <EmptyState
            title="Aucun lot"
            description="Un lot regroupe plusieurs notes de frais « bon à payer » pour un règlement en une fois."
          />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>Numéro</Th>
                <Th>Statut</Th>
                <Th align="right">Bénéficiaires</Th>
                <Th align="right">Montant</Th>
                <Th>Préparé le</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id}>
                  <Td mono>
                    <Link href={`/finance/virements/${b.id}`} className="hover:text-accent">
                      {b.number}
                    </Link>
                  </Td>
                  <Td>
                    <StatusBadge tone={STATUS[b.status].tone}>{STATUS[b.status].label}</StatusBadge>
                  </Td>
                  <Td align="right" mono>
                    {b.reportCount}
                  </Td>
                  <Td align="right" mono>
                    {moneyDh(b.totalAmount)}
                  </Td>
                  <Td mono>{date(b.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>
    </>
  );
}
