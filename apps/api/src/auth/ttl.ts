/**
 * Convertit une durée lisible (`15m`, `2h`, `30d`) en secondes.
 * On passe des secondes à `@nestjs/jwt` plutôt qu'une chaîne : le type
 * attendu par la librairie est une union de littéraux, pas `string`.
 */
export function ttlToSeconds(ttl: string, fallbackSeconds = 900): number {
  const match = /^(\d+)\s*([smhd])$/.exec(ttl.trim());
  if (!match) {
    const asNumber = Number(ttl);
    return Number.isFinite(asNumber) && asNumber > 0 ? asNumber : fallbackSeconds;
  }
  const amount = Number(match[1]);
  const unit = match[2] as 's' | 'm' | 'h' | 'd';
  return amount * { s: 1, m: 60, h: 3600, d: 86_400 }[unit];
}
