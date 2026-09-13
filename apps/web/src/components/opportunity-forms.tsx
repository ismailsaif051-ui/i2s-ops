'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Field, Input } from '@/components/ui';

export interface ClientOption {
  id: string;
  name: string;
}

interface OfferLineDraft {
  designation: string;
  unit: string;
  quantity: string;
  unitPrice: string;
}

const EMPTY_LINE: OfferLineDraft = { designation: '', unit: 'vacation', quantity: '1', unitPrice: '' };

/** Ouverture d'une opportunité, depuis la liste. */
export function OpenOpportunity({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button variant="accent" onClick={() => setOpen(true)}>
        Enregistrer une consultation
      </Button>
    );
  }

  const inputClass =
    'h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3.5 text-[15px] outline-none focus:border-accent';

  return (
    <Card title="Enregistrer une consultation">
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError(null);

          const form = new FormData(event.currentTarget);
          const amount = String(form.get('amount') ?? '').trim();
          const close = String(form.get('expectedCloseDate') ?? '').trim();

          const response = await fetch('/api/commercial/opportunites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientId: String(form.get('clientId') ?? ''),
              title: String(form.get('title') ?? '').trim(),
              amount: amount ? Number(amount) : null,
              expectedCloseDate: close || null,
              description: String(form.get('description') ?? '').trim() || null,
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

          router.push(`/commercial/consultations/${payload.id}`);
        }}
        className="flex flex-col gap-4 px-5 py-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Client">
            <select name="clientId" required className={inputClass}>
              <option value="">Choisir…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Objet" hint="Ce que le client cherche à faire contrôler.">
            <Input name="title" required minLength={3} maxLength={200} />
          </Field>
          <Field label="Montant pressenti (DH HT)" hint="Il sera remplacé par le montant de l’offre.">
            <Input type="number" name="amount" min="0" step="0.01" />
          </Field>
          <Field label="Décision attendue">
            <Input type="date" name="expectedCloseDate" />
          </Field>
        </div>

        <Field label="Contexte" hint="Ce qu’il faut savoir pour chiffrer.">
          <Input name="description" maxLength={2000} />
        </Field>

        {error && (
          <p role="alert" className="rounded-[8px] bg-danger-soft px-3.5 py-2.5 text-[14px] text-danger">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" variant="accent" disabled={busy}>
            {busy ? 'Ouverture…' : 'Ouvrir'}
          </Button>
          <Button type="button" onClick={() => setOpen(false)}>
            Annuler
          </Button>
        </div>
      </form>
    </Card>
  );
}

/**
 * Les gestes du tunnel : consultation, offre, relance, perte.
 *
 * L'opportunité ne se déclare pas gagnée : c'est l'accord du client sur une
 * offre qui la gagne, et qui crée l'affaire.
 */
