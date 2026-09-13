import { relay } from '@/lib/relay';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return relay(`/offers/${id}/redaction`, request);
}

/** Les corrections de la personne qui relit le texte. */
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return relay(`/offers/${id}/redaction`, request, 'PUT');
}
