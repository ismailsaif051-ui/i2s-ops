'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Field, Input } from '@/components/ui';

export interface AffairOption {
  id: string;
  number: string;
  title: string;
  client: string;
  departmentId: string | null;
  sites: Array<{ id: string; name: string; city: string | null }>;
}

export interface DepartmentOption {
  id: string;
  code: string;
  name: string;
}

interface FieldError {
  field: string;
  message: string;
}

export function MissionForm({
  affairs,
  departments,
  defaultAffairId,
}: {
  affairs: AffairOption[];
  departments: DepartmentOption[];
  defaultAffairId?: string;
}) {
  const router = useRouter();
  const [affairId, setAffairId] = useState(defaultAffairId ?? '');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const affair = useMemo(() => affairs.find((a) => a.id === affairId), [affairs, affairId]);
  const errorFor = (field: string) => errors.find((e) => e.field === field)?.message;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrors([]);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? '').trim();

    const response = await fetch('/api/missions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        affairId,
        objective: value('objective'),
        instructions: value('instructions'),
        departmentId: value('departmentId'),
        siteId: value('siteId'),
        serviceType: value('serviceType'),
        billable: form.get('billable') === 'on',
        plannedStartDate: value('plannedStartDate'),
        plannedEndDate: value('plannedEndDate'),
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      errors?: FieldError[];
    };

    if (response.ok && payload.id) {
      router.push(`/operations/missions/${payload.id}`);
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
    <form onSubmit={submit} className="flex flex-col gap-5">
      <Card title="Intervention">
        <div className="grid gap-5 px-5 py-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Affaire" error={errorFor('affairId')}>
              <select
                required
                value={affairId}
                onChange={(e) => setAffairId(e.target.value)}
                className={selectClass}
              >
                <option value="">Choisir une affaire…</option>
                {affairs.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.number} — {a.client} · {a.title}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field
            label="Service"
            error={errorFor('departmentId')}
            hint="Celui de l’affaire, par défaut."
          >
            <select
              name="departmentId"
              defaultValue=""
              key={affair?.departmentId ?? 'none'}
              className={selectClass}
            >
              <option value="">{affair?.departmentId ? 'Service de l’affaire' : '—'}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} — {d.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Site" error={errorFor('siteId')}>
            <select name="siteId" defaultValue="" disabled={!affair} className={selectClass}>
              <option value="">
                {affair && affair.sites.length === 0 ? 'Aucun site déclaré' : '—'}
              </option>
              {(affair?.sites ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.city ? ` — ${s.city}` : ''}
                </option>
              ))}
            </select>
          </Field>

          <div className="md:col-span-2">
            <Field label="Objet" error={errorFor('objective')}>
              <Input
                name="objective"
                maxLength={300}
                placeholder="Contrôle par ultrasons des soudures de la ligne T-12"
              />
            </Field>
          </div>

          <Field label="Début prévu" error={errorFor('plannedStartDate')}>
            <Input name="plannedStartDate" type="date" required />
          </Field>

          <Field
            label="Fin prévue"
            error={errorFor('plannedEndDate')}
            hint="L’échéance du rapport en découle : 21 jours ouvrés après."
          >
            <Input name="plannedEndDate" type="date" required />
          </Field>

          <Field label="Type de prestation" error={errorFor('serviceType')}>
            <Input name="serviceType" maxLength={80} placeholder="Ultrasons, ressuage, visuel…" />
          </Field>

          <label className="flex items-center gap-2.5 self-end pb-2 text-[14px]">
            <input
              type="checkbox"
              name="billable"
              defaultChecked
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Intervention facturable
          </label>

          <div className="md:col-span-2">
            <Field label="Consignes" error={errorFor('instructions')}>
              <textarea
                name="instructions"
                rows={3}
                maxLength={4000}
                placeholder="Accès, balisage, contraintes d’exploitation…"
                className="w-full rounded-[10px] border border-border-strong bg-surface px-3.5 py-2.5 text-[15px] outline-none focus:border-accent"
              />
            </Field>
          </div>
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
        <Button type="submit" variant="accent" disabled={busy || !affairId}>
          {busy ? 'Création…' : 'Créer la mission'}
        </Button>
        <span className="text-[13.5px] text-subtle">
          L’équipe et l’ordre de mission se posent ensuite, sur la fiche.
        </span>
      </div>
    </form>
  );
}
