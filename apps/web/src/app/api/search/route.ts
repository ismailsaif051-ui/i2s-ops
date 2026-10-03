import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE, API_URL } from '@/lib/session';

/** Relaie la recherche globale : le jeton reste dans son cookie httpOnly. */
export async function GET(request: Request) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: 'Session expirée.' }, { status: 401 });

  const q = new URL(request.url).searchParams.get('q') ?? '';
  const upstream = await fetch(`${API_URL}/search?q=${encodeURIComponent(q.slice(0, 80))}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json({ message: 'Le service est injoignable. Réessayez.' }, { status: 503 });
  }
  const payload = await upstream.json().catch(() => []);
  return NextResponse.json(payload, { status: upstream.status });
}
