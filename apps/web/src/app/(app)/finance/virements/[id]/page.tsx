import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ApiError, api } from '@/lib/api';
import { date, moneyDh } from '@/lib/format';
import { Card, PageHeader, StatusBadge, type Tone } from '@/components/ui';
import { BatchDetail, type BatchLine } from '@/components/payment-batch-form';

export const metadata: Metadata = { title: 'Ordre de virement' };

interface BatchDetailResponse {
  id: string;
  number: string;
  status: 'DRAFT' | 'VALIDATED' | 'PAID';
  totalAmount: number;
  createdAt: string;
  validatedAt: string | null;
  paidAt: string | null;
  lines: BatchLine[];
  actions: { modify: boolean; validate: boolean; pay: boolean };
}

const STATUS: Record<BatchDetailResponse['status'], { label: string; tone: Tone }> = {
  DRAFT: { label: 'En préparation', tone: 'neutral' },
  VALIDATED: { label: 'Validé, en attente', tone: 'warning' },
  PAID: { label: 'Réglé', tone: 'success' },
};

export default async function PaymentBatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let batch: BatchDetailResponse;
  try {
    batch = await api<BatchDetailResponse>(`/payment-batches/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const status = STATUS[batch.status];

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/finance/virements" className="hover:text-text">
            ‹ Ordres de virement
          </Link>
        }
        title={batch.number}
        description={`${batch.lines.length} bénéficiaire${batch.lines.length > 1 ? 's' : ''} · ${moneyDh(batch.totalAmount)} · préparé le ${date(batch.createdAt)}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            <a
              href={`/api/virements/${batch.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center rounded-[10px] bg-accent px-4 text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-accent-hover"
            >
              Ouvrir le PDF
            </a>
          </div>
        }
      />

      <div className="flex flex-col gap-5">
        <BatchDetail batchId={batch.id} lines={batch.lines} actions={batch.actions} />

        {(batch.validatedAt || batch.paidAt) && (
          <Card title="Circuit">
            <dl className="flex flex-col divide-y divide-border">
              {batch.validatedAt && (
                <div className="flex items-baseline justify-between gap-3 px-5 py-3">
                  <dt className="text-[13.5px] text-muted">Validé par RH le</dt>
                  <dd className="text-right text-[14.5px]">{date(batch.validatedAt)}</dd>
                </div>
              )}
              {batch.paidAt && (
                <div className="flex items-baseline justify-between gap-3 px-5 py-3">
                  <dt className="text-[13.5px] text-muted">Réglé par RAF le</dt>
                  <dd className="text-right text-[14.5px]">{date(batch.paidAt)}</dd>
                </div>
              )}
            </dl>
          </Card>
        )}
      </div>
    </>
  );
}
