import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { changePasswordSchema } from '@i2s/contracts';
import { ACCESS_COOKIE, API_URL, REFRESH_COOKIE } from '@/lib/api';

export async function POST(request: Request) {
  const parsed = changePasswordSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Données invalides.' },
      { status: 400 },
    );
  }

  const jar = await cookies();
  const accessToken = jar.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return NextResponse.json({ message: 'Session expirée.' }, { status: 401 });

  const upstream = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(parsed.data),
    cache: 'no-store',
  });

  if (!upstream.ok) {
    const payload = (await upstream.json().catch(() => ({}))) as { message?: string };
    return NextResponse.json(
      { message: payload.message ?? 'Changement impossible.' },
      { status: upstream.status },
    );
  }

  // Le changement révoque toutes les sessions : on force une reconnexion.
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}
