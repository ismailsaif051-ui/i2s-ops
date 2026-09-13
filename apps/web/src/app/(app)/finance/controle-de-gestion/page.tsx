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

export const metadata: Metadata = { title: 'Contrôle de gestion' };

interface CostLine {
  category: string;
  label: string;
  planned: number;
  actual: number;
  committed: number;
  atCompletion: number;
  variance: number | null;
  varianceRate: number | null;
}

interface CategoryLine extends CostLine {
  tracked: boolean;
  source: string | null;
}

interface AffairRow {
  id: string;
  number: string;
  title: string;
  client: string;
  department: string | null;
  status: string;
  endDate: string | null;
  revenue: number;
  planned: number;
  actual: number;
  committed: number;
  atCompletion: number;
  marginAtCompletion: number;
  marginRate: number | null;
  budgeted: boolean;
  overrun: boolean;
  overrunRate: number | null;
  lines: CostLine[];
}

interface Overview {
  items: AffairRow[];
  categories: CategoryLine[];
  totals: {
    affairs: number;
    unbudgeted: number;
    revenue: number;
    planned: number;
    actual: number;
    committed: number;
    atCompletion: number;
    marginAtCompletion: number;
    marginRate: number | null;
    overrunning: number;
    overrunAmount: number;
  };
}

interface AnomalyGroup {
  code: string;
  label: string;
  why: string;
  severity: 'CRITICAL' | 'WARNING';
  count: number;
  amount: number;
  rows: Array<{ reference: string; affair: string; detail: string; amount: number }>;
  truncated: number;
}

interface Anomalies {
  groups: AnomalyGroup[];
  totals: { groups: number; rows: number; critical: number; amount: number };
}

