import type { Metadata } from 'next';
import { PARADIGM_LABELS, type Paradigm } from '@i2s/contracts';
import { api } from '@/lib/api';
import { date } from '@/lib/format';
import { Card, EmptyState, NextActionBanner, PageHeader, StatusBadge } from '@/components/ui';
import { NewInspectionForm } from '@/components/new-inspection-form';

export const metadata: Metadata = { title: 'Nouvelle inspection' };

interface Mission {
  id: string;
  number: string;
  objective: string | null;
  affairNumber: string;
  client: string;
  site: string | null;
  department: string | null;
  start: string | null;
  end: string | null;
}

interface Template {
  id: string;
  formCode: string;
  version: string;
  title: string;
  paradigm: Paradigm;
  status: string;
  department: string | null;
}

export default async function NewInspectionPage() {
  const [{ items: missions }, { items: templates }] = await Promise.all([
    api<{ items: Mission[] }>('/inspections/eligible-missions'),
    api<{ items: Template[] }>('/inspection-templates'),
  ]);

  const published = templates.filter((t) => t.status === 'PUBLISHED');

  return (
    <>
      <PageHeader
        eyebrow="Opérations"
        title="Nouvelle inspection"
        description="Choisissez la mission puis le formulaire. L’en-tête sera pré-rempli depuis la mission : client, affaire, site, procédure et inspecteur ne se ressaisissent pas."
      />

      {missions.length === 0 ? (
        <Card>
          <EmptyState
            title="Aucune mission éligible"
            description="Une inspection ne peut s’ouvrir que sur une mission dont l’ordre de mission est signé, et à laquelle vous êtes affecté."
          />
        </Card>
      ) : published.length === 0 ? (
        <Card>
          <EmptyState
            title="Aucun formulaire publié"
            description="Publiez au moins un formulaire d’inspection depuis l’administration."
          />
        </Card>
      ) : (
        <>
          <NextActionBanner
            tone="info"
            title={`${missions.length} mission(s) éligible(s) · ${published.length} formulaire(s) publié(s)`}
            detail="Seules les missions dont l’ordre de mission est signé apparaissent ici — c’est la condition d’entrée du workflow."
          />
          <NewInspectionForm
            missions={missions.map((m) => ({
              id: m.id,
              label: `${m.number} — ${m.client}`,
              detail: [
                m.affairNumber,
                m.site,
                m.start ? `du ${date(m.start)}` : null,
                m.objective,
              ]
                .filter(Boolean)
                .join(' · '),
              department: m.department,
            }))}
            templates={published.map((t) => ({
              id: t.id,
              label: `${t.formCode} — ${t.title}`,
              detail: `${PARADIGM_LABELS[t.paradigm]} · version ${t.version}`,
              department: t.department,
            }))}
          />
        </>
      )}

      <div className="mt-5">
        <Card title="Formulaires disponibles">
          <ul className="divide-y divide-border">
            {published.map((template) => (
              <li key={template.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span className="ref text-[13px] font-medium">{template.formCode}</span>
                <span className="min-w-0 flex-1 text-[14.5px]">{template.title}</span>
                <StatusBadge tone="neutral">{PARADIGM_LABELS[template.paradigm]}</StatusBadge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
