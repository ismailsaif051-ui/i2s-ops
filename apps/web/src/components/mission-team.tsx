'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Field, Input, StatusBadge } from '@/components/ui';

export interface EmployeeOption {
  id: string;
  matricule: string;
  name: string;
  position: string | null;
  department: string | null;
  isInspector: boolean;
  certifications: Array<{ method: string | null; level: string | null; expiresAt: string | null }>;
}

export interface TeamMember {
  employeeId: string;
  matricule: string;
  name: string;
  role: string;
  plannedDays: number;
}

interface Actions {
  assign: boolean;
  issueOrder: boolean;
  signOrder: boolean;
}

const ROLES = [
  { value: 'LEAD', label: 'Chef de mission' },
  { value: 'ASSISTANT', label: 'Assistant' },
  { value: 'TRAINEE', label: 'Stagiaire' },
  { value: 'SUPERVISOR', label: 'Superviseur' },
];

/** Certification la plus lointaine — celle qui couvre la mission, si elle couvre. */
function coverUntil(employee: EmployeeOption): string | null {
  const dates = employee.certifications
    .map((c) => c.expiresAt)
    .filter((d): d is string => d !== null)
    .sort();
  return dates[dates.length - 1] ?? null;
}

export function MissionTeam({
  missionId,
  employees,
  team,
  actions,
  missionEnd,
  department,
}: {
  missionId: string;
  employees: EmployeeOption[];
  team: TeamMember[];
  actions: Actions;
  missionEnd: string | null;
  /** Code du service de la mission, pour remonter ses inspecteurs en tête. */
  department: string | null;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<TeamMember[]>(team);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [conflicts, setConflicts] = useState<Array<{ field: string; message: string }>>([]);

  const chosen = new Set(rows.map((r) => r.employeeId));

  /**
   * Les inspecteurs du service concerné d'abord : ce sont eux qu'on affecte
   * neuf fois sur dix. Le reste suit, sans être masqué — une mission peut
   * mobiliser un renfort d'un autre pôle.
   */
  const available = employees
    .filter((e) => !chosen.has(e.id))
    .sort((a, b) => {
      const rank = (e: EmployeeOption) =>
        (e.department === department && e.isInspector ? 0 : e.isInspector ? 1 : 2);
      return rank(a) - rank(b) || a.name.localeCompare(b.name, 'fr');
    });

  function add(employeeId: string) {
    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) return;
    setRows((current) => [
      ...current,
      {
        employeeId,
        matricule: employee.matricule,
        name: employee.name,
        role: current.length === 0 ? 'LEAD' : 'ASSISTANT',
        plannedDays: 1,
      },
    ]);
  }

  function update(employeeId: string, patch: Partial<TeamMember>) {
    setRows((current) =>
      current.map((r) => (r.employeeId === employeeId ? { ...r, ...patch } : r)),
    );
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    setConflicts([]);

    const response = await fetch(`/api/missions/${missionId}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignments: rows.map((r) => ({
          employeeId: r.employeeId,
          role: r.role,
          plannedDays: r.plannedDays,
        })),
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      errors?: Array<{ field: string; message: string }>;
      conflicts?: Array<{ employee: string; message: string; blocking: boolean }>;
    };

    setBusy(false);

    if (!response.ok) {
      setConflicts(payload.errors ?? []);
      setMessage({ tone: 'error', text: payload.message ?? 'Affectation refusée.' });
      return;
    }

    const warnings = (payload.conflicts ?? []).filter((c) => !c.blocking);
    setConflicts(warnings.map((c) => ({ field: c.employee, message: c.message })));
    setMessage({
      tone: 'ok',
      text:
        warnings.length > 0
          ? 'Équipe enregistrée, avec des points à surveiller.'
          : 'Équipe enregistrée.',
    });
    router.refresh();
  }

  const selectClass =
    'h-9 rounded-[8px] border border-border-strong bg-surface px-2.5 text-[14px] outline-none focus:border-accent';

  return (
    <Card
      title="Équipe"
      action={
        !actions.assign ? (
          <span className="text-[13.5px] text-subtle">
            L’ordre de mission est émis : l’équipe est figée.
          </span>
        ) : null
      }
    >
      <div className="flex flex-col gap-4 px-5 py-5">
        {rows.length === 0 ? (
          <p className="text-[14px] text-muted">
            Aucun intervenant. Une mission a besoin d’au moins une personne pour que son ordre
            de mission puisse être émis.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {rows.map((r) => {
              const employee = employees.find((e) => e.id === r.employeeId);
              const until = employee ? coverUntil(employee) : null;
              const expired = until !== null && missionEnd !== null && until < missionEnd;

              return (
                <li
                  key={r.employeeId}
                  className="flex flex-wrap items-center gap-3 rounded-[10px] border border-border px-4 py-3"
                >
                  <span className="ref text-[13px] text-subtle">{r.matricule}</span>
                  <span className="min-w-0 flex-1 text-[14.5px]">{r.name}</span>

                  {employee?.isInspector && (
                    <StatusBadge tone={expired ? 'danger' : 'neutral'}>
                      {until
                        ? `certifié jusqu’au ${new Date(until).toLocaleDateString('fr-FR')}`
                        : 'sans certification'}
                    </StatusBadge>
                  )}

                  {actions.assign ? (
                    <>
                      <select
                        value={r.role}
                        onChange={(e) => update(r.employeeId, { role: e.target.value })}
                        className={selectClass}
                      >
                        {ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0.5}
                          max={60}
                          step={0.5}
                          value={r.plannedDays}
                          onChange={(e) =>
                            update(r.employeeId, { plannedDays: Number(e.target.value) })
                          }
                          className={`${selectClass} w-20 text-right`}
                        />
                        <span className="text-[13.5px] text-subtle">j</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setRows((current) => current.filter((x) => x.employeeId !== r.employeeId))
                        }
                        className="text-[13.5px] text-danger hover:underline"
                      >
                        Retirer
                      </button>
                    </>
                  ) : (
                    <span className="text-[13.5px] text-muted">
                      {ROLES.find((role) => role.value === r.role)?.label ?? r.role} ·{' '}
                      {r.plannedDays} j
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {actions.assign && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[280px] flex-1">
              <Field label="Ajouter un intervenant">
                <select
                  value=""
                  onChange={(e) => e.target.value && add(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3.5 text-[15px] outline-none focus:border-accent"
                >
                  <option value="">Choisir…</option>
                  {available.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                      {e.department ? ` · ${e.department}` : ''}
                      {e.position ? ` — ${e.position}` : ''}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Button variant="accent" onClick={save} disabled={busy || rows.length === 0}>
              {busy ? 'Enregistrement…' : 'Enregistrer l’équipe'}
            </Button>
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

        {conflicts.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {conflicts.map((c, i) => (
              <li key={`${c.field}-${i}`} className="text-[13.5px] text-muted">
                <span className="font-medium">{c.field}</span> — {c.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

/** Émission puis signature de l'ordre de mission. */
export function MissionOrderPanel({
  missionId,
  order,
  actions,
  defaultObject,
}: {
  missionId: string;
  order: {
    number: string;
    status: string;
    object: string;
    instructions: string | null;
    hseInstructions: string | null;
    signedAt: string | null;
    signatureHash: string | null;
  } | null;
  actions: Actions;
  defaultObject: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function call(action: string, body?: unknown) {
    setBusy(action);
    setMessage(null);

    const response = await fetch(`/api/missions/${missionId}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      errors?: Array<{ field: string; message: string }>;
    };
    setBusy(null);

    if (!response.ok) {
      setMessage(
        payload.errors?.map((e) => `${e.field} — ${e.message}`).join(' · ') ??
          payload.message ??
          'Opération refusée.',
      );
      return;
    }
    router.refresh();
  }

  async function issue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await call('order', {
      object: String(form.get('object') ?? '').trim(),
      instructions: String(form.get('instructions') ?? '').trim(),
      hseInstructions: String(form.get('hseInstructions') ?? '').trim(),
    });
  }

  const signed = order?.status === 'SIGNED' || order?.status === 'IN_PROGRESS';

  return (
    <Card
      title="Ordre de mission"
      action={
        order ? (
          <span className="flex items-center gap-2">
            <span className="ref text-[13.5px]">{order.number}</span>
            <StatusBadge tone={signed ? 'success' : 'warning'}>
              {signed ? 'Signé' : 'Émis, en attente de signature'}
            </StatusBadge>
          </span>
        ) : (
          <span className="text-[13.5px] text-subtle">Pas encore émis</span>
        )
      }
    >
      <div className="flex flex-col gap-4 px-5 py-5">
        {signed && order ? (
          <>
            <p className="text-[14.5px]">{order.object}</p>
            {order.instructions && (
              <div>
                <p className="text-[13px] uppercase tracking-[0.04em] text-subtle">Consignes</p>
                <p className="mt-1 whitespace-pre-line text-[14.5px]">{order.instructions}</p>
              </div>
            )}
            {order.hseInstructions && (
              <div>
                <p className="text-[13px] uppercase tracking-[0.04em] text-subtle">Consignes HSE</p>
                <p className="mt-1 whitespace-pre-line text-[14.5px]">{order.hseInstructions}</p>
              </div>
            )}
            <p className="text-[13.5px] text-muted">
              Signé le {order.signedAt ? new Date(order.signedAt).toLocaleString('fr-FR') : '—'} ·
              empreinte <span className="ref">{order.signatureHash?.slice(0, 16)}…</span>
            </p>
            <p className="text-[13.5px] text-subtle">
              La saisie terrain est ouverte : les inspecteurs affectés peuvent démarrer.
            </p>
            <a
              href={`/api/missions/${missionId}/order-pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 w-fit items-center rounded-[10px] bg-accent px-4 text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-accent-hover"
            >
              Ouvrir le PDF signé
            </a>
          </>
        ) : actions.issueOrder ? (
          <form onSubmit={issue} className="flex flex-col gap-4">
            <Field label="Objet de la mission">
              <Input name="object" required maxLength={300} defaultValue={order?.object ?? defaultObject} />
            </Field>
            <Field label="Consignes">
              <textarea
                name="instructions"
                rows={2}
                defaultValue={order?.instructions ?? ''}
                className="w-full rounded-[10px] border border-border-strong bg-surface px-3.5 py-2.5 text-[15px] outline-none focus:border-accent"
              />
            </Field>
            <Field
              label="Consignes HSE"
              hint="EPI, permis de travail, points de rassemblement — ce que l’intervenant doit avoir lu avant de partir."
            >
              <textarea
                name="hseInstructions"
                rows={2}
                defaultValue={order?.hseInstructions ?? ''}
                className="w-full rounded-[10px] border border-border-strong bg-surface px-3.5 py-2.5 text-[15px] outline-none focus:border-accent"
              />
            </Field>
            <div>
              <Button type="submit" variant="accent" disabled={busy !== null}>
                {busy === 'order' ? 'Émission…' : 'Émettre l’ordre de mission'}
              </Button>
            </div>
          </form>
        ) : order ? (
          <>
            <p className="text-[14.5px]">{order.object}</p>
            <p className="text-[13.5px] text-muted">
              L’ordre est émis. Sa signature ouvre la saisie terrain — elle relève du chef de
              département.
            </p>
          </>
        ) : (
          <p className="text-[14px] text-muted">
            Affectez au moins un intervenant : c’est l’ordre de mission qui les nomme.
          </p>
        )}

        {actions.signOrder && (
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button
              variant="accent"
              onClick={() => call('order-sign')}
              disabled={busy !== null}
            >
              {busy === 'order-sign' ? 'Signature…' : 'Signer l’ordre de mission'}
            </Button>
            <span className="text-[13.5px] text-subtle">
              La signature est horodatée et scellée par une empreinte du contenu.
            </span>
          </div>
        )}

        {message && (
          <p role="alert" className="rounded-[10px] bg-danger-soft px-4 py-3 text-[14px] text-danger">
            {message}
          </p>
        )}
      </div>
    </Card>
  );
}
