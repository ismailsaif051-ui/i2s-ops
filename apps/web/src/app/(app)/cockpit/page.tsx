import Link from 'next/link';
import type { Metadata } from 'next';
import { ROLE_LABELS, can, type RoleCode } from '@i2s/contracts';
import { api, requireSession } from '@/lib/api';
import { compactDh, money, percent } from '@/lib/format';
import {
  Card,
  KpiCard,
  KpiRow,
  NextActionBanner,
  PageHeader,
  StatusBadge,
} from '@/components/ui';

export const metadata: Metadata = { title: 'Cockpit' };

interface Dashboard {
  period: { label: string };
  affairsInProgress: number;
  missionsInProgress: number;
  missionsUpcoming: number;
  unassignedDays: number;
  idleCost: number;
  pendingReports: number;
  pendingExpenses: number;
  overdueInvoices: number;
  overdueAmount: number;
  expiringCertifications: number;
  expiredDevices: number;
  openNonConformities: number;
  invoicedYtd: number;
  collectedYtd: number;
  reportOnTimeRate: number;
  reportsIssued: number;
}

export default async function CockpitPage() {
  const session = await requireSession();
  const permissions = session.permissions as Parameters<typeof can>[0];

  const data = await api<Dashboard>('/analytics/dashboard').catch(() => null);

  const alerts: Array<{ tone: 'danger' | 'warning'; title: string; detail: string; href: string }> = [];
  if (data) {
    if (data.overdueInvoices > 0) {
      alerts.push({
        tone: 'danger',
        title: `${data.overdueInvoices} facture(s) échue(s) — ${compactDh(data.overdueAmount)}`,
        detail: 'Une relance a été générée. Le recouvrement pèse directement sur la trésorerie.',
        href: '/finance/encaissements',
      });
    }
    if (data.expiredDevices > 0) {
      alerts.push({
        tone: 'danger',
        title: `${data.expiredDevices} instrument(s) de mesure hors étalonnage`,
        detail: 'Ces appareils ne peuvent plus servir à émettre un rapport valide.',
        href: '/operations/parc-mesure',
      });
    }
    if (data.unassignedDays > 0) {
      alerts.push({
        tone: 'warning',
        title: `${data.unassignedDays} jours non affectés — ${compactDh(data.idleCost)}`,
        detail: 'Capacité disponible immédiatement, payée mais non employée.',
        href: '/pilotage/jours-non-affectes',
      });
    }
    if (data.pendingReports > 0) {
      alerts.push({
        tone: 'warning',
        title: `${data.pendingReports} rapport(s) en attente de vérification`,
        detail: 'Le délai de remise court : objectif qualité de 21 jours ouvrés.',
        href: '/operations/rapports',
      });
    }
    if (data.pendingExpenses > 0) {
      alerts.push({
        tone: 'warning',
        title: `${data.pendingExpenses} note(s) de frais en attente de visa`,
        detail: 'Le règlement intervient le 15 du mois pour les notes validées à temps.',
        href: '/finance/notes-de-frais',
      });
    }
    if (data.expiringCertifications > 0) {
      alerts.push({
        tone: 'warning',
        title: `${data.expiringCertifications} certification(s) expirent sous 60 jours`,
        detail: 'Un inspecteur non certifié à la date ne peut pas être affecté à la méthode concernée.',
        href: '/ressources/employes',
      });
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={data?.period.label ?? 'Cockpit'}
        title={`Bonjour ${session.employee?.firstName ?? session.email}`}
        description={
          session.roles.length > 0
            ? `${session.roles.map((r) => ROLE_LABELS[r.code as RoleCode] ?? r.code).join(' · ')}${
                session.employee?.departmentCode ? ` — ${session.employee.departmentCode}` : ''
              }`
            : undefined
        }
      />

      {data ? (
        <>
          <KpiRow>
            <KpiCard label="Affaires en cours" value={data.affairsInProgress} href="/affaires" />
            <KpiCard label="Missions en cours" value={data.missionsInProgress} href="/operations/missions" />
            <KpiCard
              label="Jours non affectés"
              value={data.unassignedDays}
              tone={data.unassignedDays > 0 ? 'danger' : undefined}
              href="/pilotage/jours-non-affectes"
            />
            <KpiCard
              label="Coût d'inactivité"
              value={money(data.idleCost)}
              unit="DH"
              tone={data.idleCost > 0 ? 'danger' : undefined}
              href="/pilotage/jours-non-affectes"
            />
            <KpiCard label="Facturé (année)" value={compactDh(data.invoicedYtd)} href="/finance/factures" />
            <KpiCard label="Encaissé (année)" value={compactDh(data.collectedYtd)} href="/finance/encaissements" />
          </KpiRow>

          <KpiRow>
            <KpiCard
              label="Rapports à vérifier"
              value={data.pendingReports}
              tone={data.pendingReports > 0 ? 'warning' : undefined}
              href="/operations/rapports"
            />
            <KpiCard
              label="Remise dans le délai"
              value={percent(data.reportOnTimeRate, 0)}
              tone={data.reportOnTimeRate >= 90 ? 'success' : data.reportOnTimeRate >= 75 ? 'warning' : 'danger'}
              hint={`${data.reportsIssued} rapports émis`}
              href="/operations/rapports"
            />
            <KpiCard
              label="Frais à valider"
              value={data.pendingExpenses}
              tone={data.pendingExpenses > 0 ? 'warning' : undefined}
              href="/finance/notes-de-frais"
            />
            <KpiCard
              label="Factures échues"
              value={data.overdueInvoices}
              tone={data.overdueInvoices > 0 ? 'danger' : undefined}
              hint={compactDh(data.overdueAmount)}
              href="/finance/encaissements"
            />
            <KpiCard
              label="Non-conformités ouvertes"
              value={data.openNonConformities}
              tone={data.openNonConformities > 0 ? 'warning' : undefined}
              href="/operations/non-conformites"
            />
            <KpiCard
              label="Instruments périmés"
              value={data.expiredDevices}
              tone={data.expiredDevices > 0 ? 'danger' : undefined}
              href="/operations/parc-mesure"
            />
          </KpiRow>

          {alerts.length > 0 && (
            <Card title={`Alertes — ${alerts.length}`}>
              <ul className="divide-y divide-border">
                {alerts.map((alert) => (
                  <li key={alert.title} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <StatusBadge tone={alert.tone}>
                      {alert.tone === 'danger' ? 'Critique' : 'À traiter'}
                    </StatusBadge>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium">{alert.title}</p>
                      <p className="mt-0.5 text-[12.5px] text-muted">{alert.detail}</p>
                    </div>
                    <Link
                      href={alert.href}
                      className="rounded-[6px] border border-border-strong bg-surface px-3 py-1.5 text-[12.5px] hover:bg-surface-2"
                    >
                      Ouvrir
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      ) : (
        <NextActionBanner
          tone="info"
          title="Indicateurs indisponibles"
          detail="Votre profil n’a pas accès aux tableaux de bord, ou aucune donnée n’a encore été enregistrée."
        />
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card title="Votre habilitation">
          <div className="px-4 py-3.5">
            <dl className="grid grid-cols-[130px_1fr] gap-y-2 text-[13.5px]">
              <dt className="text-muted">Identifiant</dt>
              <dd className="ref text-[12.5px]">{session.email}</dd>
              <dt className="text-muted">Matricule</dt>
              <dd className="ref text-[12.5px]">
                {session.employee?.matricule ?? '—'}
              </dd>
              <dt className="text-muted">Fonction</dt>
              <dd>{session.employee?.position ?? '—'}</dd>
              <dt className="text-muted">Société</dt>
              <dd>{session.companies.map((c) => c.name).join(', ') || '—'}</dd>
              <dt className="text-muted">Droits effectifs</dt>
              <dd>{session.permissions.length} autorisations</dd>
            </dl>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {session.roles.map((role) => (
                <StatusBadge key={`${role.code}-${role.departmentId ?? 'all'}`} tone="primary">
                  {ROLE_LABELS[role.code as RoleCode] ?? role.code}
                </StatusBadge>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Accès rapides">
          <ul className="divide-y divide-border text-[13.5px]">
            {[
              { href: '/affaires', label: 'Affaires', hint: 'portefeuille et rentabilité', resource: 'affair' as const },
              { href: '/operations/missions', label: 'Missions', hint: 'planification et ordres de mission', resource: 'mission' as const },
              { href: '/pilotage/productivite', label: 'Productivité', hint: 'taux d’occupation par inspecteur', resource: 'timesheet' as const },
              { href: '/finance/notes-de-frais', label: 'Notes de frais', hint: 'circuit de visa', resource: 'expense_report' as const },
              { href: '/operations/parc-mesure', label: 'Parc de mesure', hint: 'étalonnages et blocages', resource: 'measuring_device' as const },
            ]
              .filter((item) => can(permissions, item.resource, 'VIEW'))
              .map((item) => (
                <li key={item.href} className="px-4 py-2.5">
                  <Link href={item.href} className="text-primary hover:underline">
                    {item.label}
                  </Link>
                  <span className="text-subtle"> — {item.hint}</span>
                </li>
              ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
