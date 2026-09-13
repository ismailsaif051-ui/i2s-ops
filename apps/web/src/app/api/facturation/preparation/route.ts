import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE, API_URL } from '@/lib/api';

/** Aperçu de ce qu'il y a à facturer — lecture seule, rien n'est figé. */
export async function GET(request: Request) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: 'Session expirée.' }, { status: 401 });

  const query = new URL(request.url).searchParams;
  const upstream = await fetch(`${API_URL}/attachments/preparation?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}
