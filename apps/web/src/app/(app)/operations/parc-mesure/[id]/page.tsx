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
import { CalibrationForm, DeviceActions } from '@/components/calibration-form';

export const metadata: Metadata = { title: 'Instrument de mesure' };

interface DeviceDetail {
  id: string;
  code: string;
  type: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  department: { code: string; name: string } | null;
  holder: { matricule: string; name: string } | null;
  calibrationValidUntil: string | null;
  calibrationIntervalM: number;
  status: string;
  expired: boolean;
  daysLeft: number | null;
  calibrations: Array<{
    id: string;
    date: string;
    validUntil: string;
    provider: string | null;
    certificateNumber: string | null;
    result: string;
    cost: string | null;
    hasDocument: boolean;
    documentId: string | null;
  }>;
  uses: Array<{
    inspectionId: string;
    date: string;
    mission: string;
    report: string | null;
    reportStatus: string | null;
    calibrationValidAt: string | null;
  }>;
}

const RESULT_LABELS: Record<string, { label: string; tone: Tone }> = {
  CONFORM: { label: 'Conforme', tone: 'success' },
  CONFORM_WITH_RESERVE: { label: 'Conforme avec réserve', tone: 'warning' },
  NON_CONFORM: { label: 'Non conforme', tone: 'danger' },
};

export default async function DevicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let device: DeviceDetail;
  try {
    device = await api<DeviceDetail>(`/measuring-devices/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const session = await requireSession();
  const permissions = session.permissions as Parameters<typeof can>[0];
  const canEdit = can(permissions, 'measuring_device', 'UPDATE');
  const canApprove = can(permissions, 'measuring_device', 'APPROVE');

  const designation = [device.brand, device.model].filter(Boolean).join(' ');

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/operations/parc-mesure" className="hover:text-text">
            ‹ Parc de mesure
          </Link>
        }
        title={`${device.code} — ${device.type}`}
        description={
          [designation, device.serialNumber ? `n° ${device.serialNumber}` : null]
            .filter(Boolean)
            .join(' · ') || undefined
        }
        action={
          device.expired ? (
            <StatusBadge tone="danger">
              {device.daysLeft === null
                ? 'Jamais étalonné'
                : `Périmé depuis ${Math.abs(device.daysLeft)} jour(s)`}
            </StatusBadge>
          ) : (
            <StatusBadge tone={device.daysLeft !== null && device.daysLeft <= 60 ? 'warning' : 'success'}>
              Valide jusqu’au {date(device.calibrationValidUntil)}
            </StatusBadge>
          )
        }
      />

      {device.expired && (
        <div className="mb-5 rounded-[12px] border border-danger/30 bg-danger-soft px-5 py-4">
          <p className="text-[15px] font-medium text-danger">
            Cet instrument ne peut plus fonder un rapport d’inspection.
          </p>
          <p className="mt-1 text-[14px] text-muted">
            Toute saisie qui s’appuie sur lui sera refusée à la soumission. Enregistrez le
            certificat du laboratoire pour le remettre en service.
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          <CalibrationForm
            deviceId={device.id}
            deviceCode={device.code}
            intervalMonths={device.calibrationIntervalM}
            canEdit={canEdit}
          />

          <Card title={`Historique d’étalonnage — ${device.calibrations.length}`}>
            {device.calibrations.length === 0 ? (
              <EmptyState
                title="Aucun certificat enregistré"
                description="Tant qu’aucun étalonnage n’est enregistré, l’instrument ne peut pas servir à une mesure opposable."
              />
            ) : (
              <DataTable>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>N° certificat</Th>
                    <Th>Laboratoire</Th>
                    <Th>Échéance</Th>
                    <Th>Résultat</Th>
                    <Th align="right">Coût</Th>
                    <Th>Pièce</Th>
                  </tr>
                </thead>
                <tbody>
                  {device.calibrations.map((c) => {
                    const result = RESULT_LABELS[c.result] ?? {
                      label: c.result,
                      tone: 'neutral' as Tone,
                    };
                    return (
                      <tr key={c.id}>
                        <Td mono>{date(c.date)}</Td>
                        <Td mono>{c.certificateNumber ?? <span className="text-subtle">—</span>}</Td>
                        <Td>{c.provider ?? <span className="text-subtle">—</span>}</Td>
                        <Td mono>{date(c.validUntil)}</Td>
                        <Td>
                          <StatusBadge tone={result.tone}>{result.label}</StatusBadge>
                        </Td>
                        <Td mono align="right">
                          {c.cost ? moneyDh(Number(c.cost)) : <span className="text-subtle">—</span>}
                        </Td>
                        <Td>
                          {c.hasDocument ? (
                            <span className="text-[13.5px] text-success">jointe</span>
                          ) : (
                            <span className="text-[13.5px] text-subtle">absente</span>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </DataTable>
            )}
          </Card>

          <Card title={`Inspections appuyées sur cet instrument — ${device.uses.length}`}>
            {device.uses.length === 0 ? (
              <EmptyState
                title="Aucune inspection"
                description="Cet instrument n’a encore servi à aucune saisie."
              />
            ) : (
              <DataTable>
                <thead>
                  <tr>
                    <Th>Date d’essai</Th>
                    <Th>Mission</Th>
                    <Th>Rapport</Th>
                    <Th>Étalonnage à la date</Th>
                  </tr>
                </thead>
                <tbody>
                  {device.uses.map((u) => (
                    <tr key={u.inspectionId}>
                      <Td mono>{date(u.date)}</Td>
                      <Td mono>{u.mission}</Td>
                      <Td mono>
                        {u.report ? (
                          <Link
                            href={`/operations/rapports`}
                            className="text-accent hover:underline"
                          >
                            {u.report}
                          </Link>
                        ) : (
                          <span className="text-subtle">—</span>
                        )}
                      </Td>
                      <Td mono>{date(u.calibrationValidAt)}</Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <DeviceActions
            deviceId={device.id}
            status={device.status}
            expired={device.expired}
            canEdit={canEdit}
            canApprove={canApprove}
          />

          <Card title="Fiche">
            <dl className="flex flex-col divide-y divide-border">
              {[
                ['Repère', device.code],
                ['Type', device.type],
                ['Marque et modèle', designation || '—'],
                ['N° de série', device.serialNumber ?? '—'],
                ['Pôle', device.department ? device.department.name : '—'],
                ['Détenteur', device.holder?.name ?? '—'],
                ['Périodicité', `${device.calibrationIntervalM} mois`],
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
