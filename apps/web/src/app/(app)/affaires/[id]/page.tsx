import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ReportStatus } from '@i2s/contracts';
import { ApiError, api } from '@/lib/api';
import {
  AFFAIR_COMMERCIAL_LABELS,
  AFFAIR_WORKS_LABELS,
  MISSION_STATUS_LABELS,
  REPORT_STATUS_LABELS,
  compactDh,
  date,
  moneyDh,
  percent,
  points,
} from '@/lib/format';
import {
  Card,
  DataTable,
  EmptyState,
  NextActionBanner,
  StatusBadge,
  Td,
  Th,
  type Tone,
} from '@/components/ui';

export const metadata: Metadata = { title: 'Fiche affaire' };

interface Profitability {
  affair: {
    id: string;
    number: string;
    title: string;
    status: string;
    client: { name: string; code: string };
    department: { code: string; name: string } | null;
    accountManager: string | null;
    startDate: string | null;
    endDate: string | null;
    dailyRate: number | null;
  };
  profitability: {
    revenues: { contractAmount: number; invoiced: number; collected: number; pendingAttachments: number };
    costs: { labour: number; expenses: number; vehicles: number; subcontracting: number; other: number; total: number };
    grossMargin: number;
    marginRate: number;
    budgetMarginRate: number | null;
    marginGapPoints: number | null;
    atRisk: boolean;
    remainingToInvoice: number;
  };
  consumedDays: number;
  budgetLines: Array<{ category: string; planned: number }>;
}

interface AffairDetail {
  id: string;
  number: string;
  title: string;
  commercialStatus: string;
  worksStatus: string;
  pilotInitials: string | null;
  preparedByInitials: string | null;
  physicalFileOpened: boolean;
  controlLocation: string | null;
  poNumber: string | null;
  offerAmountHT: string | null;
  poAmountHT: string | null;
  observation: string | null;
  creationDate: string | null;
  client: { name: string; code: string; paymentTerms: number };
  department: { code: string; name: string } | null;
  missions: Array<{
    id: string;
    number: string;
    objective: string | null;
    status: string;
    plannedStartDate: string | null;
    plannedEndDate: string | null;
    assignments: Array<{ employee: { matricule: string; firstName: string; lastName: string } }>;
  }>;
  reports: Array<{
    id: string;
    number: string;
    status: ReportStatus;
    issuedAt: string | null;
    deliveredAt: string | null;
  }>;
  projects: Array<{
    id: string;
    code: string;
    name: string;
    manager: string | null;
    status: string;
    startDate: string | null;
    endDate: string | null;
    sites: Array<{
      id: string;
      name: string;
      city: string | null;
      region: string | null;
      address: string | null;
      distanceFromHqKm: number | null;
      accessConstraints: string | null;
      hseRequirements: string | null;
    }>;
  }>;
  attachments: Array<{ id: string; number: string; status: string; periodStart: string; totalHT: string }>;
  invoices: Array<{
    id: string;
    number: string;
    status: string;
    issueDate: string;
    dueDate: string;
    totalTTC: string;
    payments: Array<{ amount: string }>;
  }>;
  nonConformities: Array<{ id: string; number: string; description: string; severity: string; status: string; dueDate: string | null }>;
}

const BUDGET_LABELS: Record<string, string> = {
  LABOUR: 'Main-d’œuvre',
  EXPENSES: 'Frais de mission',
  VEHICLES: 'Véhicules',
  SUBCONTRACTING: 'Sous-traitance',
  OTHER: 'Autres',
};

const SEVERITY_TONE: Record<string, Tone> = {
  CRITICAL: 'danger',
  MAJOR: 'warning',
  MINOR: 'info',
  OBSERVATION: 'neutral',
};

