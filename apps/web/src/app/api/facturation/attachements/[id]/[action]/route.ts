import { NextResponse } from 'next/server';
import { relay } from '@/lib/relay';

/** Gestes du circuit de l'attachement, et leur route côté API. */
const ROUTES: Record<string, string> = {
  transmettre: 'submit',
  signer: 'validate',
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; action: string }> },
) {
  const { id, action } = await context.params;
  const target = ROUTES[action];
  if (!target) return NextResponse.json({ message: 'Action inconnue.' }, { status: 404 });

  return relay(`/attachments/${id}/${target}`, request);
}
