'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { changePasswordSchema } from '@i2s/contracts';
import { Button, Field, Input } from '@/components/ui';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function update(field: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    // Même schéma que l'API : la règle est définie une seule fois.
    const parsed = changePasswordSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Données invalides.');
      return;
    }

    setBusy(true);
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (response.ok) {
      router.replace('/login');
      router.refresh();
      return;
    }

    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    setError(payload.message ?? 'Changement impossible.');
    setBusy(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6 py-12">
      <form
        onSubmit={submit}
        className="w-full max-w-[380px] rounded-[10px] border border-border bg-surface p-7"
      >
        <h1 className="text-[22px] font-semibold">
          Définissez votre mot de passe
        </h1>
        <p className="mb-6 mt-1 text-[13.5px] text-muted">
          Votre compte utilise encore un mot de passe provisoire. Choisissez-en un nouveau pour
          accéder à l&rsquo;application.
        </p>

        <div className="flex flex-col gap-4">
          <Field label="Mot de passe provisoire">
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={form.currentPassword}
              onChange={update('currentPassword')}
            />
          </Field>

          <Field
            label="Nouveau mot de passe"
            hint="12 caractères minimum, avec une minuscule, une majuscule et un chiffre."
          >
            <Input
              type="password"
              autoComplete="new-password"
              required
              value={form.newPassword}
              onChange={update('newPassword')}
            />
          </Field>

          <Field label="Confirmation">
            <Input
              type="password"
              autoComplete="new-password"
              required
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
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
            {busy ? 'Enregistrement…' : 'Enregistrer et se reconnecter'}
          </Button>
        </div>

        <p className="mt-6 text-[12px] text-subtle">
          Le changement révoque toutes vos sessions ouvertes : vous devrez vous reconnecter.
        </p>
      </form>
    </main>
  );
}
