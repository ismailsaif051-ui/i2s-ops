import Link from 'next/link';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { compactDh, date, moneyDh } from '@/lib/format';
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

export const metadata: Metadata = { title: 'Flotte' };

interface VehicleRow {
  id: string;
  plate: string;
  brand: string | null;
  model: string | null;
  type: string;
  ownership: string;
  department: string | null;
  assignedTo: string | null;
  currentKm: number | null;
  status: string;
  monthlyFee: number | null;
  contractEndDate: string | null;
  insurancePolicy: string | null;
  insuredUntil: string | null;
  uninsured: boolean;
  insuranceDueSoon: boolean;
  lastMaintenance: string | null;
  nextMaintenanceDate: string | null;
  nextMaintenanceKm: number | null;
  maintenanceDue: boolean;
  contractEndingSoon: boolean;
}

const STATUS: Record<string, { label: string; tone: Tone }> = {
  AVAILABLE: { label: 'Disponible', tone: 'success' },
  IN_USE: { label: 'En mission', tone: 'info' },
  MAINTENANCE: { label: 'À l’atelier', tone: 'warning' },
  OUT_OF_SERVICE: { label: 'Hors service', tone: 'danger' },
};

const TYPE_LABELS: Record<string, string> = {
  SERVICE: 'Service',
  FUNCTION: 'Fonction',
};

const OWNERSHIP: Record<string, string> = {
  OWNED: 'Propriété',
  LLD: 'LLD',
  LCD: 'LCD',
};

export default async function FleetPage() {
  const data = await api<{
    items: VehicleRow[];
    totals: {
      all: number;
      uninsured: number;
      insuranceDueSoon: number;
      maintenanceDue: number;
      monthlyCost: number;
    };
  }>('/vehicles');

  const uninsured = data.items.filter((v) => v.uninsured);

  return (
    <>
      <PageHeader
        eyebrow="Ressources"
        title="Flotte"
        description="Les véhicules qui portent vos inspecteurs sur site. Sans couverture d’assurance en cours, un véhicule reste hors service — c’est le seul point que le système refuse de contourner."
      />

      <KpiRow>
        <KpiCard label="Véhicules" value={data.totals.all} />
        <KpiCard
          label="Sans assurance"
          value={data.totals.uninsured}
          tone={data.totals.uninsured > 0 ? 'danger' : 'success'}
          hint="ne doivent pas rouler"
        />
        <KpiCard
          label="Entretien dû"
          value={data.totals.maintenanceDue}
          tone={data.totals.maintenanceDue > 0 ? 'warning' : undefined}
          hint="par la date ou le compteur"
        />
        <KpiCard
          label="Coût mensuel"
          value={compactDh(data.totals.monthlyCost)}
          hint="loyers LLD et LCD"
        />
      </KpiRow>

      {uninsured.length > 0 && (
        <NextActionBanner
          tone="danger"
          title={`${uninsured.length} véhicule(s) sans couverture en cours`}
          detail={`${uninsured
            .slice(0, 4)
            .map((v) => v.plate)
            .join(' · ')}. Enregistrez la police d’assurance : c’est le geste qui les remet en service.`}
        />
      )}

      <Card title={`${data.items.length} véhicule(s)`}>
        {data.items.length === 0 ? (
          <EmptyState
            title="Aucun véhicule"
            description="La flotte se constitue véhicule par véhicule, avec sa police d’assurance et son carnet d’entretien."
          />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>Immatriculation</Th>
                <Th>Véhicule</Th>
                <Th>Type</Th>
                <Th>Détention</Th>
                <Th>Affecté à</Th>
                <Th align="right">Compteur</Th>
                <Th>Assurance</Th>
                <Th>Entretien</Th>
                <Th align="right">Loyer</Th>
                <Th>Statut</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((v) => {
                const status = STATUS[v.status] ?? { label: v.status, tone: 'neutral' as Tone };

                return (
                  <tr key={v.id} className={v.uninsured ? 'bg-danger-soft' : undefined}>
                    <Td mono>
                      <Link
                        href={`/ressources/flotte/${v.id}`}
                        className="font-medium hover:text-accent"
                      >
                        {v.plate}
                      </Link>
                    </Td>
                    <Td>
                      {[v.brand, v.model].filter(Boolean).join(' ') || (
                        <span className="text-subtle">—</span>
                      )}
                    </Td>
                    <Td>{TYPE_LABELS[v.type] ?? v.type}</Td>
                    <Td>
                      {OWNERSHIP[v.ownership] ?? v.ownership}
                      {v.contractEndingSoon && v.contractEndDate && (
                        <span className="mt-0.5 block text-[13px] text-warning">
                          fin {date(v.contractEndDate)}
                        </span>
                      )}
                    </Td>
                    <Td>
                      {v.assignedTo ?? <span className="text-subtle">au parc</span>}
                      {v.department && (
                        <span className="mt-0.5 block text-[13px] text-subtle">{v.department}</span>
                      )}
                    </Td>
                    <Td mono align="right">
                      {v.currentKm === null ? (
                        <span className="text-subtle">—</span>
                      ) : (
                        `${v.currentKm.toLocaleString('fr-FR')} km`
                      )}
                    </Td>
                    <Td>
                      {v.insuredUntil === null ? (
                        <StatusBadge tone="danger">Aucune police</StatusBadge>
                      ) : (
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="tnum">{date(v.insuredUntil)}</span>
                          {v.uninsured ? (
                            <StatusBadge tone="danger">expirée</StatusBadge>
                          ) : v.insuranceDueSoon ? (
                            <StatusBadge tone="warning">à renouveler</StatusBadge>
                          ) : null}
                        </span>
                      )}
                    </Td>
                    <Td>
                      {v.maintenanceDue ? (
                        <StatusBadge tone="warning">à faire</StatusBadge>
                      ) : v.nextMaintenanceDate ? (
                        <span className="tnum text-[13.5px]">{date(v.nextMaintenanceDate)}</span>
                      ) : v.nextMaintenanceKm ? (
                        <span className="tnum text-[13.5px]">
                          {v.nextMaintenanceKm.toLocaleString('fr-FR')} km
                        </span>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </Td>
                    <Td mono align="right">
                      {v.monthlyFee ? moneyDh(v.monthlyFee) : <span className="text-subtle">—</span>}
                    </Td>
                    <Td>
                      <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        )}
      </Card>
    </>
  );
}
