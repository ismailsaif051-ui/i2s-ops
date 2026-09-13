import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { REPORT_STATUS_LABELS, type ReportStatus } from '@i2s/contracts';
import { ApiError, api } from '@/lib/api';
import { date } from '@/lib/format';
import { Card, PageHeader, StatusBadge, type Tone } from '@/components/ui';
import { InspectionForm, type InspectionPayload } from '@/components/inspection-form';
import {
  ReportIssuance,
  ReportVerification,
  type CheckLine,
} from '@/components/report-verification';

export const metadata: Metadata = { title: 'Rapport' };

const TONE: Record<string, Tone> = {
  DRAFT: 'neutral',
  SUBMITTED: 'warning',
  UNDER_CHECK: 'warning',
  CORRECTION: 'danger',
  VALIDATED: 'info',
  ISSUED: 'success',
  ARCHIVED: 'neutral',
};

interface ReportDetail {
  id: string;
  number: string;
  status: string;
  revision: number;
  revisionReason: string | null;
  /** Le type de rapport : le modèle du référentiel qualité. */
  type: { id: string; formCode: string; title: string } | null;
  submittedAt: string | null;
  checkedAt: string | null;
  issuedAt: string | null;
  deliveredAt: string | null;
  dueDate: string | null;
  deliveryDelay: number | null;
  onTime: boolean | null;
  author: { id: string; name: string; matricule: string };
  checker: { id: string; name: string; matricule: string } | null;
  affair: { id: string; number: string; title: string; client: string };
  mission: {
    id: string;
    number: string;
    objective: string | null;
    site: string | null;
    department: string | null;
  };
  checks: CheckLine[];
  distributions: Array<{ channel: string; sentAt: string | null; acknowledgedAt: string | null }>;
  inspection: Omit<InspectionPayload, 'report' | 'validation' | 'editable'> | null;
  actions: { take: boolean; check: boolean; issue: boolean; deliver: boolean; revise: boolean };
  criteria: string[];
  /** La pièce remise au client, présente à partir de l'émission. */
  pdf: { fileName: string } | null;
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[12.5px] uppercase tracking-[0.04em] text-subtle">{label}</span>
      <span className="text-[14.5px]">{children}</span>
    </div>
  );
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let report: ReportDetail;
  try {
    report = await api<ReportDetail>(`/reports/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const label = REPORT_STATUS_LABELS[report.status as ReportStatus] ?? report.status;

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/operations/rapports" className="hover:text-text">
            ‹ Rapports
          </Link>
        }
        title={report.number}
        description={`${report.affair.client} · affaire ${report.affair.number} · mission ${report.mission.number}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge tone={TONE[report.status] ?? 'neutral'}>{label}</StatusBadge>
            {report.revision > 0 && (
              <StatusBadge tone="info">révision {report.revision}</StatusBadge>
            )}
            {report.pdf && (
              <a
                href={`/api/rapports/${report.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center rounded-[10px] bg-accent px-4 text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-accent-hover"
              >
                Ouvrir le PDF
              </a>
            )}
          </div>
        }
      />

      {report.type && (
        <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[14.5px]">
          <span>
            <span className="ref">{report.type.formCode}</span>
            <span className="text-muted"> — {report.type.title}</span>
          </span>
          <Link
            href={`/operations/rapports?templateId=${report.type.id}`}
            className="text-[13.5px] font-medium text-accent hover:underline"
          >
            Voir tous les rapports de ce type
          </Link>
        </div>
      )}

      {report.status === 'CORRECTION' && report.revisionReason && (
        <div className="mb-5 rounded-[12px] border border-danger bg-danger-soft px-5 py-4">
          <p className="text-[14px] font-medium text-danger">Renvoyé en correction</p>
          <p className="mt-1 text-[14.5px]">{report.revisionReason}</p>
          {report.inspection && (
            <p className="mt-1.5 text-[13.5px] text-muted">
              La saisie est redevenue modifiable pour son rédacteur.
            </p>
          )}
        </div>
      )}

      <Card title="Circuit">
        <div className="grid grid-cols-2 gap-5 px-5 py-5 md:grid-cols-4">
          <Line label="Rédigé par">{report.author.name}</Line>
          <Line label="Vérifié par">
            {report.checker?.name ?? <span className="text-subtle">non assigné</span>}
          </Line>
          <Line label="Soumis le">{date(report.submittedAt)}</Line>
          <Line label="Vérifié le">{date(report.checkedAt)}</Line>
          <Line label="Émis le">{date(report.issuedAt)}</Line>
          <Line label="Remis le">{date(report.deliveredAt)}</Line>
          <Line label="Échéance">{date(report.dueDate)}</Line>
          <Line label="Délai réel">
            {report.deliveryDelay === null ? (
              <span className="text-subtle">—</span>
            ) : (
              <span className="flex items-center gap-2">
                {report.deliveryDelay} j ouvrés
                {report.onTime !== null && (
                  <StatusBadge tone={report.onTime ? 'success' : 'danger'}>
                    {report.onTime ? 'dans le délai' : 'hors délai'}
                  </StatusBadge>
                )}
              </span>
            )}
          </Line>
        </div>
      </Card>

      <div className="mt-5 flex flex-col gap-5">
        <ReportVerification
          reportId={report.id}
          status={report.status}
          criteria={report.criteria}
          existing={report.checks}
          actions={report.actions}
          checkerName={report.checker?.name ?? null}
        />

        <ReportIssuance
          reportId={report.id}
          actions={report.actions}
          issuedAt={report.issuedAt}
          deliveredAt={report.deliveredAt}
        />

        {report.distributions.length > 0 && (
          <Card title="Remises">
            <ul className="divide-y divide-border">
              {report.distributions.map((d, i) => (
                <li key={i} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className="text-[14.5px]">{CHANNELS[d.channel] ?? d.channel}</span>
                  <span className="ref text-[13.5px] text-muted">{date(d.sentAt)}</span>
                  {d.acknowledgedAt && (
                    <StatusBadge tone="success">accusé le {date(d.acknowledgedAt)}</StatusBadge>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {report.inspection && (
          <section>
            <h2 className="mb-3 text-[16px] font-semibold tracking-[-0.01em]">
              Saisie d’origine
              <span className="ml-2 text-[14px] font-normal text-subtle">
                {report.inspection.template.formCode} version {report.inspection.template.version}
              </span>
            </h2>
            <InspectionForm
              inspection={{
                ...report.inspection,
                report: { id: report.id, number: report.number, status: report.status },
                validation: { issues: [], canSubmit: false },
                editable: false,
              }}
              availableDevices={report.inspection.devices}
              embedded
            />
          </section>
        )}
      </div>
    </>
  );
}

const CHANNELS: Record<string, string> = {
  EMAIL: 'Courriel',
  PORTAL: 'Portail client',
  HAND: 'Remise en main propre',
  MAIL: 'Courrier',
};
