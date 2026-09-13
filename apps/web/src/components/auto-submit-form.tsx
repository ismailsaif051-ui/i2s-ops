'use client';

import type { FormHTMLAttributes, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Formulaire de filtres.
 *
 * Un choix dans une liste relance aussitôt la recherche ; le texte libre, lui,
 * attend la touche Entrée — relancer à chaque lettre serait pénible. Les
 * champs laissés vides ne partent pas dans l'adresse : elle reste lisible, et
 * peut se copier pour partager une sélection.
 */
export function AutoSubmitForm({
  children,
  className,
}: Pick<FormHTMLAttributes<HTMLFormElement>, 'className'> & { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  function submit(form: HTMLFormElement) {
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form).entries()) {
      if (typeof value === 'string' && value.trim() !== '') params.set(key, value.trim());
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        submit(event.currentTarget);
      }}
      onChange={(event) => {
        const target = event.target as HTMLElement;
        if (target instanceof HTMLInputElement && (target.type === 'text' || target.type === 'search')) {
          return;
        }
        submit(event.currentTarget);
      }}
    >
      {children}
    </form>
  );
}
