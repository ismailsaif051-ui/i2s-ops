import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { compactDh, date, money, moneyDh, percent } from '@/lib/format';
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
} from '@/components/ui';

export const metadata: Metadata = { title: 'Encaissements' };

interface Receivables {
  totals: {
    invoiced: number;
    collected: number;
    outstanding: number;
    collectionRate: number;
    dso: number;
  };
  aging: { current: number; d0_30: number; d31_60: number; d61_90: number; d90plus: number };
  invoices: Array<{
    id: string;
    number: string;
    client: string;
    dueDate: string;
    balance: number;
    overdueDays: number;
    dunningLevel: number | null;
  }>;
  byClient: Array<{ client: string; balance: number; count: number; worstDays: number }>;
}

const AGING_LABELS: Array<{ key: keyof Receivables['aging']; label: string; tone: string }> = [
  { key: 'current', label: 'Non échu', tone: 'bg-success' },
  { key: 'd0_30', label: '1 à 30 jours', tone: 'bg-warning' },
  { key: 'd31_60', label: '31 à 60 jours', tone: 'bg-warning' },
  { key: 'd61_90', label: '61 à 90 jours', tone: 'bg-danger' },
  { key: 'd90plus', label: 'Plus de 90 jours', tone: 'bg-danger' },
];

export default async function ReceivablesPage() {
  const data = await api<Receivables>('/receivables');

  const agingTotal = Object.values(data.aging).reduce((s, v) => s + v, 0) || 1;
  const critical = data.aging.d61_90 + data.aging.d90plus;

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Encaissements"
        description="Échéancier client, balance âgée et délai moyen de règlement. Une facture passe automatiquement en échue le lendemain de son échéance, avec relance."
      />

      <KpiRow>
        <KpiCard label="Facturé" value={compactDh(data.totals.invoiced)} hint="toutes taxes comprises" />
        <KpiCard label="Encaissé" value={compactDh(data.totals.collected)} tone="success" />
        <KpiCard
          label="Reste à encaisser"
          value={compactDh(data.totals.outstanding)}
          tone={data.totals.outstanding > 0 ? 'warning' : undefined}
        />
        <KpiCard
          label="Taux de recouvrement"
          value={percent(data.totals.collectionRate, 0)}
          tone={data.totals.collectionRate >= 85 ? 'success' : 'warning'}
        />
        <KpiCard
          label="DSO"
          value={money(data.totals.dso, 0)}
          unit="jours"
          hint="délai moyen de règlement"
        />
      </KpiRow>

      {critical > 0 && (
        <NextActionBanner
          tone="danger"
          title={`${compactDh(critical)} en retard de plus de 60 jours`}
          detail="Au-delà de 60 jours, une relance écrite ne suffit généralement plus : il faut un contact direct et, le cas échéant, une mise en demeure."
        />
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <Card title="Balance âgée">
          <div className="px-5 py-5">
            <div className="mb-5 flex h-3 overflow-hidden rounded-full bg-surface-2">
              {AGING_LABELS.map((bucket) => {
                const value = data.aging[bucket.key];
                if (value <= 0) return null;
                return (
                  <span
                    key={bucket.key}
                    className={bucket.tone}
                    style={{ width: `${(value / agingTotal) * 100}%` }}
                    title={`${bucket.label} — ${moneyDh(value)}`}
                  />
                );
              })}
            </div>

            <DataTable>
              <thead>
                <tr>
                  <Th>Ancienneté</Th>
                  <Th align="right">Montant</Th>
                  <Th align="right">Part</Th>
                </tr>
              </thead>
              <tbody>
                {AGING_LABELS.map((bucket) => {
                  const value = data.aging[bucket.key];
                  return (
                    <tr key={bucket.key}>
                      <Td>
                        <span className="flex items-center gap-2.5">
                          <span className={`inline-block h-3 w-3 rounded-[3px] ${bucket.tone}`} />
                          {bucket.label}
                        </span>
                      </Td>
                      <Td align="right" mono>
                        {moneyDh(value)}
                      </Td>
                      <Td align="right" mono>
                        {percent((value / agingTotal) * 100, 0)}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
          </div>
        </Card>

        <Card title="Encours par client">
          {data.byClient.length === 0 ? (
            <EmptyState title="Aucun encours" />
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <Th>Client</Th>
                  <Th align="right">Encours</Th>
                  <Th align="right">Retard</Th>
                </tr>
              </thead>
              <tbody>
                {data.byClient.slice(0, 12).map((client) => (
                  <tr key={client.client}>
                    <Td>
                      {client.client}
                      <span className="ml-2 text-subtle">{client.count} fact.</span>
                    </Td>
                    <Td align="right" mono>
                      {moneyDh(client.balance)}
                    </Td>
                    <Td align="right" mono>
                      <span className={client.worstDays > 60 ? 'font-semibold text-danger' : ''}>
                        {client.worstDays > 0 ? `${client.worstDays} j` : '—'}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>
      </div>

      <div className="mt-5">
        <Card title={`Factures ouvertes — ${data.invoices.length}`}>
          {data.invoices.length === 0 ? (
            <EmptyState
              title="Tout est encaissé"
              description="Aucune facture ouverte sur votre périmètre."
            />
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <Th>N° facture</Th>
                  <Th>Client</Th>
                  <Th>Échéance</Th>
                  <Th align="right">Solde dû</Th>
                  <Th align="right">Retard</Th>
                  <Th>Relance</Th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <Td mono>{invoice.number}</Td>
                    <Td>{invoice.client}</Td>
                    <Td mono>{date(invoice.dueDate)}</Td>
                    <Td align="right" mono>
                      {moneyDh(invoice.balance)}
                    </Td>
                    <Td align="right" mono>
                      {invoice.overdueDays > 0 ? (
                        <span
                          className={
                            invoice.overdueDays > 60 ? 'font-semibold text-danger' : 'text-warning'
                          }
                        >
                          {invoice.overdueDays} j
                        </span>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </Td>
                    <Td>
                      {invoice.dunningLevel ? (
                        <StatusBadge tone="warning">Relance {invoice.dunningLevel}</StatusBadge>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
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
