'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Input } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);

  // Après une période sans usage, le service met jusqu'à une minute à
  // redémarrer : sans explication, « Connexion… » ressemble à une panne.
  useEffect(() => {
    if (!busy) {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(timer);
  }, [busy]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      router.replace('/cockpit');
      router.refresh();
      return;
    }

    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    setError(payload.message ?? 'Connexion impossible.');
    setBusy(false);
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_460px]">
      {/* Volet d'identité — reprend le positionnement de la charte I2S TESTING */}
      <section className="hidden flex-col justify-between bg-rail p-12 text-[var(--rail-text)] lg:flex">
        <div>
          <p className="flex items-baseline gap-2 text-[26px] font-semibold text-white">
            I2S OPS
            <span className="h-2 w-2 rounded-[2px] bg-accent" aria-hidden="true" />
          </p>
          <p className="mt-1.5 text-[12px] text-[var(--rail-muted)]">
            Inspection · Testing · Engineering · Compliance
          </p>
        </div>

        <div className="max-w-[46ch]">
          <p className="text-[27px] font-semibold uppercase leading-tight text-white">
            La fiabilité de vos installations,
            <br />
            la sécurité de vos opérations.
          </p>
          <p className="mt-5 max-w-[42ch] text-[13.5px] leading-relaxed">
            Du premier contact client à la rentabilité de l&rsquo;affaire, sur une seule
            plateforme.
          </p>
          <p className="mt-4 ref text-[11px] leading-relaxed tracking-wide text-[var(--rail-muted)]">
            OPPORTUNITÉ → AFFAIRE → MISSION → INSPECTION → RAPPORT →
            <br />
            ATTACHEMENT → FACTURE → PAIEMENT → RENTABILITÉ
          </p>
        </div>

        <p className="text-[11.5px] text-[var(--rail-muted)]">
          Contrôle réglementaire · CND &amp; essais · Intégrité des équipements · Engineering
        </p>
      </section>

      {/* Formulaire */}
      <section className="flex items-center justify-center bg-surface px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-[340px]">
          <p className="mb-1 text-[22px] font-semibold lg:hidden">
            I2S OPS
          </p>
          <h1 className="text-[24px] font-semibold">Connexion</h1>
          <p className="mb-7 mt-1 text-[13.5px] text-muted">
            Utilisez l&rsquo;adresse professionnelle fournie par l&rsquo;administrateur.
          </p>

          <div className="flex flex-col gap-4">
            <Field label="Adresse e-mail">
              <Input
                type="email"
                name="email"
                autoComplete="username"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@i2s-testing.ma"
              />
            </Field>

            <Field label="Mot de passe">
              <Input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            {error && (
              <p
                role="alert"
                className="rounded-[6px] border-l-[3px] border-l-danger bg-danger-soft px-3 py-2 text-[13px] text-danger"
              >
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" disabled={busy} className="w-full">
              {busy ? 'Connexion…' : 'Se connecter'}
            </Button>

            {slow && (
              <p role="status" className="text-[13px] leading-relaxed text-muted">
                Le service redémarre après une période d&rsquo;inactivité. Cela peut prendre
                jusqu&rsquo;à une minute — inutile de recliquer.
              </p>
            )}
          </div>

          <p className="mt-8 text-[12px] text-subtle">
            Mot de passe oublié ou compte verrouillé : contactez l&rsquo;administrateur de la
            plateforme. Après cinq tentatives infructueuses, le compte est bloqué 15 minutes.
          </p>
        </form>
      </section>
    </main>
  );
}
