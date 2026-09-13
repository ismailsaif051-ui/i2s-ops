import Link from 'next/link';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { date } from '@/lib/format';
import {
  Card,
  DataTable,
  EmptyState,
  KpiCard,
  KpiRow,
  NextActionBanner,
  PageHeader,
  StatusBadge,
  Td,
  Th,
  type Tone,
} from '@/components/ui';

export const metadata: Metadata = { title: 'Ordres de mission' };

interface OrderRow {
  id: string;
  number: string;
  object: string;
  status: string;
  signedAt: string | null;
  hasSignature: boolean;
  signatureHash: string | null;
  mission: {
    number: string;
    start: string | null;
    end: string | null;
    site: string | null;
    vehicle: string | null;
  };
  affair: { id: string; number: string };
  client: string;
  inspectors: string[];
  approvalCount: number;
}

const LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  PENDING_APPROVAL: 'À valider',
  APPROVED: 'Validé',
  SIGNED: 'Signé',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  ARCHIVED: 'Archivé',
  REJECTED: 'Rejeté',
};

const TONE: Record<string, Tone> = {
  DRAFT: 'neutral',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'info',
  SIGNED: 'success',
  IN_PROGRESS: 'accent',
  COMPLETED: 'success',
  ARCHIVED: 'neutral',
  REJECTED: 'danger',
};

export default async function MissionOrdersPage() {
  const { items } = await api<{ items: OrderRow[] }>('/mission-orders');

  const toApprove = items.filter((o) => o.status === 'PENDING_APPROVAL').length;
  const signed = items.filter((o) => o.hasSignature).length;

  return (
    <>
      <PageHeader
        eyebrow="Opérations"
        title="Ordres de mission"
        description="Généré automatiquement dès qu’une mission est confirmée. Une fois signé, le document est verrouillé : toute modification impose une nouvelle version."
      />

      <KpiRow>
        <KpiCard label="Ordres de mission" value={items.length} />
        <KpiCard label="À valider" value={toApprove} tone={toApprove > 0 ? 'warning' : undefined} />
        <KpiCard
          label="Signés électroniquement"
          value={signed}
          tone="success"
          hint="empreinte SHA-256 enregistrée"
        />
      </KpiRow>

      {toApprove > 0 && (
        <NextActionBanner
          tone="warning"
          title={`${toApprove} ordre(s) de mission en attente de validation`}
          detail="Sans ordre de mission signé, l’inspecteur ne peut ni démarrer la mission ni déclarer de frais."
        />
      )}

      <Card title={`${items.length} ordres de mission`}>
        {items.length === 0 ? (
          <EmptyState
            title="Aucun ordre de mission"
            description="Un ordre de mission naît de la confirmation d’une mission."
          />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>N° OM</Th>
                <Th>Mission</Th>
                <Th>Affaire</Th>
                <Th>Client</Th>
                <Th>Inspecteur</Th>
                <Th>Période</Th>
                <Th>Signature</Th>
                <Th>Statut</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((order) => (
                <tr key={order.id}>
                  <Td mono>{order.number}</Td>
                  <Td mono>{order.mission.number}</Td>
                  <Td mono>
                    <Link
                      href={`/affaires/${order.affair.id}`}
                      className="text-accent hover:underline"
                    >
                      {order.affair.number}
                    </Link>
                  </Td>
                  <Td>{order.client}</Td>
                  <Td>{order.inspectors.join(', ') || '—'}</Td>
                  <Td mono>
                    {date(order.mission.start)} → {date(order.mission.end)}
                  </Td>
                  <Td>
                    {order.hasSignature ? (
                      <span
                        title={`Empreinte du PDF signé : ${order.signatureHash}`}
                        className="text-[13.5px] text-success"
                      >
                        {date(order.signedAt)}
                      </span>
                    ) : (
                      <span className="text-subtle">non signé</span>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge tone={TONE[order.status] ?? 'neutral'}>
                      {LABELS[order.status] ?? order.status}
                    </StatusBadge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>
    </>
  );
}
