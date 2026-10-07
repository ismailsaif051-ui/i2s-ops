import { redirect } from 'next/navigation';
import { api, requireSession } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Partis ensemble : ce layout entoure chaque page de l'application, donc
  // chaque navigation payait la somme des deux appels au lieu du plus lent.
  // Le compteur se lit même si le mot de passe provisoire fait rediriger
  // juste après — un appel rarement perdu, contre un gain sur toute la
  // navigation courante.
  const [session, { unread }] = await Promise.all([
    requireSession(),
    api<{ unread: number }>('/notifications/count').catch(() => ({ unread: 0 })),
  ]);

  // Mot de passe provisoire : aucune autre page n'est accessible.
  if (session.mustChangePassword) redirect('/changer-mot-de-passe');

  // Exigence du cahier des charges §21 : des données de démonstration ne
  // doivent jamais pouvoir être prises pour des données réelles.
  const isDemo = session.demo;

  return (
    <AppShell session={session} unreadCount={unread} isDemo={isDemo}>
      {children}
    </AppShell>
  );
}
