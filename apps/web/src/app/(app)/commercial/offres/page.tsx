import Link from 'next/link';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { compactDh, date, moneyDh, percent } from '@/lib/format';
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

export const metadata: Metadata = { title: 'Offres' };

interface OfferRow {
  id: string;
  number: string;
  version: number;
  amountHT: number;
  status: string;
  validUntil: string | null;
  sentAt: string | null;
  lineCount: number;
  opportunityId: string;
  title: string;
  client: string;
  stage: string;
  affairNumber: string | null;
  orderedAmountHT: number | null;
  gap: number | null;
  nextActionDate: string | null;
  lapsed: boolean;
}

interface OfferList {
  items: OfferRow[];
  totals: {
    all: number;
    draft: number;
    sent: number;
    sentAmount: number;
    accepted: number;
    acceptedAmount: number;
    lapsed: number;
    winRate: number;
    orderGap: number;
  };
}

const STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: 'En préparation', tone: 'neutral' },
  SENT: { label: 'Envoyée', tone: 'info' },
  ACCEPTED: { label: 'Acceptée', tone: 'success' },
  REJECTED: { label: 'Refusée', tone: 'danger' },
  EXPIRED: { label: 'Échue', tone: 'warning' },
};

export default async function OffersPage() {
  const data = await api<OfferList>('/offers');
  const dash = <span className="text-subtle">—</span>;

  return (
    <>
      <PageHeader
        eyebrow="Commercial"
        title="Offres"
        description="Les offres de prix, toutes versions confondues. Une offre ne s’écrase pas : chaque révision porte un nouveau numéro de version, et c’est son acceptation qui ouvre l’affaire."
      />

      <KpiRow>
        <KpiCard label="Offres" value={data.totals.all} hint={`dont ${data.totals.draft} non envoyée(s)`} />
        <KpiCard
          label="En attente de réponse"
          value={data.totals.sent}
          tone={data.totals.sent > 0 ? 'info' : undefined}
          hint={compactDh(data.totals.sentAmount)}
        />
        <KpiCard
          label="Acceptées"
          value={data.totals.accepted}
          tone={data.totals.accepted > 0 ? 'success' : undefined}
          hint={compactDh(data.totals.acceptedAmount)}
        />
        <KpiCard
          label="Taux de réussite"
          value={percent(data.totals.winRate, 0)}
          hint="sur les offres tranchées"
        />
        <KpiCard
          label="Validité dépassée"
          value={data.totals.lapsed}
          tone={data.totals.lapsed > 0 ? 'warning' : undefined}
        />
        <KpiCard
          label="Écart offre → commande"
          value={compactDh(data.totals.orderGap)}
          tone={data.totals.orderGap < 0 ? 'warning' : undefined}
          hint="ce que la négociation a coûté"
        />
      </KpiRow>

      {data.totals.lapsed > 0 && (
        <NextActionBanner
          tone="warning"
          title={`${data.totals.lapsed} offre(s) dont la validité est dépassée`}
          detail="Passé sa date de validité, une offre n’engage plus I2S : les prix se reconfirment avant toute commande."
        />
      )}

      <Card title={`${data.items.length} offre(s)`}>
        {data.items.length === 0 ? (
          <EmptyState
            title="Aucune offre"
            description="Une offre s’établit depuis la fiche de l’opportunité : son montant se calcule sur ses lignes."
            action={
              <Link
                href="/commercial/consultations"
                className="inline-flex h-10 items-center rounded-[10px] border border-border-strong bg-surface px-4 text-[14px] font-medium transition-colors hover:bg-surface-2"
              >
                Voir les consultations
              </Link>
            }
          />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>Numéro</Th>
                <Th>Client</Th>
                <Th>Objet</Th>
                <Th align="right">Montant HT</Th>
                <Th>Envoyée</Th>
                <Th>Validité</Th>
                <Th>Statut</Th>
                <Th>Affaire</Th>
                <Th align="right">Écart</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((offer) => {
                const status = STATUS[offer.status] ?? { label: offer.status, tone: 'neutral' as Tone };

                return (
                  <tr key={offer.id}>
                    <Td mono>
                      {offer.number}
                      <span className="text-subtle"> v{offer.version}</span>
                      <span className="block text-[12px] text-subtle">
                        {offer.lineCount} ligne(s)
                      </span>
                    </Td>
                    <Td>{offer.client}</Td>
                    <Td className="max-w-[260px]">
                      <Link
                        href={`/commercial/consultations/${offer.opportunityId}`}
                        className="line-clamp-1 text-primary hover:underline"
                      >
                        {offer.title}
                      </Link>
                    </Td>
                    <Td mono align="right">
                      {moneyDh(offer.amountHT)}
                    </Td>
                    <Td mono>{date(offer.sentAt) || dash}</Td>
                    <Td mono>
                      {offer.validUntil ? (
                        <span className={offer.lapsed ? 'text-warning' : undefined}>
                          {date(offer.validUntil)}
                        </span>
                      ) : (
                        dash
                      )}
                    </Td>
                    <Td>
                      <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                    </Td>
                    <Td mono>{offer.affairNumber ?? dash}</Td>
                    <Td mono align="right">
                      {offer.gap === null ? (
                        dash
                      ) : offer.gap === 0 ? (
                        <span className="text-subtle">au prix</span>
                      ) : (
                        <span className={offer.gap < 0 ? 'text-warning' : 'text-success'}>
                          {offer.gap > 0 ? '+' : ''}
                          {moneyDh(offer.gap)}
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
    </>
  );
}
