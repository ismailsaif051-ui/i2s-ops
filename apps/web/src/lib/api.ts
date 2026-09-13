import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ERROR_CODES, type SessionUser } from '@i2s/contracts';

export const ACCESS_COOKIE = 'i2s_at';
export const REFRESH_COOKIE = 'i2s_rt';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: Array<{ field: string; message: string }>,
    readonly code?: string,
  ) {
    super(message);
  }
}

interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Jeton explicite (routes d'auth) au lieu du cookie. */
  token?: string;
}

/**
 * Appel serveur vers l'API. Le jeton vit dans un cookie httpOnly : il n'est
 * jamais exposé au JavaScript du navigateur.
 */
export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = options.token ?? (await cookies()).get(ACCESS_COOKIE)?.value;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => ({}) as Record<string, unknown>);

  if (!response.ok) {
    // Mot de passe provisoire : la page appelée n'a pas à afficher une erreur
    // serveur. Le layout redirige déjà, mais page et layout se rendent en
    // parallèle — sans ce garde-fou l'erreur de la page gagne la course.
    if (response.status === 403 && payload.code === ERROR_CODES.PASSWORD_CHANGE_REQUIRED) {
      redirect('/changer-mot-de-passe');
    }

    throw new ApiError(
      response.status,
      typeof payload.message === 'string' ? payload.message : 'Erreur inattendue.',
      payload.errors as Array<{ field: string; message: string }> | undefined,
      typeof payload.code === 'string' ? payload.code : undefined,
    );
  }

  return payload as T;
}

/** Session courante, ou redirection vers la connexion. */
export async function requireSession(): Promise<SessionUser> {
  try {
    return await api<SessionUser>('/auth/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect('/login');
    throw error;
  }
}
