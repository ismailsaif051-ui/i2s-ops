/**
 * Cookies de session, partagés par la connexion et par le middleware qui les
 * renouvelle. Ce module n'importe rien de Next côté serveur : le middleware
 * s'exécute dans un environnement où ces API n'existent pas.
 */
export const ACCESS_COOKIE = 'i2s_at';
export const REFRESH_COOKIE = 'i2s_rt';
/**
 * Adresse de l'API, lue au démarrage du serveur et non à la construction.
 *
 * Seul le serveur de l'interface parle à l'API (le navigateur passe par ses
 * relais) : la variable n'a donc pas besoin d'être figée dans le code compilé.
 * Sur un hébergement, l'adresse n'est connue qu'une fois l'API déployée — la
 * lire à l'exécution évite de reconstruire l'interface pour la renseigner.
 *
 * Ordre : API_URL, puis NEXT_PUBLIC_API_URL (ancien réglage), puis, sur
 * Render, l'adresse de l'API déduite de celle de l'interface
 * (i2s-system-web.onrender.com → i2s-system-api.onrender.com), puis le poste
 * de développement.
 */
function resolveApiUrl(): string {
  const explicit = process.env['API_URL'] ?? process.env['NEXT_PUBLIC_API_URL'];
  if (explicit) return explicit.replace(/\/+$/, '');

  const host = process.env['RENDER_EXTERNAL_HOSTNAME'];
  if (host && host.includes('-web')) {
    return `https://${host.replace('-web', '-api')}/api/v1`;
  }

  return 'http://localhost:4000/api/v1';
}

export const API_URL = resolveApiUrl();

/** Durée du jeton de renouvellement, alignée sur JWT_REFRESH_TTL_DAYS côté API. */
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export function sessionCookie(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}
