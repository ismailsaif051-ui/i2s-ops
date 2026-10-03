'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconAffairs,
  IconCommercial,
  IconDocuments,
  IconFinance,
  IconOverview,
  IconProductivity,
  IconSettings,
} from '@/components/icons';

/*
 * Connexion — proposition V5 « Contribution des collaborateurs »
 * (DESIGN-I2S-CONNEXION-DIGITALISATION.md, 3 octobre 2026). Règles de
 * formulaire, d'erreurs et d'accessibilité : DESIGN-I2S-CONNEXION.md §8, §9, §11.
 */

type FieldErrors = { email?: string; password?: string };

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
      {!open && <path d="M4 4l16 16" />}
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** Petit symbole i2S System : les deux équerres orange et verte du logo. */
function BrandMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M9 3.5h7.5V11" fill="none" stroke="#4a9446" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 8.5h7.5V16" fill="none" stroke="#e8532a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Lignes abstraites : la maquette ne montre jamais de noms ni de montants. */
function Lines({ widths = ['70%', '45%'] }: { widths?: string[] }) {
  return (
    <span className="flex flex-1 flex-col gap-1.5">
      {widths.map((w, i) => (
        <span key={i} className="block h-[5px] rounded-full bg-[var(--surface-3)]" style={{ width: w }} />
      ))}
    </span>
  );
}

function Check() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--secondary-soft)] text-[var(--secondary)]">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 12.5 4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}

function MiniCard({ dot, check, doc }: { dot?: string; check?: boolean; doc?: boolean }) {
  return (
    <span className="flex items-center gap-2 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 py-2 shadow-[0_1px_2px_rgb(32_35_34/0.05)]">
      {dot && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: dot }} />}
      {doc && <IconDocuments size={13} className="shrink-0 text-[var(--text-subtle)]" />}
      <Lines />
      {check && <Check />}
    </span>
  );
}

/**
 * Illustration du parcours métier — décorative : hors de l'ordre de
 * tabulation, ignorée des lecteurs d'écran (le texte voisin dit son propos).
 * Les cartes ne sont pas des commandes.
 */
