import Link from 'next/link';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui';
import { MissionForm, type AffairOption, type DepartmentOption } from '@/components/mission-form';

export const metadata: Metadata = { title: 'Nouvelle mission' };

interface Options {
  affairs: AffairOption[];
  departments: DepartmentOption[];
}

export default async function NewMissionPage({
  searchParams,
}: {
  searchParams: Promise<{ affaire?: string }>;
}) {
  const [{ affaire }, options] = await Promise.all([
    searchParams,
    api<Options>('/missions/options'),
  ]);

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/operations/missions" className="hover:text-text">
            ‹ Missions
          </Link>
        }
        title="Planifier une mission"
        description="Une mission se rattache à une affaire : c’est ce rattachement qui fait retomber le temps passé, les frais et le chiffre d’affaires au bon endroit."
      />
      <MissionForm
        affairs={options.affairs}
        departments={options.departments}
        defaultAffairId={affaire}
      />
    </>
  );
}
