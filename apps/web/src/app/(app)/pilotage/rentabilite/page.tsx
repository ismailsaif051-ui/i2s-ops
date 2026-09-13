import Link from 'next/link';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { compactDh, moneyDh, percent, points } from '@/lib/format';
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

export const metadata: Metadata = { title: 'Rentabilité' };

interface AffairProfitability {
  id: string;
  number: string;
  title: string;
  client: string;
  department: string | null;
  worksStatus: string;
  consumedDays: number;
  revenues: { contractAmount: number; invoiced: number; collected: number; pendingAttachments: number };
  costs: { labour: number; expenses: number; vehicles: number; total: number };
  grossMargin: number;
  marginRate: number;
  budgetMarginRate: number | null;
  marginGapPoints: number | null;
  atRisk: boolean;
  remainingToInvoice: number;
}

interface Data {
  items: AffairProfitability[];
  totals: {
    affairs: number;
    invoiced: number;
    costs: number;
    grossMargin: number;
    marginRate: number;
    atRisk: number;
    loss: number;
  } | null;
}

export default async function ProfitabilityPage() {
  const data = await api<Data>('/analytics/profitability');

  if (!data.totals || data.items.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="Pilotage"
          title="Rentabilité"
          description="Marge brute par affaire, comparée à la marge budgétée."
        />
        <Card>
          <EmptyState
            title="Aucune affaire gagnée à analyser"
            description="La rentabilité se calcule sur les affaires ayant reçu un bon de commande."
          />
        </Card>
      </>
    );
  }

  const { totals } = data;
  const billed = data.items.filter((a) => a.revenues.invoiced > 0);
  const atRisk = data.items.filter((a) => a.atRisk);

  return (
    <>
      <PageHeader
        eyebrow="Pilotage"
        title="Rentabilité par affaire"
        description="Marge brute = chiffre d’affaires facturé − coûts réels. Le coût de main-d’œuvre est valorisé au coût journalier en vigueur à la date de chaque journée, jamais au coût courant."
      />

      <KpiRow>
        <KpiCard label="Affaires analysées" value={totals.affairs} hint="gagnées, avec bon de commande" />
        <KpiCard label="Facturé" value={compactDh(totals.invoiced)} hint="hors taxes" />
        <KpiCard label="Coûts réels" value={compactDh(totals.costs)} hint="main-d’œuvre et frais" />
        <KpiCard
          label="Marge brute"
          value={compactDh(totals.grossMargin)}
          tone={totals.grossMargin < 0 ? 'danger' : undefined}
        />
        <KpiCard
          label="Taux de marge"
          value={percent(totals.marginRate)}
          tone={totals.marginRate >= 20 ? 'success' : totals.marginRate >= 10 ? 'warning' : 'danger'}
        />
        <KpiCard
          label="Sous la marge budgétée"
          value={totals.atRisk}
          tone={totals.atRisk > 0 ? 'danger' : 'success'}
          hint="écart supérieur à 5 points"
        />
      </KpiRow>

      {atRisk.length > 0 && (
        <NextActionBanner
          tone="danger"
          title={`${atRisk.length} affaire(s) sous la marge budgétée de plus de 5 points`}
          detail={`La plus dégradée : ${atRisk[0]!.number} — ${atRisk[0]!.client}, marge réelle ${percent(atRisk[0]!.marginRate)} contre ${percent(atRisk[0]!.budgetMarginRate ?? 0, 0)} prévus.`}
        />
      )}

      <Card title={`${billed.length} affaires avec chiffre d’affaires facturé`}>
        <DataTable>
          <thead>
            <tr>
              <Th>N° affaire</Th>
              <Th>Client</Th>
              <Th>Sce</Th>
              <Th align="right">Facturé</Th>
              <Th align="right">Main-d’œuvre</Th>
              <Th align="right">Frais</Th>
              <Th align="right">Marge</Th>
              <Th align="right">Taux</Th>
              <Th align="right">Écart budget</Th>
            </tr>
          </thead>
          <tbody>
            {billed.map((affair) => (
              <tr key={affair.id} className={affair.atRisk ? 'bg-danger-soft/45' : undefined}>
                <Td mono>
                  <Link href={`/affaires/${affair.id}`} className="text-accent hover:underline">
                    {affair.number}
                  </Link>
                </Td>
                <Td>{affair.client}</Td>
                <Td>{affair.department ?? '—'}</Td>
                <Td align="right" mono>
                  {moneyDh(affair.revenues.invoiced)}
                </Td>
                <Td align="right" mono>
                  {moneyDh(affair.costs.labour)}
                  <span className="ml-1.5 text-subtle">{affair.consumedDays} j</span>
                </Td>
                <Td align="right" mono>
                  {moneyDh(affair.costs.expenses)}
                </Td>
                <Td align="right" mono>
                  <span className={affair.grossMargin < 0 ? 'font-semibold text-danger' : ''}>
                    {moneyDh(affair.grossMargin)}
                  </span>
                </Td>
                <Td align="right" mono>
                  {percent(affair.marginRate, 0)}
                </Td>
                <Td align="right">
                  {affair.marginGapPoints === null ? (
                    <span className="text-subtle">—</span>
                  ) : affair.atRisk ? (
                    <StatusBadge tone="danger">{points(affair.marginGapPoints)}</StatusBadge>
                  ) : (
                    <span
                      className={`tnum ${affair.marginGapPoints >= 0 ? 'text-success' : 'text-warning'}`}
                    >
                      {points(affair.marginGapPoints)}
                    </span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </Card>

      <p className="mt-4 max-w-[76ch] text-[13.5px] text-subtle">
        Les postes « véhicules », « sous-traitance » et « autres coûts » sont affichés à zéro tant
        qu’aucune source de données ne les alimente : ils ne sont pas estimés. La quote-part
        véhicule est calculée sur la fiche de chaque affaire, où le détail des missions est connu.
      </p>
    </>
  );
}
