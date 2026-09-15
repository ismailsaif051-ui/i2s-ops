import { relay } from '@/lib/relay';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return relay(`/payment-batches/${id}/pay`, request, 'POST');
}
