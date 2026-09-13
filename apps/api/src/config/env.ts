import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().default(4000),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL est requis.'),
    JWT_SECRET: z
      .string()
      .min(32, 'JWT_SECRET doit contenir au moins 32 caractères.'),
    JWT_ACCESS_TTL: z.string().default('15m'),
    JWT_REFRESH_TTL_DAYS: z.coerce.number().int().default(30),
    WEB_ORIGIN: z.string().default('http://localhost:3000'),
    /** Racine de la GED. Hors de la base : les fichiers y sont rangés par empreinte. */
    STORAGE_ROOT: z.string().default('storage'),
    /**
     * Clé du modèle qui rédige les offres.
     *
     * Facultative : sans elle, l'application fonctionne entièrement, seul
     * l'assistant de rédaction est indisponible et le dit.
     */
    ANTHROPIC_API_KEY: z.string().optional(),
    AI_MODEL: z.string().default('claude-sonnet-5'),
  })
  .passthrough();

export type Env = z.infer<typeof envSchema>;
