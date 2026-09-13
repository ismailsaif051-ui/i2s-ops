'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Field, Input, StatusBadge } from '@/components/ui';

interface Option {
  id: string;
  code?: string;
  name: string;
}

interface EmployeeOption extends Option {
  position: string | null;
  department: string | null;
}

interface FieldError {
  field: string;
  message: string;
}

const COMMERCIAL = [
  { value: 'SUIVANT_OP', label: 'Suivant offre de prix' },
  { value: 'GAGNEE', label: 'Gagnée' },
  { value: 'DP', label: 'Demande de prix' },
  { value: 'PERDUE_ANNULEE', label: 'Perdue ou annulée' },
];

const WORKS = [
  { value: 'NON_DEMARRE', label: 'Non démarré' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'A_FACTURER', label: 'À facturer' },
];

export function AffairForm({
  clients,
  departments,
  employees,
  nextNumber,
  defaultClientId,
}: {
  clients: Array<Option & { type: string }>;
  departments: Option[];
  employees: EmployeeOption[];
  nextNumber: string | null;
  defaultClientId?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [services, setServices] = useState<string[]>([]);

  const errorFor = (field: string) => errors.find((e) => e.field === field)?.message;

  function toggleService(id: string) {
    setServices((current) =>
      current.includes(id) ? current.filter((s) => s !== id) : [...current, id],
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrors([]);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? '').trim();
    const amount = (key: string) => {
      const raw = value(key);
      return raw === '' ? null : Number(raw);
    };

    const response = await fetch('/api/affairs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: value('clientId'),
        title: value('title'),
        departmentId: value('departmentId'),
        departmentIds: services,
        accountManagerId: value('accountManagerId'),
        pilotId: value('pilotId'),
        preparedById: value('preparedById'),
        controlLocation: value('controlLocation'),
        endClient: value('endClient'),
        engineeringOffice: value('engineeringOffice'),
        offerAmountHT: amount('offerAmountHT'),
        poAmountHT: amount('poAmountHT'),
        poNumber: value('poNumber'),
        commercialStatus: value('commercialStatus'),
        worksStatus: value('worksStatus'),
        physicalFileOpened: form.get('physicalFileOpened') === 'on',
        observation: value('observation'),
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      errors?: FieldError[];
    };

    if (response.ok && payload.id) {
      router.push(`/affaires/${payload.id}`);
      router.refresh();
      return;
    }

    setErrors(payload.errors ?? []);
    setMessage(payload.message ?? 'Ouverture impossible.');
    setBusy(false);
  }

  const selectClass =
    'h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3.5 text-[15px] outline-none focus:border-accent';

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <Card
        title="Affaire"
        action={
          nextNumber ? (
            <span className="text-[13.5px] text-muted">
              Code Affaire attribué à la création :{' '}
              <span className="ref font-medium text-text">{nextNumber}</span>
            </span>
          ) : null
        }
      >
        <div className="grid gap-5 px-5 py-5 md:grid-cols-2">
          <Field label="Client" error={errorFor('clientId')}>
            <select
              name="clientId"
              required
              defaultValue={defaultClientId ?? ''}
              className={selectClass}
            >
              <option value="">Choisir un client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                  {c.type === 'PROSPECT' ? ' (prospect)' : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Service pilote" error={errorFor('departmentId')}>
            <select name="departmentId" required defaultValue="" className={selectClass}>
              <option value="">Choisir un service…</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} — {d.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="md:col-span-2">
            <Field
              label="Désignation"
              error={errorFor('title')}
              hint="Ce que le client a commandé, en une ligne."
            >
              <Input
                name="title"
                required
                maxLength={240}
                placeholder="Contrôle END des lignes de transfert — arrêt annuel"
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <span className="mb-1.5 block text-[14px] font-medium">Services mobilisés</span>
            <p className="mb-2.5 text-[13px] text-subtle">
              Une affaire peut mobiliser plusieurs pôles. Chacun d’eux la verra dans son
              périmètre.
            </p>
            <div className="flex flex-wrap gap-2">
              {departments.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleService(d.id)}
                  className={`h-9 rounded-[8px] border px-3 text-[13.5px] font-medium transition-colors ${
                    services.includes(d.id)
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-border text-muted hover:border-border-strong'
                  }`}
                >
                  {d.code}
                </button>
              ))}
            </div>
          </div>

          <Field label="Lieu de contrôle" error={errorFor('controlLocation')}>
            <Input name="controlLocation" maxLength={240} />
          </Field>

          <Field label="Client final" error={errorFor('endClient')} hint="S’il diffère du donneur d’ordre.">
            <Input name="endClient" maxLength={160} />
          </Field>
        </div>
      </Card>

      <Card title="Commercial">
        <div className="grid gap-5 px-5 py-5 md:grid-cols-2">
          <Field label="Statut commercial" error={errorFor('commercialStatus')}>
            <select name="commercialStatus" defaultValue="SUIVANT_OP" className={selectClass}>
              {COMMERCIAL.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Avancement des travaux" error={errorFor('worksStatus')}>
            <select name="worksStatus" defaultValue="NON_DEMARRE" className={selectClass}>
              {WORKS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Montant de l’offre (DH HT)" error={errorFor('offerAmountHT')}>
            <Input name="offerAmountHT" type="number" min={0} step={100} />
          </Field>

          <Field label="Montant du bon de commande (DH HT)" error={errorFor('poAmountHT')}>
            <Input name="poAmountHT" type="number" min={0} step={100} />
          </Field>

          <Field
            label="N° de bon de commande"
            error={errorFor('poNumber')}
            hint="Texte libre : « BC 34950 », « Commande verbale », « Contrat + avenant »."
          >
            <Input name="poNumber" maxLength={80} />
          </Field>

          <Field label="Bureau d’études" error={errorFor('engineeringOffice')}>
            <Input name="engineeringOffice" maxLength={160} />
          </Field>
        </div>
      </Card>

      <Card title="Suivi">
        <div className="grid gap-5 px-5 py-5 md:grid-cols-3">
          <Field
            label="Chargé d’affaires"
            error={errorFor('accountManagerId')}
            hint="Vous, par défaut."
          >
            <select name="accountManagerId" defaultValue="" className={selectClass}>
              <option value="">—</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                  {e.department ? ` · ${e.department}` : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Pilote" error={errorFor('pilotId')}>
            <select name="pilotId" defaultValue="" className={selectClass}>
              <option value="">—</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Affaire préparée par" error={errorFor('preparedById')}>
            <select name="preparedById" defaultValue="" className={selectClass}>
              <option value="">—</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="md:col-span-3">
            <Field label="Observation" error={errorFor('observation')}>
              <textarea
                name="observation"
                rows={2}
                maxLength={2000}
                className="w-full rounded-[10px] border border-border-strong bg-surface px-3.5 py-2.5 text-[15px] outline-none focus:border-accent"
              />
            </Field>
          </div>

          <label className="flex items-center gap-2.5 text-[14px] md:col-span-3">
            <input
              type="checkbox"
              name="physicalFileOpened"
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Dossier physique ouvert
          </label>
        </div>
      </Card>

      {message && (
        <div role="alert" className="rounded-[10px] bg-danger-soft px-4 py-3">
          <p className="text-[14px] font-medium text-danger">{message}</p>
          {errors.length > 0 && (
            <ul className="mt-1.5 flex flex-col gap-1">
              {errors.map((e) => (
                <li key={e.field} className="text-[13.5px] text-danger">
                  {e.field} — {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="accent" disabled={busy}>
          {busy ? 'Ouverture…' : 'Ouvrir l’affaire'}
        </Button>
        <StatusBadge tone="neutral">
          Le Code Affaire est alloué à la création, sans trou ni doublon
        </StatusBadge>
      </div>
    </form>
  );
}
