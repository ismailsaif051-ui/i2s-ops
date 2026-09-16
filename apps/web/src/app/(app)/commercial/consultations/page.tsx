import Link from 'next/link';
import type { Metadata } from 'next';
import { can } from '@i2s/contracts';
import { api, requireSession } from '@/lib/api';
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
import { OpenOpportunity, type ClientOption } from '@/components/opportunity-forms';

export const metadata: Metadata = { title: 'Consultations & appels d’offres' };

interface ConsultationRow {
  id: string;
  nature: 'CONSULTATION' | 'APPEL_OFFRES';
  receivedAt: string;
  client: { id: string; name: string };
  title: string;
  department: string | null;
  owner: string | null;
  stage: string;
  stageLabel: string;
  amount: number | null;
  probability: number;
  weighted: number;
  expectedCloseDate: string | null;
  tenderReference: string | null;
  publisher: string | null;
  submissionDeadline: string | null;
  openingDate: string | null;
  guaranteeAmount: number | null;
  daysLeft: number | null;
  offerNumber: string | null;
  offerAmountHT: number | null;
  offerStatus: string | null;
  offerSentAt: string | null;
  answered: boolean;
  lostCause: string | null;
  lostCauseLabel: string | null;
  lostReason: string | null;
  affairNumber: string | null;
  affairId: string | null;
  nextActionDate: string | null;
  followUpCount: number;
}

