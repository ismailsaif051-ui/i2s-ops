import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ApiError, api } from '@/lib/api';
import { date, money } from '@/lib/format';
import {
  Card,
  DataTable,
  PageHeader,
  StatusBadge,
  Td,
  Th,
  type Tone,
} from '@/components/ui';
import { AttachmentActions } from '@/components/billing-actions';

export const metadata: Metadata = { title: 'Attachement' };

const LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Transmis au client',
  UNDER_CHECK: 'En contrôle',
  CORRECTION: 'En correction',
  VALIDATED: 'Signé par le client',
  BILLABLE: 'Facturable',
  INVOICED: 'Facturé',
};

const TONE: Record<string, Tone> = {
  DRAFT: 'neutral',
  SUBMITTED: 'warning',
  UNDER_CHECK: 'warning',
  CORRECTION: 'danger',
  VALIDATED: 'info',
  BILLABLE: 'info',
  INVOICED: 'success',
};

interface AttachmentDetail {
  id: string;
  number: string;
  status: string;
  period: { from: string; to: string };
  totalHT: number;
  submittedAt: string | null;
  validatedAt: string | null;
  affair: { id: string; number: string; title: string };
  client: { id: string; name: string; paymentTerms: number };
  lines: Array<{
    id: string;
    designation: string;
    mission: string | null;
    days: number;
    unitRate: number;
    amountHT: number;
  }>;
  invoices: Array<{ id: string; number: string; status: string }>;
  actions: { submit: boolean; validate: boolean; invoice: boolean };
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[12.5px] uppercase tracking-[0.04em] text-subtle">{label}</span>
      <span className="text-[14.5px]">{children}</span>
    </div>
  );
}

export default async function AttachmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let sheet: AttachmentDetail;
  try {
    sheet = await api<AttachmentDetail>(`/attachments/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const days = sheet.lines.reduce((sum, l) => sum + l.days, 0);
  const dash = <span className="text-subtle">—</span>;

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/finance/attachements" className="hover:text-text">
            ‹ Attachements
          </Link>
        }
        title={sheet.number}
        description={`${sheet.client.name} · affaire ${sheet.affair.number} · ${sheet.affair.title}`}
        action={
          <StatusBadge tone={TONE[sheet.status] ?? 'neutral'}>
            {LABELS[sheet.status] ?? sheet.status}
          </StatusBadge>
        }
      />

      <Card title="Période">
        <div className="grid grid-cols-2 gap-5 px-5 py-5 md:grid-cols-4">
          <Line label="Du">{date(sheet.period.from)}</Line>
          <Line label="Au">{date(sheet.period.to)}</Line>
          <Line label="Journées">{days}</Line>
          <Line label="Montant">{money(sheet.totalHT)} HT</Line>
          <Line label="Transmis le">{sheet.submittedAt ? date(sheet.submittedAt) : dash}</Line>
          <Line label="Signé le">{sheet.validatedAt ? date(sheet.validatedAt) : dash}</Line>
          <Line label="Délai de règlement">{sheet.client.paymentTerms} jours</Line>
          <Line label="Facture">
            {sheet.invoices.length === 0
              ? dash
              : sheet.invoices.map((i) => (
                  <Link
                    key={i.id}
                    href={`/finance/factures/${i.id}`}
                    className="ref hover:text-accent"
                  >
                    {i.number}
                  </Link>
                ))}
          </Line>
        </div>
      </Card>

      <div className="mt-5 flex flex-col gap-5">
        <Card title={`${sheet.lines.length} ligne(s)`}>
          <DataTable>
            <thead>
              <tr>
                <Th>Prestation</Th>
                <Th>Mission</Th>
                <Th align="right">Jours</Th>
                <Th align="right">Prix unitaire</Th>
                <Th align="right">Montant HT</Th>
              </tr>
            </thead>
            <tbody>
              {sheet.lines.map((line) => (
                <tr key={line.id}>
                  <Td>{line.designation}</Td>
                  <Td mono>{line.mission ?? dash}</Td>
                  <Td mono align="right">
                    {line.days}
                  </Td>
                  <Td mono align="right">
                    {money(line.unitRate)}
                  </Td>
                  <Td mono align="right">
                    {money(line.amountHT)}
                  </Td>
                </tr>
              ))}
              <tr>
                <Td />
                <Td />
                <Td mono align="right">
                  <span className="font-medium">{days}</span>
                </Td>
                <Td />
                <Td mono align="right">
                  <span className="font-medium">{money(sheet.totalHT)}</span>
                </Td>
              </tr>
            </tbody>
          </DataTable>
        </Card>

        <AttachmentActions
          attachmentId={sheet.id}
          actions={sheet.actions}
          status={sheet.status}
        />
      </div>
    </>
  );
}
