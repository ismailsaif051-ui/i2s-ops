'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Field } from '@/components/ui';

interface Option {
  id: string;
  label: string;
  detail: string;
  department: string | null;
}

export function NewInspectionForm({
  missions,
  templates,
}: {
  missions: Option[];
  templates: Option[];
}) {
  const router = useRouter();
  const [missionId, setMissionId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mission = missions.find((m) => m.id === missionId);

  // Les formulaires du département de la mission d'abord — sans masquer les autres,
  // certaines interventions étant transverses.
  const sortedTemplates = mission?.department
    ? [...templates].sort((a, b) => {
        const aMatch = a.department === mission.department ? 0 : 1;
        const bMatch = b.department === mission.department ? 0 : 1;
        return aMatch - bMatch;
      })
    : templates;

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch('/api/inspections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ missionId, templateId }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
    };

    if (response.ok && payload.id) {
      router.push(`/operations/inspections/${payload.id}`);
      return;
    }

    setError(payload.message ?? 'Création impossible.');
    setBusy(false);
  }

  const selectClass =
    'h-11 w-full rounded-[8px] border border-border-strong bg-surface px-3 text-[14.5px] outline-none focus:border-accent';

  return (
    <Card title="Ouvrir une saisie">
      <form onSubmit={create} className="flex flex-col gap-4 px-5 py-5">
        <Field label="Mission" hint="Seules les missions dont l’ordre de mission est signé sont proposées.">
          <select
            required
            value={missionId}
            onChange={(e) => {
              setMissionId(e.target.value);
              setTemplateId('');
            }}
            className={selectClass}
          >
            <option value="">Choisir une mission…</option>
            {missions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>

        {mission && <p className="-mt-2 text-[13.5px] text-subtle">{mission.detail}</p>}

        <Field
          label="Formulaire"
          hint={
            mission?.department
              ? `Les formulaires du pôle ${mission.department} sont proposés en premier.`
              : undefined
          }
        >
          <select
            required
            disabled={!missionId}
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className={selectClass}
          >
            <option value="">Choisir un formulaire…</option>
            {sortedTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} — {t.detail}
              </option>
            ))}
          </select>
        </Field>

        {error && (
          <p role="alert" className="rounded-[8px] bg-danger-soft px-3.5 py-2.5 text-[14px] text-danger">
            {error}
          </p>
        )}

        <div>
          <Button
            type="submit"
            variant="accent"
            disabled={busy || !missionId || !templateId}
          >
            {busy ? 'Création…' : 'Ouvrir la saisie'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