export default async function ControllingPage() {
  const [overview, anomalies] = await Promise.all([
    api<Overview>('/controlling'),
    api<Anomalies>('/controlling/anomalies'),
  ]);

  const dash = <span className="text-subtle">—</span>;
  const tracked = overview.categories.filter((c) => c.tracked);
  const untracked = overview.categories.filter((c) => !c.tracked);
  const maxPlanned = Math.max(1, ...tracked.map((c) => Math.max(c.planned, c.atCompletion)));

  // Les dossiers qui dérivent d'abord : c'est ce qu'on vient chercher ici.
  const drifting = overview.items
    .filter((i) => i.budgeted && i.overrunRate !== null && i.overrunRate > 0)
    .sort((a, b) => (b.overrunRate ?? 0) - (a.overrunRate ?? 0));
  const onTrack = overview.items.filter((i) => !drifting.includes(i));

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Contrôle de gestion"
        description="Ce qui était prévu contre ce qui a été dépensé, et ce que l’affaire coûtera une fois finie. Le coût à terminaison ajoute au consommé les missions encore à réaliser : c’est lui qui dit si le budget tiendra, pas le consommé seul."
      />

      <KpiRow>
        <KpiCard
          label="Affaires suivies"
          value={overview.totals.affairs}
          hint={
            overview.totals.unbudgeted > 0
              ? `${overview.totals.unbudgeted} sans budget`
              : 'toutes budgétées'
          }
          tone={overview.totals.unbudgeted > 0 ? 'warning' : undefined}
        />
        <KpiCard label="Marché" value={compactDh(overview.totals.revenue)} hint="hors taxes" />
        <KpiCard
          label="Coût à terminaison"
          value={compactDh(overview.totals.atCompletion)}
          hint={`dont ${compactDh(overview.totals.committed)} restant à engager`}
        />
        <KpiCard
          label="Marge à terminaison"
          value={compactDh(overview.totals.marginAtCompletion)}
          tone={
            overview.totals.marginRate === null
              ? undefined
              : overview.totals.marginRate >= 20
                ? 'success'
                : 'warning'
          }
          hint={
            overview.totals.marginRate === null
              ? undefined
              : `${percent(overview.totals.marginRate, 1)} du marché`
          }
        />
        <KpiCard
          label="Dérive de plus de 10 %"
          value={overview.totals.overrunning}
          tone={overview.totals.overrunning > 0 ? 'danger' : undefined}
          hint={
            overview.totals.overrunAmount > 0
              ? `${compactDh(overview.totals.overrunAmount)} au-delà du budget en tout`
              : undefined
          }
        />
        <KpiCard
          label="Anomalies"
          value={anomalies.totals.rows}
          tone={anomalies.totals.critical > 0 ? 'danger' : anomalies.totals.rows > 0 ? 'warning' : undefined}
          hint={`${compactDh(anomalies.totals.amount)} en jeu`}
        />
      </KpiRow>

      {anomalies.totals.critical > 0 && (
        <NextActionBanner
          tone="danger"
          title={`${anomalies.totals.critical} anomalie(s) critiques touchent directement la facturation`}
          detail="Une marge se perd plus souvent par une journée jamais facturée que par un dépassement visible."
        />
      )}

      {/* ── Postes de coût ───────────────────────────────────────── */}

      <Card title="Prévu contre à terminaison, poste par poste">
        <div className="flex flex-col gap-4 px-5 py-5">
          {tracked.map((c) => {
            const drift = c.varianceRate !== null && c.varianceRate < 0;

            return (
              <div key={c.category}>
                <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-3">
                  <span className="text-[14.5px] font-medium">{c.label}</span>
                  <span className="tnum text-[13.5px] text-muted">
                    prévu {moneyDh(c.planned)} · à terminaison{' '}
                    <span className={drift ? 'font-medium text-danger' : 'text-text'}>
                      {moneyDh(c.atCompletion)}
                    </span>
                    {c.varianceRate !== null && (
                      <span className={drift ? 'ml-2 text-danger' : 'ml-2 text-success'}>
                        {drift ? '' : '+'}
                        {percent(c.varianceRate, 1)}
                      </span>
                    )}
                  </span>
                </div>

                {/* Le prévu en fond, le réel et l'engagé par-dessus. */}
                <span className="relative block h-3 rounded-full bg-surface-2">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-border-strong"
                    style={{ width: `${(c.planned / maxPlanned) * 100}%` }}
                  />
                  <span
                    className={`absolute inset-y-0 left-0 rounded-full ${
                      drift ? 'bg-danger' : 'bg-accent'
                    }`}
                    style={{ width: `${(c.actual / maxPlanned) * 100}%` }}
                  />
                  <span
                    className={`absolute inset-y-0 rounded-full opacity-40 ${
                      drift ? 'bg-danger' : 'bg-accent'
                    }`}
                    style={{
                      left: `${(c.actual / maxPlanned) * 100}%`,
                      width: `${(c.committed / maxPlanned) * 100}%`,
                    }}
                  />
                </span>

                <p className="mt-1 text-[12.5px] text-subtle">
                  dépensé {moneyDh(c.actual)} · reste à engager {moneyDh(c.committed)} — {c.source}
                </p>
              </div>
            );
          })}

          {untracked.length > 0 && (
            <div className="mt-2 rounded-[10px] bg-warning-soft px-4 py-3">
              <p className="text-[14px] font-medium text-warning">
                {untracked.map((c) => c.label).join(' et ')} : pas encore suivis
              </p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-muted">
                {untracked.reduce((s, c) => s + c.planned, 0) > 0 && (
                  <>
                    {moneyDh(untracked.reduce((s, c) => s + c.planned, 0))} sont budgétés sur ces
                    postes, mais aucune dépense réelle n’y est rattachée : l’application n’a pas
                    encore de source pour ces coûts.{' '}
                  </>
                )}
                Ils sont donc exclus des totaux et des écarts — les compter à zéro les ferait passer
                pour une économie intégrale, ce qui serait faux.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* ── Affaires ─────────────────────────────────────────────── */}

      <div className="mt-5">
        <Card
          title={
            drifting.length > 0
              ? `${drifting.length} affaire(s) au-dessus du budget, puis les autres`
              : 'Affaires suivies'
          }
        >
          {overview.items.length === 0 ? (
            <EmptyState
              title="Aucune affaire en cours"
              description="Le contrôle porte sur les affaires en cours ou suspendues : les affaires closes sont sorties du tableau."
            />
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <Th>Affaire</Th>
                  <Th>Client</Th>
                  <Th>Sce</Th>
                  <Th align="right">Marché</Th>
                  <Th align="right">Budget</Th>
                  <Th align="right">Dépensé</Th>
                  <Th align="right">À engager</Th>
                  <Th align="right">À terminaison</Th>
                  <Th align="right">Marge</Th>
                  <Th>État</Th>
                </tr>
              </thead>
              <tbody>
                {[...drifting, ...onTrack].map((affair) => (
                  <tr key={affair.id}>
                    <Td mono>
                      <Link
                        href={`/affaires/${affair.id}`}
                        className="text-primary hover:underline"
                      >
                        {affair.number}
                      </Link>
                      <span className="block max-w-[200px] truncate text-[12px] text-subtle">
                        {affair.title}
                      </span>
                    </Td>
                    <Td className="max-w-[160px]">
                      <span className="line-clamp-1">{affair.client}</span>
                    </Td>
                    <Td>{affair.department ?? dash}</Td>
                    <Td mono align="right">
                      {moneyDh(affair.revenue)}
                    </Td>
                    <Td mono align="right">
                      {affair.budgeted ? moneyDh(affair.planned) : dash}
                    </Td>
                    <Td mono align="right">
                      {moneyDh(affair.actual)}
                    </Td>
                    <Td mono align="right">
                      {affair.committed > 0 ? moneyDh(affair.committed) : dash}
                    </Td>
                    <Td mono align="right">
                      <span className={affair.overrun ? 'font-medium text-danger' : undefined}>
                        {moneyDh(affair.atCompletion)}
                      </span>
                    </Td>
                    <Td mono align="right">
                      <span
                        className={
                          affair.marginAtCompletion < 0
                            ? 'font-medium text-danger'
                            : affair.marginRate !== null && affair.marginRate < 15
                              ? 'text-warning'
                              : undefined
                        }
                      >
                        {moneyDh(affair.marginAtCompletion)}
                      </span>
                      {affair.marginRate !== null && (
                        <span className="block text-[12px] text-subtle">
                          {percent(affair.marginRate, 0)}
                        </span>
                      )}
                    </Td>
                    <Td>
                      {!affair.budgeted ? (
                        <StatusBadge tone="neutral">Sans budget</StatusBadge>
                      ) : affair.overrunRate !== null && affair.overrunRate > 10 ? (
                        <StatusBadge tone="danger">
                          +{percent(affair.overrunRate, 0)}
                        </StatusBadge>
                      ) : affair.overrun ? (
                        <StatusBadge tone="warning">Au-dessus</StatusBadge>
                      ) : (
                        <StatusBadge tone="success">Dans le budget</StatusBadge>
                      )}
                      {affair.endDate && (
                        <span className="ref mt-0.5 block text-[12px] text-subtle">
                          fin {date(affair.endDate)}
                        </span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>
      </div>

      {/* ── Contrôles de cohérence ───────────────────────────────── */}

      <div className="mt-5">
        <Card
          title="Ce qui ne colle pas"
          action={
            <span className="text-[13.5px] text-muted">
              {anomalies.totals.rows} ligne(s) · {moneyDh(anomalies.totals.amount)} en jeu
            </span>
          }
        >
          {anomalies.groups.length === 0 ? (
            <EmptyState
              title="Aucune incohérence détectée"
              description="Journées facturées deux fois, travail jamais attaché, frais sans affaire, factures sans pièce : tous les contrôles passent."
            />
          ) : (
            <ul className="divide-y divide-border">
              {anomalies.groups.map((group) => (
                <li key={group.code} className="px-5 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <StatusBadge tone={group.severity === 'CRITICAL' ? 'danger' : 'warning'}>
                        {group.severity === 'CRITICAL' ? 'Critique' : 'À surveiller'}
                      </StatusBadge>
                      <span className="text-[14.5px] font-medium">{group.label}</span>
                    </div>
                    <span className="tnum text-[13.5px] text-muted">
                      {group.count} · {moneyDh(group.amount)}
                    </span>
                  </div>

                  <p className="mt-1.5 max-w-[80ch] text-[13.5px] leading-relaxed text-muted">
                    {group.why}
                  </p>

                  <ul className="mt-2.5 flex flex-col gap-1">
                    {group.rows.slice(0, 6).map((row, index) => (
                      <li
                        key={`${group.code}-${index}`}
                        className="flex flex-wrap items-baseline justify-between gap-3 text-[13px]"
                      >
                        <span className="text-muted">
                          <span className="ref">{row.affair}</span> · {row.detail}
                        </span>
                        {row.amount > 0 && (
                          <span className="tnum text-subtle">{moneyDh(row.amount)}</span>
                        )}
                      </li>
                    ))}
                  </ul>

                  {(group.rows.length > 6 || group.truncated > 0) && (
                    <p className="mt-1.5 text-[12.5px] text-subtle">
                      et {group.rows.length - Math.min(6, group.rows.length) + group.truncated}{' '}
                      autre(s)
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="mt-5 max-w-[80ch] text-[13.5px] leading-relaxed text-subtle">
        Aucun de ces contrôles n’empêche quoi que ce soit : ils désignent, ils ne bloquent pas. Un
        écart peut être justifié — un avenant non encore saisi, une mission reportée. C’est
        précisément pourquoi ils sont montrés à une personne plutôt que traités automatiquement.
      </p>
    </>
  );
}
