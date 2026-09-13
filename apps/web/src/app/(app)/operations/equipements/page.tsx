import Link from 'next/link';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { date } from '@/lib/format';
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

export const metadata: Metadata = { title: 'Équipements clients' };

interface AssetRow {
  id: string;
  tag: string;
  type: string | null;
  designation: string | null;
  serialNumber: string | null;
  client: string;
  clientId: string;
  site: string | null;
  city: string | null;
  inspectionIntervalM: number | null;
  regulatoryRef: string | null;
  nextInspectionDue: string | null;
  inspections: number;
  openIssues: number;
  late: boolean;
  dueSoon: boolean;
  daysLeft: number | null;
}

export default async function AssetsPage() {
  const data = await api<{
    items: AssetRow[];
    totals: {
      all: number;
      late: number;
      dueSoon: number;
      withoutSchedule: number;
      clients: number;
    };
  }>('/assets');

  const late = data.items.filter((a) => a.late);

  return (
    <>
      <PageHeader
        eyebrow="Opérations"
        title="Équipements clients"
        description="Le parc que vous contrôlez : bacs, ponts roulants, circuits, installations. Chaque équipement porte la périodicité que la réglementation lui impose — c’est cette échéance qui ramène l’inspection l’année suivante."
      />

      <KpiRow>
        <KpiCard label="Équipements" value={data.totals.all} hint={`${data.totals.clients} clients`} />
        <KpiCard
          label="Contrôles échus"
          value={data.totals.late}
          tone={data.totals.late > 0 ? 'danger' : 'success'}
          hint="équipement non couvert"
        />
        <KpiCard
          label="À contrôler sous 60 j"
          value={data.totals.dueSoon}
          tone={data.totals.dueSoon > 0 ? 'warning' : undefined}
          hint="prochaine campagne"
        />
        <KpiCard
          label="Sans échéance"
          value={data.totals.withoutSchedule}
          tone={data.totals.withoutSchedule > 0 ? 'warning' : undefined}
          hint="périodicité à renseigner"
        />
      </KpiRow>

      {late.length > 0 && (
        <NextActionBanner
          tone="danger"
          title={`${late.length} contrôle(s) réglementaire(s) échu(s)`}
          detail={`${late
            .slice(0, 4)
            .map((a) => `${a.tag} — ${a.client}`)
            .join(' · ')}. Ces équipements ne sont plus couverts : c’est autant d’interventions à planifier.`}
        />
      )}

      <Card title={`${data.items.length} équipement(s)`}>
        {data.items.length === 0 ? (
          <EmptyState
            title="Aucun équipement enregistré"
            description="Le parc du client se constitue au fil des interventions : chaque bac, pont roulant ou circuit contrôlé y prend sa place, avec sa périodicité."
          />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>Repère</Th>
                <Th>Type</Th>
                <Th>Client</Th>
                <Th>Site</Th>
                <Th>Périodicité</Th>
                <Th>Texte applicable</Th>
                <Th>Prochain contrôle</Th>
                <Th align="right">Inspections</Th>
                <Th align="right">Écarts</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((asset) => (
                <tr key={asset.id} className={asset.late ? 'bg-danger-soft' : undefined}>
                  <Td mono>
                    <Link
                      href={`/operations/equipements/${asset.id}`}
                      className="font-medium hover:text-accent"
                    >
                      {asset.tag}
                    </Link>
                  </Td>
                  <Td>
                    {asset.type ?? <span className="text-subtle">—</span>}
                    {asset.designation && (
                      <span className="mt-0.5 block text-[13px] text-subtle">
                        {asset.designation}
                      </span>
                    )}
                  </Td>
                  <Td>{asset.client}</Td>
                  <Td>
                    {asset.site ?? <span className="text-subtle">—</span>}
                    {asset.city && (
                      <span className="mt-0.5 block text-[13px] text-subtle">{asset.city}</span>
                    )}
                  </Td>
                  <Td mono>
                    {asset.inspectionIntervalM ? (
                      `${asset.inspectionIntervalM} mois`
                    ) : (
                      <span className="text-subtle">—</span>
                    )}
                  </Td>
                  <Td>
                    <span className="text-[13.5px] text-muted">
                      {asset.regulatoryRef ?? '—'}
                    </span>
                  </Td>
                  <Td>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="tnum">{date(asset.nextInspectionDue)}</span>
                      {asset.late ? (
                        <StatusBadge tone="danger">
                          échu depuis {Math.abs(asset.daysLeft ?? 0)} j
                        </StatusBadge>
                      ) : asset.dueSoon ? (
                        <StatusBadge tone="warning">{asset.daysLeft} j</StatusBadge>
                      ) : null}
                    </span>
                  </Td>
                  <Td mono align="right">
                    {asset.inspections}
                  </Td>
                  <Td align="right">
                    {asset.openIssues > 0 ? (
                      <StatusBadge tone="warning">{asset.openIssues}</StatusBadge>
                    ) : (
                      <span className="text-subtle">—</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>
    </>
  );
}
