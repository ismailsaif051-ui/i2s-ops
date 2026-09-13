import Link from 'next/link';
import type { Metadata } from 'next';
import { PARADIGM_LABELS, TEMPLATE_STATUS_LABELS, type Paradigm } from '@i2s/contracts';
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

export const metadata: Metadata = { title: 'Templates d’inspection' };

interface TemplateRow {
  id: string;
  formCode: string;
  version: string;
  title: string;
  titleEn: string | null;
  paradigm: Paradigm;
  status: string;
  applicationDate: string | null;
  method: { code: string; name: string } | null;
  department: string | null;
  sectionCount: number;
  usageCount: number;
}

const PARADIGM_TONE: Record<Paradigm, Tone> = {
  MEASUREMENT: 'accent',
  CHECKLIST: 'info',
  CRITERIA: 'secondary',
};

/** Volumétrie relevée dans le référentiel I2S — voir docs/08. */
const CATALOGUE = [
  { department: 'CND', total: 20, lot: 'L1 et L2' },
  { department: 'EILM', total: 40, lot: 'L3 et L4' },
  { department: 'CTC', total: 2, lot: 'L5' },
];

export default async function TemplatesPage() {
  const { items } = await api<{ items: TemplateRow[] }>('/inspection-templates');

  const published = items.filter((t) => t.status === 'PUBLISHED');
  const totalToPort = CATALOGUE.reduce((s, c) => s + c.total, 0);

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Templates d’inspection"
        description="Aucun formulaire n’est codé en dur : chacun est décrit par un schéma, stocké en base et versionné. Publier une version ne modifie aucun rapport déjà émis."
      />

      <KpiRow>
        <KpiCard label="Formulaires publiés" value={published.length} tone="success" />
        <KpiCard
          label="Formulaires du référentiel"
          value={totalToPort}
          hint="recensés dans vos procédures"
        />
        <KpiCard
          label="Reste à modéliser"
          value={totalToPort - published.length}
          tone={totalToPort - published.length > 0 ? 'warning' : 'success'}
        />
        <KpiCard label="Paradigmes couverts" value={new Set(items.map((t) => t.paradigm)).size} unit="/ 3" />
      </KpiRow>

      <NextActionBanner
        tone="info"
        title={`${published.length} formulaires modélisés sur ${totalToPort} recensés`}
        detail="Les trois paradigmes de saisie sont couverts : mesures END, check-list réglementaire et critères d’acceptation. La reprise des formulaires restants réutilise ces structures."
      />

      <Card title={`Bibliothèque — ${items.length} formulaires`}>
        {items.length === 0 ? (
          <EmptyState
            title="Aucun formulaire"
            description="Chargez le jeu de simulation ou créez un formulaire depuis l’éditeur."
          />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Version</Th>
                <Th>Titre</Th>
                <Th>Méthode</Th>
                <Th>Paradigme</Th>
                <Th align="right">Sections</Th>
                <Th align="right">Utilisations</Th>
                <Th>Date d’application</Th>
                <Th>Statut</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((template) => (
                <tr key={template.id}>
                  <Td mono>
                    <Link
                      href={`/administration/templates/${template.id}`}
                      className="text-accent hover:underline"
                    >
                      {template.formCode}
                    </Link>
                  </Td>
                  <Td mono>{template.version}</Td>
                  <Td className="max-w-[340px]">
                    <span className="block">{template.title}</span>
                    {template.titleEn && (
                      <span className="block text-[13px] text-subtle">{template.titleEn}</span>
                    )}
                  </Td>
                  <Td>
                    {template.method ? `${template.method.code} — ${template.method.name}` : '—'}
                  </Td>
                  <Td>
                    <StatusBadge tone={PARADIGM_TONE[template.paradigm]}>
                      {PARADIGM_LABELS[template.paradigm]}
                    </StatusBadge>
                  </Td>
                  <Td align="right" mono>
                    {template.sectionCount}
                  </Td>
                  <Td align="right" mono>
                    {template.usageCount}
                  </Td>
                  <Td mono>{date(template.applicationDate)}</Td>
                  <Td>
                    <StatusBadge tone={template.status === 'PUBLISHED' ? 'success' : 'neutral'}>
                      {TEMPLATE_STATUS_LABELS[
                        template.status as keyof typeof TEMPLATE_STATUS_LABELS
                      ] ?? template.status}
                    </StatusBadge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>

      <div className="mt-5">
        <Card title="Plan de reprise des formulaires">
          <DataTable>
            <thead>
              <tr>
                <Th>Département</Th>
                <Th align="right">Formulaires recensés</Th>
                <Th align="right">Modélisés</Th>
                <Th>Lot</Th>
              </tr>
            </thead>
            <tbody>
              {CATALOGUE.map((row) => {
                const done = published.filter((t) => t.department === row.department).length;
                return (
                  <tr key={row.department}>
                    <Td>{row.department}</Td>
                    <Td align="right" mono>
                      {row.total}
                    </Td>
                    <Td align="right" mono>
                      <span className={done > 0 ? 'text-success' : 'text-subtle'}>{done}</span>
                    </Td>
                    <Td>{row.lot}</Td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
          <p className="border-t border-border px-5 py-3 text-[13.5px] text-subtle">
            Critère d’acceptation d’un lot : le rapport généré doit être visuellement superposable
            au modèle Word ou Excel actuel, et validé par le chef de département concerné.
          </p>
        </Card>
      </div>
    </>
  );
}
