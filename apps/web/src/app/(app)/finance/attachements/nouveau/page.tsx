import Link from 'next/link';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui';
import { AttachmentForm, type AffairOption } from '@/components/attachment-form';

export const metadata: Metadata = { title: 'Nouvel attachement' };

interface AffairRow {
  id: string;
  number: string;
  title: string;
  client: { name: string };
}

export default async function NewAttachmentPage() {
  const { items } = await api<{ items: AffairRow[] }>('/affairs?limit=200');

  const affairs: AffairOption[] = items.map((a) => ({
    id: a.id,
    number: a.number,
    title: a.title,
    client: a.client.name,
  }));

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/finance/attachements" className="hover:text-text">
            ‹ Attachements
          </Link>
        }
        title="Préparer un attachement"
        description="L’attachement reprend les journées visées et facturables de la période. Une journée déjà attachée n’y figure pas : elle ne se facture qu’une fois."
      />
      <AttachmentForm affairs={affairs} />
    </>
  );
}
