import { z } from 'zod';

export const OFFER_NATURES = ['TECHNIQUE', 'COMMERCIALE', 'TECHNICO_COMMERCIALE'] as const;
export type OfferDocumentNature = (typeof OFFER_NATURES)[number];

export const draftSchema = z.object({
  nature: z.enum(OFFER_NATURES, { message: 'Choisissez la nature du document à rédiger.' }),
});

export const draftEditSchema = z.object({
  sections: z.record(z.string(), z.string().max(20_000)),
});
