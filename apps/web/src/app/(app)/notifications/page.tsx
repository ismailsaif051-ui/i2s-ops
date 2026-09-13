import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { Card, EmptyState, PageHeader, StatusBadge } from '@/components/ui';

export const metadata: Metadata = { title: 'Notifications' };

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  level: string;
  readAt: string | null;
  createdAt: string;
}

const TONE: Record<string, 'info' | 'warning' | 'danger' | 'success'> = {
  info: 'info',
  warning: 'warning',
  danger: 'danger',
  success: 'success',
};

export default async function NotificationsPage() {
  const items = await api<NotificationRow[]>('/notifications');

  return (
    <>
      <PageHeader
        eyebrow="Alertes"
        title="Notifications"
        description="Missions à venir, ordres de mission et rapports à valider, échéances de certification et d’étalonnage, factures échues."
      />

      <Card title={`${items.length} notification${items.length > 1 ? 's' : ''}`}>
        {items.length === 0 ? (
          <EmptyState
            title="Rien à signaler"
            description="Les règles de notification s’activeront avec les modules missions, rapports et frais."
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((n) => (
              <li key={n.id} className="flex items-start gap-3 px-4 py-3">
                <StatusBadge tone={TONE[n.level] ?? 'info'}>{n.type}</StatusBadge>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-[13px] text-muted">{n.body}</p>}
                </div>
                <time className="shrink-0 ref text-[11.5px] text-subtle">
                  {new Date(n.createdAt).toLocaleString('fr-FR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
