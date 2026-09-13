'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

/**
 * Ouvre — ou rouvre — la note du mois.
 *
 * Une seule note par personne, par mois et par type : si elle existe déjà, on
 * y va plutôt que d'en créer une seconde.
 */
export function OpenExpenseReport() {
  const router = useRouter();
  const now = new Date();

  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  );
  const [type, setType] = useState('MISSION');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setBusy(true);
    setError(null);

    const response = await fetch('/api/frais/ouvrir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, type }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
    };

    setBusy(false);

    if (!response.ok || !payload.id) {
      setError(payload.message ?? 'Ouverture impossible.');
      return;
    }

    router.push(`/finance/notes-de-frais/${payload.id}`);
  }

  const controlClass =
    'h-10 rounded-[8px] border border-border-strong bg-surface px-3 text-[14px] outline-none focus:border-accent';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className={controlClass}
        aria-label="Mois de la note"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className={controlClass}
        aria-label="Type de note"
      >
        <option value="MISSION">Frais de mission</option>
        <option value="OFF_MISSION">Frais hors mission</option>
      </select>
      <Button variant="accent" disabled={busy || !month} onClick={open}>
        {busy ? 'Ouverture…' : 'Ouvrir ma note'}
      </Button>
      {error && <span className="text-[13.5px] text-danger">{error}</span>}
    </div>
  );
}
