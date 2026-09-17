/**
 * Réveil de l'API endormie.
 *
 * L'hébergement met le service en veille après une période sans trafic. La
 * première requête tombe alors sur une connexion refusée, une passerelle qui
 * répond 502/503/504, ou une page d'attente HTML servie par l'hébergeur. Le
 * réveil mesuré en production prend environ 45 secondes : les tentatives
 * couvrent une minute.
 *
 * L'API ne renvoie jamais de HTML — du JSON, ou un fichier. Une réponse HTML
 * vient donc forcément de l'hébergeur, et la requête n'a pas atteint
 * l'application.
 */
const WAKING_STATUS = new Set([502, 503, 504]);
const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 15000, 15000, 15000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function servedByHost(response: Response): boolean {
  return (response.headers.get('content-type') ?? '').includes('text/html');
}

/**
 * `read` : rejoue sur toute trace de réveil — une lecture se refait sans risque.
 * `write` : ne rejoue que si l'hébergeur a répondu à la place de l'API. Une
 * passerelle en erreur ne dit pas si l'écriture a eu lieu, et la refaire
 * pourrait la doubler.
 */
export async function fetchAwakening(
  url: string,
  init: RequestInit,
  mode: 'read' | 'write',
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const last = attempt >= RETRY_DELAYS_MS.length;
    try {
      const response = await fetch(url, init);
      const waking =
        servedByHost(response) || (mode === 'read' && WAKING_STATUS.has(response.status));
      if (last || !waking) return response;
      await response.body?.cancel().catch(() => undefined);
    } catch (error) {
      if (last || mode === 'write') throw error;
    }
    await sleep(RETRY_DELAYS_MS[attempt]!);
  }
}
