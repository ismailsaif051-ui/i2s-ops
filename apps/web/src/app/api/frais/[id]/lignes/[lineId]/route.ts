import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE, API_URL } from '@/lib/api';

/** Retrait d'une ligne : le seul DELETE relayé de l'application. */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; lineId: string }> },
) {
  const { id, lineId } = await context.params;
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: 'Session expirée.' }, { status: 401 });

  const upstream = await fetch(`${API_URL}/expense-reports/${id}/lines/${lineId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}
