'use client';

import { useCallback, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import {
  CHECK_VERDICTS,
  CHECK_VERDICT_LABELS,
  type CheckVerdict,
  type TemplateField,
  type TemplateSchema,
  type TemplateSection,
} from '@i2s/contracts';
import { Button, Card, StatusBadge } from '@/components/ui';

/**
 * Rendu générique d'un formulaire d'inspection.
 *
 * Un seul composant sert les 61 formulaires du référentiel : il lit le schéma
 * du template et produit la saisie correspondante. Ajouter un formulaire ne
 * demande aucune ligne de code ici.
 */

interface ValidationIssue {
  section: string;
  field?: string;
  message: string;
  blocking: boolean;
}

interface Device {
  id: string;
  code: string;
  type: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  calibrationValidUntil: string | null;
  usable?: boolean;
}

export interface InspectionPayload {
  id: string;
  status: string;
  date: string;
  data: Record<string, unknown>;
  template: {
    formCode: string;
    version: string;
    title: string;
    titleEn: string | null;
    paradigm: string;
    schema: TemplateSchema;
  };
  inspector: { name: string; matricule: string };
  mission: {
    number: string;
    objective: string | null;
    affairNumber: string;
    client: string;
    site: string | null;
  };
  devices: Device[];
  report: { id: string; number: string; status: string } | null;
  validation: { issues: ValidationIssue[]; canSubmit: boolean };
  editable: boolean;
}

export function InspectionForm({
  inspection,
  availableDevices,
  /**
   * Rendu sous un rapport : le bandeau d'état appartient à l'écran de saisie
   * de l'inspecteur. Répété ici, il parlerait de soumission alors que le
   * dossier en est déjà à la vérification — deux états contradictoires
   * affichés côte à côte.
   */
  embedded = false,
}: {
  inspection: InspectionPayload;
  availableDevices: Device[];
  embedded?: boolean;
}) {
  const router = useRouter();
  const [data, setData] = useState<Record<string, unknown>>(inspection.data ?? {});
  const [deviceIds, setDeviceIds] = useState<string[]>(inspection.devices.map((d) => d.id));
  const [issues, setIssues] = useState<ValidationIssue[]>(inspection.validation.issues);
  const [canSubmit, setCanSubmit] = useState(inspection.validation.canSubmit);
  const [busy, setBusy] = useState<'save' | 'submit' | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const sections = inspection.template.schema?.sections ?? [];
  const readOnly = !inspection.editable;

  const setSectionValue = useCallback((sectionKey: string, value: unknown) => {
    setData((prev) => ({ ...prev, [sectionKey]: value }));
  }, []);

  const setFieldValue = useCallback((sectionKey: string, fieldKey: string, value: unknown) => {
    setData((prev) => ({
      ...prev,
      [sectionKey]: { ...((prev[sectionKey] as object) ?? {}), [fieldKey]: value },
    }));
  }, []);

  async function save() {
    setBusy('save');
    setMessage(null);
    const response = await fetch(`/api/inspections/${inspection.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, deviceIds }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      issues?: ValidationIssue[];
      canSubmit?: boolean;
      message?: string;
    };
    if (response.ok) {
      setIssues(payload.issues ?? []);
      setCanSubmit(Boolean(payload.canSubmit));
      setMessage({ tone: 'ok', text: 'Brouillon enregistré.' });
    } else {
      setMessage({ tone: 'error', text: payload.message ?? 'Enregistrement impossible.' });
    }
    setBusy(null);
  }

  async function submit() {
    setBusy('submit');
    setMessage(null);
    // On enregistre avant de soumettre : la validation porte sur ce qui est en base.
    await fetch(`/api/inspections/${inspection.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, deviceIds }),
    });
    const response = await fetch(`/api/inspections/${inspection.id}/submit`, { method: 'POST' });
    const payload = (await response.json().catch(() => ({}))) as {
      report?: { number: string };
      message?: string;
      errors?: Array<{ field: string; message: string }>;
    };
    if (response.ok) {
      router.refresh();
      setMessage({
        tone: 'ok',
        text: `Rapport ${payload.report?.number ?? ''} créé et soumis à vérification.`,
      });
    } else {
      setMessage({
        tone: 'error',
        text:
          payload.errors?.map((e) => `${e.field} : ${e.message}`).join(' · ') ??
          payload.message ??
          'Soumission refusée.',
      });
    }
    setBusy(null);
  }

  const blocking = issues.filter((i) => i.blocking);
  const warnings = issues.filter((i) => !i.blocking);

  return (
    <div className="flex flex-col gap-5">
      {/* Bandeau d'état */}
      {!embedded && (
      <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-border bg-surface px-5 py-4 shadow-[var(--shadow-card)]">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">
            {blocking.length > 0
              ? `${blocking.length} point(s) bloquant(s) avant soumission`
              : inspection.status === 'DRAFT'
                ? 'Saisie complète — prête à être soumise'
                : 'Inspection soumise'}
          </p>
          <p className="mt-0.5 text-[14px] text-muted">
            {inspection.report
              ? `Rapport ${inspection.report.number} — en attente de vérification par une personne distincte du rédacteur.`
              : 'À la soumission, un rapport est créé et part en vérification.'}
          </p>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <Button onClick={save} disabled={busy !== null}>
              {busy === 'save' ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
            <Button variant="accent" onClick={submit} disabled={busy !== null || !canSubmit}>
              {busy === 'submit' ? 'Soumission…' : 'Soumettre'}
            </Button>
          </div>
        )}
      </div>
      )}

      {message && (
        <p
          role="status"
          className={`rounded-[10px] px-4 py-3 text-[14px] ${
            message.tone === 'ok' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
          }`}
        >
          {message.text}
        </p>
      )}

      {(blocking.length > 0 || warnings.length > 0) && (
        <Card title={`Contrôles — ${blocking.length} bloquant(s), ${warnings.length} avertissement(s)`}>
          <ul className="divide-y divide-border">
            {[...blocking, ...warnings].map((issue, index) => (
              <li key={`${issue.section}-${index}`} className="flex items-start gap-3 px-5 py-3">
                <StatusBadge tone={issue.blocking ? 'danger' : 'warning'}>
                  {issue.blocking ? 'Bloquant' : 'À vérifier'}
                </StatusBadge>
                <span className="text-[14px]">
                  <span className="font-medium">{issue.section}</span>
                  {issue.field ? ` · ${issue.field}` : ''} — {issue.message}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {sections.map((section, index) => (
        <SectionRenderer
          key={section.key}
          section={section}
          index={index + 1}
          value={data[section.key]}
          readOnly={readOnly}
          devices={availableDevices}
          selectedDeviceIds={deviceIds}
          onDeviceToggle={(id) =>
            setDeviceIds((prev) =>
              prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
            )
          }
          onSectionChange={(v) => setSectionValue(section.key, v)}
          onFieldChange={(fieldKey, v) => setFieldValue(section.key, fieldKey, v)}
          context={inspection}
        />
      ))}
    </div>
  );
}

/* ── Rendu d'une section ──────────────────────────────────────────── */

function SectionRenderer({
  section,
  index,
  value,
  readOnly,
  devices,
  selectedDeviceIds,
  onDeviceToggle,
  onSectionChange,
  onFieldChange,
  context,
}: {
  section: TemplateSection;
  index: number;
  value: unknown;
  readOnly: boolean;
  devices: Device[];
  selectedDeviceIds: string[];
  onDeviceToggle: (id: string) => void;
  onSectionChange: (value: unknown) => void;
  onFieldChange: (fieldKey: string, value: unknown) => void;
  context: InspectionPayload;
}) {
  const record = (value ?? {}) as Record<string, unknown>;

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
    >
      <div className="px-5 py-4">
        {section.help && <p className="mb-4 text-[13.5px] text-muted">{section.help}</p>}

        {section.type === 'devices' ? (
          <>
            {/* Le sélecteur tient lieu de champ : son intitulé doit être visible,
                sinon l'inspecteur cherche une case « Poste US » qui n'existe pas. */}
            {section.fields
              ?.filter((f) => f.type === 'device')
              .map((f) => (
                <p key={f.key} className="mb-2.5 text-[13.5px] font-medium">
                  {f.label.fr}
                  {f.required && <span className="ml-1 text-accent">*</span>}
                  <span className="ml-2 font-normal text-subtle">
                    renseigné par la sélection ci-dessous
                  </span>
                </p>
              ))}
            <DevicePicker
              devices={devices}
              selected={selectedDeviceIds}
              readOnly={readOnly}
              onToggle={onDeviceToggle}
            />
          </>
        ) : section.type === 'checklist' ? (
          <ChecklistRenderer
            section={section}
            value={record as Record<string, CheckVerdict>}
            readOnly={readOnly}
            onChange={(pointKey, verdict) =>
              onSectionChange({ ...record, [pointKey]: verdict })
            }
          />
        ) : section.type === 'criteria' ? (
          <CriteriaRenderer
            section={section}
            value={record}
            readOnly={readOnly}
            onChange={(criterionKey, next) => onSectionChange({ ...record, [criterionKey]: next })}
          />
        ) : section.type === 'verdict' ? (
          <VerdictRenderer
            section={section}
            value={typeof value === 'string' ? value : null}
            readOnly={readOnly}
            onChange={onSectionChange}
          />
        ) : section.type === 'table' ? (
          <TableRenderer
            section={section}
            rows={Array.isArray(value) ? (value as Record<string, unknown>[]) : []}
            readOnly={readOnly}
            onChange={onSectionChange}
          />
        ) : section.type === 'photos' ? (
          <p className="text-[14px] text-muted">
            La prise de photos se fait depuis le mobile de l’inspecteur, hors ligne, avec envoi en
            tâche de fond. Cet écran de bureau ne la propose pas.
          </p>
        ) : section.type === 'signature-matrix' ? (
          <SignatureMatrix section={section} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            {/* Une colonne sur téléphone : à quatre champs par ligne, les listes
                y tombaient à 70 px et les libellés se chevauchaient. La largeur
                prévue par le formulaire s'applique à partir de la tablette. */}
            {(section.fields ?? []).map((field) => (
              <FieldRenderer
                key={field.key}
                field={field}
                value={record[field.key]}
                readOnly={readOnly}
                context={context}
                onChange={(v) => onFieldChange(field.key, v)}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ── Champ ────────────────────────────────────────────────────────── */

/**
 * En-tête repris de la mission. Le serveur écrit exactement les mêmes valeurs
 * dans les données du rapport : cette table ne fait que les afficher. Une
 * source qui ne résout rien rend le champ saisissable — plutôt qu'un tiret
 * affiché comme s'il était une valeur.
 */
const AUTOFILL_SOURCES: Record<string, (c: InspectionPayload) => string | undefined> = {
  client: (c) => c.mission.client,
  affairNumber: (c) => c.mission.affairNumber,
  site: (c) => c.mission.site ?? undefined,
  inspector: (c) => c.inspector.name,
  date: (c) => new Date(c.date).toLocaleDateString('fr-FR'),
};

function FieldRenderer({
  field,
  value,
  readOnly,
  context,
  onChange,
}: {
  field: TemplateField;
  value: unknown;
  readOnly: boolean;
  context: InspectionPayload;
  onChange: (value: unknown) => void;
}) {
  const span = Math.min(12, Math.max(1, Math.round(field.span ?? 6)));
  const autofilled = field.autofill ? AUTOFILL_SOURCES[field.autofill]?.(context) : undefined;

  const inputClass =
    'h-10 w-full rounded-[8px] border border-border-strong bg-surface px-3 text-[14.5px] outline-none focus:border-accent disabled:bg-surface-2 disabled:text-subtle';

  return (
    <div style={{ '--span': span } as CSSProperties} className="sm:[grid-column:span_var(--span)]">
      {/* Le libellé prend la hauteur libre de la cellule : un libellé sur deux
          lignes ne décale plus son champ sous ceux de ses voisins. */}
      <label className="flex h-full flex-col">
        <span className="mb-1.5 block flex-1 text-[13.5px] font-medium">
          {field.label.fr}
          {field.required && <span className="ml-1 text-accent">*</span>}
          {field.unit && <span className="ml-1.5 font-normal text-subtle">({field.unit})</span>}
        </span>

        {autofilled !== undefined ? (
          <span className="flex h-10 items-center rounded-[8px] border border-border bg-surface-2 px-3 text-[14.5px] text-muted">
            {autofilled}
          </span>
        ) : field.type === 'textarea' ? (
          <textarea
            rows={3}
            disabled={readOnly}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-[8px] border border-border-strong bg-surface px-3 py-2 text-[14.5px] outline-none focus:border-accent disabled:bg-surface-2"
          />
        ) : field.type === 'enum' ? (
          <select
            disabled={readOnly}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          >
            <option value="">—</option>
            {(field.options ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : field.type === 'boolean' ? (
          <span className="flex h-10 items-center gap-2">
            <input
              type="checkbox"
              disabled={readOnly}
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            <span className="text-[14px] text-muted">Oui</span>
          </span>
        ) : (
          <input
            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
            step={field.decimals ? `0.${'0'.repeat(field.decimals - 1)}1` : undefined}
            disabled={readOnly}
            value={(value as string | number) ?? ''}
            onChange={(e) =>
              onChange(field.type === 'number' ? e.target.valueAsNumber : e.target.value)
            }
            className={inputClass}
          />
        )}

        {field.label.en && (
          <span className="mt-1 block text-[12.5px] text-subtle">{field.label.en}</span>
        )}
      </label>
    </div>
  );
}

/* ── Instruments de mesure ────────────────────────────────────────── */

function DevicePicker({
  devices,
  selected,
  readOnly,
  onToggle,
}: {
  devices: Device[];
  selected: string[];
  readOnly: boolean;
  onToggle: (id: string) => void;
}) {
  if (devices.length === 0) {
    return <p className="text-[14px] text-muted">Aucun instrument enregistré.</p>;
  }

  return (
    <ul className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
      {devices.map((device) => {
        const usable = device.usable !== false;
        const checked = selected.includes(device.id);
        return (
          <li key={device.id}>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-[10px] border px-3.5 py-3 transition-colors ${
                checked ? 'border-accent bg-accent-soft' : 'border-border bg-surface'
              } ${usable ? '' : 'opacity-70'}`}
            >
              <input
                type="checkbox"
                disabled={readOnly || !usable}
                checked={checked}
                onChange={() => onToggle(device.id)}
                className="mt-1 h-4 w-4 accent-[var(--accent)]"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-2">
                  <span className="ref text-[13px] font-medium">{device.code}</span>
                  {!usable && <StatusBadge tone="danger">Étalonnage périmé</StatusBadge>}
                </span>
                <span className="mt-0.5 block text-[13.5px]">
                  {device.type} — {device.brand} {device.model}
                </span>
                <span className="mt-0.5 block text-[12.5px] text-subtle">
                  N° {device.serialNumber ?? '—'} · étalonné jusqu’au{' '}
                  {device.calibrationValidUntil
                    ? new Date(device.calibrationValidUntil).toLocaleDateString('fr-FR')
                    : 'jamais'}
                </span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

/* ── Check-list réglementaire ─────────────────────────────────────── */

function ChecklistRenderer({
  section,
  value,
  readOnly,
  onChange,
}: {
  section: TemplateSection;
  value: Record<string, CheckVerdict>;
  readOnly: boolean;
  onChange: (pointKey: string, verdict: CheckVerdict) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {(section.groups ?? []).map((group) => (
        <div key={group.key}>
          <p className="mb-2 text-[14.5px] font-medium">
            {group.label.fr}
            {group.qualifier && (
              <span className="ml-2 text-[13.5px] font-normal text-subtle">{group.qualifier}</span>
            )}
          </p>
          <ul className="divide-y divide-border overflow-hidden rounded-[10px] border border-border">
            {group.points.map((point) => {
              const current = value[point.key];
              return (
                <li
                  key={point.key}
                  className={`flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 ${
                    current === 'NC' ? 'bg-danger-soft' : 'bg-surface'
                  }`}
                >
                  <span className="min-w-0 flex-1 text-[14px]">
                    {point.label.fr}
                    {point.expected && (
                      <span className="ml-2 text-[13px] text-subtle">— {point.expected}</span>
                    )}
                  </span>
                  <span className="flex gap-1">
                    {CHECK_VERDICTS.map((verdict) => (
                      <button
                        key={verdict}
                        type="button"
                        disabled={readOnly}
                        title={CHECK_VERDICT_LABELS[verdict]}
                        onClick={() => onChange(point.key, verdict)}
                        className={`h-8 w-10 rounded-[6px] border text-[13px] font-medium transition-colors ${
                          current === verdict
                            ? verdict === 'NC'
                              ? 'border-danger bg-danger text-white'
                              : verdict === 'C'
                                ? 'border-success bg-success text-white'
                                : 'border-neutral bg-neutral text-white'
                            : 'border-border-strong bg-surface text-subtle hover:bg-surface-2'
                        }`}
                      >
                        {verdict}
                      </button>
                    ))}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ── Critères d'acceptation ───────────────────────────────────────── */

function CriteriaRenderer({
  section,
  value,
  readOnly,
  onChange,
}: {
  section: TemplateSection;
  value: Record<string, unknown>;
  readOnly: boolean;
  onChange: (criterionKey: string, next: { applicable: boolean; conform: boolean | null }) => void;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {(section.criteria ?? []).map((criterion) => {
        const state = (value[criterion.key] ?? { applicable: true, conform: null }) as {
          applicable: boolean;
          conform: boolean | null;
        };
        return (
          <li
            key={criterion.key}
            className={`rounded-[10px] border px-3.5 py-3 ${
              state.applicable && state.conform === false
                ? 'border-danger bg-danger-soft'
                : 'border-border bg-surface'
            }`}
          >
            <p className="text-[14px]">{criterion.label.fr}</p>
            {criterion.standards.length > 0 && (
              <p className="mt-1.5 flex flex-wrap gap-1">
                {criterion.standards.map((standard) => (
                  <span
                    key={standard}
                    className="rounded-[4px] bg-surface-2 px-1.5 py-0.5 text-[12.5px]"
                  >
                    {standard}
                  </span>
                ))}
              </p>
            )}
            <div className="mt-2.5 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-[13.5px]">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={state.applicable}
                  onChange={(e) => onChange(criterion.key, { ...state, applicable: e.target.checked })}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Applicable
              </label>
              <span className="flex gap-1.5">
                {[
                  { label: 'Conforme', v: true },
                  { label: 'Non conforme', v: false },
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    disabled={readOnly || !state.applicable}
                    onClick={() => onChange(criterion.key, { ...state, conform: option.v })}
                    className={`rounded-[6px] border px-2.5 py-1 text-[13px] transition-colors disabled:opacity-50 ${
                      state.conform === option.v
                        ? option.v
                          ? 'border-success bg-success text-white'
                          : 'border-danger bg-danger text-white'
                        : 'border-border-strong bg-surface text-subtle hover:bg-surface-2'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ── Conclusion ───────────────────────────────────────────────────── */

function VerdictRenderer({
  section,
  value,
  readOnly,
  onChange,
}: {
  section: TemplateSection;
  value: string | null;
  readOnly: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {(section.verdicts ?? []).map((verdict) => (
        <li key={verdict.fr}>
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-[10px] border px-3.5 py-3 text-[14.5px] transition-colors ${
              value === verdict.fr ? 'border-accent bg-accent-soft' : 'border-border bg-surface'
            }`}
          >
            <input
              type="radio"
              name={section.key}
              disabled={readOnly}
              checked={value === verdict.fr}
              onChange={() => onChange(verdict.fr)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            {verdict.fr}
          </label>
        </li>
      ))}
    </ul>
  );
}

/* ── Tableau répétable ────────────────────────────────────────────── */

function TableRenderer({
  section,
  rows,
  readOnly,
  onChange,
}: {
  section: TemplateSection;
  rows: Record<string, unknown>[];
  readOnly: boolean;
  onChange: (rows: Record<string, unknown>[]) => void;
}) {
  const columns = section.columns ?? [];

  const update = (index: number, key: string, value: unknown) => {
    const next = rows.map((row, i) => (i === index ? { ...row, [key]: value } : row));
    onChange(next);
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr>
              <th className="border-b border-border px-2 py-2 text-left text-[12.5px] font-medium text-subtle">
                #
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="whitespace-nowrap border-b border-border px-2 py-2 text-left text-[12.5px] font-medium text-subtle"
                >
                  {column.label.fr}
                  {column.unit && <span className="ml-1 font-normal">({column.unit})</span>}
                </th>
              ))}
              {!readOnly && <th className="border-b border-border" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="px-2 py-6 text-center text-[14px] text-subtle"
                >
                  Aucune ligne saisie.
                </td>
              </tr>
            )}
            {rows.map((row, index) => (
              <tr key={index}>
                <td className="border-b border-border px-2 py-1.5 text-subtle">{index + 1}</td>
                {columns.map((column) => (
                  <td key={column.key} className="border-b border-border px-1 py-1.5">
                    {column.type === 'enum' ? (
                      <select
                        disabled={readOnly}
                        value={(row[column.key] as string) ?? ''}
                        onChange={(e) => update(index, column.key, e.target.value)}
                        className="h-9 w-full min-w-[90px] rounded-[6px] border border-border-strong bg-surface px-2 text-[13.5px] outline-none focus:border-accent"
                      >
                        <option value="">—</option>
                        {(column.options ?? []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={column.type === 'number' ? 'number' : 'text'}
                        disabled={readOnly}
                        value={(row[column.key] as string | number) ?? ''}
                        onChange={(e) =>
                          update(
                            index,
                            column.key,
                            column.type === 'number' ? e.target.valueAsNumber : e.target.value,
                          )
                        }
                        className="tnum h-9 w-full min-w-[90px] rounded-[6px] border border-border-strong bg-surface px-2 text-[13.5px] outline-none focus:border-accent"
                      />
                    )}
                  </td>
                ))}
                {!readOnly && (
                  <td className="border-b border-border px-1 py-1.5">
                    <button
                      type="button"
                      onClick={() => onChange(rows.filter((_, i) => i !== index))}
                      className="rounded-[6px] border border-border-strong px-2 py-1 text-[13px] text-muted hover:bg-surface-2"
                    >
                      Retirer
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <Button className="mt-3" onClick={() => onChange([...rows, {}])}>
          Ajouter une ligne
        </Button>
      )}
    </div>
  );
}

/* ── Matrice de visas ─────────────────────────────────────────────── */

function SignatureMatrix({ section }: { section: TemplateSection }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr>
            <th className="border border-border bg-surface-2 px-3 py-2 text-left font-medium">
              &nbsp;
            </th>
            {(section.signatories ?? []).map((signatory) => (
              <th
                key={signatory.fr}
                className="border border-border bg-surface-2 px-3 py-2 text-left font-medium"
              >
                {signatory.fr}
                {signatory.en && (
                  <span className="block text-[12px] font-normal text-subtle">{signatory.en}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {['Nom', 'Date', 'Visa'].map((row) => (
            <tr key={row}>
              <td className="border border-border px-3 py-3 font-medium text-subtle">{row}</td>
              {(section.signatories ?? []).map((signatory) => (
                <td key={signatory.fr} className="border border-border px-3 py-3" />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[13px] text-subtle">
        Les visas sont apposés au moment de la vérification puis de l’émission, pas à la saisie.
      </p>
    </div>
  );
}
