import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  CHECK_VERDICTS,
  CHECK_VERDICT_LABELS,
  PARADIGM_LABELS,
  type Paradigm,
  type TemplateSchema,
  type TemplateSection,
} from '@i2s/contracts';
import { ApiError, api } from '@/lib/api';
import { date } from '@/lib/format';
import { Card, PageHeader, StatusBadge } from '@/components/ui';

export const metadata: Metadata = { title: 'Formulaire' };

interface TemplateDetail {
  id: string;
  formCode: string;
  version: string;
  title: string;
  titleEn: string | null;
  paradigm: Paradigm;
  status: string;
  applicationDate: string | null;
  schema: TemplateSchema;
  method: { code: string; name: string; standards: string[]; procedureRef: string | null } | null;
}

const SECTION_LABELS: Record<string, string> = {
  keyvalue: 'Bloc de saisie',
  devices: 'Instruments de mesure',
  conditions: 'Conditions d’examen',
  table: 'Tableau répétable',
  checklist: 'Check-list',
  criteria: 'Critères d’acceptation',
  photos: 'Photographies',
  verdict: 'Conclusion',
  'signature-matrix': 'Matrice de visas',
  text: 'Texte libre',
};

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let template: TemplateDetail;
  try {
    template = await api<TemplateDetail>(`/inspection-templates/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const sections = template.schema?.sections ?? [];

  return (
    <>
      <header className="mb-7">
        <Link href="/administration/templates" className="text-[13.5px] text-muted hover:text-text">
          ‹ Templates d’inspection
        </Link>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
          <h1 className="ref text-[26px] font-semibold">{template.formCode}</h1>
          <span className="ref text-[16px] text-subtle">version {template.version}</span>
          <StatusBadge tone={template.status === 'PUBLISHED' ? 'success' : 'neutral'}>
            {({ DRAFT: 'Brouillon', PUBLISHED: 'Publié', SUPERSEDED: 'Remplacé' } as Record<string, string>)[template.status] ?? template.status}
          </StatusBadge>
          <StatusBadge tone="accent">{PARADIGM_LABELS[template.paradigm]}</StatusBadge>
        </div>
        <p className="mt-2 text-[17px]">{template.title}</p>
        {template.titleEn && <p className="text-[15px] text-subtle">{template.titleEn}</p>}
        <p className="mt-2 text-[13.5px] text-subtle">
          {template.method ? `${template.method.code} — ${template.method.name}` : 'Sans méthode'}
          {template.applicationDate ? ` · Date d’application ${date(template.applicationDate)}` : ''}
          {template.method?.standards.length
            ? ` · ${template.method.standards.join(', ')}`
            : ''}
        </p>
      </header>

      {sections.length === 0 && (
        <div className="rounded-[14px] border border-border bg-surface px-5 py-5">
          <p className="text-[15px] font-medium">Formulaire de saisie pas encore construit</p>
          <p className="mt-1.5 max-w-[74ch] text-[14px] leading-relaxed text-muted">
            Ce modèle fait partie du référentiel qualité : il sert dès maintenant à classer et à
            filtrer les rapports par type. Il ne peut pas encore être saisi sur le terrain — l’écran
            de saisie ne propose que les modèles publiés. Le paradigme affiché est provisoire et sera
            confirmé à la construction du formulaire.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {sections.map((section, index) => (
          <SectionPreview key={section.key} section={section} index={index + 1} />
        ))}
      </div>

      <p className="mt-6 max-w-[76ch] text-[13.5px] text-subtle">
        Aperçu de la structure, en lecture seule. L’éditeur par glisser-déposer et le rendu PDF
        arrivent avec la reprise des lots de formulaires. Une version publiée est immuable : une
        correction crée la version suivante et ne touche à aucun rapport déjà émis.
      </p>
    </>
  );
}

function SectionPreview({ section, index }: { section: TemplateSection; index: number }) {
  return (
    <Card
      title={
        <span className="flex flex-wrap items-baseline gap-2.5">
          <span className="ref text-[13px] text-subtle">{String(index).padStart(2, '0')}</span>
          {section.label.fr}
          {section.label.en && (
            <span className="text-[13.5px] font-normal text-subtle">{section.label.en}</span>
          )}
        </span>
      }
      action={
        <span className="flex items-center gap-2">
          {section.repeatable && <StatusBadge tone="info">Répétable</StatusBadge>}
          <StatusBadge tone="neutral">{SECTION_LABELS[section.type] ?? section.type}</StatusBadge>
        </span>
      }
    >
      <div className="px-5 py-4">
        {section.help && <p className="mb-4 text-[13.5px] text-muted">{section.help}</p>}

        {/* Champs simples et colonnes de tableau */}
        {(section.fields || section.columns) && (
          <div className="grid grid-cols-12 gap-3">
            {(section.fields ?? section.columns ?? []).map((field) => (
              <div
                key={field.key}
                className="rounded-[8px] border border-border bg-surface-2 px-3 py-2.5"
                style={{ gridColumn: `span ${Math.min(12, Math.round(field.span ?? 6))}` }}
              >
                <p className="text-[13.5px] font-medium">
                  {field.label.fr}
                  {field.required && <span className="ml-1 text-accent">*</span>}
                </p>
                {field.label.en && (
                  <p className="text-[12.5px] text-subtle">{field.label.en}</p>
                )}
                <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12.5px] text-subtle">
                  <span className="ref rounded-[4px] bg-surface px-1.5 py-0.5">{field.type}</span>
                  {field.unit && <span>en {field.unit}</span>}
                  {field.autofill && (
                    <span className="text-accent">pré-rempli depuis la mission</span>
                  )}
                </p>
                {field.options && field.options.length > 0 && (
                  <p className="mt-1.5 flex flex-wrap gap-1">
                    {field.options.map((option) => (
                      <span
                        key={option}
                        className="rounded-[4px] bg-surface px-1.5 py-0.5 text-[12px]"
                      >
                        {option}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Check-list réglementaire */}
        {section.groups && (
          <div className="flex flex-col gap-4">
            {section.groups.map((group) => (
              <div key={group.key}>
                <p className="mb-2 text-[14.5px] font-medium">
                  {group.label.fr}
                  {group.qualifier && (
                    <span className="ml-2 text-[13.5px] font-normal text-subtle">
                      {group.qualifier}
                    </span>
                  )}
                </p>
                <ul className="divide-y divide-border overflow-hidden rounded-[8px] border border-border">
                  {group.points.map((point) => (
                    <li
                      key={point.key}
                      className="flex flex-wrap items-center justify-between gap-3 bg-surface px-3.5 py-2.5"
                    >
                      <span className="text-[14px]">
                        {point.label.fr}
                        {point.expected && (
                          <span className="ml-2 text-[13px] text-subtle">— {point.expected}</span>
                        )}
                      </span>
                      <span className="flex gap-1">
                        {CHECK_VERDICTS.map((verdict) => (
                          <span
                            key={verdict}
                            title={CHECK_VERDICT_LABELS[verdict]}
                            className="inline-flex h-6 w-8 items-center justify-center rounded-[5px] border border-border-strong text-[12px] text-subtle"
                          >
                            {verdict}
                          </span>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Critères d'acceptation */}
        {section.criteria && (
          <ul className="divide-y divide-border overflow-hidden rounded-[8px] border border-border">
            {section.criteria.map((criterion) => (
              <li key={criterion.key} className="bg-surface px-3.5 py-3">
                <p className="text-[14px]">{criterion.label.fr}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {criterion.standards.map((standard) => (
                    <span
                      key={standard}
                      className="rounded-[4px] bg-surface-2 px-1.5 py-0.5 text-[12.5px]"
                    >
                      {standard}
                    </span>
                  ))}
                  <span className="ml-auto flex gap-1.5 text-[12.5px] text-subtle">
                    <span className="rounded-[5px] border border-border-strong px-2 py-0.5">
                      Applicable
                    </span>
                    <span className="rounded-[5px] border border-border-strong px-2 py-0.5">
                      Conforme
                    </span>
                    <span className="rounded-[5px] border border-border-strong px-2 py-0.5">
                      Non conforme
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Conclusion à issues exclusives */}
        {section.verdicts && (
          <ul className="flex flex-col gap-2">
            {section.verdicts.map((verdict) => (
              <li
                key={verdict.fr}
                className="flex items-center gap-3 rounded-[8px] border border-border bg-surface px-3.5 py-2.5 text-[14.5px]"
              >
                <span className="h-4 w-4 shrink-0 rounded-full border border-border-strong" />
                {verdict.fr}
              </li>
            ))}
          </ul>
        )}

        {/* Matrice de visas */}
        {section.signatories && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr>
                  <th className="border border-border bg-surface-2 px-3 py-2 text-left font-medium">
                    &nbsp;
                  </th>
                  {section.signatories.map((signatory) => (
                    <th
                      key={signatory.fr}
                      className="border border-border bg-surface-2 px-3 py-2 text-left font-medium"
                    >
                      {signatory.fr}
                      {signatory.en && (
                        <span className="block text-[12px] font-normal text-subtle">
                          {signatory.en}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['Nom', 'Date', 'Visa'].map((row) => (
                  <tr key={row}>
                    <td className="border border-border px-3 py-3 font-medium text-subtle">{row}</td>
                    {section.signatories!.map((signatory) => (
                      <td key={signatory.fr} className="border border-border px-3 py-3" />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {section.type === 'photos' && (
          <p className="text-[13.5px] text-muted">
            Galerie de photographies annotées, prises depuis le mobile de l’inspecteur, compressées
            côté client et téléversées en tâche de fond.
          </p>
        )}
      </div>
    </Card>
  );
}
