import { NextResponse } from 'next/server';
import { relay } from '@/lib/relay';

const ROUTES: Record<string, string> = {
  emettre: 'issue',
  reglements: 'payments',
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; action: string }> },
) {
  const { id, action } = await context.params;
  const target = ROUTES[action];
  if (!target) return NextResponse.json({ message: 'Action inconnue.' }, { status: 404 });

  return relay(`/invoices/${id}/${target}`, request);
}
