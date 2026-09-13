'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CHECK_DECISION_LABELS, type CheckDecision } from '@i2s/contracts';
import { Button, Card, Field, StatusBadge } from '@/components/ui';

export interface CheckLine {
  criterion: string;
  applicable: boolean;
  conform: boolean | null;
  comment: string | null;
}

interface Actions {
  take: boolean;
  check: boolean;
  issue: boolean;
  deliver: boolean;
  revise: boolean;
}

/** Verdict d'un critère : trois états, dont « sans objet ». */
type Verdict = 'C' | 'NC' | 'SO' | null;

function verdictOf(line: CheckLine): Verdict {
  if (!line.applicable) return 'SO';
  if (line.conform === true) return 'C';
  if (line.conform === false) return 'NC';
  return null;
}

const VERDICTS: Array<{ value: Exclude<Verdict, null>; label: string; hint: string }> = [
  { value: 'C', label: 'Conforme', hint: 'Le critère est satisfait' },
  { value: 'NC', label: 'Non conforme', hint: 'Le rapport repart en correction' },
  { value: 'SO', label: 'Sans objet', hint: 'Le critère ne s’applique pas ici' },
];

export function ReportVerification({
  reportId,
  status,
  criteria,
  existing,
  actions,
  checkerName,
}: {
  reportId: string;
  status: string;
  criteria: string[];
  existing: CheckLine[];
  actions: Actions;
  checkerName: string | null;
}) {
  const router = useRouter();

  const [lines, setLines] = useState<CheckLine[]>(() =>
    criteria.map((criterion) => {
      const saved = existing.find((e) => e.criterion === criterion);
      return (
        saved ?? { criterion, applicable: true, conform: null, comment: null }
      );
    }),
  );
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; details: string[] } | null>(null);

  const nonConform = lines.filter((l) => l.applicable && l.conform === false);
  const pending = lines.filter((l) => l.applicable && l.conform === null);
  const canValidate = pending.length === 0 && nonConform.length === 0;

  function setVerdict(index: number, verdict: Exclude<Verdict, null>) {
    setLines((current) =>
      current.map((line, i) =>
        i === index
          ? {
              ...line,
              applicable: verdict !== 'SO',
              conform: verdict === 'C' ? true : verdict === 'NC' ? false : null,
            }
          : line,
      ),
    );
  }

  function setComment(index: number, comment: string) {
    setLines((current) =>
      current.map((line, i) => (i === index ? { ...line, comment } : line)),
    );
  }

  async function call(path: string, body?: unknown) {
    setBusy(path);
    setError(null);

    const response = await fetch(`/api/reports/${reportId}/${path}`, {
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
        details: (payload.errors ?? []).map((e) => `${e.field} — ${e.message}`),
      });
      return false;
    }

    router.refresh();
    return true;
  }

  const decide = (decision: CheckDecision) =>
    call('check', {
      checks: lines.map((l) => ({
        criterion: l.criterion,
        applicable: l.applicable,
        conform: l.applicable ? l.conform : null,
        comment: l.comment,
      })),
      decision,
      reason: decision === 'CORRECTION' ? reason : null,
    });

  const readOnly = !actions.check;

  return (
    <Card
      title="Vérification"
      action={
        checkerName ? (
          <span className="text-[13.5px] text-muted">Vérificateur : {checkerName}</span>
        ) : (
          <span className="text-[13.5px] text-subtle">Aucun vérificateur assigné</span>
        )
      }
    >
      <div className="flex flex-col gap-4 px-5 py-5">
        {status === 'SUBMITTED' && actions.take && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-surface-2 px-4 py-3">
            <p className="text-[14px]">
              Prenez le rapport en charge pour ouvrir la grille. La vérification
              s’enregistre à votre nom.
            </p>
            <Button
              variant="accent"
              disabled={busy !== null}
              onClick={() => call('take')}
            >
              {busy === 'take' ? 'Prise en charge…' : 'Prendre en charge'}
            </Button>
          </div>
        )}

        <ul className="flex flex-col gap-3">
          {lines.map((line, index) => {
            const verdict = verdictOf(line);
            return (
              <li key={line.criterion} className="rounded-[10px] border border-border px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="min-w-0 flex-1 text-[14.5px]">{line.criterion}</span>

                  {readOnly ? (
                    verdict === null ? (
                      <StatusBadge tone="neutral">Non vérifié</StatusBadge>
                    ) : (
                      <StatusBadge
                        tone={verdict === 'C' ? 'success' : verdict === 'NC' ? 'danger' : 'neutral'}
                      >
                        {VERDICTS.find((v) => v.value === verdict)?.label}
                      </StatusBadge>
                    )
                  ) : (
                    <div className="flex shrink-0 gap-1.5">
                      {VERDICTS.map((v) => (
                        <button
                          key={v.value}
                          type="button"
                          title={v.hint}
                          onClick={() => setVerdict(index, v.value)}
                          className={`h-8 rounded-[8px] border px-3 text-[13px] font-medium transition-colors ${
                            verdict === v.value
                              ? v.value === 'NC'
                                ? 'border-danger bg-danger-soft text-danger'
                                : v.value === 'C'
                                  ? 'border-success bg-success-soft text-success'
                                  : 'border-border-strong bg-surface-2 text-muted'
                              : 'border-border text-muted hover:border-border-strong'
                          }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {(line.conform === false || (line.comment && readOnly)) && (
                  <div className="mt-2.5">
                    {readOnly ? (
                      line.comment && (
                        <p className="text-[13.5px] text-muted">{line.comment}</p>
                      )
                    ) : (
                      <textarea
                        rows={2}
                        value={line.comment ?? ''}
                        onChange={(e) => setComment(index, e.target.value)}
                        placeholder="Ce qui doit être repris — obligatoire pour un critère non conforme"
                        className="w-full rounded-[8px] border border-border-strong bg-surface px-3 py-2 text-[14px] outline-none focus:border-accent"
                      />
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {!readOnly && (
          <>
            {nonConform.length > 0 && (
              <div>
                <label className="mb-1.5 block text-[14px] font-medium">
                  Motif du renvoi en correction
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ce que le rédacteur doit reprendre, en une phrase"
                  className="w-full rounded-[8px] border border-border-strong bg-surface px-3 py-2 text-[14px] outline-none focus:border-accent"
                />
              </div>
            )}

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

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="accent"
                disabled={busy !== null || !canValidate}
                onClick={() => decide('VALIDATE')}
              >
                {busy === 'check' ? 'Enregistrement…' : CHECK_DECISION_LABELS.VALIDATE}
              </Button>
              <Button
                disabled={busy !== null || nonConform.length === 0}
                onClick={() => decide('CORRECTION')}
              >
                {CHECK_DECISION_LABELS.CORRECTION}
              </Button>

              <p className="text-[13.5px] text-subtle">
                {pending.length > 0
                  ? `${pending.length} critère(s) sans verdict`
                  : nonConform.length > 0
                    ? `${nonConform.length} critère(s) non conforme(s) — la validation est fermée`
                    : 'Grille complète, aucun écart'}
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

/** Émission et remise : deux gestes distincts, deux traces distinctes. */
export function ReportIssuance({
  reportId,
  actions,
  issuedAt,
  deliveredAt,
}: {
  reportId: string;
  actions: Actions;
  issuedAt: string | null;
  deliveredAt: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [channel, setChannel] = useState('EMAIL');
  const [error, setError] = useState<string | null>(null);

  const [revising, setRevising] = useState(false);

  if (!actions.issue && !actions.deliver && !actions.revise) return null;

  async function call(path: string, body?: unknown) {
    setBusy(path);
    setError(null);

    const response = await fetch(`/api/reports/${reportId}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });

    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    setBusy(null);

    if (!response.ok) {
      setError(payload.message ?? 'Opération refusée.');
      return;
    }
    router.refresh();
  }

  return (
    <Card title="Émission">
      <div className="flex flex-col gap-4 px-5 py-5">
        {actions.issue && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[14px]">
              L’émission fige le rapport. Toute reprise ultérieure passera par une
              révision numérotée.
            </p>
            <Button variant="accent" disabled={busy !== null} onClick={() => call('issue')}>
              {busy === 'issue' ? 'Émission…' : 'Émettre le rapport'}
            </Button>
          </div>
        )}

        {actions.deliver && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px]">
              <label className="mb-1.5 block text-[14px] font-medium">Canal de remise</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="h-10 w-full rounded-[8px] border border-border-strong bg-surface px-3 text-[14.5px] outline-none focus:border-accent"
              >
                <option value="EMAIL">Courriel</option>
                <option value="PORTAL">Portail client</option>
                <option value="HAND">Remise en main propre</option>
                <option value="MAIL">Courrier</option>
              </select>
            </div>
            <Button disabled={busy !== null} onClick={() => call('deliver', { channel })}>
              {busy === 'deliver' ? 'Enregistrement…' : 'Enregistrer la remise'}
            </Button>
            <p className="text-[13.5px] text-subtle">
              {deliveredAt
                ? 'Une relance n’avance pas la date de remise : la première fait foi.'
                : 'La date de remise arrête le compteur du délai qualité.'}
            </p>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-[8px] bg-danger-soft px-3.5 py-2.5 text-[14px] text-danger">
            {error}
          </p>
        )}

        {actions.revise && (
          <div className="border-t border-border pt-4">
            {revising ? (
              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  await call('revise', { reason: String(form.get('reason') ?? '').trim() });
                  setRevising(false);
                }}
                className="flex flex-col gap-3"
              >
                <Field
                  label="Motif de la révision"
                  hint="Ce que la nouvelle version corrige — il figurera au dossier."
                >
                  <textarea
                    name="reason"
                    rows={2}
                    required
                    autoFocus
                    className="w-full rounded-[8px] border border-border-strong bg-surface px-3 py-2 text-[14px] outline-none focus:border-accent"
                  />
                </Field>
                <div className="flex gap-2">
                  <Button type="submit" variant="accent" disabled={busy !== null}>
                    {busy === 'revise' ? 'Ouverture…' : 'Ouvrir la révision'}
                  </Button>
                  <Button type="button" onClick={() => setRevising(false)}>
                    Annuler
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => setRevising(true)}>Réviser le rapport</Button>
                <span className="text-[13.5px] text-subtle">
                  La pièce déjà remise reste consultable : la révision en ajoute une, elle
                  n’efface pas la précédente.
                </span>
              </div>
            )}
          </div>
        )}

        {issuedAt && !actions.issue && !actions.deliver && !actions.revise && (
          <p className="text-[14px] text-muted">Rapport déjà émis.</p>
        )}
      </div>
    </Card>
  );
}
