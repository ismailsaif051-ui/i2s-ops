'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { moneyDh } from '@/lib/format';

/**
 * Le tunnel commercial, colonne par colonne.
 *
 * Les six premières étapes se parcourent en glissant la carte. Les deux
 * dernières ne sont pas des étapes qu'on décrète : une demande se gagne en
 * acceptant une offre — ce qui ouvre l'affaire — et se perd avec une cause,
 * qui alimente l'analyse commerciale. Ces deux colonnes refusent donc le
 * dépôt, et l'API le refuserait de toute façon.
 */
const PIPELINE: Array<{ value: string; label: string }> = [
  { value: 'NEW', label: 'Nouvelle' },
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'OFFER_DRAFT', label: 'Offre en préparation' },
  { value: 'OFFER_SENT', label: 'Offre envoyée' },
  { value: 'FOLLOW_UP', label: 'Relance' },
  { value: 'NEGOTIATION', label: 'Négociation' },
];

const CLOSED: Array<{ value: string; label: string; hint: string }> = [
  { value: 'WON', label: 'Gagnée', hint: 'se gagne en acceptant une offre' },
  { value: 'LOST', label: 'Perdue', hint: 'se déclare avec une cause' },
];

export interface KanbanCard {
  id: string;
  stage: string;
  title: string;
  client: string;
  amount: number | null;
  deadline: { label: string; tone: string | null } | null;
}

export function ConsultationsKanban({
  items,
  canUpdate,
}: {
  items: KanbanCard[];
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [dragging, setDragging] = useState<KanbanCard | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const columns = [
    ...PIPELINE.map((s) => ({ ...s, droppable: true, hint: null as string | null })),
    ...CLOSED.map((s) => ({ ...s, droppable: false })),
  ].map((col) => {
    const rows = items.filter((i) => i.stage === col.value);
    return {
      ...col,
      rows,
      amount: rows.reduce((s, r) => s + (r.amount ?? 0), 0),
    };
  });

  async function move(card: KanbanCard, toStage: string) {
    if (card.stage === toStage) return;
    setBusyId(card.id);
    setError(null);

    const response = await fetch(`/api/commercial/opportunites/${card.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: toStage }),
    });
    const payload = (await response.json().catch(() => ({}))) as { message?: string };

    if (!response.ok) {
      setError(payload.message ?? 'Le changement d’étape a échoué.');
      setBusyId(null);
      return;
    }

    router.refresh();
    setBusyId(null);
  }

  return (
    <div className="px-5 py-5">
      {error && (
        <p className="mb-4 rounded-[8px] border border-danger/40 bg-danger/5 px-3.5 py-2.5 text-[13px] text-danger">
          {error}
        </p>
      )}

      {canUpdate && (
        <p className="mb-3 text-[12.5px] text-subtle">
          Glissez une carte pour changer son étape. Une demande gagnée ou perdue se traite depuis sa
          fiche : l’une ouvre l’affaire, l’autre demande une cause.
        </p>
      )}

      <div className="flex gap-4 overflow-x-auto pb-1">
        {columns.map((col) => {
          const active = over === col.value && col.droppable;
          return (
            <div
              key={col.value}
              onDragOver={(e) => {
                if (!col.droppable || !dragging) return;
                e.preventDefault();
                setOver(col.value);
              }}
              onDragLeave={() => setOver((c) => (c === col.value ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                if (col.droppable && dragging) void move(dragging, col.value);
                setDragging(null);
              }}
              className={`flex w-[262px] flex-none flex-col gap-2.5 rounded-[10px] p-2 transition-colors ${
                active
                  ? 'bg-accent/8 ring-1 ring-accent/40'
                  : dragging && !col.droppable
                    ? 'opacity-50'
                    : ''
              }`}
            >
              <div className="px-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-[12.5px] font-medium">{col.label}</span>
                  <span className="tnum text-[11.5px] text-subtle">{col.rows.length}</span>
                </div>
                <span className="block text-[11px] text-subtle">
                  {col.droppable || col.rows.length > 0 ? moneyDh(col.amount) : ''}
                </span>
                {!col.droppable && dragging && (
                  <span className="mt-0.5 block text-[10.5px] leading-tight text-subtle">
                    {col.hint}
                  </span>
                )}
              </div>

              <div className="flex min-h-[40px] flex-col gap-2">
                {col.rows.map((row) => {
                  const movable = canUpdate && row.stage !== 'WON';
                  return (
                    <div
                      key={row.id}
                      draggable={movable}
                      onDragStart={() => setDragging(row)}
                      onDragEnd={() => {
                        setDragging(null);
                        setOver(null);
                      }}
                      className={`rounded-[10px] border border-border bg-surface p-3 ${
                        movable ? 'cursor-grab active:cursor-grabbing' : ''
                      } ${busyId === row.id ? 'opacity-50' : ''} ${
                        dragging?.id === row.id ? 'opacity-40' : ''
                      }`}
                    >
                      <Link
                        href={`/commercial/consultations/${row.id}`}
                        className="mb-1 line-clamp-2 block text-[13px] font-medium leading-snug hover:text-accent"
                      >
                        {row.title}
                      </Link>
                      <p className="mb-2 text-[12px] text-subtle">{row.client}</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="tnum text-[12.5px] font-medium">{moneyDh(row.amount)}</span>
                        {row.deadline && (
                          <span
                            className={`text-[11px] ${
                              row.deadline.tone === 'danger'
                                ? 'text-danger'
                                : row.deadline.tone === 'warning'
                                  ? 'text-warning'
                                  : 'text-subtle'
                            }`}
                          >
                            {row.deadline.label}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