export function OpportunityActions({
  opportunityId,
  actions,
  causeOptions,
}: {
  opportunityId: string;
  actions: { edit: boolean; offer: boolean; lose: boolean };
  /** Causes de perte proposées par le serveur : l'écran n'en invente aucune. */
  causeOptions: Array<{ value: string; label: string }>;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<'tender' | 'offer' | 'followUp' | 'lose' | null>(null);
  const [lines, setLines] = useState<OfferLineDraft[]>([{ ...EMPTY_LINE }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; details: string[] } | null>(null);

  if (!actions.edit && !actions.offer && !actions.lose) return null;

  const total = lines.reduce(
    (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0),
    0,
  );

  async function call(path: string, body: unknown) {
    setBusy(true);
    setError(null);

    const response = await fetch(`/api/commercial/opportunites/${opportunityId}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      errors?: Array<{ field: string; message: string }>;
    };

    setBusy(false);

    if (!response.ok) {
      setError({
        message: payload.message ?? 'Opération refusée.',
        details: (payload.errors ?? []).map((e) => e.message),
      });
      return;
    }

    setPanel(null);
    setLines([{ ...EMPTY_LINE }]);
    router.refresh();
  }

  const inputClass =
    'h-10 w-full rounded-[8px] border border-border-strong bg-surface px-3 text-[14px] outline-none focus:border-accent';

  return (
    <Card title="Avancer">
      <div className="flex flex-col gap-4 px-5 py-5">
        {panel === null && (
          <div className="flex flex-wrap gap-3">
            {actions.edit && <Button onClick={() => setPanel('tender')}>Appel d’offres</Button>}
            {actions.offer && (
              <Button variant="accent" onClick={() => setPanel('offer')}>
                Établir une offre
              </Button>
            )}
            {actions.edit && <Button onClick={() => setPanel('followUp')}>Relancer</Button>}
            {actions.lose && <Button onClick={() => setPanel('lose')}>Déclarer perdue</Button>}
          </div>
        )}

        {panel === 'tender' && (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const deadline = String(form.get('submissionDeadline') ?? '').trim();
              const opening = String(form.get('openingDate') ?? '').trim();
              const guarantee = String(form.get('guaranteeAmount') ?? '').trim();

              await call('appels-offres', {
                reference: String(form.get('reference') ?? '').trim(),
                publisher: String(form.get('publisher') ?? '').trim() || null,
                submissionDeadline: deadline || null,
                openingDate: opening || null,
                guaranteeAmount: guarantee ? Number(guarantee) : null,
              });
            }}
            className="flex flex-col gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Référence">
                <Input name="reference" required maxLength={80} placeholder="AO-2026-0912" />
              </Field>
              <Field label="Émetteur">
                <Input name="publisher" maxLength={160} />
              </Field>
              <Field label="Remise des offres">
                <Input type="date" name="submissionDeadline" />
              </Field>
              <Field label="Ouverture des plis">
                <Input type="date" name="openingDate" />
              </Field>
              <Field label="Caution (DH)">
                <Input type="number" name="guaranteeAmount" min="0" step="0.01" />
              </Field>
            </div>
            <FormActions busy={busy} onCancel={() => setPanel(null)} label="Enregistrer" />
          </form>
        )}

        {panel === 'offer' && (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const validUntil = String(form.get('validUntil') ?? '').trim();

              await call('offres', {
                validUntil: validUntil || null,
                notes: String(form.get('notes') ?? '').trim() || null,
                lines: lines
                  .filter((l) => l.designation.trim() && Number(l.quantity) > 0)
                  .map((l) => ({
                    designation: l.designation.trim(),
                    unit: l.unit.trim() || 'vacation',
                    quantity: Number(l.quantity),
                    unitPrice: Number(l.unitPrice) || 0,
                  })),
              });
            }}
            className="flex flex-col gap-4"
          >
            <p className="text-[14px] text-muted">
              Le montant se calcule sur les lignes : une offre qui ne correspond pas à son
              détail n’est pas défendable devant le client.
            </p>

            <ul className="flex flex-col gap-2.5">
              {lines.map((line, index) => (
                <li key={index} className="grid gap-2 sm:grid-cols-[1fr_100px_90px_120px_auto]">
                  <input
                    value={line.designation}
                    onChange={(e) =>
                      setLines((c) =>
                        c.map((l, i) => (i === index ? { ...l, designation: e.target.value } : l)),
                      )
                    }
                    placeholder="Prestation"
                    className={inputClass}
                  />
                  <input
                    value={line.unit}
                    onChange={(e) =>
                      setLines((c) => c.map((l, i) => (i === index ? { ...l, unit: e.target.value } : l)))
                    }
                    placeholder="unité"
                    className={inputClass}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={line.quantity}
                    onChange={(e) =>
                      setLines((c) =>
                        c.map((l, i) => (i === index ? { ...l, quantity: e.target.value } : l)),
                      )
                    }
                    placeholder="qté"
                    className={inputClass}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(e) =>
                      setLines((c) =>
                        c.map((l, i) => (i === index ? { ...l, unitPrice: e.target.value } : l)),
                      )
                    }
                    placeholder="prix unitaire"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setLines((c) => (c.length > 1 ? c.filter((_, i) => i !== index) : c))}
                    className="text-[13.5px] text-muted hover:text-danger"
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setLines((c) => [...c, { ...EMPTY_LINE }])}
                className="text-[13.5px] font-medium text-accent hover:underline"
              >
                Ajouter une ligne
              </button>
              <span className="tnum text-[15px] font-medium">
                Total : {total.toLocaleString('fr-FR')} DH HT
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Validité de l’offre">
                <Input type="date" name="validUntil" />
              </Field>
              <Field label="Note">
                <Input name="notes" maxLength={2000} />
              </Field>
            </div>

            <FormActions busy={busy} onCancel={() => setPanel(null)} label="Établir l’offre" />
          </form>
        )}

        {panel === 'followUp' && (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const next = String(form.get('nextActionDate') ?? '').trim();

              await call('relances', {
                channel: String(form.get('channel') ?? 'EMAIL'),
                outcome: String(form.get('outcome') ?? '').trim(),
                nextActionDate: next || null,
              });
            }}
            className="flex flex-col gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Canal">
                <select name="channel" defaultValue="PHONE" className={inputClass}>
                  <option value="PHONE">Téléphone</option>
                  <option value="EMAIL">Courriel</option>
                  <option value="VISIT">Visite</option>
                  <option value="OTHER">Autre</option>
                </select>
              </Field>
              <Field label="Prochaine action">
                <Input type="date" name="nextActionDate" />
              </Field>
            </div>
            <Field label="Ce que la relance a donné">
              <Input name="outcome" required minLength={3} maxLength={1000} />
            </Field>
            <FormActions busy={busy} onCancel={() => setPanel(null)} label="Enregistrer la relance" />
          </form>
        )}

        {panel === 'lose' && (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              await call('perte', {
                cause: String(form.get('cause') ?? ''),
                reason: String(form.get('reason') ?? '').trim(),
              });
            }}
            className="flex flex-col gap-4"
          >
            <p className="text-[14px] text-muted">
              La cause se totalise d’une affaire à l’autre : c’est elle qui dit, en fin d’année,
              s’il faut revoir les prix, les délais ou les références. Le détail en clair reste à
              côté, pour la mémoire du dossier.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cause de la perte">
                <select name="cause" required defaultValue="" className={inputClass}>
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {causeOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Ce qui s’est passé" hint="Le concurrent, l’écart de prix, le délai demandé.">
                <Input name="reason" required minLength={3} maxLength={1000} />
              </Field>
            </div>

            <FormActions busy={busy} onCancel={() => setPanel(null)} label="Déclarer perdue" />
          </form>
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
      </div>
    </Card>
  );
}

/** Envoyer une offre, enregistrer l'accord du client, ou son refus. */
export function OfferActions({
  offerId,
  status,
  canEdit,
}: {
  offerId: string;
  status: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<'accept' | 'reject' | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!canEdit || ['ACCEPTED', 'REJECTED', 'EXPIRED'].includes(status)) return null;

  async function call(path: string, body?: unknown, key = path) {
    setBusy(key);
    setError(null);

    const response = await fetch(`/api/commercial/offres/${offerId}/${path}`, {
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

    setPanel(null);
    router.refresh();
  }

  if (panel === 'accept') {
    return (
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const amount = String(form.get('poAmountHT') ?? '').trim();
          await call('accord', {
            poNumber: String(form.get('poNumber') ?? '').trim() || null,
            poAmountHT: amount ? Number(amount) : null,
          });
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <input
          name="poNumber"
          placeholder="N° de bon de commande"
          maxLength={80}
          className="h-9 w-[180px] rounded-[8px] border border-border-strong bg-surface px-3 text-[14px] outline-none focus:border-accent"
        />
        <input
          name="poAmountHT"
          type="number"
          min="0"
          step="0.01"
          placeholder="Montant BC"
          className="h-9 w-[140px] rounded-[8px] border border-border-strong bg-surface px-3 text-[14px] outline-none focus:border-accent"
        />
        <Button type="submit" variant="accent" disabled={busy !== null}>
          {busy === 'accord' ? 'Création…' : 'Créer l’affaire'}
        </Button>
        <Button type="button" onClick={() => setPanel(null)}>
          Annuler
        </Button>
        {error && <span className="text-[13px] text-danger">{error}</span>}
      </form>
    );
  }

  if (panel === 'reject') {
    return (
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          await call('refus', { reason: String(form.get('reason') ?? '').trim() });
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <input
          name="reason"
          required
          minLength={3}
          autoFocus
          placeholder="Motif du refus"
          className="h-9 min-w-[200px] rounded-[8px] border border-border-strong bg-surface px-3 text-[14px] outline-none focus:border-accent"
        />
        <Button type="submit" variant="accent" disabled={busy !== null}>
          Refuser
        </Button>
        <Button type="button" onClick={() => setPanel(null)}>
          Annuler
        </Button>
        {error && <span className="text-[13px] text-danger">{error}</span>}
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {status === 'DRAFT' && (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => call('envoi', {}, 'envoi')}
          className="text-[13.5px] font-medium text-accent hover:underline disabled:opacity-50"
        >
          {busy === 'envoi' ? 'Envoi…' : 'Envoyer au client'}
        </button>
      )}
      {status === 'SENT' && (
        <>
          <button
            type="button"
            onClick={() => setPanel('accept')}
            className="text-[13.5px] font-medium text-accent hover:underline"
          >
            Accord du client
          </button>
          <button
            type="button"
            onClick={() => setPanel('reject')}
            className="text-[13.5px] text-muted hover:text-danger"
          >
            Refus
          </button>
        </>
      )}
      {error && <span className="text-[13px] text-danger">{error}</span>}
    </div>
  );
}

function FormActions({
  busy,
  onCancel,
  label,
}: {
  busy: boolean;
  onCancel: () => void;
  label: string;
}) {
  return (
    <div className="flex gap-2">
      <Button type="submit" variant="accent" disabled={busy}>
        {busy ? 'Enregistrement…' : label}
      </Button>
      <Button type="button" onClick={onCancel}>
        Annuler
      </Button>
    </div>
  );
}
