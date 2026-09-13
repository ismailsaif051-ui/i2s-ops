'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Field, Input } from '@/components/ui';

export interface EmployeeOption {
  id: string;
  name: string;
  matricule: string;
}

/**
 * Demande d'avance.
 *
 * Une avance est de la trésorerie sortie avant justificatif : elle se retient
 * ensuite sur les notes de frais de l'intéressé, automatiquement.
 */
export function AdvanceRequestForm({
  employees,
  affairs,
}: {
  employees: EmployeeOption[];
  affairs: Array<{ id: string; number: string; client: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button variant="accent" onClick={() => setOpen(true)}>
        Enregistrer une demande
      </Button>
    );
  }

  const inputClass =
    'h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3.5 text-[15px] outline-none focus:border-accent';

  return (
    <Card title="Demande d’avance">
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError(null);

          const form = new FormData(event.currentTarget);
          const affairId = String(form.get('affairId') ?? '').trim();

          const response = await fetch('/api/avances/demande', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeId: String(form.get('employeeId') ?? ''),
              amount: Number(form.get('amount') ?? 0),
              reason: String(form.get('reason') ?? '').trim(),
              affairId: affairId || null,
            }),
          });

          const payload = (await response.json().catch(() => ({}))) as { message?: string };
          setBusy(false);

          if (!response.ok) {
            setError(payload.message ?? 'Demande refusée.');
            return;
          }

          setOpen(false);
          router.refresh();
        }}
        className="flex flex-col gap-4 px-5 py-5"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Bénéficiaire">
            <select name="employeeId" required className={inputClass}>
              <option value="">Choisir…</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} — {e.matricule}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Montant (DH)">
            <Input type="number" name="amount" required min="1" step="0.01" />
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
        </div>

        <Field label="Motif" hint="Ce que l’avance doit couvrir.">
          <Input
            name="reason"
            required
            minLength={3}
            maxLength={500}
            placeholder="Mission Laâyoune — hébergement et carburant"
          />
        </Field>

        {error && (
          <p role="alert" className="rounded-[8px] bg-danger-soft px-3.5 py-2.5 text-[14px] text-danger">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" variant="accent" disabled={busy}>
            {busy ? 'Enregistrement…' : 'Enregistrer la demande'}
          </Button>
          <Button type="button" onClick={() => setOpen(false)}>
            Annuler
          </Button>
        </div>
      </form>
    </Card>
  );
}

/** Accorder, refuser, verser. */
export function AdvanceDecision({
  advanceId,
  status,
  canApprove,
  canPay,
}: {
  advanceId: string;
  status: string;
  canApprove: boolean;
  canPay: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(path: string, body?: unknown, key = path) {
    setBusy(key);
    setError(null);

    const response = await fetch(`/api/avances/${advanceId}/${path}`, {
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
          maxLength={500}
          autoFocus
          placeholder="Motif du refus"
          className="h-9 min-w-[180px] flex-1 rounded-[8px] border border-border-strong bg-surface px-3 text-[14px] outline-none focus:border-accent"
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
      {status === 'REQUESTED' && canApprove && (
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

      {status === 'APPROVED' && canPay && (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => call('versement', {}, 'verser')}
          className="text-[13.5px] font-medium text-accent hover:underline disabled:opacity-50"
        >
          {busy === 'verser' ? 'Versement…' : 'Enregistrer le versement'}
        </button>
      )}

      {error && <span className="text-[13px] text-danger">{error}</span>}
    </div>
  );
}
