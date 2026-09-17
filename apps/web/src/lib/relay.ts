import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchAwakening, servedByHost } from './awaken';
import { ACCESS_COOKIE, API_URL } from './session';

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
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
): Promise<NextResponse> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: 'Session expirée.' }, { status: 401 });

  const body = method === 'DELETE' ? undefined : JSON.stringify(await request.json().catch(() => ({})));

  const upstream = await fetchAwakening(
    `${API_URL}${path}`,
    {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body,
      cache: 'no-store',
    },
    'write',
  ).catch(() => null);

  // Sans ces deux gardes, une API injoignable ou une page d'attente de
  // l'hébergeur ressortaient en succès vide : l'écran croyait l'action faite.
  if (!upstream) {
    return NextResponse.json({ message: 'Le service est injoignable. Réessayez.' }, { status: 503 });
  }
  if (servedByHost(upstream)) {
    return NextResponse.json(
      { message: 'Le service redémarre. Réessayez dans un instant.' },
      { status: 503 },
    );
  }

  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}
