import { NextResponse } from 'next/server';
import { relay } from '@/lib/relay';

/** Les seules actions relayées, avec leur route côté API. */
const ACTIONS: Record<string, string> = {
  'appels-offres': 'tenders',
  offres: 'offers',
  relances: 'follow-ups',
  perte: 'lose',
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; action: string }> },
) {
  const { id, action } = await context.params;
  const target = ACTIONS[action];

  if (!target) return NextResponse.json({ message: 'Action inconnue.' }, { status: 404 });

  return relay(`/opportunities/${id}/${target}`, request);
}
