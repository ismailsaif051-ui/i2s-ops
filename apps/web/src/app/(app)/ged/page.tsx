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

export const metadata: Metadata = { title: 'GED' };

interface DocumentRow {
  id: string;
  type: string;
  fileName: string;
  mimeType: string;
  size: number;
  sha256: string;
  confidentiality: string;
  entityType: string | null;
  entityId: string | null;
  affair: { number: string; client: string } | null;
  versionCount: number;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  REPORT: 'Rapport d’inspection',
  MISSION_ORDER: 'Ordre de mission',
  ATTACHMENT: 'Attachement',
  INVOICE: 'Facture',
  CERTIFICATE: 'Certificat',
  PROCEDURE: 'Procédure qualité',
};

const CONFIDENTIALITY: Record<string, { label: string; tone: Tone }> = {
  PUBLIC: { label: 'Public', tone: 'neutral' },
  INTERNAL: { label: 'Interne', tone: 'neutral' },
  RESTRICTED: { label: 'Diffusion restreinte', tone: 'warning' },
  CONFIDENTIAL: { label: 'Confidentiel', tone: 'danger' },
};

/** Taille lisible : les octets bruts ne disent rien à personne. */
function weight(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

/** Où retourner pour voir l'objet dont le document dépend. */
function sourceHref(row: DocumentRow): string | null {
  if (row.entityType === 'report' && row.entityId) return `/operations/rapports/${row.entityId}`;
  if (row.entityType === 'mission' && row.entityId) return `/operations/missions/${row.entityId}`;
  return null;
}

export default async function GedPage() {
  const { items } = await api<{ items: DocumentRow[] }>('/documents?limit=300');

  const totalWeight = items.reduce((sum, d) => sum + d.size, 0);
  const revised = items.filter((d) => d.versionCount > 1).length;

  return (
    <>
      <PageHeader
        eyebrow="Documents"
        title="Gestion documentaire"
        description="Chaque pièce est rangée sous son empreinte SHA-256. Un fichier qui ne correspond plus à son empreinte n’est pas servi : l’altération se voit au lieu de passer inaperçue."
      />

      <KpiRow>
        <KpiCard label="Documents" value={items.length} />
        <KpiCard label="Volume" value={weight(totalWeight)} />
        <KpiCard
          label="Pièces révisées"
          value={revised}
          hint="plus d’une version"
          tone={revised > 0 ? 'warning' : undefined}
        />
        <KpiCard
          label="Rapports émis"
          value={items.filter((d) => d.type === 'REPORT').length}
          hint="PDF remis au client"
        />
      </KpiRow>

      {items.length === 0 ? (
        <Card>
          <EmptyState
            title="Aucun document"
            description="Les pièces arrivent ici automatiquement : le PDF d’un rapport est produit à son émission, et rangé sous son empreinte."
          />
        </Card>
      ) : (
        <>
          <NextActionBanner
            tone="info"
            title="Les pièces se déposent toutes seules"
            detail="Un rapport émis produit son PDF ; une révision ajoute une version sans effacer celle qui a été remise."
          />

          <Card title={`${items.length} document(s)`}>
            <DataTable>
              <thead>
                <tr>
                  <Th>Fichier</Th>
                  <Th>Type</Th>
                  <Th>Affaire</Th>
                  <Th>Diffusion</Th>
                  <Th align="right">Taille</Th>
                  <Th align="right">Versions</Th>
                  <Th>Empreinte</Th>
                  <Th>Déposé le</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {items.map((d) => {
                  const source = sourceHref(d);
                  const confidentiality = CONFIDENTIALITY[d.confidentiality] ?? {
                    label: d.confidentiality,
                    tone: 'neutral' as Tone,
                  };

                  return (
                    <tr key={d.id}>
                      <Td mono>{d.fileName}</Td>
                      <Td>{TYPE_LABELS[d.type] ?? d.type}</Td>
                      <Td mono>
                        {d.affair ? (
                          <span title={d.affair.client}>{d.affair.number}</span>
                        ) : (
                          <span className="text-subtle">—</span>
                        )}
                      </Td>
                      <Td>
                        <StatusBadge tone={confidentiality.tone}>{confidentiality.label}</StatusBadge>
                      </Td>
                      <Td mono align="right">
                        {weight(d.size)}
                      </Td>
                      <Td mono align="right">
                        {d.versionCount}
                      </Td>
                      <Td mono>
                        <span title={d.sha256} className="text-subtle">
                          {d.sha256.slice(0, 10)}…
                        </span>
                      </Td>
                      <Td mono>{date(d.createdAt)}</Td>
                      <Td>
                        {source && (
                          <Link
                            href={source}
                            className="text-[13.5px] font-medium text-accent hover:underline"
                          >
                            Voir la pièce
                          </Link>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
          </Card>
        </>
      )}
    </>
  );
}
