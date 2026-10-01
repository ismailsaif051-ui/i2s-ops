'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, DataTable, StatusBadge, Td, Th } from '@/components/ui';
import { date, moneyDh } from '@/lib/format';

interface ImportLine {
  row: number;
  matricule: string;
  employee?: string;
  status: 'ready' | 'done' | 'unchanged' | 'error';
  amount?: number;
  previousAmount?: number | null;
  validFrom?: string;
  message?: string;
}

interface ImportResult {
  applied: boolean;
  ready: number;
  done: number;
  unchanged: number;
  errors: number;
  repricedDays: number;
  lockedDays: number;
  lines: ImportLine[];
}

const STATUS: Record<
  ImportLine['status'],
  { label: string; tone: 'info' | 'success' | 'neutral' | 'danger' }
> = {
  ready: { label: 'À enregistrer', tone: 'info' },
  done: { label: 'Enregistré', tone: 'success' },
  unchanged: { label: 'Sans changement', tone: 'neutral' },
  error: { label: 'Erreur', tone: 'danger' },
};

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Mise à jour des coûts journaliers par Excel — augmentation annuelle ou
 * reprise de l'historique de paie.
 *
 * Toujours en deux temps : l'aperçu montre chaque ligne (ancien → nouveau
 * coût) sans rien écrire ; l'enregistrement n'est proposé que si le fichier
 * ne contient aucune erreur, et il passe en entier ou pas du tout.
 */
export function ImportDailyCostsForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<{ name: string; content: string } | null>(null);
  const [busy, setBusy] = useState<'preview' | 'apply' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function send(apply: boolean, current = file) {
    if (!current) return;
    setBusy(apply ? 'apply' : 'preview');
    setError(null);

    const response = await fetch('/api/employees/daily-costs/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: current.name,
        contentBase64: current.content,
        apply,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as ImportResult & {
      message?: string;
    };
    setBusy(null);

    if (!response.ok) {
      setError(payload.message ?? 'Import refusé.');
      if (!apply) setResult(null);
      return;
    }

    setResult(payload);
    if (apply) router.refresh();
  }

  async function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    setResult(null);
    setError(null);
    if (!picked) {
      setFile(null);
      return;
    }
    const next = { name: picked.name, content: await toBase64(picked) };
    setFile(next);
    await send(false, next);
  }

  function close() {
    setOpen(false);
    setFile(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Mettre à jour les coûts</Button>;
  }

  const shown =
    result?.lines.filter((l) => l.status !== 'unchanged' || result.lines.length <= 30) ?? [];

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-10">
      <Card title="Mettre à jour les coûts journaliers" className="w-full max-w-[880px]">
        <div className="flex flex-col gap-4 px-5 py-5">
          <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[14px] text-muted">
            <li>
              <a
                href="/api/employees/daily-costs/template"
                className="font-medium text-accent hover:underline"
              >
                Téléchargez le modèle
              </a>{' '}
              : un employé par ligne, avec son coût actuel.
            </li>
            <li>
              Pour chaque employé qui change, remplissez <strong>Nouveau coût journalier</strong>,{' '}
              <strong>Date d’effet</strong> et, si vous le souhaitez, le <strong>Motif</strong>.
              Laissez les autres lignes vides.
            </li>
            <li>
              Pour reprendre un historique, ajoutez une ligne par période (même matricule, dates
              différentes).
            </li>
            <li>
              Choisissez le fichier : un aperçu s’affiche, rien n’est enregistré avant votre accord.
            </li>
          </ol>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            onChange={choose}
            disabled={busy !== null}
            className="text-[14px]"
          />

          {busy === 'preview' && <p className="text-[14px] text-muted">Lecture du fichier…</p>}

          {error && (
            <p
              role="alert"
              className="rounded-[10px] bg-danger-soft px-4 py-3 text-[14px] text-danger"
            >
              {error}
            </p>
          )}

          {result && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {result.applied ? (
                  <StatusBadge tone="success">{result.done} coût(s) enregistré(s)</StatusBadge>
                ) : (
                  <StatusBadge tone="info">{result.ready} à enregistrer</StatusBadge>
                )}
                {result.unchanged > 0 && (
                  <StatusBadge tone="neutral">{result.unchanged} sans changement</StatusBadge>
                )}
                {result.errors > 0 && (
                  <StatusBadge tone="danger">{result.errors} erreur(s)</StatusBadge>
                )}
              </div>

              {result.applied && (result.repricedDays > 0 || result.lockedDays > 0) && (
                <p className="text-[14px] text-muted">
                  {result.repricedDays > 0 &&
                    `${result.repricedDays} journée(s) déjà pointée(s) revalorisée(s) au nouveau coût. `}
                  {result.lockedDays > 0 &&
                    `${result.lockedDays} journée(s) d’un mois clôturé gardent l’ancien coût.`}
                </p>
              )}

              {shown.length > 0 && (
                <div className="max-h-[360px] overflow-auto rounded-[10px] border border-border">
                  <DataTable>
                    <thead>
                      <tr>
                        <Th>Ligne</Th>
                        <Th>Employé</Th>
                        <Th align="right">Ancien</Th>
                        <Th align="right">Nouveau</Th>
                        <Th>Date d’effet</Th>
                        <Th>État</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((line) => (
                        <tr key={line.row}>
                          <Td mono>{line.row}</Td>
                          <Td>
                            <span className="ref">{line.matricule}</span>
                            {line.employee && <span className="ml-1.5">{line.employee}</span>}
                          </Td>
                          <Td align="right" mono>
                            {line.previousAmount != null ? moneyDh(line.previousAmount, 2) : '—'}
                          </Td>
                          <Td align="right" mono>
                            {line.amount != null ? moneyDh(line.amount, 2) : '—'}
                          </Td>
                          <Td>{line.validFrom ? date(line.validFrom) : '—'}</Td>
                          <Td>
                            <StatusBadge tone={STATUS[line.status].tone}>
                              {STATUS[line.status].label}
                            </StatusBadge>
                            {line.message && (
                              <span className="mt-1 block max-w-[300px] text-[12.5px] text-muted">
                                {line.message}
                              </span>
                            )}
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </DataTable>
                </div>
              )}

              {!result.applied && result.errors > 0 && (
                <p className="text-[14px] text-danger">
                  Corrigez les lignes en erreur dans le fichier, puis choisissez-le à nouveau. Rien
                  n’a été enregistré.
                </p>
              )}
            </>
          )}

          <div className="flex items-center gap-3">
            {result && !result.applied && result.errors === 0 && result.ready > 0 && (
              <Button variant="accent" onClick={() => send(true)} disabled={busy !== null}>
                {busy === 'apply' ? 'Enregistrement…' : `Enregistrer ${result.ready} coût(s)`}
              </Button>
            )}
            <button
              type="button"
              onClick={close}
              className="text-[13.5px] text-subtle hover:underline"
            >
              Fermer
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
