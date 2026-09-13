import { NextResponse } from 'next/server';
import { relay } from '@/lib/relay';

/** Gestes relayés, et le chemin d'API correspondant. */
const ROUTES: Record<string, string> = {
  assignments: 'assignments',
  order: 'order',
  'order-sign': 'order/sign',
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; action: string }> },
) {
  const { id, action } = await context.params;
  const target = ROUTES[action];
  if (!target) return NextResponse.json({ message: 'Action inconnue.' }, { status: 404 });

  return relay(`/missions/${id}/${target}`, request);
}
