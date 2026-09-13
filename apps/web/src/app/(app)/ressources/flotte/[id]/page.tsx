import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { can } from '@i2s/contracts';
import { ApiError, api, requireSession } from '@/lib/api';
import { date, moneyDh } from '@/lib/format';
import {
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  StatusBadge,
  Td,
  Th,
  type Tone,
} from '@/components/ui';
import { VehicleForms } from '@/components/vehicle-forms';

export const metadata: Metadata = { title: 'Véhicule' };

interface VehicleDetail {
  id: string;
  plate: string;
  brand: string | null;
  model: string | null;
  type: string;
  ownership: string;
  department: { code: string; name: string } | null;
  assignedTo: { matricule: string; name: string } | null;
  currentKm: number | null;
  status: string;
  monthlyFee: number | null;
  contractEndDate: string | null;
  uninsured: boolean;
  insurances: Array<{
    id: string;
    policyNumber: string;
    insurer: string | null;
    validFrom: string;
    validTo: string;
    premium: number | null;
    current: boolean;
  }>;
  maintenances: Array<{
    id: string;
    type: string;
    date: string;
    km: number | null;
    cost: number | null;
    provider: string | null;
    nextDueDate: string | null;
    nextDueKm: number | null;
  }>;
  maintenanceCost: number;
}

const STATUS: Record<string, { label: string; tone: Tone }> = {
  AVAILABLE: { label: 'Disponible', tone: 'success' },
  IN_USE: { label: 'En mission', tone: 'info' },
  MAINTENANCE: { label: 'À l’atelier', tone: 'warning' },
  OUT_OF_SERVICE: { label: 'Hors service', tone: 'danger' },
};

const OWNERSHIP: Record<string, string> = {
  OWNED: 'En propriété',
  LLD: 'Location longue durée',
  LCD: 'Location courte durée',
};

export default async function VehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let vehicle: VehicleDetail;
  try {
    vehicle = await api<VehicleDetail>(`/vehicles/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const session = await requireSession();
  const canEdit = can(session.permissions as Parameters<typeof can>[0], 'vehicle', 'UPDATE');
  const status = STATUS[vehicle.status] ?? { label: vehicle.status, tone: 'neutral' as Tone };

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/ressources/flotte" className="hover:text-text">
            ‹ Flotte
          </Link>
        }
        title={vehicle.plate}
        description={
          [
            [vehicle.brand, vehicle.model].filter(Boolean).join(' '),
            OWNERSHIP[vehicle.ownership] ?? vehicle.ownership,
            vehicle.assignedTo?.name,
          ]
            .filter(Boolean)
            .join(' · ') || undefined
        }
        action={<StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
      />

      {vehicle.uninsured && (
        <div className="mb-5 rounded-[12px] border border-danger/30 bg-danger-soft px-5 py-4">
          <p className="text-[15px] font-medium text-danger">Aucune couverture d’assurance en cours</p>
          <p className="mt-1 text-[14px] text-muted">
            Ce véhicule ne doit pas prendre la route. Enregistrez la police en cours pour le
            remettre en service.
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-5">
          <Card title={`Assurance — ${vehicle.insurances.length} police(s)`}>
            {vehicle.insurances.length === 0 ? (
              <EmptyState
                title="Aucune police enregistrée"
                description="Sans police d’assurance, le véhicule reste hors service."
              />
            ) : (
              <DataTable>
                <thead>
                  <tr>
                    <Th>N° de police</Th>
                    <Th>Assureur</Th>
                    <Th>Du</Th>
                    <Th>Au</Th>
                    <Th align="right">Prime</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {vehicle.insurances.map((i) => (
                    <tr key={i.id}>
                      <Td mono>{i.policyNumber}</Td>
                      <Td>{i.insurer ?? <span className="text-subtle">—</span>}</Td>
                      <Td mono>{date(i.validFrom)}</Td>
                      <Td mono>{date(i.validTo)}</Td>
                      <Td mono align="right">
                        {i.premium ? moneyDh(i.premium) : <span className="text-subtle">—</span>}
                      </Td>
                      <Td>
                        {i.current ? (
                          <StatusBadge tone="success">en cours</StatusBadge>
                        ) : (
                          <span className="text-[13.5px] text-subtle">échue</span>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            )}
          </Card>

          <Card
            title={`Carnet d’entretien — ${vehicle.maintenances.length}`}
            action={
              vehicle.maintenanceCost > 0 ? (
                <span className="text-[13.5px] text-muted">
                  {moneyDh(vehicle.maintenanceCost)} cumulés
                </span>
              ) : undefined
            }
          >
            {vehicle.maintenances.length === 0 ? (
              <EmptyState
                title="Aucun entretien"
                description="Le carnet se remplit à chaque passage au garage."
              />
            ) : (
              <DataTable>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Nature</Th>
                    <Th>Garage</Th>
                    <Th align="right">Compteur</Th>
                    <Th align="right">Coût</Th>
                    <Th>Prochain</Th>
                  </tr>
                </thead>
                <tbody>
                  {vehicle.maintenances.map((m) => (
                    <tr key={m.id}>
                      <Td mono>{date(m.date)}</Td>
                      <Td>{m.type}</Td>
                      <Td>{m.provider ?? <span className="text-subtle">—</span>}</Td>
                      <Td mono align="right">
                        {m.km === null ? (
                          <span className="text-subtle">—</span>
                        ) : (
                          `${m.km.toLocaleString('fr-FR')} km`
                        )}
                      </Td>
                      <Td mono align="right">
                        {m.cost ? moneyDh(m.cost) : <span className="text-subtle">—</span>}
                      </Td>
                      <Td mono>
                        {m.nextDueDate
                          ? date(m.nextDueDate)
                          : m.nextDueKm
                            ? `${m.nextDueKm.toLocaleString('fr-FR')} km`
                            : '—'}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <VehicleForms
            vehicleId={vehicle.id}
            currentKm={vehicle.currentKm}
            uninsured={vehicle.uninsured}
            canEdit={canEdit}
          />

          <Card title="Fiche">
            <dl className="flex flex-col divide-y divide-border">
              {[
                ['Immatriculation', vehicle.plate],
                ['Marque et modèle', [vehicle.brand, vehicle.model].filter(Boolean).join(' ') || '—'],
                ['Type', vehicle.type === 'FUNCTION' ? 'Véhicule de fonction' : 'Véhicule de service'],
                ['Détention', OWNERSHIP[vehicle.ownership] ?? vehicle.ownership],
                ['Loyer mensuel', vehicle.monthlyFee ? moneyDh(vehicle.monthlyFee) : '—'],
                ['Fin de contrat', vehicle.contractEndDate ? date(vehicle.contractEndDate) : '—'],
                ['Pôle', vehicle.department?.name ?? '—'],
                ['Affecté à', vehicle.assignedTo?.name ?? 'au parc'],
                [
                  'Compteur',
                  vehicle.currentKm === null
                    ? '—'
                    : `${vehicle.currentKm.toLocaleString('fr-FR')} km`,
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 px-5 py-3">
                  <dt className="text-[13.5px] text-muted">{label}</dt>
                  <dd className="text-right text-[14.5px]">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
