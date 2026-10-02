import { relay } from '@/lib/relay';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return relay(`/affair-costs/${id}`, request, 'PATCH');
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return relay(`/affair-costs/${id}`, request, 'DELETE');
}
