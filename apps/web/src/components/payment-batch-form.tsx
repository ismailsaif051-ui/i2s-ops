'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, EmptyState, Input, StatusBadge } from '@/components/ui';

export interface CandidateLine {
  id: string;
  number: string;
  netPayable: number;
  employee: {
    id: string;
    matricule: string;
    name: string;
    position: string | null;
    department: string | null;
    bankName: string | null;
    bankRib: string | null;
  };
}

const dh = (amount: number): string =>
  `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`;

/** RH compose un nouveau lot à partir des notes « bon à payer » disponibles. */
export function CreateBatchForm({ candidates }: { candidates: CandidateLine[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    setBusy(true);
    setError(null);

    const response = await fetch('/api/virements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expenseReportIds: [...selected] }),
    });

    const payload = (await response.json().catch(() => ({}))) as { message?: string; id?: string };
    setBusy(false);

    if (!response.ok) {
      setError(payload.message ?? 'Création refusée.');
      return;
    }

    router.push(`/finance/virements/${payload.id}`);
  }

  if (!open) {
    return (
      <div>
        <Button variant="accent" onClick={() => setOpen(true)} disabled={candidates.length === 0}>
          Préparer un nouveau lot
        </Button>
        {candidates.length === 0 && (
          <p className="mt-2 text-[13.5px] text-subtle">
            Aucune note « bon à payer » disponible pour le moment.
          </p>
        )}
      </div>
    );
  }

  const total = candidates
    .filter((c) => selected.has(c.id))
    .reduce((sum, c) => sum + c.netPayable, 0);

  return (
    <Card title="Nouveau lot de virement">
      <div className="flex flex-col gap-4 px-5 py-5">
        <p className="text-[14px] text-muted">
          Cochez les notes à regrouper dans ce virement. Chacune sort de la liste dès qu’elle
          rejoint un lot.
        </p>

        <ul className="flex flex-col divide-y divide-border rounded-[10px] border border-border">
          {candidates.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={selected.has(c.id)}
                onChange={() => toggle(c.id)}
                className="h-4 w-4 accent-accent"
              />
              <span className="ref text-[13px] text-subtle">{c.employee.matricule}</span>
              <span className="min-w-0 flex-1 text-[14.5px]">{c.employee.name}</span>
              <span className="ref text-[13px] text-subtle">{c.number}</span>
              {!c.employee.bankRib && (
                <StatusBadge tone="warning">RIB manquant</StatusBadge>
              )}
              <span className="ref text-[14px] font-medium">{dh(c.netPayable)}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[13.5px] text-muted">
            {selected.size} sélectionnée{selected.size > 1 ? 's' : ''} · total{' '}
            <span className="ref font-medium text-text">{dh(total)}</span>
          </span>
          <div className="flex items-center gap-3">
            <Button variant="accent" onClick={submit} disabled={busy || selected.size === 0}>
              {busy ? 'Création…' : 'Créer le lot'}
            </Button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[13.5px] text-subtle hover:underline"
            >
              Annuler
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-[10px] bg-danger-soft px-4 py-3 text-[14px] text-danger">
            {error}
          </p>
        )}
      </div>
    </Card>
  );
}

export interface BatchLine {
  id: string;
  number: string;
  netPayable: number;
  paymentMethod: string;
  bankReference: string | null;
  employee: {
    id: string;
    matricule: string;
    name: string;
    position: string | null;
    department: string | null;
    bankName: string | null;
    bankRib: string | null;
  };
}

/** Le détail d'un lot — modification RH, validation, puis exécution RAF. */
export function BatchDetail({
  batchId,
  lines,
  actions,
}: {
  batchId: string;
  lines: BatchLine[];
  actions: { modify: boolean; validate: boolean; pay: boolean };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  async function call(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown) {
    setBusy(path);
    setError(null);

    const response = await fetch(`/api/virements/${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'DELETE' ? undefined : JSON.stringify(body ?? {}),
    });

    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    setBusy(null);

    if (!response.ok) {
      setError(payload.message ?? 'Opération refusée.');
      return false;
    }

    router.refresh();
    return true;
  }

  if (lines.length === 0) {
    return (
      <Card title="Bénéficiaires">
        <EmptyState title="Lot vide" description="Ce lot ne contient plus aucune note." />
      </Card>
    );
  }

  return (
    <Card title={`Bénéficiaires — ${lines.length}`}>
      <ul className="flex flex-col divide-y divide-border">
        {lines.map((line) => (
          <li key={line.id} className="flex flex-col gap-2 px-5 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="ref text-[13px] text-subtle">{line.employee.matricule}</span>
              <span className="min-w-0 flex-1 text-[14.5px] font-medium">{line.employee.name}</span>
              <span className="ref text-[13px] text-subtle">{line.number}</span>
              <span className="ref text-[14px] font-medium">{dh(line.netPayable)}</span>
              {actions.modify && (
                <button
                  type="button"
                  onClick={() => call(`${batchId}/lines/${line.id}`, 'DELETE')}
                  className="text-[13px] text-danger hover:underline"
                >
                  Retirer
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[13.5px] text-muted">
              <span>{line.employee.bankName ?? 'Banque non renseignée'}</span>
              <span className={`ref ${line.employee.bankRib ? '' : 'text-danger'}`}>
                {line.employee.bankRib ?? 'RIB manquant'}
              </span>
            </div>

            {actions.modify && (
              <div className="flex items-center gap-2">
                {editing === line.id ? (
                  <form
                    onSubmit={async (event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      const ok = await call(`${batchId}/lines/${line.id}`, 'PATCH', {
                        bankReference: String(form.get('bankReference') ?? '').trim(),
                      });
                      if (ok) setEditing(null);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      name="bankReference"
                      defaultValue={line.bankReference ?? ''}
                      placeholder="Référence de virement"
                      className="h-9 w-56 text-[13.5px]"
                    />
                    <Button type="submit" disabled={busy !== null} className="h-9 px-3 text-[13px]">
                      Ok
                    </Button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="text-[13px] text-subtle hover:underline"
                    >
                      Annuler
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing(line.id)}
                    className="text-[13px] text-accent hover:underline"
                  >
                    {line.bankReference ? `Référence : ${line.bankReference}` : 'Ajouter une référence'}
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {(actions.validate || actions.pay) && (
        <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-4">
          {actions.validate && (
            <Button
              variant="accent"
              disabled={busy !== null}
              onClick={() => call(`${batchId}/validate`, 'POST')}
            >
              {busy === `${batchId}/validate` ? 'Validation…' : 'Valider le lot'}
            </Button>
          )}
          {actions.pay && (
            <Button
              variant="accent"
              disabled={busy !== null}
              onClick={() => call(`${batchId}/pay`, 'POST')}
            >
              {busy === `${batchId}/pay` ? 'Exécution…' : 'Exécuter le virement'}
            </Button>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mx-5 mb-4 rounded-[10px] bg-danger-soft px-4 py-3 text-[14px] text-danger">
          {error}
        </p>
      )}
    </Card>
  );
}
