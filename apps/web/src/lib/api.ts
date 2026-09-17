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
 * Réveil de l'API endormie.
 *
 * L'hébergement met le service en veille après une période sans trafic : la
 * première requête tombe alors sur une connexion refusée ou une passerelle qui
 * répond 502/503 le temps du démarrage. Sans ce rattrapage, la page rendue
 * côté serveur lève et l'utilisateur voit une erreur applicative alors que
 * rien n'est cassé — c'est ce qui donnait l'impression que « les accès ne
 * marchent pas ».
 *
 * On ne rejoue que des lectures : rejouer une écriture la ferait deux fois.
 */
const WAKING_STATUS = new Set([502, 503, 504]);
const RETRY_DELAYS_MS = [1000, 3000, 6000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAwakening(
  url: string,
  init: RequestInit,
  replayable: boolean,
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const last = attempt >= RETRY_DELAYS_MS.length;
    try {
      const response = await fetch(url, init);
      if (!replayable || last || !WAKING_STATUS.has(response.status)) return response;
    } catch (error) {
      if (!replayable || last) throw error;
    }
    await sleep(RETRY_DELAYS_MS[attempt]);
  }
}

/**
 * Appel serveur vers l'API. Le jeton vit dans un cookie httpOnly : il n'est
 * jamais exposé au JavaScript du navigateur.
 */
export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = options.token ?? (await cookies()).get(ACCESS_COOKIE)?.value;

  const response = await fetchAwakening(
    `${API_URL}${path}`,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
    },
    options.body === undefined && (options.method ?? 'GET').toUpperCase() === 'GET',
  );

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
