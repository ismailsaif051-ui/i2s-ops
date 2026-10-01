import { relay } from '@/lib/relay';

/** Mise à jour d'une affaire — le bon de commande arrive souvent après elle. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return relay(`/affairs/${id}`, request, 'PATCH');
}
