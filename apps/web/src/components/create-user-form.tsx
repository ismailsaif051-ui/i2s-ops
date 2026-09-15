'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROLE_CODES, ROLE_LABELS } from '@i2s/contracts';
import { Button, Card, Field, Input } from '@/components/ui';

export interface EmployeeOption {
  id: string;
  matricule: string;
  name: string;
  position: string | null;
}

export interface DepartmentOption {
  id: string;
  code: string;
  name: string;
}

const selectClass =
  'h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3.5 text-[15px] outline-none focus:border-accent';

export function CreateUserForm({
  employees,
  departments,
}: {
  employees: EmployeeOption[];
  departments: DepartmentOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; temporaryPassword: string } | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const employeeId = String(form.get('employeeId') ?? '');
    const departmentId = String(form.get('departmentId') ?? '');

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: String(form.get('email') ?? '').trim(),
        employeeId: employeeId || undefined,
        roles: [
          {
            roleCode: String(form.get('roleCode') ?? ''),
            departmentId: departmentId || undefined,
          },
        ],
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      email?: string;
      temporaryPassword?: string;
    };
    setBusy(false);

    if (!response.ok) {
      setError(payload.message ?? 'Création refusée.');
      return;
    }

    setCreated({ email: payload.email!, temporaryPassword: payload.temporaryPassword! });
    router.refresh();
  }

  if (created) {
    return (
      <Card title="Compte créé">
        <div className="flex flex-col gap-4 px-5 py-5">
          <p className="text-[14px] text-muted">
            Ce mot de passe provisoire ne sera plus jamais affiché — notez-le maintenant. Le
            compte devra en changer à la première connexion.
          </p>
          <dl className="flex flex-col gap-2 rounded-[10px] border border-border bg-surface-2 px-4 py-3">
            <div>
              <dt className="text-[12.5px] uppercase tracking-[0.04em] text-subtle">Adresse</dt>
              <dd className="ref mt-0.5 text-[14.5px]">{created.email}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] uppercase tracking-[0.04em] text-subtle">
                Mot de passe provisoire
              </dt>
              <dd className="ref mt-0.5 text-[16px] font-medium">{created.temporaryPassword}</dd>
            </div>
          </dl>
          <div>
            <Button
              variant="accent"
              onClick={() => {
                setCreated(null);
                setOpen(false);
              }}
            >
              Fermer
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!open) {
    return (
      <div>
        <Button variant="accent" onClick={() => setOpen(true)}>
          Créer un utilisateur
        </Button>
      </div>
    );
  }

  return (
    <Card title="Nouveau compte">
      <form onSubmit={submit} className="flex flex-col gap-4 px-5 py-5">
        <Field label="Adresse email">
          <Input type="email" name="email" required maxLength={200} />
        </Field>

        <Field label="Employé" hint="Facultatif — un compte sans employé rattaché reste possible.">
          <select name="employeeId" defaultValue="" className={selectClass}>
            <option value="">Aucun</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.matricule} · {e.name}
                {e.position ? ` — ${e.position}` : ''}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Rôle">
          <select name="roleCode" defaultValue="" required className={selectClass}>
            <option value="" disabled>
              Choisir…
            </option>
            {ROLE_CODES.map((code) => (
              <option key={code} value={code}>
                {ROLE_LABELS[code]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Département"
          hint="Requis pour un rôle dont le périmètre est le département (ex. Chef de département)."
        >
          <select name="departmentId" defaultValue="" className={selectClass}>
            <option value="">Aucun</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} · {d.name}
              </option>
            ))}
          </select>
        </Field>

        {error && (
          <p role="alert" className="rounded-[10px] bg-danger-soft px-4 py-3 text-[14px] text-danger">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" variant="accent" disabled={busy}>
            {busy ? 'Création…' : 'Créer le compte'}
          </Button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[13.5px] text-subtle hover:underline"
          >
            Annuler
          </button>
        </div>
      </form>
    </Card>
  );
}
