import { relay } from '@/lib/relay';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; reportId: string }> },
) {
  const { id, reportId } = await context.params;
  return relay(`/payment-batches/${id}/lines/${reportId}`, request, 'PATCH');
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; reportId: string }> },
) {
  const { id, reportId } = await context.params;
  return relay(`/payment-batches/${id}/lines/${reportId}`, request, 'DELETE');
}
