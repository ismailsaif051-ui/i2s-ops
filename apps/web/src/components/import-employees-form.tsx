'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, StatusBadge } from '@/components/ui';

interface ImportDetail {
  row: number;
  matricule: string;
  status: 'created' | 'skipped' | 'error';
  message?: string;
}

interface ImportResult {
  created: number;
  skipped: number;
  errors: number;
  details: ImportDetail[];
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Import en masse — même format de colonnes que l'export, pour un aller-
 * retour naturel : exporter, compléter dans le tableur, réimporter.
 */
export function ImportEmployeesForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function submit() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);
    setResult(null);

    const contentBase64 = await toBase64(file);
    const response = await fetch('/api/employees/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, contentBase64 }),
    });

    const payload = (await response.json().catch(() => ({}))) as ImportResult & {
      message?: string;
    };
    setBusy(false);

    if (!response.ok) {
      setError(payload.message ?? 'Import refusé.');
      return;
    }

    setResult(payload);
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>Importer Excel</Button>
    );
  }

  const issues = result?.details.filter((d) => d.status !== 'created') ?? [];

  return (
    <Card title="Importer des employés">
      <div className="flex flex-col gap-4 px-5 py-5">
        <p className="text-[14px] text-muted">
          Même format que l’export : réutilisez le fichier téléchargé, complété avec les
          nouvelles fiches. Un matricule déjà connu est ignoré — jamais écrasé.
        </p>

        <a
          href="/api/employees/export"
          className="w-fit text-[13.5px] font-medium text-accent hover:underline"
        >
          Télécharger le modèle (export actuel)
        </a>

        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            className="text-[14px]"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button variant="accent" onClick={submit} disabled={busy || !fileName}>
            {busy ? 'Import…' : 'Importer'}
          </Button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setResult(null);
              setError(null);
            }}
            className="text-[13.5px] text-subtle hover:underline"
          >
            Fermer
          </button>
        </div>

        {error && (
          <p role="alert" className="rounded-[10px] bg-danger-soft px-4 py-3 text-[14px] text-danger">
            {error}
          </p>
        )}

        {result && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="success">{result.created} créé(s)</StatusBadge>
              {result.skipped > 0 && (
                <StatusBadge tone="neutral">{result.skipped} ignoré(s)</StatusBadge>
              )}
              {result.errors > 0 && (
                <StatusBadge tone="danger">{result.errors} erreur(s)</StatusBadge>
              )}
            </div>

            {issues.length > 0 && (
              <ul className="flex flex-col gap-1.5 rounded-[10px] border border-border px-4 py-3">
                {issues.map((d, i) => (
                  <li key={i} className="text-[13px] text-muted">
                    <span className="ref">ligne {d.row}</span>
                    {d.matricule !== '—' && <span className="ml-1.5 font-medium">{d.matricule}</span>}
                    {d.message && <span className="ml-1.5">— {d.message}</span>}
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
