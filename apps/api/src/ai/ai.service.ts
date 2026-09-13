import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Version par défaut du modèle rédacteur. Surchargée par `AI_MODEL`. */
const DEFAULT_MODEL = 'claude-sonnet-5';

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

/** Au-delà, on rend la main : l'écran ne doit pas rester bloqué. */
const TIMEOUT_MS = 120_000;

export interface CompletionRequest {
  system: string;
  user: string;
  /**
   * Début imposé de la réponse.
   *
   * Sert à obtenir du JSON sans préambule : on amorce la réponse par `{`, et
   * le modèle n'a plus la place d'écrire « Voici le document… » avant.
   */
  prefill?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CompletionResult {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Appel au modèle de rédaction.
 *
 * Isolé dans un service à part pour deux raisons : le métier ne doit pas
 * connaître le fournisseur, et le texte envoyé sort de l'entreprise — ce
 * passage-là mérite d'être visible à un seul endroit.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly config: ConfigService) {}

  /** L'assistant n'est utilisable que si une clé a été déposée. */
  get configured(): boolean {
    return Boolean(this.config.get<string>('ANTHROPIC_API_KEY')?.trim());
  }

  get model(): string {
    return this.config.get<string>('AI_MODEL')?.trim() || DEFAULT_MODEL;
  }

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY')?.trim();

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'L’assistant de rédaction n’est pas configuré : la clé du modèle est absente. ' +
          'Déposez-la dans le fichier .env sous le nom ANTHROPIC_API_KEY, puis redémarrez l’API.',
      );
    }

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      { role: 'user', content: request.user },
    ];
    if (request.prefill) messages.push({ role: 'assistant', content: request.prefill });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': API_VERSION,
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: request.maxTokens ?? 8000,
          temperature: request.temperature ?? 0.3,
          system: request.system,
          messages,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError';
      this.logger.error(`Appel au modèle impossible : ${String(error)}`);

      throw new ServiceUnavailableException(
        aborted
          ? 'Le modèle n’a pas répondu dans le temps imparti. Réessayez dans un moment.'
          : 'Le modèle est injoignable. Vérifiez la connexion réseau du serveur.',
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      this.logger.error(`Modèle : réponse ${response.status} — ${detail.slice(0, 400)}`);

      throw new ServiceUnavailableException(this.explain(response.status));
    }

    const payload = (await response.json()) as {
      model?: string;
      content?: Array<{ type: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const text = (payload.content ?? [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text ?? '')
      .join('');

    if (!text.trim()) {
      throw new ServiceUnavailableException('Le modèle a répondu sans texte utilisable.');
    }

    return {
      text: (request.prefill ?? '') + text,
      model: payload.model ?? this.model,
      inputTokens: payload.usage?.input_tokens ?? 0,
      outputTokens: payload.usage?.output_tokens ?? 0,
    };
  }

  /** Le refus du fournisseur, dit en français à celui qui est devant l'écran. */
  private explain(status: number): string {
    if (status === 401 || status === 403) {
      return 'La clé du modèle est refusée. Vérifiez ANTHROPIC_API_KEY dans le fichier .env.';
    }
    if (status === 404) {
      return `Le modèle « ${this.model} » est inconnu du fournisseur. Corrigez AI_MODEL dans le fichier .env.`;
    }
    if (status === 429) {
      return 'Trop de demandes de rédaction en même temps. Patientez une minute et relancez.';
    }
    if (status === 400) {
      return 'Le dossier est trop volumineux pour être rédigé d’un seul tenant. Allégez le contexte de la consultation.';
    }
    return 'Le service de rédaction est momentanément indisponible. Réessayez plus tard.';
  }
}
