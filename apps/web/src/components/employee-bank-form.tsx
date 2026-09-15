'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Field, Input } from '@/components/ui';

/**
 * Coordonnées bancaires du bénéficiaire — c'est cette fiche que l'ordre de
 * virement généré au règlement d'une note de frais vient lire.
 */
export function EmployeeBankForm({
  employeeId,
  bankName,
  bankRib,
  editable,
}: {
  employeeId: string;
  bankName: string | null;
  bankRib: string | null;
  editable: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/employees/${employeeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bankName: String(form.get('bankName') ?? '').trim(),
        bankRib: String(form.get('bankRib') ?? '').trim(),
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    setBusy(false);

    if (!response.ok) {
      setMessage({ tone: 'error', text: payload.message ?? 'Enregistrement refusé.' });
      return;
    }

    setEditing(false);
    router.refresh();
  }

  return (
    <Card
      title="Coordonnées bancaires"
      action={
        editable && !editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[13px] font-medium text-accent hover:underline"
          >
            Modifier
          </button>
        ) : null
      }
    >
      <div className="flex flex-col gap-4 px-5 py-5">
        {editing ? (
          <form onSubmit={save} className="flex flex-col gap-4">
            <Field label="Banque" hint="Nom de la banque du bénéficiaire.">
              <Input name="bankName" maxLength={120} defaultValue={bankName ?? ''} />
            </Field>
            <Field label="RIB" hint="24 chiffres — celui qui figurera sur l’ordre de virement.">
              <Input name="bankRib" maxLength={34} defaultValue={bankRib ?? ''} />
            </Field>
            <div className="flex items-center gap-3">
              <Button type="submit" variant="accent" disabled={busy}>
                {busy ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-[13.5px] text-subtle hover:underline"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <dl className="flex flex-col gap-3">
            <div>
              <dt className="text-[12.5px] uppercase tracking-[0.04em] text-subtle">Banque</dt>
              <dd className="mt-0.5 text-[14.5px]">{bankName ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] uppercase tracking-[0.04em] text-subtle">RIB</dt>
              <dd className="ref mt-0.5 text-[14.5px]">{bankRib ?? '—'}</dd>
            </div>
            {!bankRib && (
              <p className="text-[13.5px] text-subtle">
                Sans RIB, l’ordre de virement généré au règlement des notes de frais de cet
                employé restera à compléter à la main.
              </p>
            )}
          </dl>
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
      </div>
    </Card>
  );
}
