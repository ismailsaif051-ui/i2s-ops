'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, DataTable, Field, Input, StatusBadge, Td, Th } from '@/components/ui';

export interface AffairOption {
  id: string;
  number: string;
  title: string;
  client: string;
}

interface PreparedLine {
  missionId: string | null;
  missionNumber: string | null;
  designation: string;
  days: number;
  unitRate: number | null;
  rateSource: 'AFFAIR_RATE' | 'AFFAIR_DAILY_RATE' | 'MISSING';
  amountHT: number;
}

interface Preparation {
  affair: { number: string; client: string };
  period: { from: string; to: string };
  lines: PreparedLine[];
  totalHT: number;
  missingRates: number;
}

const RATE_ORIGIN: Record<string, string> = {
  AFFAIR_RATE: 'barème de l’affaire',
  AFFAIR_DAILY_RATE: 'prix de journée de l’affaire',
  MISSING: 'aucun prix connu',
};

const money = (value: number) =>
  `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} DH`;

/**
 * Préparation d'un attachement.
 *
 * On montre d'abord ce qu'il y a à facturer — sans rien figer. L'attachement
 * n'est créé qu'une fois les journées et les prix sous les yeux : c'est la
 * pièce que le client signera, elle ne se devine pas.
 */
export function AttachmentForm({ affairs }: { affairs: AffairOption[] }) {
  const router = useRouter();

  const [affairId, setAffairId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [preparation, setPreparation] = useState<Preparation | null>(null);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [issues, setIssues] = useState<Array<{ field: string; message: string }>>([]);

  async function preview() {
    setBusy('preview');
    setMessage(null);
    setIssues([]);
    setPreparation(null);

    const params = new URLSearchParams({ affairId, from, to });
    const response = await fetch(`/api/facturation/preparation?${params}`);
    const body = (await response.json().catch(() => ({}))) as Preparation & { message?: string };

    setBusy(null);

    if (!response.ok) {
      setMessage({ tone: 'error', text: body.message ?? 'Préparation impossible.' });
      return;
    }

    setPreparation(body);
    setRates(
      Object.fromEntries(
        body.lines
          .filter((l) => l.missionId && l.unitRate !== null)
          .map((l) => [l.missionId!, l.unitRate!]),
      ),
    );
  }

  async function create() {
    setBusy('create');
    setMessage(null);
    setIssues([]);

    const response = await fetch('/api/facturation/attachements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ affairId, periodStart: from, periodEnd: to, rates }),
    });

    const body = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      errors?: Array<{ field: string; message: string }>;
    };

    if (response.ok && body.id) {
      router.push(`/finance/attachements/${body.id}`);
      router.refresh();
      return;
    }

    setBusy(null);
    setIssues(body.errors ?? []);
    setMessage({ tone: 'error', text: body.message ?? 'Création impossible.' });
  }

  const total = preparation
    ? preparation.lines.reduce(
        (sum, l) => sum + l.days * (l.missionId ? (rates[l.missionId] ?? 0) : (l.unitRate ?? 0)),
        0,
      )
    : 0;

  const selectClass =
    'h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3.5 text-[15px] outline-none focus:border-accent';

  return (
    <div className="flex flex-col gap-5">
      <Card title="Période à attacher">
        <div className="grid gap-5 px-5 py-5 md:grid-cols-4">
          <div className="md:col-span-2">
            <Field label="Affaire">
              <select
                required
                value={affairId}
                onChange={(e) => {
                  setAffairId(e.target.value);
                  setPreparation(null);
                }}
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

          <Field label="Du">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>

          <Field label="Au">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>

          <div className="md:col-span-4">
            <Button
              onClick={preview}
              disabled={busy !== null || !affairId || !from || !to}
            >
              {busy === 'preview' ? 'Recherche…' : 'Voir ce qu’il y a à facturer'}
            </Button>
          </div>
        </div>
      </Card>

      {message && (
        <div role="alert" className="rounded-[10px] bg-danger-soft px-4 py-3">
          <p className="text-[14px] font-medium text-danger">{message.text}</p>
          {issues.length > 0 && (
            <ul className="mt-1.5 flex flex-col gap-1">
              {issues.map((i) => (
                <li key={i.field} className="text-[13.5px] text-danger">
                  {i.field} — {i.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {preparation && (
        <Card
          title={`${preparation.lines.length} ligne(s) — ${preparation.affair.client}`}
          action={
            <span className="text-[14px] font-medium">
              {money(Math.round(total * 100) / 100)} HT
            </span>
          }
        >
          {preparation.lines.length === 0 ? (
            <div className="px-5 py-5">
              <p className="text-[14px] text-muted">
                Aucune journée visée et facturable sur cette période. Seules les journées
                d’intervention facturables, une fois le mois visé, peuvent être attachées.
              </p>
            </div>
          ) : (
            <>
              <DataTable>
                <thead>
                  <tr>
                    <Th>Prestation</Th>
                    <Th align="right">Jours</Th>
                    <Th align="right">Prix unitaire</Th>
                    <Th>Origine du prix</Th>
                    <Th align="right">Montant HT</Th>
                  </tr>
                </thead>
                <tbody>
                  {preparation.lines.map((line) => {
                    const rate = line.missionId
                      ? (rates[line.missionId] ?? 0)
                      : (line.unitRate ?? 0);

                    return (
                      <tr key={line.missionId ?? line.designation}>
                        <Td>{line.designation}</Td>
                        <Td mono align="right">
                          {line.days}
                        </Td>
                        <Td align="right">
                          {line.missionId ? (
                            <input
                              type="number"
                              min={0}
                              step={50}
                              value={rate || ''}
                              onChange={(e) =>
                                setRates({
                                  ...rates,
                                  [line.missionId!]: Number(e.target.value),
                                })
                              }
                              className="h-9 w-28 rounded-[8px] border border-border-strong bg-surface px-2.5 text-right text-[14px] outline-none focus:border-accent"
                            />
                          ) : (
                            money(rate)
                          )}
                        </Td>
                        <Td>
                          <StatusBadge tone={line.rateSource === 'MISSING' ? 'danger' : 'neutral'}>
                            {RATE_ORIGIN[line.rateSource]}
                          </StatusBadge>
                        </Td>
                        <Td mono align="right">
                          {money(Math.round(line.days * rate * 100) / 100)}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </DataTable>

              <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-4">
                <Button
                  variant="accent"
                  onClick={create}
                  disabled={busy !== null || preparation.lines.length === 0}
                >
                  {busy === 'create' ? 'Création…' : 'Créer l’attachement'}
                </Button>
                <span className="text-[13.5px] text-subtle">
                  Les journées retenues seront rattachées à cet attachement : elles ne pourront
                  plus être facturées ailleurs.
                </span>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