export default async function AffairPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let detail: AffairDetail;
  try {
    detail = await api<AffairDetail>(`/affairs/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const analytics = await api<Profitability | null>(`/analytics/affairs/${id}/profitability`).catch(
    () => null,
  );
  const p = analytics?.profitability;

  const budgetByCategory = new Map(
    (analytics?.budgetLines ?? []).map((b) => [b.category, b.planned]),
  );
  const actualByCategory: Record<string, number> = {
    LABOUR: p?.costs.labour ?? 0,
    EXPENSES: p?.costs.expenses ?? 0,
    VEHICLES: p?.costs.vehicles ?? 0,
    SUBCONTRACTING: p?.costs.subcontracting ?? 0,
    OTHER: p?.costs.other ?? 0,
  };

  const pendingReports = detail.reports.filter((r) =>
    ['SUBMITTED', 'UNDER_CHECK', 'CORRECTION'].includes(r.status),
  );
  const openNc = detail.nonConformities.filter((n) => !['CLOSED', 'REJECTED'].includes(n.status));
  const siteCount = detail.projects.reduce((sum, p) => sum + p.sites.length, 0);

  return (
    <>
      {/* En-tête d'entité — commun à affaire, mission, rapport, facture */}
      <header className="mb-5">
        <Link href="/affaires" className="text-[12.5px] text-muted hover:text-text">
          ‹ Affaires
        </Link>
        <div className="mt-1 flex flex-wrap items-baseline gap-3">
          <h1 className="ref text-[26px] font-semibold">
            {detail.number}
          </h1>
          <span className="text-[20px] font-semibold">
            {detail.client.name}
          </span>
          <StatusBadge
            tone={
              detail.commercialStatus === 'GAGNEE'
                ? 'success'
                : detail.commercialStatus === 'PERDUE_ANNULEE'
                  ? 'danger'
                  : 'warning'
            }
          >
            {AFFAIR_COMMERCIAL_LABELS[detail.commercialStatus] ?? detail.commercialStatus}
          </StatusBadge>
          <StatusBadge tone={detail.worksStatus === 'FAC_TOTALE' ? 'success' : 'info'}>
            {AFFAIR_WORKS_LABELS[detail.worksStatus] ?? detail.worksStatus}
          </StatusBadge>
        </div>
        <p className="mt-1 max-w-[80ch] text-[14px] text-muted">{detail.title}</p>
        <p className="mt-1 text-[12.5px] text-subtle">
          {detail.department?.code ?? '—'}
          {detail.pilotInitials && ` · Pilote ${detail.pilotInitials}`}
          {detail.preparedByInitials && ` · Préparée par ${detail.preparedByInitials}`}
          {detail.controlLocation && ` · ${detail.controlLocation}`}
          {' · Dossier physique '}
          {detail.physicalFileOpened ? 'ouvert' : 'non ouvert'}
        </p>
      </header>

      {/* Bandeau de chiffres */}
      {p && (
        <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] overflow-hidden rounded-[10px] border border-border bg-surface">
          {[
            { k: 'Marché', v: compactDh(p.revenues.contractAmount), d: 'HT' },
            { k: 'Facturé', v: compactDh(p.revenues.invoiced), d: `${detail.invoices.length} facture(s)` },
            { k: 'Encaissé', v: compactDh(p.revenues.collected), d: 'règlements reçus' },
            { k: 'Coûts', v: compactDh(p.costs.total), d: `${analytics?.consumedDays ?? 0} jours pointés` },
            {
              k: 'Marge',
              v: percent(p.marginRate),
              d: p.budgetMarginRate === null ? 'pas de budget' : `budget ${percent(p.budgetMarginRate, 0)}`,
              warn: p.atRisk,
            },
            { k: 'Reste à facturer', v: compactDh(p.remainingToInvoice), d: 'hors attachements en cours' },
          ].map((cell) => (
            <div key={cell.k} className="border-r border-border px-4 py-3.5 last:border-r-0">
              <p className="text-[13.5px] text-subtle">
                {cell.k}
              </p>
              <p
                className={`tnum mt-1.5 text-[24px] font-semibold leading-none ${
                  cell.warn ? 'text-danger' : ''
                }`}
              >
                {cell.v}
              </p>
              <p className="mt-1.5 text-[11.5px] text-subtle">{cell.d}</p>
            </div>
          ))}
        </div>
      )}

      {p?.atRisk && (
        <NextActionBanner
          tone="danger"
          title={`Alerte rentabilité — écart de marge ${points(p.marginGapPoints)}`}
          detail={`Marge budgétée ${percent(p.budgetMarginRate ?? 0, 0)}, marge réelle ${percent(p.marginRate)}. Analyser les frais de mission et vérifier que les jours d’attente chantier ont bien été portés à un attachement.`}
        />
      )}

      {pendingReports.length > 0 && (
        <NextActionBanner
          tone="warning"
          title={`${pendingReports.length} rapport(s) en attente de vérification`}
          detail="Le rapport doit être visé par un vérificateur distinct du rédacteur avant émission."
          action={
            <Link
              href="/operations/rapports"
              className="rounded-[6px] border border-border-strong bg-surface px-3 py-1.5 text-[13px] hover:bg-surface-2"
            >
              Ouvrir la file
            </Link>
          }
        />
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Commercial">
          <div className="px-4 py-3.5">
            <dl className="grid grid-cols-[160px_1fr] gap-y-2 text-[13.5px]">
              <dt className="text-muted">Montant offre (OP)</dt>
              <dd className="tnum ref text-[12.5px]">
                {moneyDh(detail.offerAmountHT)}
              </dd>
              <dt className="text-muted">Montant bon de commande</dt>
              <dd className="tnum ref text-[12.5px]">
                {moneyDh(detail.poAmountHT)}
              </dd>
              <dt className="text-muted">N° bon de commande</dt>
              <dd className="ref text-[12.5px]">
                {detail.poNumber ?? '—'}
              </dd>
              <dt className="text-muted">Date de création</dt>
              <dd>{date(detail.creationDate)}</dd>
              <dt className="text-muted">Délai de paiement</dt>
              <dd>{detail.client.paymentTerms} jours</dd>
              {detail.observation && (
                <>
                  <dt className="text-muted">Observation</dt>
                  <dd>{detail.observation}</dd>
                </>
              )}
            </dl>
          </div>
        </Card>

        {p && (
          <Card title="Budget vs réel">
            <DataTable>
              <thead>
                <tr>
                  <Th>Poste</Th>
                  <Th align="right">Budget</Th>
                  <Th align="right">Réel</Th>
                  <Th align="right">Écart</Th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(BUDGET_LABELS).map((category) => {
                  const planned = budgetByCategory.get(category) ?? 0;
                  const actual = actualByCategory[category] ?? 0;
                  const gap = planned - actual;
                  return (
                    <tr key={category}>
                      <Td>{BUDGET_LABELS[category]}</Td>
                      <Td align="right" mono>{moneyDh(planned)}</Td>
                      <Td align="right" mono>{moneyDh(actual)}</Td>
                      <Td align="right" mono>
                        <span className={gap < 0 ? 'font-semibold text-danger' : 'text-success'}>
                          {gap >= 0 ? '+' : ''}
                          {moneyDh(gap)}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
            <p className="px-4 py-2.5 text-[12px] text-subtle">
              Sous-traitance et autres coûts sont à zéro tant qu’aucune source de données ne les
              alimente — ils ne sont pas estimés.
            </p>
          </Card>
        )}
      </div>

      <div className="mt-5">
        <Card
          title={`Projets & sites — ${detail.projects.length}`}
          action={
            <span className="text-[13.5px] text-muted">
              {siteCount} site(s) d’intervention
            </span>
          }
        >
          {detail.projects.length === 0 ? (
            <EmptyState
              title="Aucun projet"
              description="Un projet découpe l’affaire en lots, et porte les sites où les inspecteurs se rendent."
            />
          ) : (
            <ul className="divide-y divide-border">
              {detail.projects.map((project) => (
                <li key={project.id} className="px-4 py-3.5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="ref text-[12px]">{project.code}</span>
                    <span className="text-[14px] font-medium">{project.name}</span>
                    {project.manager && (
                      <span className="text-[12.5px] text-subtle">{project.manager}</span>
                    )}
                    {(project.startDate || project.endDate) && (
                      <span className="tnum text-[12.5px] text-subtle">
                        {date(project.startDate)} → {date(project.endDate)}
                      </span>
                    )}
                  </div>

                  {project.sites.length === 0 ? (
                    <p className="mt-1.5 text-[13px] text-subtle">Aucun site rattaché.</p>
                  ) : (
                    <ul className="mt-2.5 flex flex-col gap-2.5">
                      {project.sites.map((site) => {
                        // Beaucoup de sites portent le nom de leur ville : la
                        // répéter donnerait « Jorf Lasfar · Jorf Lasfar ».
                        const lieu = [site.city, site.region]
                          .filter((v): v is string => Boolean(v) && v !== site.name)
                          .join(' · ');
                        return (
                        <li key={site.id} className="border-l-2 border-border pl-3">
                          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                            <span className="text-[13.5px] font-medium">{site.name}</span>
                            {lieu && <span className="text-[12.5px] text-muted">{lieu}</span>}
                            {site.distanceFromHqKm !== null && (
                              <span className="tnum text-[12.5px] text-subtle">
                                {site.distanceFromHqKm} km du siège
                              </span>
                            )}
                          </div>
                          {site.accessConstraints && (
                            <p className="mt-0.5 text-[12.5px] leading-snug text-subtle">
                              {site.accessConstraints}
                            </p>
                          )}
                          {site.hseRequirements && (
                            <p className="mt-0.5 text-[12.5px] leading-snug text-subtle">
                              HSE — {site.hseRequirements}
                            </p>
                          )}
                        </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card
          title={`Missions — ${detail.missions.length}`}
          action={
            detail.missions.length > 12 ? (
              <Link
                href={`/operations/missions?affairId=${detail.id}`}
                className="text-[13px] font-medium text-accent hover:underline"
              >
                Voir les {detail.missions.length}
              </Link>
            ) : undefined
          }
        >
          {detail.missions.length === 0 ? (
            <EmptyState title="Aucune mission" description="Planifiez une mission depuis le planning." />
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <Th>N°</Th>
                  <Th>Objet</Th>
                  <Th>Inspecteur</Th>
                  <Th>Période</Th>
                  <Th>Statut</Th>
                </tr>
              </thead>
              <tbody>
                {detail.missions.slice(0, 12).map((m) => (
                  <tr key={m.id}>
                    <Td mono>
                      <Link href={`/operations/missions/${m.id}`} className="hover:text-accent">
                        {m.number}
                      </Link>
                    </Td>
                    <Td className="max-w-[220px]">
                      <span className="line-clamp-1">{m.objective ?? '—'}</span>
                    </Td>
                    <Td>
                      {m.assignments
                        .map((a) => `${a.employee.lastName.toUpperCase()}`)
                        .join(', ') || '—'}
                    </Td>
                    <Td mono>
                      {date(m.plannedStartDate)} → {date(m.plannedEndDate)}
                    </Td>
                    <Td>
                      <StatusBadge tone={m.status === 'CLOSED' ? 'success' : 'info'}>
                        {MISSION_STATUS_LABELS[m.status] ?? m.status}
                      </StatusBadge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>

        <Card title={`Factures — ${detail.invoices.length}`}>
          {detail.invoices.length === 0 ? (
            <EmptyState
              title="Aucune facture"
              description="Une facture se construit à partir d’attachements validés."
            />
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <Th>N°</Th>
                  <Th>Émission</Th>
                  <Th>Échéance</Th>
                  <Th align="right">TTC</Th>
                  <Th>Statut</Th>
                </tr>
              </thead>
              <tbody>
                {detail.invoices.map((inv) => {
                  const paid = inv.payments.reduce((s, p2) => s + Number(p2.amount), 0);
                  return (
                    <tr key={inv.id}>
                      <Td mono>
                        <Link href={`/finance/factures/${inv.id}`} className="hover:text-accent">
                          {inv.number}
                        </Link>
                      </Td>
                      <Td mono>{date(inv.issueDate)}</Td>
                      <Td mono>{date(inv.dueDate)}</Td>
                      <Td align="right" mono>{moneyDh(inv.totalTTC)}</Td>
                      <Td>
                        <StatusBadge
                          tone={
                            inv.status === 'PAID'
                              ? 'success'
                              : inv.status === 'OVERDUE'
                                ? 'danger'
                                : 'info'
                          }
                        >
                          {inv.status === 'PAID'
                            ? 'Payée'
                            : inv.status === 'OVERDUE'
                              ? 'Échue'
                              : paid > 0
                                ? 'Partiellement payée'
                                : 'Envoyée'}
                        </StatusBadge>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card title={`Rapports — ${detail.reports.length}`}>
          {detail.reports.length === 0 ? (
            <EmptyState title="Aucun rapport" />
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <Th>N°</Th>
                  <Th>Statut</Th>
                  <Th>Émis le</Th>
                  <Th>Remis le</Th>
                </tr>
              </thead>
              <tbody>
                {detail.reports.map((r) => (
                  <tr key={r.id}>
                    <Td mono>
                      <Link href={`/operations/rapports/${r.id}`} className="hover:text-accent">
                        {r.number}
                      </Link>
                    </Td>
                    <Td>
                      <StatusBadge
                        tone={
                          r.status === 'ISSUED' || r.status === 'ARCHIVED'
                            ? 'success'
                            : r.status === 'CORRECTION'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {REPORT_STATUS_LABELS[r.status] ?? r.status}
                      </StatusBadge>
                    </Td>
                    <Td mono>{date(r.issuedAt)}</Td>
                    <Td mono>{date(r.deliveredAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>

        <Card title={`Non-conformités — ${openNc.length} ouverte(s)`}>
          {detail.nonConformities.length === 0 ? (
            <EmptyState title="Aucune non-conformité" />
          ) : (
            <ul className="divide-y divide-border">
              {detail.nonConformities.map((nc) => (
                <li key={nc.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/operations/non-conformites/${nc.id}`}
                      className="ref text-[12px] text-primary hover:underline"
                    >
                      {nc.number}
                    </Link>
                    <StatusBadge tone={SEVERITY_TONE[nc.severity] ?? 'neutral'}>
                      {nc.severity === 'CRITICAL'
                        ? 'Critique'
                        : nc.severity === 'MAJOR'
                          ? 'Majeure'
                          : nc.severity === 'MINOR'
                            ? 'Mineure'
                            : 'Observation'}
                    </StatusBadge>
                    {nc.dueDate && (
                      <span className="text-[12px] text-subtle">Échéance {date(nc.dueDate)}</span>
                    )}
                  </div>
                  <p className="mt-1 text-[13px] text-muted">{nc.description}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
