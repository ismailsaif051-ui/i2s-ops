import Link from 'next/link';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import {
  AFFAIR_COMMERCIAL_LABELS,
  AFFAIR_WORKS_LABELS,
  compactDh,
  moneyDh,
  percent,
  points,
} from '@/lib/format';
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
import { CreateLink } from '@/components/create-link';
import { ExportLink } from '@/components/export-link';

export const metadata: Metadata = { title: 'Affaires' };

interface AffairRow {
  id: string;
  number: string;
  title: string;
  status: string;
  commercialStatus?: string;
  worksStatus?: string;
  client: { id: string; name: string };
  department: string | null;
  accountManager: string | null;
  contractAmount: number | null;
  invoiced: number;
  consumedDays: number;
  marginRate: number | null;
  budgetMarginRate: number | null;
  counts: { missions: number; reports: number; invoices: number };
}

const COMMERCIAL_TONE: Record<string, Tone> = {
  GAGNEE: 'success',
  SUIVANT_OP: 'warning',
  PERDUE_ANNULEE: 'danger',
  DP: 'neutral',
};

const WORKS_TONE: Record<string, Tone> = {
  NON_DEMARRE: 'neutral',
  EN_COURS: 'info',
  A_FACTURER: 'warning',
  FAC_PARTIELLE: 'warning',
  FAC_TOTALE: 'success',
  PERDU_ANNULE: 'danger',
};

export default async function AffairsPage() {
  const { items } = await api<{ items: AffairRow[] }>('/affairs?limit=200');

  const won = items.filter((a) => a.commercialStatus === 'GAGNEE');
  const awaiting = items.filter((a) => a.commercialStatus === 'SUIVANT_OP');
  const atRisk = items.filter(
    (a) =>
      a.marginRate !== null &&
      a.budgetMarginRate !== null &&
      a.marginRate - a.budgetMarginRate < -5,
  );
  const totalContract = won.reduce((s, a) => s + (a.contractAmount ?? 0), 0);
  const totalInvoiced = items.reduce((s, a) => s + a.invoiced, 0);

  return (
    <>
      <PageHeader
        eyebrow="Portefeuille"
        title="Affaires"
        description="Deux axes de statut indépendants, comme au registre de suivi : l’avancement commercial d’un côté, l’état des travaux et de la facturation de l’autre."
        action={
          <div className="flex items-center gap-2">
            <ExportLink href="/api/affairs/export" resource="affair" />
            <CreateLink href="/affaires/nouvelle" label="Ouvrir une affaire" resource="affair" />
          </div>
        }
      />

      <KpiRow>
        <KpiCard label="Affaires gagnées" value={won.length} hint="bon de commande reçu" />
        <KpiCard
          label="Suivant offre de prix"
          value={awaiting.length}
          tone={awaiting.length > 0 ? 'warning' : undefined}
          hint="commande attendue"
        />
        <KpiCard label="Montant gagné" value={compactDh(totalContract)} hint="cumul HT" />
        <KpiCard label="Facturé" value={compactDh(totalInvoiced)} hint="cumul HT" />
        <KpiCard
          label="Sous la marge budgétée"
          value={atRisk.length}
          tone={atRisk.length > 0 ? 'danger' : undefined}
          hint="écart supérieur à 5 points"
        />
      </KpiRow>

      <Card title={`${items.length} affaires`}>
        {items.length === 0 ? (
          <EmptyState
            title="Aucune affaire"
            description="Une affaire naît d’une offre gagnée, ou se crée directement à réception d’un bon de commande."
          />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>N° affaire</Th>
                <Th>Client</Th>
                <Th>Désignation</Th>
                <Th>Sce</Th>
                <Th>Statut affaire</Th>
                <Th>État travaux</Th>
                <Th align="right">Montant</Th>
                <Th align="right">Facturé</Th>
                <Th align="right">Marge</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((affair) => {
                const gap =
                  affair.marginRate !== null && affair.budgetMarginRate !== null
                    ? affair.marginRate - affair.budgetMarginRate
                    : null;
                return (
                  <tr key={affair.id}>
                    <Td mono>
                      <Link href={`/affaires/${affair.id}`} className="text-primary hover:underline">
                        {affair.number}
                      </Link>
                    </Td>
                    <Td>{affair.client.name}</Td>
                    <Td className="max-w-[320px]">
                      <span className="line-clamp-2">{affair.title}</span>
                    </Td>
                    <Td>{affair.department ?? '—'}</Td>
                    <Td>
                      {affair.commercialStatus ? (
                        <StatusBadge tone={COMMERCIAL_TONE[affair.commercialStatus] ?? 'neutral'}>
                          {AFFAIR_COMMERCIAL_LABELS[affair.commercialStatus] ?? affair.commercialStatus}
                        </StatusBadge>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td>
                      {affair.worksStatus ? (
                        <StatusBadge tone={WORKS_TONE[affair.worksStatus] ?? 'neutral'}>
                          {AFFAIR_WORKS_LABELS[affair.worksStatus] ?? affair.worksStatus}
                        </StatusBadge>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td align="right" mono>
                      {moneyDh(affair.contractAmount)}
                    </Td>
                    <Td align="right" mono>
                      {moneyDh(affair.invoiced)}
                    </Td>
                    <Td align="right">
                      {affair.marginRate === null ? (
                        <span className="text-subtle">—</span>
                      ) : (
                        <span className="flex items-center justify-end gap-2">
                          <span className="tnum ref text-[12px]">
                            {percent(affair.marginRate, 0)}
                          </span>
                          {gap !== null && gap < -5 && (
                            <StatusBadge tone="danger">{points(gap)}</StatusBadge>
                          )}
                        </span>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        )}
      </Card>

      <p className="mt-4 max-w-[74ch] text-[12.5px] text-subtle">
        La marge affichée ici est indicative : elle confronte le facturé au seul coût de
        main-d’œuvre. Le détail complet — frais, véhicules, sous-traitance, comparaison au budget —
        se trouve sur la fiche de chaque affaire.
      </p>
    </>
  );
}