function Illustration() {
  const column = (title: string, icon: React.ReactNode, cards: React.ReactNode) => (
    <span className="flex min-w-0 flex-col gap-2 rounded-[8px] bg-[var(--bg)] p-2">
      <span className="flex items-center gap-1.5 px-1 text-[11.5px] font-medium text-[var(--text)]">
        {icon}
        {title}
      </span>
      {cards}
    </span>
  );
  const arrow = <span className="self-center text-[var(--brand)]">→</span>;

  return (
    <div aria-hidden="true" className="pointer-events-none relative select-none pr-[118px] pt-[52px]">
      {/* Espace logiciel miniature */}
      <div className="relative z-10 overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_8px_24px_rgb(32_35_34/0.08)]">
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-3 py-2">
          <span className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-[#e8532a]" />
            <span className="h-2 w-2 rounded-full bg-[#f2b43a]" />
            <span className="h-2 w-2 rounded-full bg-[#5aa35a]" />
          </span>
          <span className="flex items-center gap-1 text-[12.5px] font-semibold text-[var(--text)]">
            i2S System <BrandMark size={13} />
          </span>
        </div>
        <div className="flex">
          <span className="flex flex-col items-center gap-3 border-r border-[var(--border)] px-2 py-3 text-[var(--text-subtle)]">
            <IconOverview size={15} className="text-[var(--brand)]" />
            <IconProductivity size={15} />
            <IconAffairs size={15} />
            <IconDocuments size={15} />
            <IconSettings size={15} />
            <IconCommercial size={15} />
          </span>
          <span className="grid flex-1 grid-cols-[1fr_auto_1fr_auto_1fr] gap-1.5 p-2.5">
            {column(
              'Affaires',
              <IconDocuments size={13} className="text-[var(--brand)]" />,
              <>
                <MiniCard dot="#e8532a" check />
                <MiniCard dot="#f2a43a" />
                <MiniCard dot="#4f8a5f" />
              </>,
            )}
            {arrow}
            {column(
              'Missions',
              <IconProductivity size={13} className="text-[var(--secondary)]" />,
              <>
                <MiniCard doc check />
                <MiniCard dot="#f2c48a" />
                <MiniCard dot="#8fb39b" />
              </>,
            )}
            {arrow}
            {column(
              'Rapports',
              <IconAffairs size={13} className="text-[var(--text-muted)]" />,
              <>
                <MiniCard doc />
                <MiniCard doc check />
              </>,
            )}
          </span>
        </div>
      </div>

      {/* Équipes, reliée à l'espace central */}
      <div className="absolute right-0 top-0 z-20 w-[150px] rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_8px_24px_rgb(32_35_34/0.1)]">
        <p className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-[var(--text)]">
          <IconCommercial size={14} className="text-[var(--brand)]" /> Équipes
        </p>
        {[0, 1, 2].map((i) => (
          <span key={i} className="mb-1.5 flex items-center gap-2 last:mb-0">
            <span className="h-5 w-5 rounded-full bg-[var(--surface-3)]" />
            <Lines widths={['80%', '50%']} />
          </span>
        ))}
      </div>

      {/* Facturation, reliée aux rapports */}
      <div className="absolute -bottom-10 right-2 z-20 w-[170px] rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_8px_24px_rgb(32_35_34/0.1)]">
        <p className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-[var(--text)]">
          <IconFinance size={14} className="text-[var(--brand)]" /> Facturation
        </p>
        <span className="flex items-center gap-2">
          <Lines widths={['85%', '65%', '45%']} />
          <Check />
        </span>
      </div>

      {/* Connecteurs : traits fins vert sauge, points orange. */}
      <svg className="absolute inset-0 z-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d="M78 40 C 78 20, 82 14, 86 14" fill="none" stroke="var(--secondary)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" opacity="0.7" />
        <path d="M95 36 C 95 55, 92 60, 86 62" fill="none" stroke="var(--secondary)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" opacity="0.7" />
      </svg>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);

  // Après une période sans usage, le service met jusqu'à une minute à
  // redémarrer : sans explication, l'attente ressemble à une panne.
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
    if (busy) return;

    const errors: FieldErrors = {};
    if (!email.trim()) errors.email = 'Saisissez votre adresse e-mail professionnelle.';
    else if (!EMAIL_FORMAT.test(email.trim())) errors.email = 'Saisissez une adresse e-mail valide.';
    if (!password) errors.password = 'Saisissez votre mot de passe.';
    setFieldErrors(errors);
    setError(null);
    if (errors.email || errors.password) {
      document.getElementById(errors.email ? 'email' : 'password')?.focus();
      return;
    }

    setBusy(true);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    }).catch(() => null);

    if (response?.ok) {
      router.replace('/cockpit');
      router.refresh();
      return;
    }

    const payload = (await response?.json().catch(() => ({}))) as { message?: string } | undefined;
    const message = payload?.message ?? '';
    if (!response || response.status >= 500) {
      setError('Le service est momentanément indisponible. Réessayez dans un instant.');
    } else if (/verrouill|bloqu/i.test(message)) {
      // Blocage : le message du serveur porte l'heure réelle de déblocage.
      setError(message);
    } else {
      setError('Connexion impossible. Vérifiez vos identifiants.');
    }
    setBusy(false);
  }

  const inputClass = (invalid: boolean) =>
    `h-14 w-full rounded-[8px] border bg-surface px-4 text-[16px] text-text outline-none transition-colors placeholder:text-subtle focus:border-accent ${
      invalid ? 'border-danger' : 'border-border-strong'
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-surface text-text">
      <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-border px-6 md:px-12">
        <div className="flex items-center gap-5">
          <img src="/brand/logo-i2s-testing.png" alt="I2S TESTING" width={200} height={53} className="only-light h-auto w-[170px] md:w-[200px]" />
          <img src="/brand/logo-i2s-testing-light.png" alt="I2S TESTING" width={200} height={53} className="only-dark h-auto w-[170px] md:w-[200px]" />
          <span className="hidden h-8 w-px bg-border-strong sm:block" aria-hidden="true" />
          <span className="hidden text-[16px] text-muted sm:block">I2S System</span>
        </div>
        <span className="text-[14px] text-muted">Espace entreprise</span>
      </header>

      <main className="mx-auto grid w-full max-w-[1600px] flex-1 items-center gap-10 px-6 py-8 md:px-12 min-[900px]:grid-cols-[minmax(0,1.15fr)_auto_minmax(340px,480px)] min-[900px]:gap-12">
        {/* Panneau « entreprise connectée » — masqué sous 900 px pour garder la connexion à portée. */}
        <section
          aria-labelledby="accroche"
          className="relative hidden overflow-hidden rounded-[16px] border border-border bg-panel-sage px-10 pb-8 pt-9 text-panel-text min-[900px]:block"
          style={{ backgroundImage: 'radial-gradient(var(--panel-dot) 1px, transparent 1.2px)', backgroundSize: '18px 18px' }}
        >
          <span className="block h-[4px] w-12 rounded-full bg-brand" aria-hidden="true" />
          <p className="mt-6 text-[13px] font-medium uppercase tracking-[0.22em] text-secondary">
            Votre entreprise connectée
          </p>
          <h2 id="accroche" className="mt-3 text-[clamp(32px,3.2vw,46px)] font-bold leading-[1.08] tracking-[-0.02em]">
            Chaque mise à jour
            <br />
            fait avancer toute l’équipe.
          </h2>
          <p className="mt-4 max-w-[52ch] text-[clamp(16px,1.35vw,20px)] leading-snug text-muted">
            Renseignez vos activités, partagez vos avancées et contribuez à une information fiable pour
            mieux coordonner nos opérations.
          </p>

          <div className="mt-6 mb-12 hidden min-[1100px]:block">
            <Illustration />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px]">
            {['Centraliser', 'Collaborer', 'Piloter'].map((word, i) => (
              <span key={word} className="flex items-center gap-3">
                {i > 0 && <span className="hidden h-px w-16 bg-border-strong sm:block" aria-hidden="true" />}
                <span className="h-2.5 w-2.5 rounded-full bg-brand" aria-hidden="true" />
                {word}
              </span>
            ))}
            <span className="ml-auto text-[12px] text-subtle">Illustration du parcours métier</span>
          </div>
        </section>

        <span className="hidden h-[80%] w-px self-center bg-border-strong min-[900px]:block" aria-hidden="true" />

        {/* Formulaire */}
        <section aria-labelledby="titre-connexion" className="w-full max-w-[480px] justify-self-center min-[900px]:justify-self-stretch">
          <p className="text-[13px] font-medium uppercase tracking-[0.22em] text-secondary">Bienvenue sur I2S System</p>
          <h1 id="titre-connexion" className="mt-3 text-[clamp(30px,3vw,36px)] font-bold leading-tight tracking-[-0.02em]">
            Connexion
          </h1>
          <p className="mt-2 text-[17px] leading-snug text-muted">Connectez-vous avec votre adresse professionnelle.</p>

          <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-[15px] font-medium">
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@entreprise.ma"
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'email-erreur' : undefined}
                className={inputClass(!!fieldErrors.email)}
              />
              {fieldErrors.email && (
                <p id="email-erreur" className="mt-1.5 text-[14px] text-danger">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-[15px] font-medium">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'password-erreur' : undefined}
                  className={`${inputClass(!!fieldErrors.password)} pr-14`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-pressed={showPassword}
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[8px] text-muted hover:text-text"
                >
                  <EyeIcon open={!showPassword} />
                </button>
              </div>
              {fieldErrors.password && (
                <p id="password-erreur" className="mt-1.5 text-[14px] text-danger">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {error && (
              <p role="alert" className="flex gap-2 rounded-[8px] border border-danger bg-danger-soft px-4 py-3 text-[14.5px] text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              aria-busy={busy}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-[8px] bg-accent text-[17px] font-semibold text-on-fill transition-colors hover:bg-accent-hover disabled:cursor-wait disabled:opacity-80"
            >
              {busy ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
                  Connexion en cours…
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight />
                </>
              )}
            </button>

            {slow && (
              <p role="status" className="text-[14px] leading-relaxed text-muted">
                Le service redémarre après une période d’inactivité. Cela peut prendre jusqu’à une
                minute — inutile de recliquer.
              </p>
            )}
          </form>

          <div className="mt-8 flex gap-3 border-t border-border pt-6">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="mt-0.5 shrink-0 text-muted" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
            </svg>
            <div>
              <p className="text-[15px] font-semibold">Besoin d’aide pour vous connecter ?</p>
              <p className="mt-1 text-[14px] leading-relaxed text-muted">
                Mot de passe oublié ou compte verrouillé : contactez votre administrateur.
                <br />
                Après 5 tentatives infructueuses : blocage de 15 minutes.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-2 px-6 py-5 text-[13px] text-muted md:px-12">
        <p>I2S TESTING · Safer. Better. Further.</p>
        <p>Accès réservé aux utilisateurs autorisés</p>
      </footer>
    </div>
  );
}
