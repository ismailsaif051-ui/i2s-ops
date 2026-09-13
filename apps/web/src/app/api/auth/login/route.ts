import { NextResponse } from 'next/server';
import { loginSchema, type AuthTokens } from '@i2s/contracts';
import { ACCESS_COOKIE, API_URL, REFRESH_COOKIE } from '@/lib/api';

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

  const upstream = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.data),
    cache: 'no-store',
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json(
      { message: "L'API est injoignable. Vérifiez qu'elle est démarrée." },
      { status: 503 },
    );
  }

  const payload = (await upstream.json().catch(() => ({}))) as Partial<AuthTokens> & {
    message?: string;
  };

  if (!upstream.ok || !payload.accessToken || !payload.refreshToken) {
    return NextResponse.json(
      { message: payload.message ?? 'Identifiants invalides.' },
      { status: upstream.status || 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === 'production';

  response.cookies.set(ACCESS_COOKIE, payload.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: payload.expiresIn ?? 900,
  });
  response.cookies.set(REFRESH_COOKIE, payload.refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
