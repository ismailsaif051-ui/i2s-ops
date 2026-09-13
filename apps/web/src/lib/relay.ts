import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE, API_URL } from '@/lib/api';

/**
 * Relaie une écriture du navigateur vers l'API.
 *
 * Le jeton vit dans un cookie httpOnly : le navigateur ne peut pas appeler
 * l'API directement, et c'est voulu. Ces relais sont le seul chemin, ce qui
 * garde le jeton hors de portée du JavaScript de la page.
 */
export async function relay(
  path: string,
  request: Request,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST',
): Promise<NextResponse> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: 'Session expirée.' }, { status: 401 });

  const upstream = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(await request.json().catch(() => ({}))),
    cache: 'no-store',
  });

  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}
