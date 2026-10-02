'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, DataTable, EmptyState, Field, Input, StatusBadge, Td, Th } from '@/components/ui';
import { date, moneyDh } from '@/lib/format';

export interface AffairCostLine {
  id: string;
  category: 'SUBCONTRACTING' | 'OTHER';
  categoryLabel: string;
  status: 'COMMITTED' | 'ACTUAL';
  statusLabel: string;
  label: string;
  supplier: string | null;
  reference: string | null;
  amountHT: number;
  date: string;
}

export interface AffairCostList {
  items: AffairCostLine[];
  totals: { committed: number; actual: number };
  actions: { create: boolean; update: boolean };
}

function today(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

const selectClass =
  'h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3 text-[15px] text-text outline-none focus:border-accent';

/**
 * Sous-traitance et autres coûts directs d'une affaire.
 *
 * Un coût est « engagé » quand la commande au fournisseur est passée : il
 * pèse sur la marge à terminaison. Il devient « réel » à réception de la
 * facture, et entre alors dans la marge.
 */
export function AffairCostsCard({ affairId, data }: { affairId: string; data: AffairCostList }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function send(url: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown) {
    setError(null);
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    if (!response.ok) {
      setError(payload.message ?? 'Enregistrement refusé.');
      return false;
    }
    router.refresh();
    return true;
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy('create');
    const ok = await send(`/api/affairs/${affairId}/costs`, 'POST', {
      category: form.get('category'),
      status: form.get('status'),
      label: String(form.get('label') ?? '').trim(),
      supplier: String(form.get('supplier') ?? '').trim(),
      reference: String(form.get('reference') ?? '').trim(),
      amountHT: String(form.get('amountHT') ?? '').replace(/\s/g, '').replace(',', '.'),
      date: form.get('date'),
    });
    setBusy(null);
    if (ok) setAdding(false);
  }

  async function markReceived(id: string) {
    setBusy(id);
    await send(`/api/affair-costs/${id}`, 'PATCH', { status: 'ACTUAL' });
    setBusy(null);
  }

  async function remove(id: string) {
    setBusy(id);
    await send(`/api/affair-costs/${id}`, 'DELETE');
    setBusy(null);
    setConfirmDelete(null);
  }

  return (
    <Card
      title="Sous-traitance et autres coûts"
      action={
        data.actions.create && !adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-[13px] font-medium text-accent hover:underline"
          >
            Ajouter un coût
          </button>
        ) : (
          <span className="text-[13px] text-muted">
            Réel {moneyDh(data.totals.actual)} · Engagé {moneyDh(data.totals.committed)}
          </span>
        )
      }
    >
      {adding && (
        <form onSubmit={create} className="flex flex-col gap-4 border-b border-border px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Poste">
              <select id="cost-category" name="category" className={selectClass} defaultValue="SUBCONTRACTING">
                <option value="SUBCONTRACTING">Sous-traitance</option>
                <option value="OTHER">Autre coût direct</option>
              </select>
            </Field>
            <Field label="État" hint="Engagé : commande passée. Réel : facture reçue.">
              <select id="cost-status" name="status" className={selectClass} defaultValue="COMMITTED">
                <option value="COMMITTED">Engagé</option>
                <option value="ACTUAL">Réel (facture reçue)</option>
              </select>
            </Field>
            <Field label="Date">
              <Input id="cost-date" name="date" type="date" required defaultValue={today()} />
            </Field>
          </div>
          <Field label="Description">
            <Input
              id="cost-label"
              name="label"
              required
              minLength={2}
              maxLength={200}
              placeholder="ex. Contrôle radiographique sous-traité"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Fournisseur">
              <Input id="cost-supplier" name="supplier" maxLength={160} />
            </Field>
            <Field label="N° commande ou facture">
              <Input id="cost-reference" name="reference" maxLength={80} />
            </Field>
            <Field label="Montant HT (DH)">
              <Input id="cost-amount" name="amountHT" inputMode="decimal" required placeholder="ex. 12 500" />
            </Field>
          </div>
          {error && (
            <p role="alert" className="rounded-[10px] bg-danger-soft px-4 py-3 text-[14px] text-danger">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" variant="accent" disabled={busy === 'create'}>
              {busy === 'create' ? 'Enregistrement…' : 'Enregistrer le coût'}
            </Button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setError(null);
              }}
              className="text-[13.5px] text-subtle hover:underline"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {!adding && error && (
        <p role="alert" className="border-b border-border bg-danger-soft px-5 py-3 text-[14px] text-danger">
          {error}
        </p>
      )}

      {data.items.length === 0 ? (
        <EmptyState
          title="Aucun coût saisi"
          description="Sous-traitance, location de matériel, analyses en laboratoire… Saisissez-les ici : sans eux, la marge de l’affaire paraît plus haute qu’elle ne l’est."
        />
      ) : (
        <div className="overflow-x-auto">
          <DataTable>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Coût</Th>
                <Th>État</Th>
                <Th align="right">Montant HT</Th>
                {data.actions.update && <Th />}
              </tr>
            </thead>
            <tbody>
              {data.items.map((line) => (
                <tr key={line.id}>
                  <Td mono>{date(line.date)}</Td>
                  <Td>
                    <span className="font-medium">{line.label}</span>
                    <span className="block text-[12.5px] text-subtle">
                      {line.categoryLabel}
                      {line.supplier && ` · ${line.supplier}`}
                      {line.reference && ` · ${line.reference}`}
                    </span>
                  </Td>
                  <Td>
                    <StatusBadge tone={line.status === 'ACTUAL' ? 'success' : 'warning'}>
                      {line.statusLabel}
                    </StatusBadge>
                  </Td>
                  <Td align="right" mono>
                    {moneyDh(line.amountHT, 2)}
                  </Td>
                  {data.actions.update && (
                    <Td align="right">
                      <div className="flex flex-wrap justify-end gap-3 text-[13px]">
                        {confirmDelete === line.id ? (
                          <>
                            <span className="text-muted">Supprimer ce coût ?</span>
                            <button
                              type="button"
                              onClick={() => remove(line.id)}
                              disabled={busy === line.id}
                              className="font-medium text-danger hover:underline"
                            >
                              Oui, supprimer
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(null)}
                              className="text-subtle hover:underline"
                            >
                              Non
                            </button>
                          </>
                        ) : (
                          <>
                            {line.status === 'COMMITTED' && (
                              <button
                                type="button"
                                onClick={() => markReceived(line.id)}
                                disabled={busy === line.id}
                                className="font-medium text-accent hover:underline"
                              >
                                Facture reçue
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(line.id)}
                              className="text-subtle hover:text-danger hover:underline"
                            >
                              Supprimer
                            </button>
                          </>
                        )}
                      </div>
                    </Td>
                  )}
                </tr>
              ))}
            </tbody>
          </DataTable>
        </div>
      )}
    </Card>
  );
}
