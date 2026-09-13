'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Field, Input, StatusBadge } from '@/components/ui';

export interface Category {
  id: string;
  code: string;
  label: string;
  capType: string;
  capAmount: number | null;
  requiresReceipt: boolean;
}

export interface MissionOption {
  id: string;
  number: string;
  client: string;
  affairNumber: string;
}

export interface ExpenseLine {
  id: string;
  date: string;
  category: { id: string; code: string; label: string };
  amount: number;
  affair: string | null;
  mission: string | null;
  description: string | null;
  comment: string | null;
  hasReceipt: boolean;
}

export interface Issue {
  line: string;
  message: string;
  blocking: boolean;
}

/** Ce qu'un plafond veut dire, en clair. */
function capLabel(category: Category): string | null {
  if (category.capAmount === null) return null;
  const per =
    category.capType === 'MONTHLY'
      ? 'par mois'
      : category.capType === 'PER_NIGHT'
        ? 'par nuitée'
        : 'par jour';
  return `plafond ${category.capAmount} DH ${per}`;
}

export function ExpenseLineForm({
  reportId,
  categories,
  missions,
  reportType,
}: {
  reportId: string;
  categories: Category[];
  missions: MissionOption[];
  reportType: string;
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; details: string[] } | null>(null);

  const category = categories.find((c) => c.id === categoryId);
  const needsMission = reportType === 'MISSION';

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

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const missionId = String(form.get('missionId') ?? '').trim();

    const response = await fetch(`/api/frais/${reportId}/lignes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: String(form.get('date') ?? ''),
        categoryId,
        amount: Number(form.get('amount') ?? 0),
        missionId: missionId || null,
        description: String(form.get('description') ?? '').trim() || null,
        comment: String(form.get('comment') ?? '').trim() || null,
        receipt: fileContent
          ? { fileName: fileName ?? 'justificatif.pdf', contentBase64: fileContent }
          : null,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      errors?: Array<{ field: string; message: string }>;
    };

    setBusy(false);

    if (!response.ok) {
      setError({
        message: payload.message ?? 'Dépense refusée.',
        details: (payload.errors ?? []).map((e) => e.message),
      });
      return;
    }

    (event.target as HTMLFormElement).reset();
    setCategoryId('');
    setFileName(null);
    setFileContent(null);
    router.refresh();
  }

  const selectClass =
    'h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3.5 text-[15px] outline-none focus:border-accent';

  return (
    <Card title="Ajouter une dépense">
      <form onSubmit={submit} className="flex flex-col gap-4 px-5 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date">
            <Input type="date" name="date" required />
          </Field>

          <Field label="Nature de la dépense" hint={category ? (capLabel(category) ?? undefined) : undefined}>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={selectClass}
            >
              <option value="">Choisir…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                  {c.capAmount !== null ? ` — ${c.capAmount} DH` : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Montant (DH)">
            <Input type="number" name="amount" required min="0.01" step="0.01" />
          </Field>

          {needsMission && (
            <Field
              label="Mission"
              hint={
                missions.length === 0
                  ? 'Aucune mission ne vous est affectée sur ce mois avec un ordre de mission signé.'
                  : 'Un frais de mission porte sa mission — c’est ce qui permet de le refacturer.'
              }
            >
              <select name="missionId" required disabled={missions.length === 0} className={selectClass}>
                <option value="">
                  {missions.length === 0 ? 'Aucune mission imputable' : 'Choisir la mission…'}
                </option>
                {missions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.number} — {m.client}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Libellé" hint="Ce que couvre la dépense.">
            <Input name="description" maxLength={300} placeholder="Nuitée à Jorf Lasfar" />
          </Field>

          <Field
            label="Justificatif"
            hint={
              category?.requiresReceipt
                ? 'Obligatoire pour cette nature de dépense.'
                : 'Facultatif pour cette nature.'
            }
          >
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={pickFile}
              className="h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3 py-2 text-[14px] file:mr-3 file:rounded-[6px] file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-[13.5px]"
            />
          </Field>
        </div>

        <Field
          label="Justification"
          hint="À renseigner si la dépense dépasse le plafond de sa catégorie."
        >
          <Input name="comment" maxLength={500} placeholder="Hôtel complet, seule disponibilité" />
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

        <div>
          <Button type="submit" variant="accent" disabled={busy || !categoryId}>
            {busy ? 'Ajout…' : 'Ajouter la dépense'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

/** Soumission, visa, rejet, règlement — selon ce que l'API autorise. */
export function ExpenseActions({
  reportId,
  status,
  currentStep,
  actions,
  issues,
}: {
  reportId: string;
  status: string;
  currentStep: { label: string; roles: string[] } | null;
  actions: { edit: boolean; submit: boolean; decide: boolean; pay: boolean };
  issues: Issue[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const blocking = issues.filter((i) => i.blocking);

  async function call(path: string, body?: unknown, key = path) {
    setBusy(key);
    setMessage(null);

    const response = await fetch(`/api/frais/${reportId}/${path}`, {
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
          payload.message ??
          'Opération refusée.' +
            (payload.errors?.length ? ` ${payload.errors.map((e) => e.message).join(' ')}` : ''),
      });
      return;
    }

    setRejecting(false);
    router.refresh();
  }

  if (!actions.submit && !actions.decide && !actions.pay && blocking.length === 0) return null;

  return (
    <Card title={currentStep ? `Étape : ${currentStep.label}` : 'Circuit'}>
      <div className="flex flex-col gap-4 px-5 py-5">
        {currentStep && (
          <p className="text-[14px] text-muted">
            Cette étape relève de : {currentStep.roles.filter((r) => r !== 'ADMIN').join(', ')}.
          </p>
        )}

        {blocking.length > 0 && (
          <div className="rounded-[10px] bg-danger-soft px-4 py-3">
            <p className="text-[14px] font-medium text-danger">
              {blocking.length} point(s) à régler avant de transmettre
            </p>
            <ul className="mt-1.5 flex flex-col gap-1">
              {blocking.map((i, index) => (
                <li key={`${i.line}-${index}`} className="text-[13.5px] text-danger">
                  <span className="font-medium">{i.line}</span> — {i.message}
                </li>
              ))}
            </ul>
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

        <div className="flex flex-wrap items-center gap-3">
          {actions.submit && (
            <Button variant="accent" disabled={busy !== null} onClick={() => call('transmettre')}>
              {busy === 'transmettre' ? 'Transmission…' : 'Transmettre au visa'}
            </Button>
          )}

          {actions.decide && !rejecting && (
            <>
              <Button
                variant="accent"
                disabled={busy !== null}
                onClick={() => call('decider', { decision: 'APPROVE' }, 'approuver')}
              >
                {busy === 'approuver' ? 'Visa…' : 'Viser'}
              </Button>
              <Button onClick={() => setRejecting(true)}>Rejeter</Button>
            </>
          )}

          {actions.pay && (
            <Button variant="accent" disabled={busy !== null} onClick={() => call('regler')}>
              {busy === 'regler' ? 'Règlement…' : 'Enregistrer le règlement'}
            </Button>
          )}

          {status === 'PAID' && <StatusBadge tone="success">Réglée</StatusBadge>}
        </div>

        {rejecting && (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              await call(
                'decider',
                { decision: 'REJECT', comment: String(form.get('comment') ?? '').trim() },
                'rejeter',
              );
            }}
            className="flex flex-col gap-3"
          >
            <Field label="Motif du rejet" hint="L’auteur doit savoir quoi reprendre.">
              <Input name="comment" required minLength={3} maxLength={1000} autoFocus />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" variant="accent" disabled={busy !== null}>
                {busy === 'rejeter' ? 'Rejet…' : 'Confirmer le rejet'}
              </Button>
              <Button type="button" onClick={() => setRejecting(false)}>
                Annuler
              </Button>
            </div>
          </form>
        )}
      </div>
    </Card>
  );
}

/** Suppression d'une ligne, tant que la note n'est pas partie. */
export function RemoveLineButton({ reportId, lineId }: { reportId: string; lineId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch(`/api/frais/${reportId}/lignes/${lineId}`, { method: 'DELETE' });
        setBusy(false);
        router.refresh();
      }}
      className="text-[13.5px] text-muted hover:text-danger disabled:opacity-50"
    >
      {busy ? '…' : 'Retirer'}
    </button>
  );
}
