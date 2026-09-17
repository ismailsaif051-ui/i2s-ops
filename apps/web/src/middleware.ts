import { NextResponse, type NextRequest } from 'next/server';
import { fetchAwakening, servedByHost } from '@/lib/awaken';
import {
  ACCESS_COOKIE,
  API_URL,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  sessionCookie,
  type SessionTokens,
} from '@/lib/session';

// La version doit être lisible sans session : c'est ce qui permet de vérifier
// qu'un déploiement est bien en ligne avant de se connecter.
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/version'];

/** Marge avant expiration en deçà de laquelle on renouvelle sans attendre. */
const RENEW_BEFORE_MS = 60_000;

type Renewal = SessionTokens | 'invalid' | 'unreachable';

/**
 * Renouvellements en cours, par jeton. Un chargement de page envoie plusieurs
 * requêtes avec le même jeton : elles partagent un seul renouvellement au lieu
 * d'en lancer chacune un. L'API tolère de toute façon ce cas quelques
 * secondes ; ceci évite simplement des rotations inutiles.
 */
const pending = new Map<string, { at: number; result: Promise<Renewal> }>();

function expiresSoon(accessToken: string): boolean {
  try {
    const segment = accessToken.split('.')[1] ?? '';
    const payload = JSON.parse(atob(segment.replace(/-/g, '+').replace(/_/g, '/'))) as {
      exp?: number;
    };
    return typeof payload.exp !== 'number' || payload.exp * 1000 - Date.now() < RENEW_BEFORE_MS;
  } catch {
    return true;
  }
}

async function callRefresh(refreshToken: string): Promise<Renewal> {
  // En mode lecture : l'API accepte qu'un renouvellement soit rejoué dans les
  // secondes qui suivent, ce qui rend la répétition sans danger pendant le réveil.
  const response = await fetchAwakening(
    `${API_URL}/auth/refresh`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    },
    'read',
  ).catch(() => null);

  if (!response || servedByHost(response) || response.status >= 500) return 'unreachable';
  if (!response.ok) return 'invalid';

  const tokens = (await response.json().catch(() => null)) as SessionTokens | null;
  return tokens?.accessToken && tokens.refreshToken ? tokens : 'unreachable';
}

function renew(refreshToken: string): Promise<Renewal> {
  const now = Date.now();
  for (const [token, entry] of pending) {
    if (now - entry.at > 30_000) pending.delete(token);
  }
  const existing = pending.get(refreshToken);
  if (existing) return existing.result;

  const result = callRefresh(refreshToken);
  pending.set(refreshToken, { at: now, result });
  return result;
}

function toLogin(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

/**
 * Garde de premier niveau : sans session, on n'entre pas dans l'application.
 * L'autorisation fine reste appliquée par l'API.
 *
 * Le jeton d'accès ne vit que quinze minutes. Sans renouvellement, chacun
 * était renvoyé à la page de connexion un quart d'heure après s'être
 * connecté, alors que sa session restait valable trente jours.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!accessToken && !refreshToken) return toLogin(request);
  if (!refreshToken || (accessToken && !expiresSoon(accessToken))) return NextResponse.next();

  const renewal = await renew(refreshToken);

  if (renewal === 'invalid') {
    const response = toLogin(request);
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
    return response;
  }

  // API injoignable même après la fenêtre de réveil : on laisse passer, la page
  // affichera l'écran « service indisponible » plutôt qu'une déconnexion.
  if (renewal === 'unreachable') return NextResponse.next();

  // La requête en cours doit voir le nouveau jeton, pas seulement les suivantes.
  request.cookies.set(ACCESS_COOKIE, renewal.accessToken);
  request.cookies.set(REFRESH_COOKIE, renewal.refreshToken);
  const response = NextResponse.next({ request });
  response.cookies.set(ACCESS_COOKIE, renewal.accessToken, sessionCookie(renewal.expiresIn ?? 900));
  response.cookies.set(REFRESH_COOKIE, renewal.refreshToken, sessionCookie(REFRESH_MAX_AGE));
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)'],
};
