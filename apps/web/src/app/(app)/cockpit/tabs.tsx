import Link from 'next/link';
import { api } from '@/lib/api';
import { compactDh, money, percent } from '@/lib/format';
import { Card, KpiCard, KpiRow, StatusBadge } from '@/components/ui';

/*
 * Onglets de la Vue d'ensemble : Activité, Finance, Qualité.
 * Chaque bloc lit une API existante, avec les droits de l'utilisateur : un
 * bloc refusé ou indisponible ne s'affiche pas (jamais un zéro inventé).
 */

export const TABS = [
  { key: 'synthese', label: 'Synthèse' },
  { key: 'activite', label: 'Activité' },
  { key: 'finance', label: 'Finance' },
  { key: 'qualite', label: 'Qualité' },
] as const;
export type TabKey = (typeof TABS)[number]['key'];

/** Onglets en liens : chacun a son adresse, le mois choisi est conservé. */
export function TabNav({ current, month }: { current: TabKey; month: string }) {
  return (
    <nav aria-label="Rubriques de la vue d’ensemble" className="mb-6 overflow-x-auto overflow-y-hidden border-b border-border">
      <ul className="-mb-px flex min-w-max gap-1">
        {TABS.map((tab) => {
          const active = tab.key === current;
          return (
            <li key={tab.key}>
              <Link
                href={`/cockpit?month=${month}${tab.key === 'synthese' ? '' : `&tab=${tab.key}`}`}
                aria-current={active ? 'page' : undefined}
                className={`block border-b-2 px-4 py-3 text-[15px] transition-colors ${
                  active ? 'border-accent font-medium text-accent' : 'border-transparent text-muted hover:text-text'
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Unavailable({ what }: { what: string }) {
  return (
    <Card>
      <p className="px-6 py-6 text-[14.5px] text-muted">
        {what} : votre profil n’y a pas accès, ou le service ne répond pas pour le moment.
      </p>
    </Card>
  );
}

function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="px-6 pb-3 pt-5">
      <h2 className="text-[20px] font-semibold leading-tight">{title}</h2>
      {detail && <p className="mt-1 text-[14px] text-muted">{detail}</p>}
    </div>
  );
}

/* ── Activité ────────────────────────────────────────────────────── */

interface Productivity {
  period: { label: string; workingDays: number };
  rows: Array<{
    employeeId: string;
    name: string;
    department: { code: string } | null;
    isInspector: boolean;
    worked: number;
    billedDays: number;
    unassigned: number;
    waiting: number;
    netProductivity: number;
    idleCost: number;
  }>;
  totals: {
    worked: number;
    billedDays: number;
    unassigned: number;
    waiting: number;
    idleCost: number;
    unvaluedDays: number;
    netProductivity: number;
  };
}

const days = (n: number) => `${(Math.round(n * 10) / 10).toLocaleString('fr-FR')} j`;

export async function ActivityTab({ month }: { month: string }) {
  const data = await api<Productivity>(`/analytics/productivity?month=${month}`).catch(() => null);
  if (!data) return <Unavailable what="L’activité des équipes" />;

  const inspectors = data.rows.filter((r) => r.isInspector);
  const { totals } = data;

  return (
    <>
      <KpiRow>
        <KpiCard label="Jours travaillés" value={days(totals.worked)} hint={`${data.period.workingDays} jours ouvrés dans le mois`} href={`/pilotage/productivite?month=${month}`} />
        <KpiCard label="Jours facturés" value={days(totals.billedDays)} hint="portés par un attachement validé" href={`/pilotage/productivite?month=${month}`} />
        <KpiCard
          label="Productivité nette"
          value={percent(totals.netProductivity, 1)}
          tone={totals.netProductivity < 50 ? 'warning' : undefined}
          hint="jours facturés ÷ jours disponibles"
          href={`/pilotage/productivite?month=${month}`}
        />
        <KpiCard
          label="Jours non affectés"
          value={days(totals.unassigned)}
          tone={totals.unassigned > 0 ? 'danger' : undefined}
          hint={`coût : ${money(totals.idleCost)} DH`}
          href={`/pilotage/jours-non-affectes?month=${month}`}
        />
      </KpiRow>

      {totals.unvaluedDays > 0 && (
        <p className="mb-5 rounded-[10px] border border-border bg-warning-soft px-4 py-3 text-[14px] text-warning">
          {days(totals.unvaluedDays)} travaillés ne sont encore portés par aucun attachement validé : ils
          ne comptent pas dans la productivité tant qu’ils ne sont pas attachés.
        </p>
      )}

      <Card>
        <SectionTitle title="Inspecteurs" detail={`Mois de ${data.period.label} — les moins productifs en premier.`} />
        {inspectors.length === 0 ? (
          <p className="px-6 pb-6 text-[14.5px] text-muted">Aucun pointage d’inspecteur sur ce mois.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[14.5px]">
              <thead>
                <tr className="text-left text-[13.5px] text-muted">
                  <th className="px-6 pb-2.5 font-normal">Inspecteur</th>
                  <th className="px-3 pb-2.5 font-normal">Service</th>
                  <th className="px-3 pb-2.5 text-right font-normal">Travaillés</th>
                  <th className="px-3 pb-2.5 text-right font-normal">Facturés</th>
                  <th className="px-3 pb-2.5 text-right font-normal">Non affectés</th>
                  <th className="px-6 pb-2.5 text-right font-normal">Productivité</th>
                </tr>
              </thead>
              <tbody>
                {inspectors.slice(0, 10).map((r) => (
                  <tr key={r.employeeId} className="h-[48px] border-t border-border">
                    <td className="px-6 font-medium">{r.name}</td>
                    <td className="px-3 text-muted">{r.department?.code ?? '—'}</td>
                    <td className="tnum px-3 text-right">{days(r.worked)}</td>
                    <td className="tnum px-3 text-right">{days(r.billedDays)}</td>
                    <td className={`tnum px-3 text-right ${r.unassigned > 0 ? 'text-danger' : ''}`}>{days(r.unassigned)}</td>
                    <td className="tnum px-6 text-right font-medium">{percent(r.netProductivity, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-border px-6 py-3 text-[13.5px]">
          <Link href={`/pilotage/productivite?month=${month}`} className="font-medium text-accent hover:underline">
            Voir toute la productivité
          </Link>
          <span className="text-muted"> · </span>
          <Link href="/operations/planning" className="font-medium text-accent hover:underline">
            Planning des inspecteurs
          </Link>
        </p>
      </Card>
    </>
  );
}

/* ── Finance ─────────────────────────────────────────────────────── */

interface DashboardTrends {
  period: { label: string; to: string };
  invoicedYtd: number | null;
  collectedYtd: number | null;
  invoicedTrend: number[] | null;
  collectedTrend: number[] | null;
}

interface Receivables {
  totals: { outstanding: number; collectionRate: number; dso: number };
  aging: Record<string, number>;
}

interface ProfitabilityTotals {
  totals: { affairs: number; grossMargin: number; marginRate: number | null; atRisk: number; loss: number; notInvoiced: number } | null;
}

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** Barres groupées Facturé / Encaissé par mois, sur une seule échelle, avec leur tableau équivalent. */
function MonthlyBars({ invoiced, collected }: { invoiced: number[]; collected: number[] }) {
  const max = Math.max(1, ...invoiced, ...collected);
  return (
    <div className="px-6 pb-6">
      <div className="flex h-[220px] items-end gap-2 border-b border-border pb-1" aria-hidden="true">
        {invoiced.map((value, i) => (
          <div key={i} className="flex h-full flex-1 flex-col justify-end">
            <div className="flex h-full items-end justify-center gap-[3px]">
              <div className="w-1/3 max-w-[18px] rounded-t-[3px] bg-brand" style={{ height: `${(Math.max(0, value) / max) * 100}%` }} title={`Facturé ${MONTHS[i]} : ${money(value)} DH`} />
              <div className="w-1/3 max-w-[18px] rounded-t-[3px] bg-secondary" style={{ height: `${(Math.max(0, collected[i] ?? 0) / max) * 100}%` }} title={`Encaissé ${MONTHS[i]} : ${money(collected[i] ?? 0)} DH`} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2 text-center text-[12px] text-muted" aria-hidden="true">
        {invoiced.map((_, i) => (
          <span key={i} className="flex-1">{MONTHS[i]}</span>
        ))}
      </div>
      <p className="mt-3 flex gap-5 text-[13px] text-muted" aria-hidden="true">
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-brand" /> Facturé HT</span>
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-secondary" /> Encaissé</span>
      </p>
      <table className="sr-only">
        <caption>Facturé et encaissé par mois</caption>
        <thead>
          <tr><th>Mois</th><th>Facturé HT</th><th>Encaissé</th></tr>
        </thead>
        <tbody>
          {invoiced.map((value, i) => (
            <tr key={i}><td>{MONTHS[i]}</td><td>{money(value)} DH</td><td>{money(collected[i] ?? 0)} DH</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const AGING_LABELS: Record<string, string> = {
  current: 'Non échu',
  d0_30: '1 à 30 jours',
  d31_60: '31 à 60 jours',
  d61_90: '61 à 90 jours',
  d90plus: 'Plus de 90 jours',
};

export async function FinanceTab({ month }: { month: string }) {
  const [dash, receivables, profitability] = await Promise.all([
    api<DashboardTrends>(`/analytics/dashboard?month=${month}`).catch(() => null),
    api<Receivables>('/receivables').catch(() => null),
    api<ProfitabilityTotals>('/analytics/profitability').catch(() => null),
  ]);
  const hasBilling = dash?.invoicedTrend && dash.collectedTrend && dash.invoicedYtd !== null;
  if (!hasBilling && !receivables && !profitability?.totals) return <Unavailable what="Les chiffres financiers" />;

  const endOfPeriod = dash ? new Date(dash.period.to).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
  const p = profitability?.totals;
  const agingMax = receivables ? Math.max(1, ...Object.values(receivables.aging)) : 1;

  return (
    <>
      {hasBilling && (
        <Card className="mb-5">
          <SectionTitle title="Facturé et encaissé, mois par mois" detail={`Du 1er janvier au ${endOfPeriod} — total : ${compactDh(dash!.invoicedYtd)} facturés, ${compactDh(dash!.collectedYtd)} encaissés.`} />
          <MonthlyBars invoiced={dash!.invoicedTrend!} collected={dash!.collectedTrend!} />
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {receivables && (
          <Card>
            <SectionTitle title="Créances clients" detail="État à ce jour, toutes factures émises non soldées." />
            <div className="grid grid-cols-3 gap-4 px-6 pb-4">
              <div>
                <p className="text-[13.5px] text-muted">Reste à encaisser</p>
                <p className="tnum mt-1 text-[24px] font-semibold">{compactDh(receivables.totals.outstanding)}</p>
              </div>
              <div>
                <p className="text-[13.5px] text-muted">Taux de recouvrement</p>
                <p className="tnum mt-1 text-[24px] font-semibold">{percent(receivables.totals.collectionRate, 0)}</p>
              </div>
              <div>
                <p className="text-[13.5px] text-muted">Délai moyen de paiement</p>
                <p className={`tnum mt-1 text-[24px] font-semibold ${receivables.totals.dso > 90 ? 'text-danger' : ''}`}>{Math.round(receivables.totals.dso)} j</p>
              </div>
            </div>
            <ul className="space-y-2.5 px-6 pb-6">
              {Object.entries(receivables.aging).map(([key, value]) => (
                <li key={key} className="grid grid-cols-[130px_1fr_auto] items-center gap-3 text-[14px]">
                  <span className="text-muted">{AGING_LABELS[key] ?? key}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                    <span className={`block h-full rounded-full ${key === 'current' ? 'bg-secondary' : key === 'd90plus' ? 'bg-danger' : 'bg-warning'}`} style={{ width: `${(value / agingMax) * 100}%` }} />
                  </span>
                  <span className="tnum text-right font-medium">{compactDh(value)}</span>
                </li>
              ))}
            </ul>
            <p className="border-t border-border px-6 py-3 text-[13.5px]">
              <Link href="/finance/encaissements" className="font-medium text-accent hover:underline">Ouvrir les encaissements</Link>
            </p>
          </Card>
        )}

        {p && (
          <Card>
            <SectionTitle title="Rentabilité des affaires" detail={`Affaires gagnées, à ce jour — ${p.affairs} affaires.`} />
            <div className="grid grid-cols-2 gap-4 px-6 pb-5">
              <div>
                <p className="text-[13.5px] text-muted">Marge brute</p>
                <p className={`tnum mt-1 text-[24px] font-semibold ${p.grossMargin < 0 ? 'text-danger' : ''}`}>{compactDh(p.grossMargin)}</p>
              </div>
              <div>
                <p className="text-[13.5px] text-muted">Taux de marge</p>
                <p className="tnum mt-1 text-[24px] font-semibold">{p.marginRate === null ? '—' : percent(p.marginRate, 1)}</p>
              </div>
            </div>
            <ul className="space-y-2 px-6 pb-6 text-[14px]">
              <li className="flex items-center justify-between gap-3">
                <span>Sous la marge budgétée (écart &gt; 5 points)</span>
                <StatusBadge tone={p.atRisk > 0 ? 'danger' : 'success'}>{p.atRisk}</StatusBadge>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>En perte</span>
                <StatusBadge tone={p.loss > 0 ? 'danger' : 'success'}>{p.loss}</StatusBadge>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>Pas encore facturées (marge non calculable)</span>
                <StatusBadge tone="neutral">{p.notInvoiced}</StatusBadge>
              </li>
            </ul>
            <p className="border-t border-border px-6 py-3 text-[13.5px]">
              <Link href="/pilotage/rentabilite" className="font-medium text-accent hover:underline">Ouvrir la rentabilité</Link>
            </p>
          </Card>
        )}
      </div>
    </>
  );
}

/* ── Qualité ─────────────────────────────────────────────────────── */

interface Quality {
  year: number;
  total: number;
  onTime: number;
  rate: number;
  averageDaysVsDue: number | null;
  byDepartment: Array<{ code: string; total: number; onTime: number; rate: number }>;
  byQuarter: Array<{ quarter: string; total: number; onTime: number; rate: number }>;
  late: Array<{ id: string; number: string; client: string; department: string | null; daysVsDue: number | null }>;
}

interface QualityState {
  /** Absents (null) sans le droit de voir la liste correspondante. */
  openNonConformities: number | null;
  expiredDevices: number | null;
  expiringCertifications: number | null;
}

function RateRow({ label, rate, total }: { label: string; rate: number; total: number }) {
  return (
    <li className="grid grid-cols-[70px_1fr_auto] items-center gap-3 text-[14px]">
      <span className="font-medium">{label}</span>
      <span className="h-2.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
        <span className={`block h-full rounded-full ${rate >= 90 ? 'bg-secondary' : rate >= 75 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${Math.min(100, rate)}%` }} />
      </span>
      <span className="tnum text-right">
        <span className="font-medium">{percent(rate, 0)}</span>
        <span className="text-muted"> · {total} rapports</span>
      </span>
    </li>
  );
}

export async function QualityTab({ month }: { month: string }) {
  const [quality, state] = await Promise.all([
    api<Quality>('/analytics/quality').catch(() => null),
    api<QualityState>(`/analytics/dashboard?month=${month}`).catch(() => null),
  ]);
  if (!quality) return <Unavailable what="Les indicateurs qualité" />;

  return (
    <>
      <KpiRow>
        <KpiCard label={`Rapports remis dans le délai · ${quality.year}`} value={quality.total > 0 ? percent(quality.rate, 1) : '—'} hint={`${quality.onTime} sur ${quality.total} rapports`} href="/pilotage/qualite" />
        <KpiCard
          label="Écart moyen à l’échéance"
          value={quality.averageDaysVsDue === null ? '—' : `${quality.averageDaysVsDue > 0 ? '+' : ''}${(Math.round(quality.averageDaysVsDue * 10) / 10).toLocaleString('fr-FR')} j`}
          hint={quality.averageDaysVsDue !== null && quality.averageDaysVsDue <= 0 ? 'remis en avance en moyenne' : 'remis en retard en moyenne'}
          href="/pilotage/qualite"
        />
        {state && state.openNonConformities !== null && (
          <KpiCard label="Non-conformités ouvertes" value={state.openNonConformities} tone={state.openNonConformities > 0 ? 'warning' : undefined} hint="état à ce jour" href="/operations/non-conformites" />
        )}
        {state && state.expiredDevices !== null && (
          <KpiCard label="Instruments hors étalonnage" value={state.expiredDevices} tone={state.expiredDevices > 0 ? 'danger' : undefined} hint="état à ce jour" href="/operations/parc-mesure" />
        )}
      </KpiRow>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Par service" detail={`Année ${quality.year} — objectif : remise sous 21 jours ouvrés.`} />
          <ul className="space-y-3 px-6 pb-6">
            {quality.byDepartment.map((d) => (
              <RateRow key={d.code} label={d.code} rate={d.rate} total={d.total} />
            ))}
          </ul>
        </Card>
        <Card>
          <SectionTitle title="Par trimestre" detail={`Année ${quality.year}.`} />
          <ul className="space-y-3 px-6 pb-6">
            {quality.byQuarter.map((q) => (
              <RateRow key={q.quarter} label={q.quarter} rate={q.rate} total={q.total} />
            ))}
          </ul>
        </Card>
      </div>

      {quality.late.length > 0 && (
        <Card className="mt-5">
          <SectionTitle title="Rapports remis en retard" detail="Les plus récents." />
          <ul className="divide-y divide-border border-t border-border">
            {quality.late.slice(0, 6).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 text-[14px]">
                <span>
                  <Link href={`/operations/rapports/${r.id}`} className="ref font-medium text-accent hover:underline">{r.number}</Link>
                  <span className="text-muted"> · {r.client}{r.department ? ` · ${r.department}` : ''}</span>
                </span>
                {r.daysVsDue !== null && <StatusBadge tone="danger">{`+${r.daysVsDue} j`}</StatusBadge>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
