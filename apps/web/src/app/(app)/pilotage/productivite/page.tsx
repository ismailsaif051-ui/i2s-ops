import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { money, moneyDh, percent } from '@/lib/format';
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
} from '@/components/ui';

export const metadata: Metadata = { title: 'Productivité' };

interface ProductivityRow {
  employeeId: string;
  matricule: string;
  name: string;
  department: { code: string; name: string } | null;
  isInspector: boolean;
  workingDays: number;
  worked: number;
  billable: number;
  nonBillable: number;
  waiting: number;
  leave: number;
  unassigned: number;
  other: number;
  billedDays: number;
  netProductivity: number;
  idleCost: number;
  nonBillableSiteCost: number;
  unvaluedDays: number;
}

interface ProductivityData {
  period: { label: string; workingDays: number };
  rows: ProductivityRow[];
  totals: {
    worked: number;
    billable: number;
    billedDays: number;
    waiting: number;
    leave: number;
    unassigned: number;
    idleCost: number;
    unvaluedDays: number;
    netProductivity: number;
  };
}

function tone(rate: number): 'success' | 'warning' | 'danger' {
  if (rate >= 75) return 'success';
  if (rate >= 55) return 'warning';
  return 'danger';
}

export default async function ProductivityPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const query = params.month ? `?month=${encodeURIComponent(params.month)}` : '';
  const data = await api<ProductivityData>(`/analytics/productivity${query}`);

  const inspectors = data.rows.filter((r) => r.isInspector);

  return (
    <>
      <PageHeader
        eyebrow="Pilotage"
        title="Productivité & taux d'occupation"
        description="Productivité nette = jours facturés sur attachements / (jours ouvrés − congés). Un jour travaillé mais non attaché ne compte pas comme productif."
        action={
          <span className="rounded-[6px] border border-border-strong bg-surface px-3 py-1.5 text-[13px]">
            {data.period.label} · {data.period.workingDays} jours ouvrés
          </span>
        }
      />

      <KpiRow>
        <KpiCard
          label="Productivité nette"
          value={percent(data.totals.netProductivity)}
          tone={tone(data.totals.netProductivity)}
          hint="moyenne du périmètre"
        />
        <KpiCard label="Jours facturés" value={data.totals.billedDays} hint="portés par un attachement" />
        <KpiCard
          label="Travaillés non valorisés"
          value={data.totals.unvaluedDays}
          tone={data.totals.unvaluedDays > 0 ? 'warning' : undefined}
          hint="jours travaillés sans attachement"
        />
        <KpiCard
          label="Jours non affectés"
          value={data.totals.unassigned}
          tone={data.totals.unassigned > 0 ? 'danger' : undefined}
          href="/pilotage/jours-non-affectes"
          hint="cliquer pour le détail"
        />
        <KpiCard
          label="Coût d'inactivité"
          value={money(data.totals.idleCost)}
          unit="DH"
          tone={data.totals.idleCost > 0 ? 'danger' : undefined}
        />
      </KpiRow>

      <Card title={`Détail par collaborateur — ${data.rows.length}`}>
        {data.rows.length === 0 ? (
          <EmptyState
            title="Aucun pointage sur la période"
            description="Les journées sont générées à partir du calendrier ouvré dès qu’un employé est enregistré."
          />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>Matricule</Th>
                <Th>Collaborateur</Th>
                <Th>Dép.</Th>
                <Th align="right">Ouvrés</Th>
                <Th align="right">Travaillés</Th>
                <Th align="right">Facturables</Th>
                <Th align="right">Facturés</Th>
                <Th align="right">Attente</Th>
                <Th align="right">Congés</Th>
                <Th align="right">Non affectés</Th>
                <Th align="right">Productivité</Th>
                <Th align="right">Coût inactivité</Th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.employeeId}>
                  <Td mono>{row.matricule}</Td>
                  <Td>
                    <span className="font-medium">{row.name}</span>
                    {!row.isInspector && <span className="ml-2 text-subtle">support</span>}
                  </Td>
                  <Td>{row.department?.code ?? '—'}</Td>
                  <Td align="right" mono>{row.workingDays}</Td>
                  <Td align="right" mono>{row.worked}</Td>
                  <Td align="right" mono>{row.billable}</Td>
                  <Td align="right" mono>
                    {row.billedDays}
                    {row.unvaluedDays > 0 && (
                      <span className="ml-1.5 text-warning" title="Jours travaillés non valorisés">
                        −{row.unvaluedDays}
                      </span>
                    )}
                  </Td>
                  <Td align="right" mono>{row.waiting}</Td>
                  <Td align="right" mono>{row.leave}</Td>
                  <Td align="right" mono>
                    <span className={row.unassigned > 0 ? 'font-semibold text-danger' : ''}>
                      {row.unassigned}
                    </span>
                  </Td>
                  <Td align="right">
                    <StatusBadge tone={tone(row.netProductivity)}>
                      {percent(row.netProductivity)}
                    </StatusBadge>
                  </Td>
                  <Td align="right" mono>{moneyDh(row.idleCost)}</Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>

      {inspectors.length > 0 && (
        <div className="mt-5">
          <Card title="Classement des inspecteurs">
            <div className="flex flex-col gap-2.5 px-4 py-4">
              {[...inspectors]
                .sort((a, b) => b.netProductivity - a.netProductivity)
                .map((row) => (
                  <div key={row.employeeId} className="grid grid-cols-[190px_1fr_60px] items-center gap-3">
                    <span className="truncate text-[13px]">{row.name}</span>
                    <span className="h-2.5 rounded-[2px] bg-surface-2">
                      <span
                        className={`block h-2.5 rounded-[2px] ${
                          row.netProductivity >= 75
                            ? 'bg-success'
                            : row.netProductivity >= 55
                              ? 'bg-warning'
                              : 'bg-danger'
                        }`}
                        style={{ width: `${Math.min(100, row.netProductivity)}%` }}
                      />
                    </span>
                    <span className="tnum text-right ref text-[12px]">
                      {percent(row.netProductivity, 0)}
                    </span>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
