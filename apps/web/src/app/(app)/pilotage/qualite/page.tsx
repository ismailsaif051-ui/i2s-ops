import Link from 'next/link';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { date, percent } from '@/lib/format';
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
  type Tone,
} from '@/components/ui';

export const metadata: Metadata = { title: 'Qualité' };

interface Quality {
  year: number;
  total: number;
  onTime: number;
  rate: number;
  unmeasured: number;
  averageDaysVsDue: number | null;
  byDepartment: Array<{ code: string; total: number; onTime: number; rate: number }>;
  byQuarter: Array<{ quarter: string; total: number; onTime: number; rate: number }>;
  late: Array<{
    id: string;
    number: string;
    deliveredAt: string | null;
    dueDate: string | null;
    department: string | null;
    client: string;
    daysVsDue: number | null;
  }>;
}

/** Mêmes seuils que le tableau de bord : un seul barème dans l'application. */
function toneOf(rate: number): Tone {
  return rate >= 90 ? 'success' : rate >= 75 ? 'warning' : 'danger';
}

export default async function QualitePage() {
  const data = await api<Quality>('/analytics/quality');

  return (
    <>
      <PageHeader
        eyebrow="Pilotage"
        title="Qualité"
        description="Le respect du délai de remise des rapports, l’indicateur que le QMS contractualise. Un rapport est tenu quand il est remis au client au plus tard à l’échéance ouverte par la fin de mission."
      />

      <KpiRow>
        <KpiCard
          label="Remise dans le délai"
          value={percent(data.rate, 0)}
          tone={toneOf(data.rate)}
          hint={`${data.onTime} rapports tenus sur ${data.total}`}
        />
        <KpiCard
          label="Rapports mesurés"
          value={data.total}
          hint={`remis en ${data.year}`}
        />
        <KpiCard
          label="Marge sur l’échéance"
          value={
            data.averageDaysVsDue === null
              ? '—'
              : `${data.averageDaysVsDue > 0 ? '+' : ''}${data.averageDaysVsDue} j`
          }
          tone={
            data.averageDaysVsDue !== null && data.averageDaysVsDue > 0 ? 'danger' : undefined
          }
          hint="moyenne ; négatif = remis en avance"
        />
        <KpiCard
          label="Remis en retard"
          value={data.total - data.onTime}
          tone={data.total - data.onTime > 0 ? 'danger' : undefined}
          hint="sur l’année en cours"
        />
      </KpiRow>

      {data.unmeasured > 0 && (
        <p className="mb-5 text-[13px] text-subtle">
          {data.unmeasured} rapport(s) remis sans échéance connue ne sont pas comptés : ils ne
          peuvent être ni tenus ni en retard.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Par département">
          {data.byDepartment.length === 0 ? (
            <EmptyState title="Aucun rapport remis cette année" />
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <Th>Service</Th>
                  <Th align="right">Remis</Th>
                  <Th align="right">Tenus</Th>
                  <Th align="right">Taux</Th>
                </tr>
              </thead>
              <tbody>
                {data.byDepartment.map((d) => (
                  <tr key={d.code}>
                    <Td>{d.code}</Td>
                    <Td align="right" mono>
                      {d.total}
                    </Td>
                    <Td align="right" mono>
                      {d.onTime}
                    </Td>
                    <Td align="right">
                      <StatusBadge tone={toneOf(d.rate)}>{percent(d.rate, 0)}</StatusBadge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>

        <Card title="Par trimestre">
          {data.byQuarter.length === 0 ? (
            <EmptyState title="Aucun rapport remis cette année" />
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <Th>Trimestre</Th>
                  <Th align="right">Remis</Th>
                  <Th align="right">Tenus</Th>
                  <Th align="right">Taux</Th>
                </tr>
              </thead>
              <tbody>
                {data.byQuarter.map((q) => (
                  <tr key={q.quarter}>
                    <Td>{q.quarter}</Td>
                    <Td align="right" mono>
                      {q.total}
                    </Td>
                    <Td align="right" mono>
                      {q.onTime}
                    </Td>
                    <Td align="right">
                      <StatusBadge tone={toneOf(q.rate)}>{percent(q.rate, 0)}</StatusBadge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>
      </div>

      <div className="mt-5">
        <Card
          title="Rapports remis en retard"
          action={
            data.late.length > 0 ? (
              <span className="text-[13.5px] text-muted">les plus en retard d’abord</span>
            ) : undefined
          }
        >
          {data.late.length === 0 ? (
            <EmptyState
              title="Aucun retard"
              description="Tous les rapports remis cette année l’ont été dans le délai."
            />
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <Th>N° rapport</Th>
                  <Th>Client</Th>
                  <Th>Service</Th>
                  <Th>Échéance</Th>
                  <Th>Remis le</Th>
                  <Th align="right">Retard</Th>
                </tr>
              </thead>
              <tbody>
                {data.late.map((r) => (
                  <tr key={r.id}>
                    <Td mono>
                      <Link href={`/operations/rapports/${r.id}`} className="hover:text-accent">
                        {r.number}
                      </Link>
                    </Td>
                    <Td>{r.client}</Td>
                    <Td>{r.department ?? '—'}</Td>
                    <Td mono>{date(r.dueDate)}</Td>
                    <Td mono>{date(r.deliveredAt)}</Td>
                    <Td align="right">
                      <StatusBadge tone="danger">
                        {r.daysVsDue === null ? '—' : `+${r.daysVsDue} j`}
                      </StatusBadge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>
      </div>
    </>
  );
}
