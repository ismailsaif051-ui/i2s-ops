import Link from 'next/link';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui';
import { ClientForm } from '@/components/client-form';

export const metadata: Metadata = { title: 'Nouveau client' };

export default function NewClientPage() {
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/commercial/clients" className="hover:text-text">
            ‹ Clients
          </Link>
        }
        title="Nouveau client"
        description="Le code client sert de clé de rapprochement avec la comptabilité. Il ne se réutilise pas : une fois posé, il désigne ce client pour toujours."
      />
      <ClientForm />
    </>
  );
}
