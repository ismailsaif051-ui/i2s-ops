import Link from 'next/link';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui';
import { AffairForm } from '@/components/affair-form';

export const metadata: Metadata = { title: 'Nouvelle affaire' };

interface Options {
  clients: Array<{ id: string; code: string; name: string; type: string }>;
  departments: Array<{ id: string; code: string; name: string }>;
  employees: Array<{
    id: string;
    matricule: string;
    name: string;
    position: string | null;
    department: string | null;
  }>;
  nextNumber: string | null;
}

export default async function NewAffairPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const [{ client }, options] = await Promise.all([searchParams, api<Options>('/affairs/options')]);

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/affaires" className="hover:text-text">
            ‹ Affaires
          </Link>
        }
        title="Ouvrir une affaire"
        description="Le Code Affaire est le pivot du système : missions, temps passé, frais, attachements et factures s’y rattachent. Il est alloué à la création et ne se choisit pas."
      />
      <AffairForm
        clients={options.clients}
        departments={options.departments}
        employees={options.employees}
        nextNumber={options.nextNumber}
        defaultClientId={client}
      />
    </>
  );
}
