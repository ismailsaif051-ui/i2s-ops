import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE, API_URL } from '@/lib/api';

/** Relaie l’export Excel de la Vue d’ensemble, pour la période demandée. */
export async function GET(request: Request) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: 'Session expirée.' }, { status: 401 });

  const upstream = await fetch(`${API_URL}/analytics/dashboard/export${monthQuery(request)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!upstream.ok) {
    const payload = await upstream.json().catch(() => ({ message: 'Export indisponible.' }));
    return NextResponse.json(payload, { status: upstream.status });
  }

  return new NextResponse(await upstream.arrayBuffer(), {
    status: 200,
    headers: {
      'Content-Type':
        upstream.headers.get('content-type') ??
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': upstream.headers.get('content-disposition') ?? 'attachment',
      'Cache-Control': 'private, no-store',
    },
  });
}

/** Seul un mois au format AAAA-MM est transmis à l'API. */
function monthQuery(request: Request): string {
  const month = new URL(request.url).searchParams.get('month');
  return month && /^\d{4}-\d{2}$/.test(month) ? `?month=${month}` : '';
}
