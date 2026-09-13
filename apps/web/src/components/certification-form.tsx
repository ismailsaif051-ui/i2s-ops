'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Field, Input } from '@/components/ui';

export interface EmployeeOption {
  id: string;
  name: string;
  matricule: string;
}

/**
 * Enregistrement d'une habilitation.
 *
 * C'est le geste qui rend un inspecteur affectable à une méthode : une
 * habilitation périmée bloque l'affectation, et seule une nouvelle la débloque.
 */
export function CertificationForm({
  employees,
  methods,
}: {
  employees: EmployeeOption[];
  methods: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; details: string[] } | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  if (!open) {
    return (
      <Button variant="accent" onClick={() => setOpen(true)}>
        Enregistrer une habilitation
      </Button>
    );
  }

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

  const inputClass =
    'h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3.5 text-[15px] outline-none focus:border-accent';

  return (
    <Card title="Enregistrer une habilitation">
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError(null);
          setWarnings([]);

          const form = new FormData(event.currentTarget);
          const issuedAt = String(form.get('issuedAt') ?? '').trim();

          const response = await fetch('/api/habilitations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeId: String(form.get('employeeId') ?? ''),
              type: String(form.get('type') ?? '').trim(),
              method: String(form.get('method') ?? '').trim() || null,
              level: String(form.get('level') ?? '').trim() || null,
              issuer: String(form.get('issuer') ?? '').trim() || null,
              number: String(form.get('number') ?? '').trim() || null,
              issuedAt: issuedAt || null,
              expiresAt: String(form.get('expiresAt') ?? ''),
              certificate: fileContent
                ? { fileName: fileName ?? 'certificat.pdf', contentBase64: fileContent }
                : null,
            }),
          });

          const payload = (await response.json().catch(() => ({}))) as {
            message?: string;
            errors?: Array<{ field: string; message: string }>;
            warnings?: string[];
          };

          setBusy(false);

          if (!response.ok) {
            setError({
              message: payload.message ?? 'Habilitation refusée.',
              details: (payload.errors ?? []).map((e) => e.message),
            });
            return;
          }

          setWarnings(payload.warnings ?? []);
          if ((payload.warnings ?? []).length === 0) setOpen(false);
          setFileName(null);
          setFileContent(null);
          router.refresh();
        }}
        className="flex flex-col gap-4 px-5 py-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Titulaire">
            <select name="employeeId" required className={inputClass}>
              <option value="">Choisir…</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} — {e.matricule}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Type" hint="COFREND, ASNT, habilitation électrique…">
            <Input name="type" required minLength={2} maxLength={60} placeholder="COFREND" />
          </Field>

          <Field label="Méthode" hint="Pour une certification d’essais non destructifs.">
            <select name="method" className={inputClass}>
              <option value="">Sans objet</option>
              {methods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Niveau">
            <Input name="level" maxLength={10} placeholder="2" />
          </Field>

          <Field label="Organisme">
            <Input name="issuer" maxLength={120} placeholder="COFREND — Comité français" />
          </Field>

          <Field label="N° de certificat">
            <Input name="number" maxLength={80} />
          </Field>

          <Field label="Délivrée le">
            <Input type="date" name="issuedAt" />
          </Field>

          <Field label="Échéance" hint="C’est elle qui conditionne les affectations.">
            <Input type="date" name="expiresAt" required />
          </Field>
        </div>

        <Field label="Certificat scanné" hint="PDF. Il rejoint la GED en diffusion restreinte.">
          <input
            type="file"
            accept="application/pdf"
            onChange={pickFile}
            className="h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3 py-2 text-[14px] file:mr-3 file:rounded-[6px] file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-[13.5px]"
          />
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

        <div className="flex gap-2">
          <Button type="submit" variant="accent" disabled={busy}>
            {busy ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
          <Button type="button" onClick={() => setOpen(false)}>
            Fermer
          </Button>
        </div>
      </form>
    </Card>
  );
}
