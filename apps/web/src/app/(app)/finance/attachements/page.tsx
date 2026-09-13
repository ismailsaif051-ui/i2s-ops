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
  NextActionBanner,
  PageHeader,
  StatusBadge,
  Td,
  Th,
  type Tone,
} from '@/components/ui';
import { CreateLink } from '@/components/create-link';

export const metadata: Metadata = { title: 'Attachements' };

interface AttachmentRow {
  id: string;
  number: string;
  affair: { id: string; number: string; title: string };
  client: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalHT: number;
  days: number;
  lineCount: number;
  invoiced: boolean;
  validatedAt: string | null;
}

const LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumis',
  UNDER_CHECK: 'En contrôle',
  CORRECTION: 'En correction',
  VALIDATED: 'Validé',
  BILLABLE: 'Facturable',
  INVOICED: 'Facturé',
};

const TONE: Record<string, Tone> = {
  DRAFT: 'neutral',
  SUBMITTED: 'warning',
  UNDER_CHECK: 'warning',
  CORRECTION: 'danger',
  VALIDATED: 'info',
  BILLABLE: 'accent',
  INVOICED: 'success',
};

export default async function AttachmentsPage() {
  const { items } = await api<{ items: AttachmentRow[] }>('/attachments');

  const billable = items.filter((a) => ['VALIDATED', 'BILLABLE'].includes(a.status));
  const pending = items.filter((a) => ['SUBMITTED', 'UNDER_CHECK', 'CORRECTION'].includes(a.status));
  const billableAmount = billable.reduce((s, a) => s + a.totalHT, 0);
  const totalDays = items.reduce((s, a) => s + a.days, 0);

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Attachements"
        description="Constitué à partir des journées pointées et des rapports émis. Une journée ne peut figurer que dans un seul attachement validé — c’est ce qui empêche de facturer deux fois le même jour."
        action={
          <CreateLink
            href="/finance/attachements/nouveau"
            label="Préparer un attachement"
            resource="attachment"
          />
        }
      />

      <KpiRow>
        <KpiCard label="Attachements" value={items.length} />
        <KpiCard label="Jours attachés" value={totalDays} hint="toutes périodes" />
        <KpiCard
          label="En attente de validation"
          value={pending.length}
          tone={pending.length > 0 ? 'warning' : undefined}
        />
        <KpiCard
          label="Prêt à facturer"
          value={compactDh(billableAmount)}
          tone={billableAmount > 0 ? 'accent' : undefined}
          hint={`${billable.length} attachement(s) validé(s)`}
        />
      </KpiRow>

      {billable.length > 0 && (
        <NextActionBanner
          tone="accent"
          title={`${billable.length} attachement(s) validé(s) et non facturé(s) — ${compactDh(billableAmount)}`}
          detail="Ce montant est acquis mais pas encore facturé. Il peut être regroupé en une facture par affaire et par période."
          action={
            <Link
              href="/finance/factures"
              className="rounded-[8px] border border-border-strong bg-surface px-3 py-1.5 text-[14px] hover:bg-surface-2"
            >
              Ouvrir la facturation
            </Link>
          }
        />
      )}

      <Card title={`${items.length} attachements`}>
        {items.length === 0 ? (
          <EmptyState
            title="Aucun attachement"
            description="Un attachement se constitue à partir des journées pointées et validées sur une affaire."
          />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>N° attachement</Th>
                <Th>Affaire</Th>
                <Th>Client</Th>
                <Th>Période</Th>
                <Th align="right">Lignes</Th>
                <Th align="right">Jours</Th>
                <Th align="right">Montant HT</Th>
                <Th>Statut</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((sheet) => (
                <tr key={sheet.id}>
                  <Td mono>
                    <Link
                      href={`/finance/attachements/${sheet.id}`}
                      className="hover:text-accent"
                    >
                      {sheet.number}
                    </Link>
                  </Td>
                  <Td mono>
                    <Link
                      href={`/affaires/${sheet.affair.id}`}
                      className="text-accent hover:underline"
                    >
                      {sheet.affair.number}
                    </Link>
                  </Td>
                  <Td>{sheet.client}</Td>
                  <Td mono>
                    {date(sheet.periodStart)} → {date(sheet.periodEnd)}
                  </Td>
                  <Td align="right" mono>
                    {sheet.lineCount}
                  </Td>
                  <Td align="right" mono>
                    {sheet.days}
                  </Td>
                  <Td align="right" mono>
                    {moneyDh(sheet.totalHT)}
                  </Td>
                  <Td>
                    <StatusBadge tone={TONE[sheet.status] ?? 'neutral'}>
                      {LABELS[sheet.status] ?? sheet.status}
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
