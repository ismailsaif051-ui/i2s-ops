'use client';

import { useEffect, useState } from 'react';
import { THEME_KEY } from '@/lib/theme';

/**
 * Apparence : Système, Clair ou Sombre.
 *
 * « Système » ne pose rien sur <html> : le réglage de l'ordinateur décide.
 * « Clair » et « Sombre » posent data-theme, qui l'emporte. Le choix est une
 * préférence de ce navigateur ; il ne remonte pas au serveur.
 */
export type ThemeChoice = 'system' | 'light' | 'dark';

function apply(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === 'system') delete root.dataset.theme;
  else root.dataset.theme = choice;
  try {
    if (choice === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {
    // Navigation privée : le choix vaut pour la page ouverte.
  }
}

function systemIsDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>('system');
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    setChoice(current === 'light' || current === 'dark' ? current : 'system');
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(media.matches);
    const onChange = () => setSystemDark(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const isDark = choice === 'dark' || (choice === 'system' && systemDark);

  return {
    choice,
    isDark,
    set(next: ThemeChoice) {
      apply(next);
      setChoice(next);
    },
    /** Bascule rapide : l'inverse de ce qui est affiché. */
    toggle() {
      const next: ThemeChoice = isDark ? 'light' : 'dark';
      // Revenir à l'état du système plutôt que figer un choix identique.
      const resolved = (next === 'dark') === systemIsDark() ? 'system' : next;
      apply(resolved);
      setChoice(resolved);
    },
  };
}
