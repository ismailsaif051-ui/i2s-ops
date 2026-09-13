import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE, API_URL } from '@/lib/api';

/** Les seules actions relayées. Tout le reste est refusé ici, pas à l'API. */
const ALLOWED = new Set(['take', 'check', 'issue', 'deliver', 'revise']);

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; action: string }> },
) {
  const { id, action } = await context.params;

  if (!ALLOWED.has(action)) {
    return NextResponse.json({ message: 'Action inconnue.' }, { status: 404 });
  }

  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: 'Session expirée.' }, { status: 401 });

  const upstream = await fetch(`${API_URL}/reports/${id}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(await request.json().catch(() => ({}))),
    cache: 'no-store',
  });

  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}
