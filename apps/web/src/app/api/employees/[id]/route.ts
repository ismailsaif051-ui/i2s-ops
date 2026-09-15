import { relay } from '@/lib/relay';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return relay(`/employees/${id}`, request, 'PATCH');
}
