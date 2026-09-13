import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { compactDh, date, money, moneyDh } from '@/lib/format';
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

export const metadata: Metadata = { title: 'Jours non affectés' };

interface UnassignedData {
  period: { from: string; to: string; label: string };
  totals: { days: number; cost: number; employees: number };
  byDepartment: Array<{ code: string; name: string; days: number; cost: number; employees: number }>;
  byEmployee: Array<{
    employeeId: string;
    matricule: string;
    name: string;
    position: string | null;
    department: string | null;
    days: number;
    cost: number;
    lastDate: string;
  }>;
  trend: Array<{ month: string; days: number; cost: number }>;
}

/**
 * Vue stratégique du cahier des charges (module 13).
 * Ce que l'entreprise paie sans l'affecter — et qui le supporte.
 */
export default async function UnassignedDaysPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const query = params.month ? `?month=${encodeURIComponent(params.month)}` : '';
  const data = await api<UnassignedData>(`/analytics/unassigned-days${query}`);

  const maxDays = Math.max(1, ...data.byDepartment.map((d) => d.days));
  const maxTrend = Math.max(1, ...data.trend.map((t) => t.days));
  const previous = data.trend.at(-2)?.days ?? 0;
  const current = data.trend.at(-1)?.days ?? 0;
  const evolution = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;

  return (
    <>
      <PageHeader
        eyebrow="Pilotage"
        title="Jours non affectés"
        description="Jours payés pendant lesquels un inspecteur n’a reçu aucune affectation. C’est la sous-charge, et la capacité immédiatement disponible."
        action={
          <span className="rounded-[6px] border border-border-strong bg-surface px-3 py-1.5 text-[13px]">
            {data.period.label}
          </span>
        }
      />

      <KpiRow>
        <KpiCard
          label="Jours non affectés"
          value={data.totals.days}
          tone={data.totals.days > 0 ? 'danger' : undefined}
          hint="sur la période"
        />
        <KpiCard
          label="Coût d'inactivité"
          value={money(data.totals.cost)}
          unit="DH"
          tone={data.totals.cost > 0 ? 'danger' : undefined}
          hint="coût journalier à la date de chaque jour"
        />
        <KpiCard label="Inspecteurs concernés" value={data.totals.employees} hint="au moins un jour" />
        <KpiCard
          label="Évolution"
          value={evolution === null ? '—' : `${evolution > 0 ? '+' : ''}${evolution} %`}
          tone={evolution !== null && evolution > 0 ? 'warning' : undefined}
          hint="vs mois précédent"
        />
      </KpiRow>

      {data.totals.days === 0 ? (
        <Card>
          <EmptyState
            title="Aucun jour non affecté sur la période"
            description="Tous les inspecteurs de votre périmètre ont été affectés, en congé ou en formation."
          />
        </Card>
      ) : (
        <>
          <NextActionBanner
            tone="warning"
            title={`${data.totals.days} jours sans affectation représentent ${moneyDh(data.totals.cost)} de coût sec`}
            detail="Ces journées sont immédiatement disponibles : elles peuvent être affectées à une mission, à de la formation ou à une action commerciale."
          />

          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <Card title="Par département">
              <DataTable>
                <thead>
                  <tr>
                    <Th>Département</Th>
                    <Th align="right">Jours</Th>
                    <Th align="right">Coût</Th>
                    <Th align="right">Inspecteurs</Th>
                    <Th>Répartition</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.byDepartment.map((dept) => (
                    <tr key={dept.code}>
                      <Td>
                        <span className="font-medium">{dept.code}</span>
                        <span className="ml-2 text-subtle">{dept.name}</span>
                      </Td>
                      <Td align="right" mono>
                        {dept.days}
                      </Td>
                      <Td align="right" mono>
                        {moneyDh(dept.cost)}
                      </Td>
                      <Td align="right" mono>
                        {dept.employees}
                      </Td>
                      <Td className="w-[34%]">
                        <span className="flex items-center gap-2">
                          <span
                            className="block h-2 rounded-[2px] bg-danger"
                            style={{ width: `${Math.round((dept.days / maxDays) * 100)}%` }}
                          />
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </Card>

            <Card title="Évolution 12 mois">
              <div className="px-4 py-4">
                <div className="flex h-[150px] items-end gap-1.5">
                  {data.trend.map((t) => (
                    <div key={t.month} className="flex flex-1 flex-col items-center gap-1.5">
                      <span
                        className="w-full rounded-t-[2px] bg-primary"
                        style={{ height: `${Math.max(2, Math.round((t.days / maxTrend) * 118))}px` }}
                        title={`${t.month} — ${t.days} jours, ${moneyDh(t.cost)}`}
                      />
                      <span className="text-[12px] text-subtle">
                        {t.month.slice(5)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[12px] text-subtle">
                  Nombre de jours non affectés par mois. Survolez une barre pour le coût.
                </p>
              </div>
            </Card>
          </div>

          <div className="mt-5">
            <Card title={`Inspecteurs concernés — ${data.byEmployee.length}`}>
              <DataTable>
                <thead>
                  <tr>
                    <Th>Matricule</Th>
                    <Th>Inspecteur</Th>
                    <Th>Fonction</Th>
                    <Th>Dép.</Th>
                    <Th align="right">Jours</Th>
                    <Th align="right">Coût</Th>
                    <Th>Dernier jour sans affectation</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.byEmployee.map((employee) => (
                    <tr key={employee.employeeId}>
                      <Td mono>{employee.matricule}</Td>
                      <Td>
                        <span className="font-medium">{employee.name}</span>
                      </Td>
                      <Td>{employee.position ?? '—'}</Td>
                      <Td>{employee.department ?? '—'}</Td>
                      <Td align="right" mono>
                        <span className={employee.days >= 10 ? 'font-semibold text-danger' : ''}>
                          {employee.days}
                        </span>
                      </Td>
                      <Td align="right" mono>
                        {moneyDh(employee.cost)}
                      </Td>
                      <Td mono>{date(employee.lastDate)}</Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </Card>
          </div>

          <p className="mt-4 max-w-[74ch] text-[12.5px] text-subtle">
            Le coût est calculé jour par jour avec le coût journalier <strong>en vigueur à cette
            date</strong>, jamais avec le coût courant : une revalorisation trimestrielle ne
            réécrit pas le passé. Total de la période : {compactDh(data.totals.cost)}.
          </p>
        </>
      )}
    </>
  );
}
