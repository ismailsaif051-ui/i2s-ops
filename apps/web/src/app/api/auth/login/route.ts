import { NextResponse } from 'next/server';
import { loginSchema, type AuthTokens } from '@i2s/contracts';
import { fetchAwakening, servedByHost } from '@/lib/awaken';
import { ACCESS_COOKIE, API_URL, REFRESH_COOKIE, REFRESH_MAX_AGE, sessionCookie } from '@/lib/session';

/**
 * Point d'entrée de connexion côté Next : appelle l'API puis dépose les jetons
 * dans des cookies httpOnly. Le navigateur ne voit jamais le jeton.
 */
export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Données invalides.' },
      { status: 400 },
    );
  }

  const upstream = await fetchAwakening(
    `${API_URL}/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
    },
    'write',
  ).catch(() => null);

  if (!upstream || servedByHost(upstream)) {
    return NextResponse.json(
      { message: 'Le service redémarre après une période d’inactivité. Réessayez dans un instant.' },
      { status: 503 },
    );
  }

  const payload = (await upstream.json().catch(() => ({}))) as Partial<AuthTokens> & {
    message?: string;
  };

  if (!upstream.ok || !payload.accessToken || !payload.refreshToken) {
    // Jamais un statut de succès ici : l'écran de connexion s'y fierait et
    // enverrait vers l'application sans session.
    return NextResponse.json(
      { message: payload.message ?? 'Identifiants invalides.' },
      { status: upstream.ok ? 502 : upstream.status },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE, payload.accessToken, sessionCookie(payload.expiresIn ?? 900));
  response.cookies.set(REFRESH_COOKIE, payload.refreshToken, sessionCookie(REFRESH_MAX_AGE));
  return response;
}
