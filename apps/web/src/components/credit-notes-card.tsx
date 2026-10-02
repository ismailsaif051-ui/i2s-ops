'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, DataTable, EmptyState, Field, Input, Td, Th } from '@/components/ui';
import { date, money } from '@/lib/format';

export interface CreditNote {
  id: string;
  number: string;
  issueDate: string;
  amountHT: number;
  amountTTC: number;
  reason: string;
}

/**
 * Avoirs d'une facture.
 *
 * Une facture émise ne se modifie pas : une erreur de quantité, un geste
 * commercial ou une annulation se corrigent par un avoir, numéroté à part et
 * au même taux de TVA. Il réduit le chiffre d'affaires et le reste dû.
 */
export function CreditNotesCard({
  invoiceId,
  creditNotes,
  canCreate,
  creditableHT,
  remaining,
  vatRate,
}: {
  invoiceId: string;
  creditNotes: CreditNote[];
  canCreate: boolean;
  creditableHT: number;
  remaining: number;
  vatRate: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [amount, setAmount] = useState('');

  if (!canCreate && creditNotes.length === 0) return null;

  // Plafond affiché : ni plus que le HT restant, ni plus que le reste dû.
  const maxHT = Math.min(creditableHT, Math.round((remaining / (1 + vatRate / 100)) * 100) / 100);
  const parsed = Number(amount.replace(/\s/g, '').replace(',', '.'));
  const previewTTC = parsed > 0 ? Math.round(parsed * (1 + vatRate / 100) * 100) / 100 : null;
  const total = creditNotes.reduce((s, c) => s + c.amountTTC, 0);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/facturation/factures/${invoiceId}/avoirs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amountHT: amount,
        reason: String(form.get('reason') ?? '').trim(),
        issueDate: String(form.get('issueDate') || '') || undefined,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      number?: string;
      remaining?: number;
    };
    setBusy(false);
    if (!response.ok) {
      setError(payload.message ?? 'Avoir refusé.');
      return;
    }
    setDone(
      `Avoir ${payload.number} émis.${payload.remaining === 0 ? ' La facture est soldée.' : ` Reste dû : ${money(payload.remaining ?? 0)}.`}`,
    );
    setOpen(false);
    setAmount('');
    router.refresh();
  }

  return (
    <Card
      title={creditNotes.length > 0 ? `Avoirs — ${money(total)} TTC` : 'Avoirs'}
      action={
        canCreate && !open ? (
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setDone(null);
            }}
            className="text-[13px] font-medium text-accent hover:underline"
          >
            Émettre un avoir
          </button>
        ) : null
      }
    >
      {open && (
        <form onSubmit={submit} className="flex flex-col gap-4 border-b border-border px-5 py-5">
          <p className="text-[14px] text-muted">
            L’avoir corrige la facture sans la modifier : il porte son propre numéro et la même TVA
            ({vatRate} %). Pour annuler toute la facture, saisissez la totalité du montant restant.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Montant HT (DH)"
              hint={`Au plus ${money(maxHT)} HT${previewTTC ? ` · soit ${money(previewTTC)} TTC` : ''}`}
            >
              <Input
                id="credit-amount"
                name="amountHT"
                inputMode="decimal"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <Field label="Date d’émission">
              <Input id="credit-date" name="issueDate" type="date" />
            </Field>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setAmount(String(maxHT).replace('.', ','))}
                className="mb-3 text-[13px] font-medium text-accent hover:underline"
              >
                Tout le montant restant
              </button>
            </div>
          </div>
          <Field label="Motif" hint="Obligatoire — figure sur l’avoir et dans le journal d’audit.">
            <Input
              id="credit-reason"
              name="reason"
              required
              minLength={3}
              maxLength={500}
              placeholder="ex. Deux vacations facturées en double sur la mission MIS-26-0042"
            />
          </Field>
          {error && (
            <p role="alert" className="rounded-[10px] bg-danger-soft px-4 py-3 text-[14px] text-danger">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" variant="accent" disabled={busy}>
              {busy ? 'Émission…' : 'Émettre l’avoir'}
            </Button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
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
        <p role="status" className="border-b border-border bg-success-soft px-5 py-3 text-[14px] text-success">
          {done}
        </p>
      )}

      {creditNotes.length === 0 ? (
        <EmptyState
          title="Aucun avoir"
          description="Une erreur sur une facture émise se corrige par un avoir, jamais en modifiant la facture."
        />
      ) : (
        <div className="overflow-x-auto">
          <DataTable>
            <thead>
              <tr>
                <Th>N°</Th>
                <Th>Date</Th>
                <Th>Motif</Th>
                <Th align="right">HT</Th>
                <Th align="right">TTC</Th>
              </tr>
            </thead>
            <tbody>
              {creditNotes.map((c) => (
                <tr key={c.id}>
                  <Td mono>{c.number}</Td>
                  <Td mono>{date(c.issueDate)}</Td>
                  <Td>{c.reason}</Td>
                  <Td mono align="right">
                    {money(c.amountHT)}
                  </Td>
                  <Td mono align="right">
                    {money(c.amountTTC)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </div>
      )}
    </Card>
  );
}
