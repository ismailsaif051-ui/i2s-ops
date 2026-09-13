import { redirect } from 'next/navigation';
import { api, requireSession } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  // Mot de passe provisoire : aucune autre page n'est accessible.
  if (session.mustChangePassword) redirect('/changer-mot-de-passe');

  const { unread } = await api<{ unread: number }>('/notifications/count').catch(() => ({
    unread: 0,
  }));

  // Exigence du cahier des charges §21 : des données de démonstration ne
  // doivent jamais pouvoir être prises pour des données réelles.
  const isDemo = session.demo;

  return (
    <AppShell session={session} unreadCount={unread} isDemo={isDemo}>
      {children}
    </AppShell>
  );
}
