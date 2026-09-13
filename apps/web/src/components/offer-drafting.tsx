'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, StatusBadge } from '@/components/ui';

export interface DraftSection {
  key: string;
  label: string;
  brief: string;
  text: string;
}

export interface DraftState {
  available: boolean;
  natures: Array<{ value: string; label: string }>;
  draft: {
    nature: string;
    natureLabel: string;
    status: 'A_RELIRE' | 'RELU';
    sections: DraftSection[];
    model: string;
    generatedAt: string;
    generatedBy: string | null;
    reviewedAt: string | null;
    reviewedBy: string | null;
  } | null;
}

interface Problem {
  message: string;
  details: string[];
}

/**
 * Rédaction assistée d'une offre.
 *
 * L'assistant écrit les mots, jamais les chiffres : le tableau des prix vient
 * des lignes de l'offre. Et rien ne part au client sans qu'une personne ait
 * relu le texte et l'ait assumé.
 */
export function OfferDrafting({
  offerId,
  offerNumber,
  state,
  canEdit,
}: {
  offerId: string;
  offerNumber: string;
  state: DraftState;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nature, setNature] = useState(state.draft?.nature ?? 'TECHNICO_COMMERCIALE');
  const [sections, setSections] = useState<DraftSection[]>(state.draft?.sections ?? []);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);

  const draft = state.draft;
  const reviewed = draft?.status === 'RELU';

  async function call(
    path: string,
    method: 'POST' | 'PUT',
    body: unknown,
    key: string,
  ): Promise<Record<string, unknown> | null> {
    setBusy(key);
    setProblem(null);

    const response = await fetch(`/api/commercial/offres/${offerId}/redaction${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      errors?: Array<{ field: string; message: string }>;
      sections?: DraftSection[];
    };

    setBusy(null);

    if (!response.ok) {
      setProblem({
        message: payload.message ?? 'Opération refusée.',
        details: (payload.errors ?? []).map((e) => e.message),
      });
      return null;
    }

    return payload as Record<string, unknown>;
  }

  if (!canEdit) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[13.5px] font-medium text-accent hover:underline"
      >
        {draft ? 'Voir le texte de l’offre' : 'Rédiger avec l’assistant'}
      </button>
    );
  }

  return (
    <Card
      title={`Rédaction — ${offerNumber}`}
      action={
        draft ? (
          <StatusBadge tone={reviewed ? 'success' : 'warning'}>
            {reviewed ? 'Relu' : 'À relire'}
          </StatusBadge>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4 px-5 py-5">
        {!state.available && (
          <div className="rounded-[10px] bg-warning-soft px-4 py-3">
            <p className="text-[14px] font-medium text-warning">
              L’assistant de rédaction n’est pas configuré
            </p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted">
              Déposez la clé du modèle dans le fichier <span className="ref">.env</span> sous le nom{' '}
              <span className="ref">ANTHROPIC_API_KEY</span>, puis redémarrez l’API. Le reste de
              l’application fonctionne sans elle.
            </p>
          </div>
        )}

        <p className="max-w-[74ch] text-[14px] leading-relaxed text-muted">
          L’assistant écrit les mots, jamais les chiffres : le tableau des prix est construit à
          partir des lignes de l’offre. Le texte part du dossier réel — client, objet, appel
          d’offres, habilitations du service et instruments étalonnés — et rien n’est envoyé au
          client avant qu’une personne l’ait relu.
        </p>

        {!draft && (
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium">Nature du document</span>
              <select
                value={nature}
                onChange={(e) => setNature(e.target.value)}
                className="h-11 rounded-[10px] border border-border-strong bg-surface px-3.5 text-[15px] outline-none focus:border-accent"
              >
                {state.natures.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </select>
            </label>

            <Button
              variant="accent"
              disabled={busy !== null || !state.available}
              onClick={async () => {
                const result = await call('', 'POST', { nature }, 'draft');
                if (result) {
                  setSections((result.sections as DraftSection[]) ?? []);
                  router.refresh();
                }
              }}
            >
              {busy === 'draft' ? 'Rédaction en cours…' : 'Rédiger'}
            </Button>

            <Button type="button" onClick={() => setOpen(false)}>
              Fermer
            </Button>
          </div>
        )}

        {draft && (
          <>
            <p className="text-[13px] text-subtle">
              {draft.natureLabel} · rédigée par {draft.model}
              {draft.generatedBy && `, lancée par ${draft.generatedBy}`}
              {draft.reviewedBy && ` · relue par ${draft.reviewedBy}`}
            </p>

            <ul className="flex flex-col gap-5">
              {(sections.length > 0 ? sections : draft.sections).map((section, index) => (
                <li key={section.key} className="flex flex-col gap-1.5">
                  <label className="flex flex-col gap-1">
                    <span className="text-[14px] font-medium">{section.label}</span>
                    <span className="text-[12.5px] leading-snug text-subtle">{section.brief}</span>
                  </label>
                  <textarea
                    value={section.text}
                    readOnly={reviewed}
                    rows={Math.min(16, Math.max(4, Math.ceil(section.text.length / 90)))}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSections((current) => {
                        const base = current.length > 0 ? current : draft.sections;
                        return base.map((s, i) => (i === index ? { ...s, text: value } : s));
                      });
                      setDirty(true);
                    }}
                    className={`w-full rounded-[10px] border border-border-strong px-3.5 py-3 text-[14.5px] leading-relaxed outline-none focus:border-accent ${
                      reviewed ? 'bg-surface-2 text-muted' : 'bg-surface'
                    }`}
                  />
                </li>
              ))}
            </ul>

            {problem && (
              <div role="alert" className="rounded-[10px] bg-danger-soft px-4 py-3">
                <p className="text-[14px] font-medium text-danger">{problem.message}</p>
                {problem.details.length > 0 && (
                  <ul className="mt-1.5 flex flex-col gap-1">
                    {problem.details.map((d) => (
                      <li key={d} className="text-[13.5px] text-danger">
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {!reviewed && (
                <>
                  <Button
                    disabled={busy !== null || !dirty}
                    onClick={async () => {
                      const body = {
                        sections: Object.fromEntries(sections.map((s) => [s.key, s.text])),
                      };
                      const result = await call('', 'PUT', body, 'save');
                      if (result) {
                        setDirty(false);
                        router.refresh();
                      }
                    }}
                  >
                    {busy === 'save' ? 'Enregistrement…' : 'Enregistrer les corrections'}
                  </Button>

                  <Button
                    variant="accent"
                    disabled={busy !== null || dirty}
                    onClick={async () => {
                      const result = await call('/validation', 'POST', {}, 'approve');
                      if (result) router.refresh();
                    }}
                  >
                    {busy === 'approve' ? 'Validation…' : 'J’ai relu — valider le texte'}
                  </Button>
                </>
              )}

              <a
                href={`/api/commercial/offres/${offerId}/document`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center rounded-[10px] border border-border-strong bg-surface px-4 text-[14px] font-medium transition-colors hover:bg-surface-2"
              >
                Ouvrir le document PDF
              </a>

              <Button type="button" onClick={() => setOpen(false)}>
                Fermer
              </Button>
            </div>

            {dirty && (
              <p className="text-[13px] text-warning">
                Corrections non enregistrées : enregistrez-les avant de valider.
              </p>
            )}
          </>
        )}

        {problem && !draft && (
          <div role="alert" className="rounded-[10px] bg-danger-soft px-4 py-3">
            <p className="text-[14px] font-medium text-danger">{problem.message}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
