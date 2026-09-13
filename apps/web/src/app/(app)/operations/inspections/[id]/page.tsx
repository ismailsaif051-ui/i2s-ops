import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PARADIGM_LABELS, type Paradigm } from '@i2s/contracts';
import { ApiError, api } from '@/lib/api';
import { date } from '@/lib/format';
import { StatusBadge } from '@/components/ui';
import { InspectionForm, type InspectionPayload } from '@/components/inspection-form';

export const metadata: Metadata = { title: 'Saisie d’inspection' };

interface Device {
  id: string;
  code: string;
  type: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  calibrationValidUntil: string | null;
  usable: boolean;
}

export default async function InspectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let inspection: InspectionPayload;
  try {
    inspection = await api<InspectionPayload>(`/inspections/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const { items: devices } = await api<{ items: Device[] }>(
    `/inspections/devices/available?date=${encodeURIComponent(inspection.date)}`,
  ).catch(() => ({ items: [] as Device[] }));

  return (
    <>
      <header className="mb-7">
        <Link href="/operations/rapports" className="text-[13.5px] text-muted hover:text-text">
          ‹ Rapports
        </Link>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
          <h1 className="ref text-[24px] font-semibold">{inspection.template.formCode}</h1>
          <span className="ref text-[15px] text-subtle">version {inspection.template.version}</span>
          <StatusBadge tone={inspection.status === 'DRAFT' ? 'warning' : 'success'}>
            {inspection.status === 'DRAFT' ? 'Brouillon' : 'Soumise'}
          </StatusBadge>
          <StatusBadge tone="accent">
            {PARADIGM_LABELS[inspection.template.paradigm as Paradigm] ??
              inspection.template.paradigm}
          </StatusBadge>
        </div>
        <p className="mt-2 text-[17px]">{inspection.template.title}</p>
        {inspection.template.titleEn && (
          <p className="text-[15px] text-subtle">{inspection.template.titleEn}</p>
        )}
        <p className="mt-2 text-[13.5px] text-subtle">
          Mission {inspection.mission.number} · Affaire {inspection.mission.affairNumber} ·{' '}
          {inspection.mission.client}
          {inspection.mission.site ? ` · ${inspection.mission.site}` : ''} · Essai du{' '}
          {date(inspection.date)} · {inspection.inspector.name}
        </p>
      </header>

      <InspectionForm inspection={inspection} availableDevices={devices} />
    </>
  );
}
