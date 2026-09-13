'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Field, Input } from '@/components/ui';

export interface LeaveTypeOption {
  code: string;
  label: string;
}

/**
 * Dépôt d'une demande de congé.
 *
 * Le nombre de jours n'est pas demandé : le serveur le compte sur le
 * calendrier de la société. Un pont férié ne se déduit pas du solde.
 */
export function LeaveRequestForm({ types }: { types: LeaveTypeOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; details: string[] } | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  if (!open) {
    return (
      <Button variant="accent" onClick={() => setOpen(true)}>
        Poser un congé
      </Button>
    );
  }

  const inputClass =
    'h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3.5 text-[15px] outline-none focus:border-accent';

  return (
    <Card title="Poser un congé">
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError(null);
          setWarnings([]);

          const form = new FormData(event.currentTarget);
          const response = await fetch('/api/conges/demande', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: String(form.get('type') ?? 'ANNUAL'),
              startDate: String(form.get('startDate') ?? ''),
              endDate: String(form.get('endDate') ?? ''),
              reason: String(form.get('reason') ?? '').trim() || null,
            }),
          });

          const payload = (await response.json().catch(() => ({}))) as {
            message?: string;
            errors?: Array<{ field: string; message: string }>;
            warnings?: Array<{ message: string }>;
          };

          setBusy(false);

          if (!response.ok) {
            setError({
              message: payload.message ?? 'Demande refusée.',
              details: (payload.errors ?? []).map((e) => e.message),
            });
            return;
          }

          setWarnings((payload.warnings ?? []).map((w) => w.message));
          if ((payload.warnings ?? []).length === 0) setOpen(false);
          router.refresh();
        }}
        className="flex flex-col gap-4 px-5 py-5"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Nature">
            <select name="type" required defaultValue="ANNUAL" className={inputClass}>
              {types.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Du">
            <Input type="date" name="startDate" required />
          </Field>
          <Field label="Au">
            <Input type="date" name="endDate" required />
          </Field>
        </div>

        <Field label="Motif" hint="Facultatif, sauf pour un congé exceptionnel.">
          <Input name="reason" maxLength={500} />
        </Field>

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

        {warnings.length > 0 && (
          <div className="rounded-[10px] bg-warning-soft px-4 py-3">
            <p className="text-[14px] font-medium text-warning">
              Demande enregistrée, avec des points à régler
            </p>
            <ul className="mt-1.5 flex flex-col gap-1">
              {warnings.map((w) => (
                <li key={w} className="text-[13.5px] text-muted">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2">
          <Button type="submit" variant="accent" disabled={busy}>
            {busy ? 'Envoi…' : 'Transmettre la demande'}
          </Button>
          <Button type="button" onClick={() => setOpen(false)}>
            Fermer
          </Button>
        </div>
      </form>
    </Card>
  );
}

/** Accorder, refuser, ou retirer une demande. */
export function LeaveDecision({
  leaveId,
  canApprove,
  canCancel,
}: {
  leaveId: string;
  canApprove: boolean;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(path: string, body?: unknown, key = path) {
    setBusy(key);
    setError(null);

    const response = await fetch(`/api/conges/${leaveId}/${path}`, {
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

    setRejecting(false);
    router.refresh();
  }

  if (rejecting) {
    return (
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          await call('decision', {
            decision: 'REJECT',
            comment: String(form.get('comment') ?? '').trim(),
          });
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <input
          name="comment"
          required
          minLength={3}
          maxLength={1000}
          autoFocus
          placeholder="Motif du refus"
          className="h-9 min-w-[200px] flex-1 rounded-[8px] border border-border-strong bg-surface px-3 text-[14px] outline-none focus:border-accent"
        />
        <Button type="submit" variant="accent" disabled={busy !== null}>
          Refuser
        </Button>
        <Button type="button" onClick={() => setRejecting(false)}>
          Annuler
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canApprove && (
        <>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => call('decision', { decision: 'APPROVE' }, 'accorder')}
            className="text-[13.5px] font-medium text-accent hover:underline disabled:opacity-50"
          >
            {busy === 'accorder' ? 'Accord…' : 'Accorder'}
          </button>
          <button
            type="button"
            onClick={() => setRejecting(true)}
            className="text-[13.5px] text-muted hover:text-danger"
          >
            Refuser
          </button>
        </>
      )}
      {canCancel && (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => call('annulation', {}, 'annuler')}
          className="text-[13.5px] text-muted hover:text-danger disabled:opacity-50"
        >
          {busy === 'annuler' ? '…' : 'Retirer'}
        </button>
      )}
      {error && <span className="text-[13px] text-danger">{error}</span>}
    </div>
  );
}
