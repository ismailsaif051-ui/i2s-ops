'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, DataTable, StatusBadge, Td, Th } from '@/components/ui';

export interface PendingRow {
  employeeId: string;
  matricule: string;
  name: string;
  department: string | null;
  days: number;
  unassigned: number;
  corrected: number;
}

/**
 * Génération du pointage et visa du mois.
 *
 * Le pointage se déduit du planning : le bouton ne fait que rejouer cette
 * déduction sur le mois, sans toucher aux journées corrigées ni à celles
 * déjà visées. Le visa, lui, engage — il rend le temps passé opposable.
 */
export function TimesheetMonth({
  month,
  pending,
  canGenerate,
  canValidate,
}: {
  month: string;
  pending: PendingRow[];
  canGenerate: boolean;
  canValidate: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  async function call(path: string, body: unknown, key: string) {
    setBusy(key);
    setMessage(null);

    const response = await fetch(`/api/pointage/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      generated?: number;
      skipped?: number;
      validated?: number;
      byCategory?: Record<string, number>;
    };

    setBusy(null);

    if (!response.ok) {
      setMessage({ tone: 'error', text: payload.message ?? 'Opération refusée.' });
      return;
    }

    setMessage({
      tone: 'ok',
      text:
        payload.validated !== undefined
          ? `${payload.validated} journée(s) visée(s).`
          : `${payload.generated} journée(s) déduites du planning` +
            (payload.byCategory?.UNASSIGNED
              ? `, dont ${payload.byCategory.UNASSIGNED} non affectée(s).`
              : '.'),
    });

    router.refresh();
  }

  if (!canGenerate && !canValidate) return null;

  return (
    <Card
      title={`Pointage du mois — ${month}`}
      action={
        canGenerate && (
          <Button
            variant="accent"
            disabled={busy !== null}
            onClick={() => call('generer', { month }, 'generer')}
          >
            {busy === 'generer' ? 'Déduction…' : 'Déduire du planning'}
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-4 px-5 py-5">
        {message && (
          <p
            role="status"
            className={`rounded-[10px] px-4 py-3 text-[14px] ${
              message.tone === 'ok' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
            }`}
          >
            {message.text}
          </p>
        )}

        {pending.length === 0 ? (
          <p className="text-[14px] text-muted">
            Aucun pointage en attente de visa sur ce mois.
          </p>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>Collaborateur</Th>
                <Th>Service</Th>
                <Th align="right">Jours</Th>
                <Th align="right">Non affectés</Th>
                <Th align="right">Corrigés</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {pending.map((row) => (
                <tr key={row.employeeId}>
                  <Td>
                    <Link
                      href={`/ressources/pointage?employe=${row.employeeId}`}
                      className="font-medium hover:text-accent"
                    >
                      {row.name}
                    </Link>
                  </Td>
                  <Td>{row.department ?? <span className="text-subtle">—</span>}</Td>
                  <Td mono align="right">
                    {row.days}
                  </Td>
                  <Td align="right">
                    {row.unassigned > 0 ? (
                      <StatusBadge tone="danger">{row.unassigned}</StatusBadge>
                    ) : (
                      <span className="text-subtle">—</span>
                    )}
                  </Td>
                  <Td mono align="right">
                    {row.corrected > 0 ? row.corrected : <span className="text-subtle">—</span>}
                  </Td>
                  <Td>
                    {canValidate && (
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() =>
                          call(
                            'viser',
                            { employeeId: row.employeeId, month },
                            `viser-${row.employeeId}`,
                          )
                        }
                        className="text-[13.5px] font-medium text-accent hover:underline disabled:opacity-50"
                      >
                        {busy === `viser-${row.employeeId}` ? 'Visa…' : 'Viser le mois'}
                      </button>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </div>
    </Card>
  );
}
