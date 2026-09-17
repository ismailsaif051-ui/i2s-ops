/**
 * Cookies de session, partagés par la connexion et par le middleware qui les
 * renouvelle. Ce module n'importe rien de Next côté serveur : le middleware
 * s'exécute dans un environnement où ces API n'existent pas.
 */
export const ACCESS_COOKIE = 'i2s_at';
export const REFRESH_COOKIE = 'i2s_rt';
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

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
