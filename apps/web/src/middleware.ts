import { NextResponse, type NextRequest } from 'next/server';

// La version doit être lisible sans session : c'est ce qui permet de vérifier
// qu'un déploiement est bien en ligne avant de se connecter.
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/version'];

/**
 * Garde de premier niveau : sans cookie de session, on n'entre pas dans
 * l'application. L'autorisation fine reste appliquée par l'API.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const hasSession = request.cookies.has('i2s_at') || request.cookies.has('i2s_rt');
  if (hasSession) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|webp|ico)$).*)'],
};
