'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, StatusBadge, type Tone } from '@/components/ui';

export interface MissionOption {
  missionId: string;
  number: string;
  objective: string | null;
  billable: boolean;
  affair: string;
  client: string;
}

export interface DayEntry {
  category: string;
  missionId: string | null;
  missionNumber: string | null;
  affairNumber: string | null;
  /** Part de la journée — 0,5 quand deux interventions se la partagent. */
  share: number;
  comment: string | null;
  status: string;
  source: string;
  validatedBy: string | null;
  locked: boolean;
}

export interface WeekDay {
  date: string;
  weekday: number;
  isWorkingDay: boolean;
  holidayLabel: string | null;
  entry: DayEntry | null;
  /** Toutes les lignes du jour : une par intervention quand il y en a plusieurs. */
  entries: DayEntry[];
  missions: MissionOption[];
}

export interface WeekPayload {
  employee: { id: string; matricule: string; name: string; department: string | null } | null;
  week: { from: string; to: string };
  dailyCost: number | null;
  days: WeekDay[];
  editable: boolean;
  canValidate: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  MISSION_BILLABLE: 'Intervention facturable',
  MISSION_NON_BILLABLE: 'Intervention non facturable',
  SITE_WAITING: 'Attente sur site',
  WEATHER: 'Intempéries',
  TRAINING: 'Formation',
  LEAVE: 'Congé',
  SICK: 'Arrêt maladie',
  UNASSIGNED: 'Journée non affectée',
  OTHER: 'Autre',
};

/**
 * Corrections proposées.
 *
 * On ne propose pas de « déclarer » une journée non affectée : elle se déduit
 * du planning. On corrige ce que le terrain a démenti — une intervention
 * empêchée, une attente, une absence non saisie ailleurs.
 */
const CORRECTIONS: Array<{ value: string; needsMission: boolean }> = [
  { value: 'MISSION_BILLABLE', needsMission: true },
  { value: 'MISSION_NON_BILLABLE', needsMission: true },
  { value: 'SITE_WAITING', needsMission: true },
  { value: 'WEATHER', needsMission: false },
  { value: 'TRAINING', needsMission: false },
  { value: 'LEAVE', needsMission: false },
  { value: 'SICK', needsMission: false },
  { value: 'UNASSIGNED', needsMission: false },
  { value: 'OTHER', needsMission: false },
];

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

const TONE: Record<string, Tone> = {
  MISSION_BILLABLE: 'success',
  MISSION_NON_BILLABLE: 'info',
  SITE_WAITING: 'warning',
  WEATHER: 'warning',
  TRAINING: 'info',
  LEAVE: 'neutral',
  SICK: 'neutral',
  UNASSIGNED: 'danger',
  OTHER: 'neutral',
};

function needsMission(category: string): boolean {
  return CORRECTIONS.find((c) => c.value === category)?.needsMission ?? false;
}

/** « ½ journée », « ⅓ journée »… — la part d'une intervention dans la journée. */
function shareLabel(share: number): string {
  if (share >= 0.999) return 'journée';
  const known: Array<[number, string]> = [
    [0.5, '½'],
    [0.3333, '⅓'],
    [0.25, '¼'],
    [0.2, '⅕'],
  ];
  const match = known.find(([value]) => Math.abs(value - share) < 0.002);
  return `${match ? match[1] : share.toLocaleString('fr-FR')} journée`;
}

