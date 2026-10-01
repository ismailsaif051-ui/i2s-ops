'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, EmptyState, Field, Input } from '@/components/ui';
import { date, moneyDh } from '@/lib/format';

export interface DailyCostPeriod {
  id: string;
  amount: string;
  validFrom: string;
  validTo: string | null;
  reason: string | null;
}

interface SetCostResult {
  message?: string;
  repricedDays?: number;
  lockedDays?: number;
}

function today(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n > 1 ? 's' : ''}`;
}

/**
 * Coût journalier d'un employé : périodes successives, jamais écrasées.
 *
 * Un nouveau coût ouvre une période à sa date d'effet et ferme la précédente
 * la veille. Antidaté, il revalorise les journées déjà pointées depuis cette
 * date — sauf celles d'un mois clôturé.
 */
export function DailyCostCard({
  employeeId,
  costs,
  editable,
}: {
  employeeId: string;
  costs: DailyCostPeriod[];
  editable: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setDone(null);

    const form = new FormData(event.currentTarget);
    const amount = String(form.get('amount') ?? '')
      .replace(/\s/g, '')
      .replace(',', '.');
    const validFrom = String(form.get('validFrom') ?? '');

    const response = await fetch(`/api/employees/${employeeId}/daily-costs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        validFrom,
        currency: 'MAD',
        reason: String(form.get('reason') ?? '').trim(),
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as SetCostResult;
    setBusy(false);

    if (!response.ok) {
      setError(payload.message ?? 'Enregistrement refusé.');
      return;
    }

    const parts = [`Nouveau coût en vigueur à partir du ${date(validFrom)}.`];
    if (payload.repricedDays) {
      parts.push(`${plural(payload.repricedDays, 'journée')} déjà pointée(s) revalorisée(s).`);
    }
    if (payload.lockedDays) {
      parts.push(
        `${plural(payload.lockedDays, 'journée')} d’un mois clôturé garde(nt) l’ancien coût.`,
      );
    }
    setDone(parts.join(' '));
    setEditing(false);
    router.refresh();
  }

  return (
    <Card
      title="Coût journalier"
      action={
        editable && !editing ? (
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setDone(null);
            }}
            className="text-[13px] font-medium text-accent hover:underline"
          >
            Nouveau coût
          </button>
        ) : null
      }
    >
      {editing && (
        <form onSubmit={save} className="flex flex-col gap-4 border-b border-border px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Coût journalier (DH)"
              hint="Coût complet d’une journée : salaire et charges."
            >
              <Input name="amount" inputMode="decimal" required autoFocus placeholder="ex. 950" />
            </Field>
            <Field
              label="Date d’effet"
              hint="Peut être passée : les journées déjà pointées depuis seront revalorisées."
            >
              <Input name="validFrom" type="date" required defaultValue={today()} />
            </Field>
          </div>
          <Field
            label="Motif"
            hint="Obligatoire — conservé dans l’historique et le journal d’audit."
          >
            <Input
              name="reason"
              required
              minLength={3}
              maxLength={500}
              placeholder="ex. Augmentation annuelle 2026"
            />
          </Field>

          {error && (
            <p
              role="alert"
              className="rounded-[10px] bg-danger-soft px-4 py-3 text-[14px] text-danger"
            >
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" variant="accent" disabled={busy}>
              {busy ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
              className="text-[13.5px] text-subtle hover:underline"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {done && (
        <p
          role="status"
          className="border-b border-border bg-success-soft px-5 py-3 text-[14px] text-success"
        >
          {done}
        </p>
      )}

      {costs.length === 0 ? (
        <EmptyState
          title="Aucun coût journalier"
          description="Sans coût journalier, aucune marge n’est calculable pour cet employé sur ses affaires et missions."
        />
      ) : (
        <ul className="divide-y divide-border">
          {costs.map((c) => (
            <li key={c.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-3">
              <span className="ref text-[14px] font-medium">{moneyDh(Number(c.amount), 2)}</span>
              <span className="text-[13.5px] text-muted">
                depuis le {date(c.validFrom)}
                {c.validTo ? ` · jusqu’au ${date(c.validTo)}` : ' · en cours'}
              </span>
              {c.reason && <span className="basis-full text-[13px] text-subtle">{c.reason}</span>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
