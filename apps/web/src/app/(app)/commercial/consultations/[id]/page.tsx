import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { can } from '@i2s/contracts';
import { ApiError, api, requireSession } from '@/lib/api';
import { date, moneyDh } from '@/lib/format';
import {
  Card,
  DataTable,
  EmptyState,
  NextActionBanner,
  PageHeader,
  StatusBadge,
  Td,
  Th,
  type Tone,
} from '@/components/ui';
import { OfferActions, OpportunityActions } from '@/components/opportunity-forms';
import { OfferDrafting, type DraftSection } from '@/components/offer-drafting';

export const metadata: Metadata = { title: 'Opportunité' };

interface OfferLine {
  id: string;
  position: number;
  designation: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amountHT: number;
}

interface OpportunityDetail {
  id: string;
  title: string;
  stage: string;
  stageLabel: string;
  amount: number | null;
  probability: number;
  expectedCloseDate: string | null;
  lostCause: string | null;
  lostCauseLabel: string | null;
  lostReason: string | null;
  causeOptions: Array<{ value: string; label: string }>;
  description: string | null;
  client: { id: string; name: string; code: string; type: string };
  department: { code: string; name: string } | null;
  owner: { id: string; matricule: string; name: string } | null;
  tenders: Array<{
    id: string;
    reference: string;
    publisher: string | null;
    submissionDeadline: string | null;
    openingDate: string | null;
    guaranteeAmount: number | null;
    status: string;
  }>;
  offers: Array<{
    id: string;
    number: string;
    version: number;
    amountHT: number;
    status: string;
    validUntil: string | null;
    sentAt: string | null;
    notes: string | null;
    lines: OfferLine[];
    draft: {
      nature: string;
      natureLabel: string;
      status: 'A_RELIRE' | 'RELU';
      sections: DraftSection[];
      model: string;
      generatedAt: string;
      reviewedAt: string | null;
    } | null;
  }>;
  followUps: Array<{
    id: string;
    date: string;
    channel: string;
    outcome: string;
    nextActionDate: string | null;
    contact: string | null;
  }>;
  affairs: Array<{ id: string; number: string; title: string; status: string }>;
  assistant: { available: boolean; natures: Array<{ value: string; label: string }> };
  actions: { edit: boolean; offer: boolean; lose: boolean };
}

const STAGE_TONE: Record<string, Tone> = {
  NEW: 'neutral',
  CONSULTATION: 'neutral',
  OFFER_DRAFT: 'info',
  OFFER_SENT: 'info',
  FOLLOW_UP: 'warning',
  NEGOTIATION: 'accent',
  WON: 'success',
  LOST: 'danger',
};

const OFFER_STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: 'En préparation', tone: 'neutral' },
  SENT: { label: 'Envoyée', tone: 'info' },
  ACCEPTED: { label: 'Acceptée', tone: 'success' },
  REJECTED: { label: 'Refusée', tone: 'danger' },
  EXPIRED: { label: 'Échue', tone: 'warning' },
};

