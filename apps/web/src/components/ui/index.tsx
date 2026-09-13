/**
 * Design System I2S OPS — composants de base.
 *
 * Direction : clair, aéré, contemporain. Aucun libellé en capitales espacées
 * ni en chasse fixe ; la chasse fixe (`.ref`) est réservée aux identifiants
 * métier, où l'alignement caractère par caractère sert à quelque chose.
 * Voir docs/07-DESIGN-SYSTEM.md.
 */
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

/* ── Boutons ─────────────────────────────────────────────────────── */

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover border-transparent shadow-sm',
  accent: 'bg-accent text-white hover:bg-accent-hover border-transparent shadow-sm',
  secondary: 'bg-surface text-text border-border-strong hover:bg-surface-2',
  ghost: 'bg-transparent text-muted border-transparent hover:bg-surface-2 hover:text-text',
  danger: 'bg-danger text-white border-transparent hover:opacity-90',
};

export function Button({
  variant = 'secondary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      {...props}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border px-4 text-[14px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_STYLES[variant]} ${className}`}
    />
  );
}

/* ── Badges de statut ────────────────────────────────────────────── */

export type Tone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'primary'
  | 'accent'
  | 'secondary';

const TONE_STYLES: Record<Tone, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  neutral: 'bg-neutral-soft text-neutral',
  primary: 'bg-primary-soft text-primary',
  accent: 'bg-accent-soft text-accent',
  secondary: 'bg-secondary-soft text-secondary',
};

/** Point coloré + libellé : jamais la couleur seule (accessibilité). */
export function StatusBadge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12.5px] font-medium ${TONE_STYLES[tone]}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}

/* ── Cartes & sections ───────────────────────────────────────────── */

export function Card({
  title,
  action,
  children,
  className = '',
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[14px] border border-border bg-surface shadow-[var(--shadow-card)] ${className}`}
    >
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-[16px] font-semibold tracking-[-0.01em]">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  /** Fil d'Ariane ou surtitre — un lien de retour est admis. */
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-[13px] font-medium text-accent">{eyebrow}</p>
        )}
        <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.02em]">{title}</h1>
        {description && (
          <p className="mt-2 max-w-[70ch] text-[15px] leading-relaxed text-muted">{description}</p>
        )}
      </div>
      {action}
    </header>
  );
}

/* ── Indicateurs ─────────────────────────────────────────────────── */

export function KpiCard({
  label,
  value,
  unit,
  hint,
  tone,
  href,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  tone?: Tone;
  href?: string;
}) {
  const valueTone =
    tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-warning' : 'text-text';

  const body = (
    <>
      {/* Hauteur fixe : un libellé sur deux lignes ne décale pas le chiffre
          par rapport aux cartes voisines. */}
      <p className="flex min-h-[2.6em] items-start text-[13.5px] leading-snug text-muted">
        {label}
      </p>
      <p className={`title tnum mt-1 text-[32px] font-semibold leading-none tracking-[-0.02em] ${valueTone}`}>
        {value}
        {unit && <span className="ml-1.5 text-[15px] font-medium text-subtle">{unit}</span>}
      </p>
      {hint && <p className="mt-2 text-[12.5px] leading-snug text-subtle">{hint}</p>}
    </>
  );

  const base =
    'block rounded-[14px] border border-border bg-surface px-5 py-4 shadow-[var(--shadow-card)] transition-shadow';

  // Un indicateur cliquable ouvre son détail — exigence du CDC (module 01).
  return href ? (
    <a href={href} className={`${base} hover:shadow-[var(--shadow-raised)]`}>
      {body}
    </a>
  ) : (
    <div className={base}>{body}</div>
  );
}

/** Bande d'indicateurs : cartes séparées, pas de cellules étirées sur du vide. */
export function KpiRow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-7 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(210px,1fr))]">
      {children}
    </div>
  );
}

/* ── Tableaux ────────────────────────────────────────────────────── */

export function DataTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[14.5px]">{children}</table>
    </div>
  );
}

export function Th({ children, align = 'left' }: { children?: ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={`whitespace-nowrap border-b border-border px-5 py-3 text-[13px] font-medium text-subtle ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = 'left',
  mono = false,
  className = '',
}: {
  children?: ReactNode;
  align?: 'left' | 'right';
  /** Identifiant métier : rendu en chasse fixe pour l'alignement. */
  mono?: boolean;
  className?: string;
}) {
  return (
    <td
      className={`border-b border-border px-5 py-3.5 align-middle ${
        align === 'right' ? 'tnum text-right' : ''
      } ${mono ? 'ref' : ''} ${className}`}
    >
      {children}
    </td>
  );
}

/* ── États ───────────────────────────────────────────────────────── */

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <p className="title text-[18px] font-semibold">{title}</p>
      {description && (
        <p className="max-w-[54ch] text-[14.5px] leading-relaxed text-muted">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/** Répond à « que dois-je faire ? » — règle UX « action suivante » (CDC §22). */
export function NextActionBanner({
  tone = 'info',
  title,
  detail,
  action,
}: {
  tone?: Tone;
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  const styles: Record<Tone, string> = {
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
    info: 'bg-info-soft text-info',
    neutral: 'bg-neutral-soft text-neutral',
    primary: 'bg-primary-soft text-primary',
    accent: 'bg-accent-soft text-accent',
    secondary: 'bg-secondary-soft text-secondary',
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-[14px] border border-border bg-surface px-5 py-4 shadow-[var(--shadow-card)]">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[16px] font-semibold ${styles[tone]}`}
        aria-hidden="true"
      >
        !
      </span>
      <div className="min-w-0 flex-1">
        <p className="title text-[15px] font-semibold">{title}</p>
        {detail && <p className="mt-0.5 text-[14px] leading-relaxed text-muted">{detail}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── Formulaires ─────────────────────────────────────────────────── */

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[14px] font-medium">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-[13px] text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-[13px] text-subtle">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3.5 text-[15px] text-text outline-none transition-colors placeholder:text-subtle focus:border-accent ${className}`}
    />
  );
}
