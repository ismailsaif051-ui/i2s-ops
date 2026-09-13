'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Field, Input } from '@/components/ui';

/**
 * Police d'assurance et carnet d'entretien.
 *
 * Enregistrer une couverture en cours est le geste qui remet un véhicule en
 * service : c'est le seul point que le système refuse de contourner.
 */
export function VehicleForms({
  vehicleId,
  currentKm,
  uninsured,
  canEdit,
}: {
  vehicleId: string;
  currentKm: number | null;
  uninsured: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<'insurance' | 'maintenance' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; details: string[] } | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  if (!canEdit) return null;

  async function call(path: string, body: unknown) {
    setBusy(true);
    setError(null);
    setWarnings([]);

    const response = await fetch(`/api/flotte/${vehicleId}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      errors?: Array<{ field: string; message: string }>;
      warnings?: string[];
    };

    setBusy(false);

    if (!response.ok) {
      setError({
        message: payload.message ?? 'Opération refusée.',
        details: (payload.errors ?? []).map((e) => e.message),
      });
      return;
    }

    setWarnings(payload.warnings ?? []);
    if ((payload.warnings ?? []).length === 0) setPanel(null);
    router.refresh();
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card title="Enregistrer">
      <div className="flex flex-col gap-4 px-5 py-5">
        {panel === null && (
          <>
            {uninsured && (
              <p className="text-[14px] text-muted">
                Ce véhicule n’a pas de couverture en cours : il reste hors service tant
                qu’une police valide n’est pas enregistrée.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button variant="accent" onClick={() => setPanel('insurance')}>
                Police d’assurance
              </Button>
              <Button onClick={() => setPanel('maintenance')}>Entretien</Button>
            </div>
          </>
        )}

        {panel === 'insurance' && (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const premium = String(form.get('premium') ?? '').trim();
              await call('assurances', {
                policyNumber: String(form.get('policyNumber') ?? '').trim(),
                insurer: String(form.get('insurer') ?? '').trim() || null,
                validFrom: String(form.get('validFrom') ?? ''),
                validTo: String(form.get('validTo') ?? ''),
                premium: premium ? Number(premium) : null,
              });
            }}
            className="flex flex-col gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="N° de police">
                <Input name="policyNumber" required maxLength={80} />
              </Field>
              <Field label="Assureur">
                <Input name="insurer" maxLength={120} placeholder="WAFA ASSURANCE" />
              </Field>
              <Field label="Valide du">
                <Input type="date" name="validFrom" required defaultValue={today} />
              </Field>
              <Field label="Au" hint="C’est cette date qui remet le véhicule en service.">
                <Input type="date" name="validTo" required />
              </Field>
              <Field label="Prime (DH)">
                <Input type="number" name="premium" min="0" step="0.01" />
              </Field>
            </div>
            <Actions busy={busy} onCancel={() => setPanel(null)} label="Enregistrer la police" />
          </form>
        )}

        {panel === 'maintenance' && (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const km = String(form.get('km') ?? '').trim();
              const cost = String(form.get('cost') ?? '').trim();
              const nextDueKm = String(form.get('nextDueKm') ?? '').trim();
              const nextDueDate = String(form.get('nextDueDate') ?? '').trim();

              await call('entretiens', {
                type: String(form.get('type') ?? '').trim(),
                date: String(form.get('date') ?? ''),
                km: km ? Number(km) : null,
                cost: cost ? Number(cost) : null,
                provider: String(form.get('provider') ?? '').trim() || null,
                nextDueKm: nextDueKm ? Number(nextDueKm) : null,
                nextDueDate: nextDueDate || null,
              });
            }}
            className="flex flex-col gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nature">
                <Input name="type" required minLength={2} maxLength={80} placeholder="Vidange, plaquettes" />
              </Field>
              <Field label="Date">
                <Input type="date" name="date" required defaultValue={today} max={today} />
              </Field>
              <Field
                label="Compteur (km)"
                hint={currentKm !== null ? `Dernier relevé : ${currentKm.toLocaleString('fr-FR')} km.` : undefined}
              >
                <Input type="number" name="km" min={currentKm ?? 0} step="1" />
              </Field>
              <Field label="Coût (DH)">
                <Input type="number" name="cost" min="0" step="0.01" />
              </Field>
              <Field label="Garage">
                <Input name="provider" maxLength={120} />
              </Field>
              <Field label="Prochain entretien (km)">
                <Input type="number" name="nextDueKm" min="0" step="1" />
              </Field>
              <Field label="Prochain entretien (date)">
                <Input type="date" name="nextDueDate" />
              </Field>
            </div>
            <Actions busy={busy} onCancel={() => setPanel(null)} label="Enregistrer l’entretien" />
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

        {warnings.length > 0 && (
          <div className="rounded-[10px] bg-warning-soft px-4 py-3">
            <ul className="flex flex-col gap-1">
              {warnings.map((w) => (
                <li key={w} className="text-[13.5px] text-warning">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

function Actions({
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
