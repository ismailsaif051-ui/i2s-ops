'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Field, Input } from '@/components/ui';

interface Message {
  tone: 'ok' | 'error';
  text: string;
}

function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(null);

  async function call(
    path: string,
    body: unknown,
    key: string,
  ): Promise<Record<string, unknown> | null> {
    setBusy(key);
    setMessage(null);

    const response = await fetch(`/api/facturation/${path}`, {
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
      setMessage({
        tone: 'error',
        text:
          payload.errors?.map((e) => `${e.field} — ${e.message}`).join(' · ') ??
          payload.message ??
          'Opération refusée.',
      });
      return null;
    }

    router.refresh();
    return payload as Record<string, unknown>;
  }

  return { busy, message, setMessage, call, router };
}

function Feedback({ message }: { message: Message | null }) {
  if (!message) return null;
  return (
    <p
      role="status"
      className={`rounded-[10px] px-4 py-3 text-[14px] ${
        message.tone === 'ok' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
      }`}
    >
      {message.text}
    </p>
  );
}

/** Circuit de l'attachement : transmission, signature du client, facturation. */
export function AttachmentActions({
  attachmentId,
  actions,
  status,
}: {
  attachmentId: string;
  actions: { submit: boolean; validate: boolean; invoice: boolean };
  status: string;
}) {
  const { busy, message, call, router } = useAction();

  if (!actions.submit && !actions.validate && !actions.invoice) {
    return status === 'INVOICED' ? null : (
      <Card title="Circuit">
        <p className="px-5 py-5 text-[14px] text-muted">
          Aucune action ouverte à ce stade avec vos droits.
        </p>
      </Card>
    );
  }

  return (
    <Card title="Circuit">
      <div className="flex flex-col gap-4 px-5 py-5">
        {actions.submit && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[14px]">
              Transmettez l’attachement au client : c’est la pièce qu’il signe pour reconnaître
              les journées passées chez lui.
            </p>
            <Button
              variant="accent"
              disabled={busy !== null}
              onClick={() => call(`attachements/${attachmentId}/transmettre`, {}, 'submit')}
            >
              {busy === 'submit' ? 'Transmission…' : 'Transmettre au client'}
            </Button>
          </div>
        )}

        {actions.validate && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[14px]">
              Le client a signé ? L’attachement devient facturable.
            </p>
            <Button
              variant="accent"
              disabled={busy !== null}
              onClick={() => call(`attachements/${attachmentId}/signer`, {}, 'validate')}
            >
              {busy === 'validate' ? 'Enregistrement…' : 'Signé par le client'}
            </Button>
          </div>
        )}

        {actions.invoice && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[14px]">
              L’attachement est signé : il peut partir en facture.
            </p>
            <Button
              variant="accent"
              disabled={busy !== null}
              onClick={async () => {
                const created = await call(
                  'factures',
                  { attachmentIds: [attachmentId] },
                  'invoice',
                );
                if (created?.id) router.push(`/finance/factures/${created.id}`);
              }}
            >
              {busy === 'invoice' ? 'Facturation…' : 'Établir la facture'}
            </Button>
          </div>
        )}

        <Feedback message={message} />
      </div>
    </Card>
  );
}

/** Émission d'une facture et saisie des règlements. */
export function InvoiceActions({
  invoiceId,
  actions,
  remaining,
}: {
  invoiceId: string;
  actions: { issue: boolean; pay: boolean };
  remaining: number;
}) {
  const { busy, message, call } = useAction();
  const [paying, setPaying] = useState(false);

  if (!actions.issue && !actions.pay) return null;

  return (
    <Card title="Règlement">
      <div className="flex flex-col gap-4 px-5 py-5">
        {actions.issue && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[14px]">
              L’émission fait courir l’échéance : à partir de là, la facture est suivie au
              recouvrement.
            </p>
            <Button
              variant="accent"
              disabled={busy !== null}
              onClick={() => call(`factures/${invoiceId}/emettre`, {}, 'issue')}
            >
              {busy === 'issue' ? 'Émission…' : 'Émettre la facture'}
            </Button>
          </div>
        )}

        {actions.pay &&
          (paying ? (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const done = await call(
                  `factures/${invoiceId}/reglements`,
                  {
                    amount: Number(form.get('amount')),
                    date: String(form.get('date') || '') || undefined,
                    method: String(form.get('method')),
                    bankReference: String(form.get('bankReference') ?? '').trim() || null,
                  },
                  'pay',
                );
                if (done) setPaying(false);
              }}
              className="grid gap-4 md:grid-cols-4"
            >
              <Field label="Montant (DH TTC)" hint={`Reste dû : ${remaining.toLocaleString('fr-FR')} DH`}>
                <Input
                  name="amount"
                  type="number"
                  min={0.01}
                  step={0.01}
                  max={remaining}
                  defaultValue={remaining}
                  required
                  autoFocus
                />
              </Field>

              <Field label="Date">
                <Input name="date" type="date" />
              </Field>

              <Field label="Moyen">
                <select
                  name="method"
                  defaultValue="TRANSFER"
                  className="h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3.5 text-[15px] outline-none focus:border-accent"
                >
                  <option value="TRANSFER">Virement</option>
                  <option value="CHECK">Chèque</option>
                  <option value="BILL_OF_EXCHANGE">Effet</option>
                  <option value="CASH">Espèces</option>
                  <option value="CARD">Carte</option>
                </select>
              </Field>

              <Field label="Référence bancaire">
                <Input name="bankReference" maxLength={80} placeholder="VIR-2026-0918" />
              </Field>

              <div className="flex gap-2 md:col-span-4">
                <Button type="submit" variant="accent" disabled={busy !== null}>
                  {busy === 'pay' ? 'Enregistrement…' : 'Enregistrer le règlement'}
                </Button>
                <Button type="button" onClick={() => setPaying(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[14px]">
                Reste dû :{' '}
                <span className="tnum font-medium">
                  {remaining.toLocaleString('fr-FR')} DH TTC
                </span>
              </p>
              <Button onClick={() => setPaying(true)}>Enregistrer un règlement</Button>
            </div>
          ))}

        <Feedback message={message} />
      </div>
    </Card>
  );
}
