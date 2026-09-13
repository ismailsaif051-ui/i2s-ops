import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ApiError, api } from '@/lib/api';
import { date } from '@/lib/format';
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

export const metadata: Metadata = { title: 'Équipement client' };

interface AssetDetail {
  id: string;
  tag: string;
  type: string | null;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  client: { id: string; name: string; code: string };
  site: { name: string; city: string | null } | null;
  commissioningDate: string | null;
  inspectionIntervalM: number | null;
  regulatoryRef: string | null;
  nextInspectionDue: string | null;
  late: boolean;
  daysLeft: number | null;
  inspections: Array<{
    id: string;
    date: string;
    status: string;
    formCode: string;
    title: string;
    mission: string;
    report: string | null;
    reportStatus: string | null;
    issuedAt: string | null;
  }>;
  issues: Array<{
    id: string;
    number: string;
    description: string;
    severity: string;
    status: string;
    dueDate: string | null;
    open: boolean;
  }>;
}

const SEVERITY: Record<string, { label: string; tone: Tone }> = {
  CRITICAL: { label: 'Critique', tone: 'danger' },
  MAJOR: { label: 'Majeure', tone: 'warning' },
  MINOR: { label: 'Mineure', tone: 'info' },
  OBSERVATION: { label: 'Observation', tone: 'neutral' },
};

export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let asset: AssetDetail;
  try {
    asset = await api<AssetDetail>(`/assets/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const designation = [asset.brand, asset.model].filter(Boolean).join(' ');
  const openIssues = asset.issues.filter((i) => i.open);

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/operations/equipements" className="hover:text-text">
            ‹ Équipements clients
          </Link>
        }
        title={`${asset.tag}${asset.type ? ` — ${asset.type}` : ''}`}
        description={
          [designation, asset.serialNumber ? `n° ${asset.serialNumber}` : null, asset.client.name]
            .filter(Boolean)
            .join(' · ') || undefined
        }
        action={
          asset.nextInspectionDue ? (
            <StatusBadge
              tone={
                asset.late
                  ? 'danger'
                  : asset.daysLeft !== null && asset.daysLeft <= 60
                    ? 'warning'
                    : 'success'
              }
            >
              {asset.late
                ? `Contrôle échu depuis ${Math.abs(asset.daysLeft ?? 0)} j`
                : `Prochain contrôle le ${date(asset.nextInspectionDue)}`}
            </StatusBadge>
          ) : (
            <StatusBadge tone="warning">Aucune échéance</StatusBadge>
          )
        }
      />

      {asset.late && (
        <div className="mb-5 rounded-[12px] border border-danger/30 bg-danger-soft px-5 py-4">
          <p className="text-[15px] font-medium text-danger">
            Contrôle réglementaire échu depuis le {date(asset.nextInspectionDue)}
          </p>
          <p className="mt-1 text-[14px] text-muted">
            {asset.regulatoryRef
              ? `${asset.regulatoryRef} — l’équipement n’est plus couvert. C’est une intervention à planifier.`
              : 'L’équipement n’est plus couvert. C’est une intervention à planifier.'}
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-5">
          <Card title={`Historique d’inspection — ${asset.inspections.length}`}>
            {asset.inspections.length === 0 ? (
              <EmptyState
                title="Aucune inspection"
                description="Cet équipement n’a encore fait l’objet d’aucun contrôle enregistré dans la plateforme."
              />
            ) : (
              <DataTable>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Formulaire</Th>
                    <Th>Mission</Th>
                    <Th>Rapport</Th>
                    <Th>Émis le</Th>
                  </tr>
                </thead>
                <tbody>
                  {asset.inspections.map((i) => (
                    <tr key={i.id}>
                      <Td mono>{date(i.date)}</Td>
                      <Td>
                        <span className="ref text-[13px]">{i.formCode}</span>
                        <span className="mt-0.5 block text-[13.5px] text-muted">{i.title}</span>
                      </Td>
                      <Td mono>{i.mission}</Td>
                      <Td mono>{i.report ?? <span className="text-subtle">—</span>}</Td>
                      <Td mono>{i.issuedAt ? date(i.issuedAt) : <span className="text-subtle">—</span>}</Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            )}
          </Card>

          <Card
            title="Écarts constatés"
            action={
              openIssues.length > 0 ? (
                <StatusBadge tone="warning">{openIssues.length} ouvert(s)</StatusBadge>
              ) : undefined
            }
          >
            {asset.issues.length === 0 ? (
              <EmptyState
                title="Aucun écart"
                description="Aucune non-conformité n’a été ouverte sur cet équipement."
              />
            ) : (
              <ul className="divide-y divide-border">
                {asset.issues.map((issue) => {
                  const severity = SEVERITY[issue.severity] ?? {
                    label: issue.severity,
                    tone: 'neutral' as Tone,
                  };

                  return (
                    <li key={issue.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Link
                          href={`/operations/non-conformites/${issue.id}`}
                          className="ref text-[13px] font-medium hover:text-accent"
                        >
                          {issue.number}
                        </Link>
                        <StatusBadge tone={severity.tone}>{severity.label}</StatusBadge>
                        {issue.open ? (
                          <StatusBadge tone="warning">Ouvert</StatusBadge>
                        ) : (
                          <StatusBadge tone="success">Clôturé</StatusBadge>
                        )}
                        {issue.dueDate && (
                          <span className="ref text-[13px] text-subtle">
                            échéance {date(issue.dueDate)}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 max-w-[90ch] text-[14.5px]">{issue.description}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <Card title="Fiche">
          <dl className="flex flex-col divide-y divide-border">
            {[
              ['Repère', asset.tag],
              ['Type', asset.type ?? '—'],
              ['Marque et modèle', designation || '—'],
              ['N° de série', asset.serialNumber ?? '—'],
              ['Client', asset.client.name],
              [
                'Site',
                asset.site ? `${asset.site.name}${asset.site.city ? ` — ${asset.site.city}` : ''}` : '—',
              ],
              ['Mise en service', asset.commissioningDate ? date(asset.commissioningDate) : '—'],
              [
                'Périodicité',
                asset.inspectionIntervalM ? `${asset.inspectionIntervalM} mois` : '—',
              ],
              ['Texte applicable', asset.regulatoryRef ?? '—'],
              ['Prochain contrôle', asset.nextInspectionDue ? date(asset.nextInspectionDue) : '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-3 px-5 py-3">
                <dt className="text-[13.5px] text-muted">{label}</dt>
                <dd className="text-right text-[14.5px]">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </>
  );
}
