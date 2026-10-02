import Link from 'next/link';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { compactDh, money, percent } from '@/lib/format';
import { Card, KpiCard, KpiRow, NextActionBanner, PageHeader } from '@/components/ui';

export const metadata: Metadata = { title: 'Vue d’ensemble' };

interface Dashboard {
  period: { label: string };
  affairsInProgress: number;
  missionsInProgress: number;
  missionsUpcoming: number;
  /** Absent quand l'utilisateur n'a pas le droit timesheet:VIEW. */
  unassignedDays: number | null;
  idleCost: number | null;
  pendingReports: number;
  pendingExpenses: number;
  /** Absent quand l'utilisateur n'a pas le droit invoice:VIEW. */
  overdueInvoices: number | null;
  overdueAmount: number | null;
  expiringCertifications: number;
  expiredDevices: number;
  openNonConformities: number;
  invoicedYtd: number | null;
  collectedYtd: number | null;
  reportOnTimeRate: number;
  reportsIssued: number;
}

type Priority = 'high' | 'check' | 'validate' | 'follow';

/** Priorité affichée : une pastille ET un libellé — jamais la couleur seule. */
const PRIORITY: Record<Priority, { label: string; dot: string; text: string }> = {
  high: { label: 'Haute', dot: 'bg-danger', text: 'font-semibold text-danger' },
  check: { label: 'À vérifier', dot: 'bg-warning', text: 'text-text' },
  validate: { label: 'À valider', dot: 'bg-warning', text: 'text-text' },
  follow: { label: 'À suivre', dot: 'bg-warning', text: 'text-text' },
};

interface Todo {
  priority: Priority;
  subject: string;
  volume: string;
  action: string;
  href: string;
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** Barre horizontale proportionnelle à une valeur — la longueur se calcule, elle ne se dessine pas à l'œil. */
function Bar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const width = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-3 overflow-hidden rounded-full bg-surface-2" role="img" aria-label={label}>
      <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
}

