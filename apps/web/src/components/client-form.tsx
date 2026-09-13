'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Field, Input } from '@/components/ui';

interface FieldError {
  field: string;
  message: string;
}

const SECTORS = [
  'Phosphates & mines',
  'Énergie & pétrochimie',
  'Cimenterie',
  'Agroalimentaire',
  'Bâtiment & travaux publics',
  'Portuaire & logistique',
  'Chimie',
  'Automobile',
  'Autre',
];

export function ClientForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const errorFor = (field: string) => errors.find((e) => e.field === field)?.message;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrors([]);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? '').trim();

    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: value('code'),
        name: value('name'),
        type: value('type'),
        ice: value('ice'),
        sector: value('sector'),
        city: value('city'),
        address: value('address'),
        phone: value('phone'),
        email: value('email'),
        paymentTerms: Number(value('paymentTerms') || 30),
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      errors?: FieldError[];
    };

    if (response.ok && payload.id) {
      router.push(`/commercial/clients/${payload.id}`);
      router.refresh();
      return;
    }

    setErrors(payload.errors ?? []);
    setMessage(payload.message ?? 'Création impossible.');
    setBusy(false);
  }

  const selectClass =
    'h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3.5 text-[15px] outline-none focus:border-accent';

  return (
    <Card title="Identité">
      <form onSubmit={submit} className="flex flex-col gap-5 px-5 py-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Raison sociale"
            error={errorFor('name')}
            hint="Telle qu’elle figurera sur les factures."
          >
            <Input name="name" required maxLength={160} autoFocus />
          </Field>

          <Field
            label="Code client"
            error={errorFor('code')}
            hint="Laissez vide : il sera dérivé du nom."
          >
            <Input name="code" maxLength={12} placeholder="dérivé automatiquement" />
          </Field>

          <Field label="Nature" error={errorFor('type')}>
            <select name="type" defaultValue="PROSPECT" className={selectClass}>
              <option value="PROSPECT">Prospect</option>
              <option value="CLIENT">Client</option>
            </select>
          </Field>

          <Field label="Secteur" error={errorFor('sector')}>
            <select name="sector" defaultValue="" className={selectClass}>
              <option value="">—</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="ICE" error={errorFor('ice')} hint="15 chiffres.">
            <Input name="ice" maxLength={15} inputMode="numeric" />
          </Field>

          <Field
            label="Délai de règlement"
            error={errorFor('paymentTerms')}
            hint="En jours, à compter de la facture."
          >
            <Input name="paymentTerms" type="number" min={0} max={180} defaultValue={30} />
          </Field>

          <Field label="Ville" error={errorFor('city')}>
            <Input name="city" maxLength={80} />
          </Field>

          <Field label="Téléphone" error={errorFor('phone')}>
            <Input name="phone" maxLength={40} />
          </Field>

          <Field label="Adresse" error={errorFor('address')}>
            <Input name="address" maxLength={240} />
          </Field>

          <Field label="Courriel" error={errorFor('email')}>
            <Input name="email" type="email" maxLength={120} />
          </Field>
        </div>

        {message && (
          <p role="alert" className="rounded-[10px] bg-danger-soft px-4 py-3 text-[14px] text-danger">
            {message}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" variant="accent" disabled={busy}>
            {busy ? 'Création…' : 'Créer le client'}
          </Button>
          <span className="text-[13.5px] text-subtle">
            Les contacts s’ajoutent ensuite, depuis la fiche.
          </span>
        </div>
      </form>
    </Card>
  );
}

/** Ajout d'un contact depuis la fiche client. */
export function ContactForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/clients/${clientId}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: String(form.get('firstName') ?? '').trim(),
        lastName: String(form.get('lastName') ?? '').trim(),
        role: String(form.get('role') ?? '').trim(),
        email: String(form.get('email') ?? '').trim(),
        phone: String(form.get('phone') ?? '').trim(),
        isPrimary: form.get('isPrimary') === 'on',
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    setBusy(false);

    if (!response.ok) {
      setMessage(payload.message ?? 'Ajout impossible.');
      return;
    }

    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>Ajouter un contact</Button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 border-t border-border px-5 py-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Prénom">
          <Input name="firstName" required maxLength={80} autoFocus />
        </Field>
        <Field label="Nom">
          <Input name="lastName" required maxLength={80} />
        </Field>
        <Field label="Fonction">
          <Input name="role" maxLength={80} placeholder="Responsable maintenance" />
        </Field>
        <Field label="Courriel">
          <Input name="email" type="email" maxLength={120} />
        </Field>
        <Field label="Téléphone">
          <Input name="phone" maxLength={40} />
        </Field>
      </div>

      <label className="flex items-center gap-2.5 text-[14px]">
        <input type="checkbox" name="isPrimary" className="h-4 w-4 accent-[var(--accent)]" />
        Contact principal — c’est lui qui recevra les rapports
      </label>

      {message && (
        <p role="alert" className="rounded-[10px] bg-danger-soft px-4 py-3 text-[14px] text-danger">
          {message}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" variant="accent" disabled={busy}>
          {busy ? 'Ajout…' : 'Ajouter'}
        </Button>
        <Button type="button" onClick={() => setOpen(false)}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
