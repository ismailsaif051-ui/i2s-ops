'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Input } from '@/components/ui';

/** Unités de facturation d'un bon de commande — dans l'ordre où on les rencontre. */
export const BILLING_UNIT_OPTIONS = [
  {
    value: 'VACATION',
    label: 'À la vacation',
    unit: 'vacation',
    hint: 'La journée d’inspecteur ; une demi-journée compte 0,5.',
  },
  {
    value: 'INTERVENTION',
    label: 'À l’intervention',
    unit: 'intervention',
    hint: 'Chaque jour où la mission a lieu compte 1, même partagé avec une autre.',
  },
  {
    value: 'UNIT',
    label: 'À l’unité (équipement contrôlé)',
    unit: 'équipement',
    hint: 'Un prix par palan, élingue, grue… compté sur les rapports d’inspection.',
  },
  {
    value: 'FIXED',
    label: 'Au forfait',
    unit: 'forfait',
    hint: 'La mission se facture une seule fois, quel que soit le temps passé.',
  },
] as const;

export type BillingUnitValue = (typeof BILLING_UNIT_OPTIONS)[number]['value'];

/**
 * Le bon de commande d'une affaire, modifiable après coup.
 *
 * Le BC arrive souvent après l'acceptation de l'offre, et c'est lui qui fixe
 * comment la prestation se facture : à la vacation, à l'intervention, à
 * l'équipement ou au forfait. Ce réglage pilote la préparation des
 * attachements de l'affaire.
 */
export function AffairPurchaseOrderForm({
  affairId,
  initial,
}: {
  affairId: string;
  initial: {
    poNumber: string | null;
    poAmountHT: number | null;
    billingUnit: BillingUnitValue;
    poUnitPrice: number | null;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unit, setUnit] = useState<BillingUnitValue>(initial.billingUnit);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[13.5px] font-medium text-accent hover:underline"
      >
        Renseigner le bon de commande
      </button>
    );
  }

  const selected = BILLING_UNIT_OPTIONS.find((o) => o.value === unit)!;

  return (
    <form
      className="mt-3 flex flex-col gap-3 rounded-[12px] border border-border bg-surface-2 p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError(null);

        const form = new FormData(event.currentTarget);
        const text = (key: string) => String(form.get(key) ?? '').trim();
        const amount = (key: string) => (text(key) === '' ? null : Number(text(key)));

        const response = await fetch(`/api/affairs/${affairId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            poNumber: text('poNumber'),
            poAmountHT: amount('poAmountHT'),
            billingUnit: unit,
            poUnitPrice: amount('poUnitPrice'),
          }),
        });

        const payload = (await response.json().catch(() => ({}))) as {
          message?: string;
          errors?: Array<{ message: string }>;
        };
        setBusy(false);

        if (!response.ok) {
          setError(payload.errors?.[0]?.message ?? payload.message ?? 'Enregistrement refusé.');
          return;
        }

        setOpen(false);
        router.refresh();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="N° de bon de commande">
          <Input name="poNumber" maxLength={80} defaultValue={initial.poNumber ?? ''} />
        </Field>
        <Field label="Montant du BC (DH HT)">
          <Input
            name="poAmountHT"
            type="number"
            min={0}
            step={100}
            defaultValue={initial.poAmountHT ?? ''}
          />
        </Field>
        <Field label="Mode de facturation" hint={selected.hint}>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as BillingUnitValue)}
            className="h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3 text-[15px]"
          >
            {BILLING_UNIT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={`Prix unitaire du BC (DH HT par ${selected.unit})`}>
          <Input
            name="poUnitPrice"
            type="number"
            min={0}
            step={10}
            defaultValue={initial.poUnitPrice ?? ''}
          />
        </Field>
      </div>

      {error && <p className="text-[13.5px] text-danger">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" variant="accent" disabled={busy}>
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
        <Button type="button" onClick={() => setOpen(false)}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
