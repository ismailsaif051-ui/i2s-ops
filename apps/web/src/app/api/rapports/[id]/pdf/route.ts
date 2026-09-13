import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE, API_URL } from '@/lib/api';

/**
 * Relaie la pièce PDF du rapport.
 *
 * Le navigateur ne peut pas appeler l'API directement — le jeton vit dans un
 * cookie httpOnly. Le flux est retransmis tel quel, en-têtes compris.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: 'Session expirée.' }, { status: 401 });

  const upstream = await fetch(`${API_URL}/reports/${id}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!upstream.ok) {
    const payload = await upstream.json().catch(() => ({ message: 'Pièce indisponible.' }));
    return NextResponse.json(payload, { status: upstream.status });
  }

  return new NextResponse(await upstream.arrayBuffer(), {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/pdf',
      'Content-Disposition': upstream.headers.get('content-disposition') ?? 'inline',
      'Cache-Control': 'private, no-store',
    },
  });
}