interface ConsultationList {
  items: ConsultationRow[];
  lostCauses: Array<{
    cause: string;
    label: string;
    count: number;
    amount: number;
    actionable: boolean;
  }>;
  totals: {
    all: number;
    open: number;
    openAmount: number;
    weighted: number;
    consultations: number;
    tenders: number;
    won: number;
    wonAmount: number;
    lost: number;
    lostAmount: number;
    conversionRate: number;
    missedDeadlines: number;
    urgentDeadlines: number;
    overdueFollowUps: number;
    guarantees: number;
    actionableLostAmount: number;
    actionableLostCount: number;
  };
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

/**
 * L'échéance, dite comme on la dit au bureau.
 *
 * Sur un appel d'offres, c'est elle qui commande : un dossier remis en retard
 * est écarté sans être lu, quelle qu'en soit la qualité.
 */
function deadlineState(row: ConsultationRow): { label: string; tone: Tone | null } | null {
  if (row.stage === 'WON' || row.stage === 'LOST') return null;
  if (row.answered) return { label: 'Offre remise', tone: 'info' };
  if (row.daysLeft === null) return null;
  if (row.daysLeft < 0) return { label: `Échue depuis ${-row.daysLeft} j`, tone: 'danger' };
  if (row.daysLeft === 0) return { label: 'Dernier jour', tone: 'danger' };
  if (row.daysLeft <= 7) return { label: `${row.daysLeft} j restants`, tone: 'warning' };
  return { label: `${row.daysLeft} j restants`, tone: null };
}

const STAGE_ORDER = [
  'NEW',
  'CONSULTATION',
  'OFFER_DRAFT',
  'OFFER_SENT',
  'FOLLOW_UP',
  'NEGOTIATION',
  'WON',
  'LOST',
];

function ConsultationCard({ row }: { row: ConsultationRow }) {
  const state = deadlineState(row);
  return (
    <Link
      href={`/commercial/consultations/${row.id}`}
      className="block rounded-[10px] border border-border bg-surface p-3 transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      <p className="mb-1 line-clamp-2 text-[13px] font-medium leading-snug">{row.title}</p>
      <p className="mb-2 text-[12px] text-subtle">{row.client.name}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="tnum text-[12.5px] font-medium">
          {moneyDh(row.offerAmountHT ?? row.amount)}
        </span>
        {state && (
          <span
            className={`text-[11px] ${
              state.tone === 'danger'
                ? 'text-danger'
                : state.tone === 'warning'
                  ? 'text-warning'
                  : 'text-subtle'
            }`}
          >
            {state.label}
          </span>
        )}
      </div>
    </Link>
  );
}

function ConsultationsKanban({ items }: { items: ConsultationRow[] }) {
  const map = new Map<string, ConsultationRow[]>();
  for (const row of items) {
    if (!map.has(row.stage)) map.set(row.stage, []);
    map.get(row.stage)!.push(row);
  }
  const orderedStages = [
    ...STAGE_ORDER.filter((s) => map.has(s)),
    ...[...map.keys()].filter((s) => !STAGE_ORDER.includes(s)),
  ];

  return (
    <div className="flex gap-4 overflow-x-auto px-5 py-5">
      {orderedStages.map((stage) => {
        const rows = map.get(stage)!;
        const sum = rows.reduce((acc, r) => acc + (r.offerAmountHT ?? r.amount ?? 0), 0);
        return (
          <div key={stage} className="flex w-[260px] flex-none flex-col gap-2.5">
            <div className="flex items-baseline justify-between px-1">
              <span className="text-[12.5px] font-medium">{rows[0]?.stageLabel ?? stage}</span>
              <span className="tnum text-[11.5px] text-subtle">{rows.length}</span>
            </div>
            <span className="px-1 text-[11px] text-subtle">{moneyDh(sum)}</span>
            <div className="flex flex-col gap-2">
              {rows.map((row) => (
                <ConsultationCard key={row.id} row={row} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function ConsultationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const [session, data, params] = await Promise.all([
    requireSession(),
    api<ConsultationList>('/consultations'),
    searchParams,
  ]);
  const view = params.view === 'kanban' ? 'kanban' : 'table';

  const permissions = session.permissions as Parameters<typeof can>[0];
  const canCreate = can(permissions, 'opportunity', 'CREATE');

  const clients: ClientOption[] = canCreate
    ? await api<{ items: Array<{ id: string; name: string; code: string }> }>('/clients')
        .then((r) => r.items.map((c) => ({ id: c.id, name: `${c.name} — ${c.code}` })))
        .catch(() => [])
    : [];

  const dash = <span className="text-subtle">—</span>;
  const maxLoss = Math.max(1, ...data.lostCauses.map((c) => c.amount));

  return (
    <>
      <PageHeader
        eyebrow="Commercial"
        title="Consultations & appels d’offres"
        description="Toutes les demandes de prix, qu’elles arrivent par consultation directe ou par appel d’offres. Une demande gagnée crée l’affaire ; une demande perdue est classée par cause, pour qu’on sache sur quoi agir."
        action={canCreate ? <OpenOpportunity clients={clients} /> : undefined}
      />

      <KpiRow>
        <KpiCard
          label="En cours"
          value={data.totals.open}
          hint={`${data.totals.consultations} consultation(s) · ${data.totals.tenders} AO`}
        />
        <KpiCard label="Montant en jeu" value={compactDh(data.totals.openAmount)} hint="hors taxes" />
        <KpiCard
          label="Pipeline pondéré"
          value={compactDh(data.totals.weighted)}
          hint="montant × probabilité"
        />
        <KpiCard
          label="Taux de transformation"
          value={percent(data.totals.conversionRate, 0)}
          tone={data.totals.conversionRate >= 50 ? 'success' : 'warning'}
          hint={`${data.totals.won} gagnée(s) · ${data.totals.lost} perdue(s)`}
        />
        <KpiCard
          label="Échéances à 7 jours"
          value={data.totals.urgentDeadlines}
          tone={data.totals.urgentDeadlines > 0 ? 'warning' : undefined}
          hint="appels d’offres à déposer"
        />
        <KpiCard
          label="Cautions immobilisées"
          value={compactDh(data.totals.guarantees)}
          hint="dossiers en cours"
        />
      </KpiRow>

      {data.totals.urgentDeadlines > 0 && (
        <NextActionBanner
          tone="warning"
          title={`${data.totals.urgentDeadlines} appel(s) d’offres à déposer sous 7 jours`}
          detail="Un dossier remis en retard est écarté sans être lu, quelle qu’en soit la qualité."
        />
      )}

      {data.totals.missedDeadlines > 0 && (
        <NextActionBanner
          tone="danger"
          title={`${data.totals.missedDeadlines} échéance(s) passée(s) sans offre déposée`}
          detail="Ces dossiers sont perdus par défaut. Déclarez-les perdus avec leur cause, ou reprenez-les si le client a prolongé le délai."
        />
      )}

      {data.totals.overdueFollowUps > 0 && (
        <NextActionBanner
          tone="warning"
          title={`${data.totals.overdueFollowUps} relance(s) dont la date est passée`}
          detail="Une offre sans relance perd rapidement sa chance d’aboutir."
        />
      )}

      <Card
        title={`${data.items.length} demande(s) de prix`}
        action={
          data.items.length === 0 ? undefined : (
            <div className="flex items-center gap-3 text-[13px]">
              <Link
                href="?view=table"
                className={
                  view === 'table' ? 'font-medium text-accent' : 'text-muted hover:text-text'
                }
              >
                Tableau
              </Link>
              <Link
                href="?view=kanban"
                className={
                  view === 'kanban' ? 'font-medium text-accent' : 'text-muted hover:text-text'
                }
              >
                Kanban
              </Link>
            </div>
          )
        }
      >
        {data.items.length === 0 ? (
          <EmptyState
            title="Aucune consultation"
            description="Enregistrez la demande dès qu’elle arrive : c’est ce qui permet de mesurer, en fin d’année, ce qu’on a gagné et pourquoi on a perdu le reste."
          />
        ) : view === 'kanban' ? (
          <ConsultationsKanban items={data.items} />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>Reçue le</Th>
                <Th>Client</Th>
                <Th>Objet</Th>
                <Th>Nature</Th>
                <Th>Sce</Th>
                <Th>Remise / décision</Th>
                <Th align="right">Montant</Th>
                <Th>Offre</Th>
                <Th>Statut</Th>
                <Th>Issue</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => {
                const state = deadlineState(row);

                return (
                  <tr key={row.id}>
                    <Td mono>{date(row.receivedAt)}</Td>
                    <Td>{row.client.name}</Td>
                    <Td className="max-w-[240px]">
                      <Link
                        href={`/commercial/consultations/${row.id}`}
                        className="line-clamp-1 text-primary hover:underline"
                      >
                        {row.title}
                      </Link>
                      {row.publisher && (
                        <span className="block text-[12px] text-subtle">{row.publisher}</span>
                      )}
                    </Td>
                    <Td>
                      {row.nature === 'APPEL_OFFRES' ? (
                        <>
                          <span className="text-[13.5px] font-medium">Appel d’offres</span>
                          <span className="ref block text-[12px] text-subtle">
                            {row.tenderReference}
                          </span>
                        </>
                      ) : (
                        <span className="text-[13.5px] text-muted">Consultation directe</span>
                      )}
                    </Td>
                    <Td>{row.department ?? dash}</Td>
                    <Td mono>
                      {date(row.submissionDeadline ?? row.expectedCloseDate) || dash}
                      {state && (
                        <span
                          className={`block text-[12px] ${
                            state.tone === 'danger'
                              ? 'text-danger'
                              : state.tone === 'warning'
                                ? 'text-warning'
                                : 'text-subtle'
                          }`}
                        >
                          {state.label}
                        </span>
                      )}
                    </Td>
                    <Td mono align="right">
                      {moneyDh(row.offerAmountHT ?? row.amount)}
                    </Td>
                    <Td mono>
                      {row.offerNumber ?? <span className="text-subtle">—</span>}
                      {row.offerSentAt && (
                        <span className="block text-[12px] text-subtle">
                          envoyée le {date(row.offerSentAt)}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <StatusBadge tone={STAGE_TONE[row.stage] ?? 'neutral'}>
                        {row.stageLabel}
                      </StatusBadge>
                    </Td>
                    <Td className="max-w-[220px]">
                      {row.stage === 'WON' && row.affairId ? (
                        <Link
                          href={`/affaires/${row.affairId}`}
                          className="ref text-[13.5px] text-primary hover:underline"
                        >
                          {row.affairNumber}
                        </Link>
                      ) : row.stage === 'LOST' ? (
                        <>
                          <span className="text-[13.5px] font-medium text-danger">
                            {row.lostCauseLabel ?? 'Cause non renseignée'}
                          </span>
                          {row.lostReason && (
                            <span className="mt-0.5 block text-[12.5px] leading-snug text-subtle">
                              {row.lostReason}
                            </span>
                          )}
                        </>
                      ) : row.nextActionDate ? (
                        <span className="text-[13px] text-subtle">
                          relance le {date(row.nextActionDate)}
                        </span>
                      ) : (
                        dash
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        )}
      </Card>

      {data.lostCauses.length > 0 && (
        <div className="mt-5">
          <Card
            title="Pourquoi on perd"
            action={
              <span className="text-[13.5px] text-muted">
                {data.totals.lost} dossier(s) · {moneyDh(data.totals.lostAmount)}
              </span>
            }
          >
            <div className="px-5 py-5">
              <p className="mb-4 max-w-[74ch] text-[14px] leading-relaxed text-muted">
                Les causes sur lesquelles I2S peut agir — prix, délai, moyens, dossier — pèsent{' '}
                <span className="font-medium text-text">
                  {moneyDh(data.totals.actionableLostAmount)}
                </span>{' '}
                sur {data.totals.actionableLostCount} dossier(s). Un projet abandonné par le client
                n’est pas une contre-performance commerciale : il est compté à part.
              </p>

              <ul className="flex flex-col gap-3.5">
                {data.lostCauses.map((cause) => (
                  <li key={cause.cause}>
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-[13.5px]">
                      <span className={cause.actionable ? 'font-medium' : 'text-muted'}>
                        {cause.label}
                        {!cause.actionable && (
                          <span className="ml-2 text-[12px] text-subtle">hors maîtrise I2S</span>
                        )}
                      </span>
                      <span className="tnum text-subtle">
                        {cause.count} · {moneyDh(cause.amount)}
                      </span>
                    </div>
                    <span className="block h-2.5 rounded-full bg-surface-2">
                      <span
                        className={`block h-2.5 rounded-full ${
                          cause.actionable ? 'bg-danger' : 'bg-neutral'
                        }`}
                        style={{ width: `${Math.max(4, (cause.amount / maxLoss) * 100)}%` }}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
