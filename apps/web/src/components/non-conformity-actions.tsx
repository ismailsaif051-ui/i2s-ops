'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Field, Input, StatusBadge } from '@/components/ui';

export interface EmployeeOption {
  id: string;
  name: string;
  department: string | null;
}

interface Actions {
  assign: boolean;
  start: boolean;
  evidence: boolean;
  verify: boolean;
}

/**
 * Le traitement d'un écart, étape par étape.
 *
 * Chaque geste n'apparaît que si l'API l'autorise : l'écran ne propose jamais
 * une action qui serait refusée.
 */
export function NonConformityActions({
  ncId,
  status,
  actions,
  employees,
  hasEvidence,
}: {
  ncId: string;
  status: string;
  actions: Actions;
  employees: EmployeeOption[];
  hasEvidence: boolean;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<'assign' | 'evidence' | 'reject' | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; details: string[] } | null>(null);

  async function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName(null);
      setFileContent(null);
      return;
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);

    setFileName(file.name);
    setFileContent(btoa(binary));
  }

  async function call(path: string, body?: unknown, key = path) {
    setBusy(key);
    setError(null);

    const response = await fetch(`/api/ecarts/${ncId}/${path}`, {
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
      setError({
        message: payload.message ?? 'Opération refusée.',
        details: (payload.errors ?? []).map((e) => e.message),
      });
      return;
    }

    setPanel(null);
    setFileName(null);
    setFileContent(null);
    router.refresh();
  }

  if (!actions.assign && !actions.start && !actions.evidence && !actions.verify) {
    return status === 'CLOSED' ? (
      <Card title="Traitement">
        <p className="px-5 py-5 text-[14px] text-muted">
          Écart clôturé. La preuve de levée reste consultable à la GED.
        </p>
      </Card>
    ) : null;
  }

  const inputClass =
    'h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3.5 text-[15px] outline-none focus:border-accent';

  return (
    <Card title="Traitement">
      <div className="flex flex-col gap-4 px-5 py-5">
        {error && (
          <div role="alert" className="rounded-[10px] bg-danger-soft px-4 py-3">
            <p className="text-[14px] font-medium text-danger">{error.message}</p>
            {error.details.length > 0 && (
              <ul className="mt-1.5 flex flex-col gap-1">
                {error.details.map((d) => (
                  <li key={d} className="text-[13.5px] text-danger">
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {panel === null && (
          <div className="flex flex-wrap items-center gap-3">
            {actions.assign && (
              <Button onClick={() => setPanel('assign')}>
                {status === 'OPEN' ? 'Affecter' : 'Réaffecter'}
              </Button>
            )}
            {actions.start && (
              <Button disabled={busy !== null} onClick={() => call('prise-en-main')}>
                {busy === 'prise-en-main' ? 'Prise en main…' : 'Prendre en main'}
              </Button>
            )}
            {actions.evidence && (
              <Button variant="accent" onClick={() => setPanel('evidence')}>
                Rendre compte de la levée
              </Button>
            )}
            {actions.verify && (
              <>
                <Button
                  variant="accent"
                  disabled={busy !== null}
                  onClick={() => call('verification', { decision: 'CLOSE' }, 'cloturer')}
                >
                  {busy === 'cloturer' ? 'Clôture…' : 'Clôturer l’écart'}
                </Button>
                <Button onClick={() => setPanel('reject')}>Refuser la levée</Button>
              </>
            )}
          </div>
        )}

        {panel === 'assign' && (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const dueDate = String(form.get('dueDate') ?? '').trim();
              await call(
                'affectation',
                { ownerId: String(form.get('ownerId') ?? ''), dueDate: dueDate || null },
                'affectation',
              );
            }}
            className="flex flex-col gap-3"
          >
            <Field label="Responsable du traitement">
              <select name="ownerId" required className={inputClass}>
                <option value="">Choisir…</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                    {e.department ? ` — ${e.department}` : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Échéance" hint="Laissée vide, l’échéance de la gravité est conservée.">
              <Input type="date" name="dueDate" />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" variant="accent" disabled={busy !== null}>
                {busy === 'affectation' ? 'Affectation…' : 'Affecter'}
              </Button>
              <Button type="button" onClick={() => setPanel(null)}>
                Annuler
              </Button>
            </div>
          </form>
        )}

        {panel === 'evidence' && (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              await call(
                'levee',
                {
                  correctiveAction: String(form.get('correctiveAction') ?? '').trim(),
                  evidence: fileContent
                    ? { fileName: fileName ?? 'preuve.pdf', contentBase64: fileContent }
                    : null,
                },
                'levee',
              );
            }}
            className="flex flex-col gap-3"
          >
            <Field
              label="Action corrective menée"
              hint="Ce qui a été fait, par qui, et ce que ça change."
            >
              <textarea
                name="correctiveAction"
                rows={3}
                required
                minLength={5}
                maxLength={2000}
                className="w-full rounded-[10px] border border-border-strong bg-surface px-3.5 py-2.5 text-[15px] outline-none focus:border-accent"
              />
            </Field>
            <Field
              label="Preuve documentaire"
              hint={
                hasEvidence
                  ? 'Une preuve est déjà jointe. En choisir une autre la remplace.'
                  : 'Obligatoire : photo, rapport de contre-visite ou attestation.'
              }
            >
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={pickFile}
                className="h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3 py-2 text-[14px] file:mr-3 file:rounded-[6px] file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-[13.5px]"
              />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" variant="accent" disabled={busy !== null}>
                {busy === 'levee' ? 'Envoi…' : 'Transmettre à la vérification'}
              </Button>
              <Button type="button" onClick={() => setPanel(null)}>
                Annuler
              </Button>
            </div>
          </form>
        )}

        {panel === 'reject' && (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              await call(
                'verification',
                { decision: 'REJECT', comment: String(form.get('comment') ?? '').trim() },
                'refuser',
              );
            }}
            className="flex flex-col gap-3"
          >
            <Field label="Ce qui manque à la levée" hint="Le responsable doit savoir quoi reprendre.">
              <Input name="comment" required minLength={3} maxLength={1000} autoFocus />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" variant="accent" disabled={busy !== null}>
                {busy === 'refuser' ? 'Refus…' : 'Renvoyer en traitement'}
              </Button>
              <Button type="button" onClick={() => setPanel(null)}>
                Annuler
              </Button>
            </div>
          </form>
        )}

        {actions.verify && panel === null && (
          <p className="text-[13.5px] text-subtle">
            Vous vérifiez une levée que vous n’avez pas menée — c’est ce qui lui donne sa
            valeur devant un audit.
          </p>
        )}
      </div>
    </Card>
  );
}

/** Ouverture d'un écart, depuis la liste. */
export function OpenNonConformity({
  affairs,
  employees,
}: {
  affairs: Array<{ id: string; number: string; client: string }>;
  employees: EmployeeOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    'h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3.5 text-[15px] outline-none focus:border-accent';

  if (!open) {
    return (
      <Button variant="accent" onClick={() => setOpen(true)}>
        Ouvrir un écart
      </Button>
    );
  }

  return (
    <Card title="Ouvrir un écart">
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError(null);

          const form = new FormData(event.currentTarget);
          const affairId = String(form.get('affairId') ?? '').trim();
          const ownerId = String(form.get('ownerId') ?? '').trim();

          const response = await fetch('/api/ecarts/ouvrir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description: String(form.get('description') ?? '').trim(),
              severity: String(form.get('severity') ?? 'MINOR'),
              affairId: affairId || null,
              ownerId: ownerId || null,
            }),
          });

          const payload = (await response.json().catch(() => ({}))) as {
            id?: string;
            message?: string;
          };

          setBusy(false);

          if (!response.ok || !payload.id) {
            setError(payload.message ?? 'Ouverture impossible.');
            return;
          }

          router.push(`/operations/non-conformites/${payload.id}`);
        }}
        className="flex flex-col gap-4 px-5 py-5"
      >
        <Field label="Ce qui a été constaté" hint="Le fait, pas l’interprétation.">
          <textarea
            name="description"
            rows={3}
            required
            minLength={5}
            maxLength={2000}
            className="w-full rounded-[10px] border border-border-strong bg-surface px-3.5 py-2.5 text-[15px] outline-none focus:border-accent"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Gravité" hint="Elle fixe le délai de traitement.">
            <select name="severity" required defaultValue="MINOR" className={inputClass}>
              <option value="CRITICAL">Critique — 7 jours</option>
              <option value="MAJOR">Majeure — 30 jours</option>
              <option value="MINOR">Mineure — 60 jours</option>
              <option value="OBSERVATION">Observation — 90 jours</option>
            </select>
          </Field>

          <Field label="Affaire" hint="Facultatif.">
            <select name="affairId" className={inputClass}>
              <option value="">Aucune</option>
              {affairs.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.number} — {a.client}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Responsable" hint="Peut être désigné plus tard.">
            <select name="ownerId" className={inputClass}>
              <option value="">À désigner</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {error && (
          <p role="alert" className="rounded-[8px] bg-danger-soft px-3.5 py-2.5 text-[14px] text-danger">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" variant="accent" disabled={busy}>
            {busy ? 'Ouverture…' : 'Ouvrir l’écart'}
          </Button>
          <Button type="button" onClick={() => setOpen(false)}>
            Annuler
          </Button>
        </div>
      </form>
    </Card>
  );
}

/** Étapes franchies, pour situer l'écart d'un coup d'œil. */
export function NonConformitySteps({ status }: { status: string }) {
  const steps = [
    { key: 'OPEN', label: 'Ouverte' },
    { key: 'ASSIGNED', label: 'Affectée' },
    { key: 'IN_PROGRESS', label: 'En traitement' },
    { key: 'EVIDENCE_PROVIDED', label: 'Levée justifiée' },
    { key: 'CLOSED', label: 'Clôturée' },
  ];

  const index = steps.findIndex((s) => s.key === status);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((step, i) => (
        <StatusBadge
          key={step.key}
          tone={index < 0 ? 'neutral' : i < index ? 'success' : i === index ? 'accent' : 'neutral'}
        >
          {step.label}
        </StatusBadge>
      ))}
    </div>
  );
}