export default async function OverviewPage() {
  const data = await api<Dashboard>('/analytics/dashboard').catch(() => null);

  if (!data) {
    return (
      <>
        <PageHeader title="Vue d’ensemble" description="Les indicateurs essentiels pour décider et agir." />
        <NextActionBanner
          tone="info"
          title="Indicateurs indisponibles"
          detail="Votre profil n’a pas accès aux tableaux de bord, ou le service ne répond pas. Rechargez la page dans un instant."
        />
      </>
    );
  }

  const canSeeBilling = data.invoicedYtd !== null && data.collectedYtd !== null;

  // À traiter : ce qui demande une action, dans l'ordre de priorité. Une ligne
  // n'apparaît que si elle a un volume ; chaque action ouvre la liste
  // correspondante — rien ne part chez un client depuis ce tableau.
  const todos: Todo[] = [];
  if (data.overdueInvoices !== null && data.overdueInvoices > 0) {
    todos.push({
      priority: 'high',
      subject: 'Factures échues',
      volume: `${data.overdueInvoices} · ${compactDh(data.overdueAmount)}`,
      action: 'Relancer',
      href: '/finance/encaissements',
    });
  }
  if (data.expiredDevices > 0) {
    todos.push({
      priority: 'high',
      subject: 'Instruments hors étalonnage',
      volume: String(data.expiredDevices),
      action: 'Ouvrir',
      href: '/operations/parc-mesure',
    });
  }
  if (data.pendingReports > 0) {
    todos.push({ priority: 'check', subject: 'Rapports à vérifier', volume: String(data.pendingReports), action: 'Consulter', href: '/operations/rapports' });
  }
  if (data.pendingExpenses > 0) {
    todos.push({ priority: 'validate', subject: 'Frais en attente', volume: String(data.pendingExpenses), action: 'Valider', href: '/finance/notes-de-frais' });
  }
  if (data.openNonConformities > 0) {
    todos.push({ priority: 'follow', subject: 'Non-conformités ouvertes', volume: String(data.openNonConformities), action: 'Examiner', href: '/operations/non-conformites' });
  }
  if (data.expiringCertifications > 0) {
    todos.push({ priority: 'follow', subject: 'Certifications expirant sous 60 jours', volume: String(data.expiringCertifications), action: 'Planifier', href: '/ressources/habilitations' });
  }

  const scale = canSeeBilling ? Math.max(data.invoicedYtd!, data.collectedYtd!) : 0;
  const year = data.period.label.split(' ').pop();

  return (
    <>
      <PageHeader
        title="Vue d’ensemble"
        description="Les indicateurs essentiels pour décider et agir."
        action={
          <p className="rounded-[8px] border border-border bg-surface px-3.5 py-2 text-[13.5px] text-muted">
            Période : <span className="font-medium capitalize text-text">{data.period.label}</span>
            <span className="text-subtle"> · cumuls depuis janvier {year}</span>
          </p>
        }
      />

      <KpiRow>
        <KpiCard label="Affaires en cours" value={data.affairsInProgress} href="/affaires" />
        <KpiCard label="Missions en cours" value={data.missionsInProgress} href="/operations/missions" />
        {data.invoicedYtd !== null && (
          <KpiCard label="Facturé · année" value={compactDh(data.invoicedYtd)} href="/finance/factures" />
        )}
        {data.collectedYtd !== null && (
          <KpiCard label="Encaissé · année" value={compactDh(data.collectedYtd)} href="/finance/encaissements" />
        )}
      </KpiRow>

      <div className={`mb-5 grid gap-5 ${canSeeBilling ? 'xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]' : ''}`}>
        <Card>
          <div className="px-6 pb-2 pt-5">
            <h2 className="text-[20px] font-semibold leading-tight">À traiter</h2>
            <p className="mt-1 text-[14px] text-muted">Les actions qui demandent votre attention.</p>
          </div>
          {todos.length === 0 ? (
            <p className="px-6 pb-6 pt-3 text-[14.5px] text-muted">Rien à traiter pour le moment.</p>
          ) : (
            <>
              {/* Tableau sur écran large… */}
              <table className="hidden w-full text-[14.5px] md:table">
                <thead>
                  <tr className="text-left text-[13.5px] text-muted">
                    <th className="px-6 pb-2.5 pt-2 font-normal">Priorité</th>
                    <th className="px-3 pb-2.5 pt-2 font-normal">Sujet</th>
                    <th className="px-3 pb-2.5 pt-2 font-normal">Volume</th>
                    <th className="px-6 pb-2.5 pt-2 font-normal">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {todos.map((todo) => (
                    <tr key={todo.subject} className="h-[52px] border-t border-border">
                      <td className="px-6">
                        <span className={`inline-flex items-center gap-2.5 ${PRIORITY[todo.priority].text}`}>
                          <span className={`h-2 w-2 rounded-full ${PRIORITY[todo.priority].dot}`} aria-hidden="true" />
                          {PRIORITY[todo.priority].label}
                        </span>
                      </td>
                      <td className="px-3">{todo.subject}</td>
                      <td className="tnum px-3">{todo.volume}</td>
                      <td className="px-6">
                        <Link href={todo.href} className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline">
                          {todo.action}
                          <span className="sr-only"> — {todo.subject}</span>
                          <ArrowRight />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* …blocs compacts sur mobile. */}
              <ul className="divide-y divide-border border-t border-border md:hidden">
                {todos.map((todo) => (
                  <li key={todo.subject} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="font-medium">{todo.subject}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-[13px] text-muted">
                        <span className={`h-2 w-2 rounded-full ${PRIORITY[todo.priority].dot}`} aria-hidden="true" />
                        {PRIORITY[todo.priority].label} · <span className="tnum">{todo.volume}</span>
                      </p>
                    </div>
                    <Link href={todo.href} className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-medium text-accent">
                      {todo.action}
                      <span className="sr-only"> — {todo.subject}</span>
                      <ArrowRight />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        {canSeeBilling && (
          <Card>
            <div className="px-6 pb-6 pt-5">
              <h2 className="text-[20px] font-semibold leading-tight">Encaissements annuels</h2>
              <p className="mt-1 text-[14px] text-muted">Montants cumulés depuis janvier, hors taxes facturés et règlements reçus.</p>

              <div className="mt-6 grid gap-5">
                {[
                  { label: 'Facturé', value: data.invoicedYtd!, color: 'bg-brand' },
                  { label: 'Encaissé', value: data.collectedYtd!, color: 'bg-secondary' },
                ].map((row) => (
                  <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-6 gap-y-2">
                    <p className="text-[15px] font-medium">{row.label}</p>
                    <p className="tnum row-span-2 self-center text-[17px] font-semibold">{compactDh(row.value)}</p>
                    <Bar value={row.value} max={scale} color={row.color} label={`${row.label} : ${money(row.value)} DH`} />
                  </div>
                ))}
              </div>

              <p className="mt-6 border-t border-border pt-4 text-[13.5px] text-muted">
                Encaissé ={' '}
                <span className="tnum font-medium text-text">
                  {data.invoicedYtd! > 0 ? percent((data.collectedYtd! / data.invoicedYtd!) * 100, 0) : '—'}
                </span>{' '}
                du facturé. Les factures échues sont suivies à part, dans « À traiter ».
              </p>
            </div>
          </Card>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <Link href="/pilotage/qualite" className="block px-6 pb-6 pt-5 transition-colors hover:bg-surface-2/50">
            <h2 className="text-[20px] font-semibold leading-tight">Qualité de service</h2>
            <p className="mt-1 text-[14px] text-muted">Rapports remis dans le délai, depuis janvier.</p>
            {data.reportsIssued > 0 ? (
              <>
                <p className="tnum mt-4 text-[36px] font-semibold leading-none text-secondary">
                  {percent(data.reportOnTimeRate, 0)}
                </p>
                <div className="mt-4">
                  <Bar
                    value={data.reportOnTimeRate}
                    max={100}
                    color="bg-secondary"
                    label={`${percent(data.reportOnTimeRate, 0)} des rapports remis dans le délai`}
                  />
                </div>
                <p className="mt-3 text-[13.5px] text-muted">
                  <span className="tnum">{data.reportsIssued}</span> rapports émis
                </p>
              </>
            ) : (
              <p className="mt-4 text-[14.5px] text-muted">— Aucun rapport remis cette année : le taux n’est pas encore calculable.</p>
            )}
          </Link>
        </Card>

        {data.unassignedDays !== null && data.idleCost !== null && (
          <Card>
            <div className="px-6 pb-6 pt-5">
              <h2 className="text-[20px] font-semibold leading-tight">Disponibilité des équipes</h2>
              <p className="mt-1 text-[14px] text-muted">Période : {data.period.label}.</p>
              <div className="mt-4 grid grid-cols-2">
                <Link href="/pilotage/jours-non-affectes" className="pr-5 hover:opacity-80">
                  <p className="text-[14px] text-muted">Jours non affectés</p>
                  <p className={`tnum mt-2 text-[36px] font-semibold leading-none ${data.unassignedDays > 0 ? 'text-danger' : ''}`}>
                    {data.unassignedDays}
                  </p>
                  <p className="mt-3 text-[13.5px] text-muted">
                    {data.unassignedDays === 0 ? 'Aucun jour non affecté.' : 'Capacité payée mais non employée.'}
                  </p>
                </Link>
                <Link href="/pilotage/jours-non-affectes" className="border-l border-border pl-5 hover:opacity-80">
                  <p className="text-[14px] text-muted">Coût d’inactivité</p>
                  <p className={`tnum mt-2 text-[36px] font-semibold leading-none ${data.idleCost > 0 ? 'text-danger' : ''}`}>
                    {money(data.idleCost)}
                    <span className="ml-1.5 text-[18px] font-medium">DH</span>
                  </p>
                  <p className="mt-3 text-[13.5px] text-muted">
                    {data.idleCost === 0 ? 'Aucun coût d’inactivité.' : 'Coût journalier des jours non affectés.'}
                  </p>
                </Link>
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
