/**
 * Partage d'une journée entre plusieurs interventions.
 *
 * Un inspecteur peut enchaîner plusieurs interventions courtes dans la même
 * journée — un palan le matin chez un client, une élingue l'après-midi chez
 * un autre. Règle retenue par I2S : la journée se partage À PARTS ÉGALES
 * entre les interventions du jour, sans saisie d'heures. Deux interventions
 * valent 0,5 journée chacune, trois valent un tiers.
 *
 * La dernière part absorbe l'arrondi : la somme des parts redonne toujours
 * exactement une journée, et la somme des coûts exactement le coût du jour.
 * Sans cela, une journée coupée en trois vaudrait 0,9999 jour et perdrait un
 * centime — invisible sur une ligne, faux sur un exercice.
 */
export interface DaySlot {
  /** Part de la journée, à quatre décimales (0,3333). */
  share: number;
  /** Coût imputé à cette part, au centime ; nul si le coût du jour est inconnu. */
  cost: number | null;
}

export function splitDay(interventions: number, dayCost: number | null): DaySlot[] {
  const n = Math.max(1, Math.floor(interventions));

  const shareUnits = 10_000; // quatre décimales
  const baseShare = Math.floor(shareUnits / n);
  const lastShare = shareUnits - baseShare * (n - 1);

  const costCents = dayCost === null ? null : Math.round(dayCost * 100);
  const baseCost = costCents === null ? null : Math.floor(costCents / n);
  const lastCost = costCents === null || baseCost === null ? null : costCents - baseCost * (n - 1);

  return Array.from({ length: n }, (_, index) => {
    const last = index === n - 1;
    const units = last ? lastShare : baseShare;
    const cents = last ? lastCost : baseCost;
    return {
      share: units / shareUnits,
      cost: cents === null ? null : cents / 100,
    };
  });
}

/** Addition de parts de journée sans dérive d'arrondi (quatre décimales). */
export function sumShares(shares: Iterable<number>): number {
  let units = 0;
  for (const share of shares) units += Math.round(share * 10_000);
  return units / 10_000;
}
