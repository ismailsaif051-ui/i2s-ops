'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Field, Input, StatusBadge } from '@/components/ui';

const RESULTS: Array<{ value: string; label: string; hint: string }> = [
  { value: 'CONFORM', label: 'Conforme', hint: 'L’instrument redevient utilisable' },
  {
    value: 'CONFORM_WITH_RESERVE',
    label: 'Conforme avec réserve',
    hint: 'Utilisable, avec les limites notées au certificat',
  },
  {
    value: 'NON_CONFORM',
    label: 'Non conforme',
    hint: 'L’instrument sort du service — il ne peut plus fonder un rapport',
  },
];

/**
 * Enregistrement d'un certificat d'étalonnage.
 *
 * C'est le seul geste qui rend un instrument périmé utilisable à nouveau. Le
 * certificat scanné est joint : sans lui, un audit n'a que la parole de celui
 * qui a saisi.
 */
export function CalibrationForm({
  deviceId,
  deviceCode,
  intervalMonths,
  canEdit,
}: {
  deviceId: string;
  deviceCode: string;
  intervalMonths: number;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('CONFORM');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [issues, setIssues] = useState<string[]>([]);

  if (!canEdit) return null;

  async function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName(null);
      setFileContent(null);
      return;
    }

    const buffer = await file.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);

    setFileName(file.name);
    setFileContent(btoa(binary));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setIssues([]);

    const form = new FormData(event.currentTarget);
    const validUntil = String(form.get('validUntil') ?? '').trim();
    const cost = String(form.get('cost') ?? '').trim();

    const response = await fetch(`/api/parc-mesure/${deviceId}/etalonnage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: String(form.get('date') ?? ''),
        validUntil: validUntil || null,
        provider: String(form.get('provider') ?? '').trim() || null,
        certificateNumber: String(form.get('certificateNumber') ?? '').trim(),
        result,
        cost: cost ? Number(cost) : null,
        certificate: fileContent ? { fileName: fileName ?? 'certificat.pdf', contentBase64: fileContent } : null,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      errors?: Array<{ field: string; message: string }>;
      warnings?: string[];
    };

    setBusy(false);

    if (!response.ok) {
      setIssues((payload.errors ?? []).map((e) => e.message));
      setMessage({ tone: 'error', text: payload.message ?? 'Certificat refusé.' });
      return;
    }

    setIssues(payload.warnings ?? []);
    setMessage({ tone: 'ok', text: `Certificat enregistré pour ${deviceCode}.` });
    setOpen(false);
    setFileName(null);
    setFileContent(null);
    router.refresh();
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card
      title="Étalonnage"
      action={
        !open && (
          <Button variant="accent" onClick={() => setOpen(true)}>
            Enregistrer un certificat
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-4 px-5 py-5">
        {!open && (
          <p className="text-[14px] text-muted">
            Un instrument dont l’étalonnage a expiré ne peut plus fonder un rapport.
            L’enregistrement d’un certificat conforme le rend utilisable à nouveau — c’est
            le seul geste qui le fasse.
          </p>
        )}

        {open && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date de l’étalonnage" hint="Telle qu’elle figure au certificat.">
                <Input type="date" name="date" required defaultValue={today} max={today} />
              </Field>

              <Field
                label="Échéance"
                hint={`Laissée vide, elle est calculée à ${intervalMonths} mois.`}
              >
                <Input type="date" name="validUntil" />
              </Field>

              <Field label="N° de certificat" hint="La preuve de l’étalonnage : obligatoire.">
                <Input name="certificateNumber" required maxLength={80} placeholder="CERT-2026-0412" />
              </Field>

              <Field label="Laboratoire" hint="Organisme ayant réalisé l’étalonnage.">
                <Input name="provider" maxLength={120} placeholder="LPEE — Laboratoire de métrologie" />
              </Field>

              <Field label="Coût (DH)" hint="Facultatif — alimente le coût du parc.">
                <Input type="number" name="cost" min="0" step="0.01" />
              </Field>

              <Field label="Certificat scanné" hint="PDF. Il rejoint la GED, rattaché à l’instrument.">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={pickFile}
                  className="h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3 py-2 text-[14px] file:mr-3 file:rounded-[6px] file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-[13.5px]"
                />
              </Field>
            </div>

            <div>
              <span className="mb-2 block text-[14px] font-medium">Résultat</span>
              <div className="flex flex-wrap gap-2">
                {RESULTS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    title={r.hint}
                    onClick={() => setResult(r.value)}
                    className={`h-9 rounded-[8px] border px-3.5 text-[13.5px] font-medium transition-colors ${
                      result === r.value
                        ? r.value === 'NON_CONFORM'
                          ? 'border-danger bg-danger-soft text-danger'
                          : 'border-success bg-success-soft text-success'
                        : 'border-border text-muted hover:border-border-strong'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[13px] text-subtle">
                {RESULTS.find((r) => r.value === result)?.hint}
              </p>
            </div>

            {message?.tone === 'error' && (
              <div role="alert" className="rounded-[10px] bg-danger-soft px-4 py-3">
                <p className="text-[14px] font-medium text-danger">{message.text}</p>
                {issues.length > 0 && (
                  <ul className="mt-1.5 flex flex-col gap-1">
                    {issues.map((i) => (
                      <li key={i} className="text-[13.5px] text-danger">
                        {i}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" variant="accent" disabled={busy}>
                {busy ? 'Enregistrement…' : 'Enregistrer le certificat'}
              </Button>
              <Button type="button" onClick={() => setOpen(false)}>
                Annuler
              </Button>
            </div>
          </form>
        )}

        {!open && message && (
          <div
            className={`rounded-[10px] px-4 py-3 ${
              message.tone === 'ok' ? 'bg-success-soft' : 'bg-danger-soft'
            }`}
          >
            <p
              className={`text-[14px] font-medium ${
                message.tone === 'ok' ? 'text-success' : 'text-danger'
              }`}
            >
              {message.text}
            </p>
            {issues.length > 0 && (
              <ul className="mt-1.5 flex flex-col gap-1">
                {issues.map((i) => (
                  <li key={i} className="text-[13.5px] text-muted">
                    {i}
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

/** Départ au laboratoire, réforme, remise en service. */
export function DeviceActions({
  deviceId,
  status,
  expired,
  canEdit,
  canApprove,
}: {
  deviceId: string;
  status: string;
  expired: boolean;
  canEdit: boolean;
  canApprove: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retiring, setRetiring] = useState(false);

  if (!canEdit && !canApprove) return null;

  async function call(path: string, body?: unknown) {
    setBusy(path);
    setError(null);

    const response = await fetch(`/api/parc-mesure/${deviceId}/${path}`, {
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
    setRetiring(false);
    router.refresh();
  }

  return (
    <Card title="Cycle de vie">
      <div className="flex flex-col gap-3 px-5 py-5">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge tone={status === 'OUT_OF_SERVICE' ? 'danger' : expired ? 'warning' : 'success'}>
            {status === 'OUT_OF_SERVICE'
              ? 'Réformé'
              : status === 'IN_CALIBRATION'
                ? 'Au laboratoire'
                : expired
                  ? 'Étalonnage expiré'
                  : 'En service'}
          </StatusBadge>

          {canEdit && status !== 'IN_CALIBRATION' && status !== 'OUT_OF_SERVICE' && (
            <Button disabled={busy !== null} onClick={() => call('depart-etalonnage')}>
              {busy === 'depart-etalonnage' ? 'Envoi…' : 'Envoyer au laboratoire'}
            </Button>
          )}

          {canApprove && status === 'OUT_OF_SERVICE' && (
            <Button disabled={busy !== null} onClick={() => call('remise-en-service')}>
              {busy === 'remise-en-service' ? 'Remise…' : 'Remettre en service'}
            </Button>
          )}

          {canApprove && status !== 'OUT_OF_SERVICE' && !retiring && (
            <Button onClick={() => setRetiring(true)}>Réformer</Button>
          )}
        </div>

        {retiring && (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              await call('reforme', { reason: String(form.get('reason') ?? '').trim() });
            }}
            className="flex flex-col gap-3"
          >
            <Field label="Motif de la réforme" hint="Il figurera au journal du parc.">
              <Input name="reason" required minLength={3} maxLength={500} autoFocus />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" variant="accent" disabled={busy !== null}>
                {busy === 'reforme' ? 'Réforme…' : 'Confirmer la réforme'}
              </Button>
              <Button type="button" onClick={() => setRetiring(false)}>
                Annuler
              </Button>
            </div>
          </form>
        )}

        {error && (
          <p role="alert" className="rounded-[8px] bg-danger-soft px-3.5 py-2.5 text-[14px] text-danger">
            {error}
          </p>
        )}
      </div>
    </Card>
  );
}