const CHANNELS: Record<string, string> = {
  PHONE: 'Téléphone',
  EMAIL: 'Courriel',
  VISIT: 'Visite',
  OTHER: 'Autre',
};

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[12.5px] uppercase tracking-[0.04em] text-subtle">{label}</span>
      <span className="text-[14.5px]">{children}</span>
    </div>
  );
}

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  let opportunity: OpportunityDetail;
  try {
    opportunity = await api<OpportunityDetail>(`/consultations/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const permissions = session.permissions as Parameters<typeof can>[0];
  const canWrite = can(permissions, 'opportunity', 'UPDATE');
  const canOffer = can(permissions, 'offer', 'CREATE');
  const canOfferWrite = can(permissions, 'offer', 'UPDATE');

  const dash = <span className="text-subtle">—</span>;
  const nextAction = opportunity.followUps.find((f) => f.nextActionDate)?.nextActionDate ?? null;
  const overdue = nextAction !== null && new Date(nextAction) < new Date();

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/commercial/consultations" className="hover:text-text">
            ‹ Consultations &amp; appels d’offres
          </Link>
        }
        title={opportunity.title}
        description={`${opportunity.client.name} · ${opportunity.client.code}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge tone={STAGE_TONE[opportunity.stage] ?? 'neutral'}>
              {opportunity.stageLabel}
            </StatusBadge>
          </div>
        }
      />

      {opportunity.stage === 'LOST' && (
        <NextActionBanner
          tone="danger"
          title={`Perdue — ${opportunity.lostCauseLabel ?? 'cause non renseignée'}`}
          detail={opportunity.lostReason ?? undefined}
        />
      )}

      {opportunity.affairs.length > 0 && (
        <NextActionBanner
          tone="success"
          title={`Affaire ${opportunity.affairs[0].number} ouverte`}
          detail="Le suivi se poursuit désormais sur l’affaire : planification, exécution, facturation."
          action={
            <Link
              href={`/affaires/${opportunity.affairs[0].id}`}
              className="inline-flex h-10 items-center rounded-[10px] border border-border-strong bg-surface px-4 text-[14px] font-medium transition-colors hover:bg-surface-2"
            >
              Ouvrir l’affaire
            </Link>
          }
        />
      )}

      {overdue && opportunity.actions.edit && (
        <NextActionBanner
          tone="warning"
          title="Relance en retard"
          detail={`La prochaine action était prévue le ${date(nextAction)}. Une offre sans relance perd rapidement sa chance d’aboutir.`}
        />
      )}

      <Card title="Le dossier">
        <div className="grid grid-cols-2 gap-5 px-5 py-5 md:grid-cols-4">
          <Line label="Client">
            <Link href={`/commercial/clients/${opportunity.client.id}`} className="hover:underline">
              {opportunity.client.name}
            </Link>
          </Line>
          <Line label="Service">
            {opportunity.department ? opportunity.department.name : dash}
          </Line>
          <Line label="Chargé du dossier">{opportunity.owner?.name ?? dash}</Line>
          <Line label="Décision attendue">{date(opportunity.expectedCloseDate) || dash}</Line>
          <Line label="Montant">{opportunity.amount === null ? dash : moneyDh(opportunity.amount)}</Line>
          <Line label="Probabilité">{opportunity.probability} %</Line>
          <Line label="Pondéré">
            {opportunity.amount === null
              ? dash
              : moneyDh(Math.round(opportunity.amount * (opportunity.probability / 100)))}
          </Line>
          <Line label="Prochaine action">{date(nextAction) || dash}</Line>
        </div>

        {opportunity.description && (
          <p className="border-t border-border px-5 py-4 text-[14.5px] leading-relaxed text-muted">
            {opportunity.description}
          </p>
        )}
      </Card>

      <div className="mt-5 flex flex-col gap-5">
        {(canWrite || canOffer) && (
          <OpportunityActions
            opportunityId={opportunity.id}
            causeOptions={opportunity.causeOptions}
            actions={{
              edit: opportunity.actions.edit && canWrite,
              offer: opportunity.actions.offer && canOffer,
              lose: opportunity.actions.lose && canWrite,
            }}
          />
        )}

        <Card title={`Offres — ${opportunity.offers.length}`}>
          {opportunity.offers.length === 0 ? (
            <EmptyState
              title="Aucune offre"
              description="Le montant de l’offre se calcule sur ses lignes. C’est son acceptation par le client qui ouvre l’affaire."
            />
          ) : (
            <ul className="divide-y divide-border">
              {opportunity.offers.map((offer) => {
                const status = OFFER_STATUS[offer.status] ?? {
                  label: offer.status,
                  tone: 'neutral' as Tone,
                };

                return (
                  <li key={offer.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <div>
                        <span className="ref text-[14.5px] font-medium">
                          {offer.number} v{offer.version}
                        </span>
                        <span className="ml-3 tnum text-[14.5px]">{moneyDh(offer.amountHT)} HT</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                        <OfferActions
                          offerId={offer.id}
                          status={offer.status}
                          canEdit={canOfferWrite}
                        />
                      </div>
                    </div>

                    <p className="mt-1 text-[13.5px] text-subtle">
                      {offer.sentAt ? `Envoyée le ${date(offer.sentAt)}` : 'Non envoyée'}
                      {offer.validUntil && ` · valable jusqu’au ${date(offer.validUntil)}`}
                      {offer.notes && ` · ${offer.notes}`}
                    </p>

                    <div className="mt-3">
                      <OfferDrafting
                        offerId={offer.id}
                        offerNumber={`${offer.number} v${offer.version}`}
                        canEdit={canOfferWrite && offer.status === 'DRAFT'}
                        state={{
                          available: opportunity.assistant.available,
                          natures: opportunity.assistant.natures,
                          draft: offer.draft
                            ? {
                                ...offer.draft,
                                generatedBy: null,
                                reviewedBy: null,
                              }
                            : null,
                        }}
                      />
                    </div>

                    {offer.lines.length > 0 && (
                      <ul className="mt-3 flex flex-col gap-1.5">
                        {offer.lines.map((l) => (
                          <li
                            key={l.id}
                            className="flex flex-wrap items-baseline justify-between gap-3 text-[13.5px]"
                          >
                            <span className="text-muted">{l.designation}</span>
                            <span className="tnum text-subtle">
                              {l.quantity} {l.unit} × {moneyDh(l.unitPrice)} ={' '}
                              <span className="text-text">{moneyDh(l.amountHT)}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title={`Appels d’offres — ${opportunity.tenders.length}`}>
          {opportunity.tenders.length === 0 ? (
            <EmptyState
              title="Consultation directe"
              description="Aucun appel d’offres rattaché : le client a consulté I2S directement."
            />
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <Th>Référence</Th>
                  <Th>Émetteur</Th>
                  <Th>Remise des offres</Th>
                  <Th>Ouverture des plis</Th>
                  <Th align="right">Caution</Th>
                </tr>
              </thead>
              <tbody>
                {opportunity.tenders.map((t) => (
                  <tr key={t.id}>
                    <Td mono>{t.reference}</Td>
                    <Td>{t.publisher ?? dash}</Td>
                    <Td mono>{date(t.submissionDeadline) || dash}</Td>
                    <Td mono>{date(t.openingDate) || dash}</Td>
                    <Td mono align="right">
                      {t.guaranteeAmount === null ? dash : moneyDh(t.guaranteeAmount)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>

        <Card title={`Relances — ${opportunity.followUps.length}`}>
          {opportunity.followUps.length === 0 ? (
            <EmptyState
              title="Aucune relance"
              description="Chaque échange avec le client s’enregistre ici : c’est la mémoire du dossier."
            />
          ) : (
            <ul className="divide-y divide-border">
              {opportunity.followUps.map((f) => (
                <li key={f.id} className="px-5 py-3.5">
                  <p className="text-[14.5px]">{f.outcome}</p>
                  <p className="mt-0.5 text-[13.5px] text-subtle">
                    {date(f.date)} · {CHANNELS[f.channel] ?? f.channel}
                    {f.contact && ` · ${f.contact}`}
                    {f.nextActionDate && ` · prochaine action le ${date(f.nextActionDate)}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
