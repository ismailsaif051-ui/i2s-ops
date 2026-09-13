import Link from 'next/link';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { DEVICE_STATUS_LABELS, date, percent } from '@/lib/format';
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

export const metadata: Metadata = { title: 'Parc de mesure' };

interface DeviceRow {
  id: string;
  code: string;
  type: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  department: string | null;
  holder: string | null;
  calibrationValidUntil: string | null;
  status: string;
  lastCertificate: string | null;
  blocking: boolean;
  dueSoon: boolean;
}

const TONE: Record<string, Tone> = {
  AVAILABLE: 'success',
  IN_USE: 'primary',
  DUE_CALIBRATION: 'warning',
  IN_CALIBRATION: 'info',
  EXPIRED: 'danger',
  OUT_OF_SERVICE: 'neutral',
};

/**
 * Module ajouté au cahier des charges à partir du référentiel qualité :
 * un rapport établi avec un instrument hors étalonnage est invalide.
 */
export default async function DevicesPage() {
  const { items } = await api<{ items: DeviceRow[] }>('/measuring-devices');

  const expired = items.filter((d) => d.blocking);
  const dueSoon = items.filter((d) => d.dueSoon);
  const compliant = items.length - expired.length;
  const rate = items.length > 0 ? (compliant / items.length) * 100 : 0;

  return (
    <>
      <PageHeader
        eyebrow="Opérations"
        title="Parc d'instruments de mesure"
        description="Chaque instrument porte sa validité d’étalonnage. Un instrument périmé ne peut plus être sélectionné dans une inspection."
      />

      <KpiRow>
        <KpiCard label="Instruments" value={items.length} hint="parc I2S" />
        <KpiCard
          label="Périmés"
          value={expired.length}
          tone={expired.length > 0 ? 'danger' : undefined}
          hint="usage bloqué"
        />
        <KpiCard
          label="À étalonner sous 30 j"
          value={dueSoon.length}
          tone={dueSoon.length > 0 ? 'warning' : undefined}
        />
        <KpiCard
          label="Taux de conformité"
          value={percent(rate, 0)}
          tone={rate >= 95 ? 'success' : rate >= 85 ? 'warning' : 'danger'}
          hint="indicateur qualité annuel"
        />
      </KpiRow>

      {expired.length > 0 && (
        <NextActionBanner
          tone="danger"
          title={`${expired.length} instrument(s) hors étalonnage : ${expired.map((d) => d.code).join(', ')}`}
          detail="Ils ne peuvent plus fonder un rapport. Ouvrez la fiche de l’instrument pour enregistrer le certificat du laboratoire."
          action={
            <Link
              href={`/operations/parc-mesure/${expired[0]!.id}`}
              className="text-[14px] font-medium underline underline-offset-2"
            >
              Ouvrir {expired[0]!.code}
            </Link>
          }
        />
      )}

      <Card title={`Parc — ${items.length} instruments`}>
        {items.length === 0 ? (
          <EmptyState
            title="Aucun instrument enregistré"
            description="Enregistrez les appareils de mesure et leurs certificats d’étalonnage."
          />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Type</Th>
                <Th>Marque / modèle</Th>
                <Th>N° de série</Th>
                <Th>Dép.</Th>
                <Th>Détenteur</Th>
                <Th>Étalonnage valide jusqu’au</Th>
                <Th>Certificat</Th>
                <Th>Statut</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((device) => (
                <tr key={device.id} className={device.blocking ? 'bg-danger-soft' : undefined}>
                  <Td mono>
                    <Link
                      href={`/operations/parc-mesure/${device.id}`}
                      className="font-medium hover:text-accent"
                    >
                      {device.code}
                    </Link>
                  </Td>
                  <Td>{device.type}</Td>
                  <Td>
                    {device.brand} {device.model}
                  </Td>
                  <Td mono>{device.serialNumber ?? '—'}</Td>
                  <Td>{device.department ?? '—'}</Td>
                  <Td>{device.holder ?? <span className="text-subtle">au magasin</span>}</Td>
                  <Td mono>
                    <span className={device.blocking ? 'font-semibold text-danger' : ''}>
                      {date(device.calibrationValidUntil)}
                    </span>
                  </Td>
                  <Td mono>{device.lastCertificate ?? '—'}</Td>
                  <Td>
                    <StatusBadge tone={TONE[device.status] ?? 'neutral'}>
                      {DEVICE_STATUS_LABELS[device.status] ?? device.status}
                    </StatusBadge>
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