function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function TimesheetWeek({ payload }: { payload: WeekPayload }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ category: string; missionIds: string[] }>({
    category: '',
    missionIds: [],
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [issues, setIssues] = useState<Array<{ field: string; message: string }>>([]);

  const pointed = payload.days.filter((d) => d.entry);
  const unassigned = pointed.filter((d) => d.entry?.category === 'UNASSIGNED').length;
  const idleCost = payload.dailyCost !== null ? unassigned * payload.dailyCost : null;

  function startEdit(day: WeekDay) {
    setEditing(day.date);
    // Toutes les interventions déjà pointées ce jour-là, à défaut la première
    // mission prévue.
    const current = day.entries.map((e) => e.missionId).filter((id): id is string => Boolean(id));
    setDraft({
      category: day.entry?.category ?? '',
      missionIds: current.length > 0 ? current : day.missions.slice(0, 1).map((m) => m.missionId),
    });
    setMessage(null);
    setIssues([]);
  }

  async function submit(date: string) {
    setBusy(true);
    setMessage(null);
    setIssues([]);

    const response = await fetch('/api/pointage/corrections', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: payload.employee?.id,
        days: [
          {
            date,
            category: draft.category,
            // Plusieurs interventions : la journée se partage à parts égales.
            missionIds: needsMission(draft.category) ? draft.missionIds : [],
          },
        ],
      }),
    });

    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
      errors?: Array<{ field: string; message: string }>;
      warnings?: Array<{ date: string; message: string }>;
    };

    setBusy(false);

    if (!response.ok) {
      setIssues(body.errors ?? []);
      setMessage({ tone: 'error', text: body.message ?? 'Correction refusée.' });
      return;
    }

    setIssues((body.warnings ?? []).map((w) => ({ field: w.date, message: w.message })));
    setMessage({ tone: 'ok', text: 'Journée corrigée.' });
    setEditing(null);
    router.refresh();
  }

  const selectClass =
    'h-9 rounded-[8px] border border-border-strong bg-surface px-2.5 text-[14px] outline-none focus:border-accent';

  return (
    <Card
      title={`Semaine du ${shortDate(payload.week.from)} au ${shortDate(payload.week.to)}`}
      action={
        <div className="flex flex-wrap items-center gap-3">
          {payload.dailyCost !== null && (
            <span className="text-[13.5px] text-muted">
              Coût journalier :{' '}
              <span className="tnum font-medium text-text">
                {payload.dailyCost.toLocaleString('fr-FR')} DH
              </span>
            </span>
          )}
          <StatusBadge tone={unassigned > 0 ? 'danger' : 'neutral'}>
            {unassigned} journée(s) non affectée(s)
            {idleCost !== null && unassigned > 0
              ? ` · ${idleCost.toLocaleString('fr-FR')} DH`
              : ''}
          </StatusBadge>
        </div>
      }
    >
      <div className="flex flex-col gap-4 px-5 py-5">
        <p className="text-[14px] text-muted">
          Ces journées sont déduites du planning : une journée affectée à une mission est
          pointée sur cette mission, et ce qui reste d’un jour ouvré est une journée non
          affectée. Corrigez seulement ce que le terrain a démenti.
        </p>

        <ul className="flex flex-col gap-2.5">
          {payload.days.map((day) => {
            const entry = day.entry;
            const isEditing = editing === day.date;

            return (
              <li
                key={day.date}
                className={`rounded-[10px] border px-4 py-3 ${
                  day.isWorkingDay ? 'border-border bg-surface' : 'border-border bg-surface-2'
                }`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-[132px] shrink-0">
                    <p className="text-[14.5px] font-medium capitalize">
                      {WEEKDAYS[day.weekday]} {shortDate(day.date)}
                    </p>
                    {!day.isWorkingDay && (
                      <p className="text-[12.5px] text-subtle">
                        {day.holidayLabel ?? 'non ouvré'}
                      </p>
                    )}
                  </div>

                  {isEditing ? (
                    <>
                      <select
                        value={draft.category}
                        onChange={(e) =>
                          setDraft({
                            category: e.target.value,
                            missionIds: needsMission(e.target.value)
                              ? draft.missionIds.length > 0
                                ? draft.missionIds
                                : day.missions.slice(0, 1).map((m) => m.missionId)
                              : [],
                          })
                        }
                        className={`${selectClass} min-w-[220px] flex-1`}
                      >
                        <option value="">Choisir…</option>
                        {CORRECTIONS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {CATEGORY_LABELS[c.value]}
                          </option>
                        ))}
                      </select>

                      {needsMission(draft.category) && (
                        <fieldset className="flex min-w-[240px] flex-1 flex-col gap-1">
                          <legend className="mb-0.5 text-[12.5px] text-subtle">
                            Interventions du jour — la journée se partage entre elles
                          </legend>
                          {day.missions.length === 0 && (
                            <span className="text-[13px] text-warning">
                              Aucune mission prévue ce jour-là au planning.
                            </span>
                          )}
                          {day.missions.map((m) => (
                            <label key={m.missionId} className="flex items-center gap-2 text-[13.5px]">
                              <input
                                type="checkbox"
                                checked={draft.missionIds.includes(m.missionId)}
                                onChange={(e) =>
                                  setDraft({
                                    ...draft,
                                    missionIds: e.target.checked
                                      ? [...draft.missionIds, m.missionId]
                                      : draft.missionIds.filter((id) => id !== m.missionId),
                                  })
                                }
                                className="h-4 w-4 accent-[var(--color-accent)]"
                              />
                              <span className="ref">{m.number}</span>
                              <span className="text-muted">— {m.client}</span>
                            </label>
                          ))}
                        </fieldset>
                      )}

                      <Button
                        variant="accent"
                        disabled={
                          busy ||
                          !draft.category ||
                          (needsMission(draft.category) && draft.missionIds.length === 0)
                        }
                        onClick={() => submit(day.date)}
                      >
                        {busy ? 'Correction…' : 'Corriger'}
                      </Button>
                      <Button onClick={() => setEditing(null)}>Annuler</Button>
                    </>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        {entry ? (
                          <span className="flex flex-col gap-1">
                            {day.entries.map((e, index) => (
                              <span
                                key={e.missionId ?? `ligne-${index}`}
                                className="flex flex-wrap items-center gap-2"
                              >
                                <StatusBadge tone={TONE[e.category] ?? 'neutral'}>
                                  {CATEGORY_LABELS[e.category] ?? e.category}
                                </StatusBadge>
                                {e.missionNumber && (
                                  <span className="ref text-[13.5px] text-muted">
                                    {e.missionNumber}
                                  </span>
                                )}
                                {day.entries.length > 1 && (
                                  <span className="text-[12.5px] text-subtle">
                                    {shareLabel(e.share)}
                                  </span>
                                )}
                                {index === 0 && e.source === 'MANUAL' && (
                                  <span className="text-[12.5px] text-subtle">corrigée</span>
                                )}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className="text-[13.5px] text-subtle">
                            {day.isWorkingDay ? 'pas encore généré' : 'hors décompte'}
                          </span>
                        )}
                      </div>

                      {entry?.locked ? (
                        <StatusBadge tone="success">Visé</StatusBadge>
                      ) : (
                        payload.editable &&
                        day.isWorkingDay && (
                          <button
                            type="button"
                            onClick={() => startEdit(day)}
                            className="text-[13.5px] font-medium text-accent hover:underline"
                          >
                            Corriger
                          </button>
                        )
                      )}
                    </>
                  )}
                </div>

                {entry?.locked && entry.validatedBy && (
                  <p className="mt-2 text-[13px] text-subtle">Visé par {entry.validatedBy}.</p>
                )}
              </li>
            );
          })}
        </ul>

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

        {issues.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {issues.map((i, index) => (
              <li key={`${i.field}-${index}`} className="text-[13.5px] text-muted">
                <span className="ref font-medium">{shortDate(i.field)}</span> — {i.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
