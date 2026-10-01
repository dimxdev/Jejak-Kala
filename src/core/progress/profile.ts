// Who the player is: a name and one of the traveler looks. Kept tiny on purpose; nothing here leaves the
// device (there are no accounts).

import { z } from 'zod';

/** Ids of the traveler portraits: shared/traveler-<id>. */
export const TRAVELERS = ['a', 'b', 'c'] as const;
export type TravelerId = (typeof TRAVELERS)[number];

export const MAX_NAME_LENGTH = 20;

/** Trims the name and collapses runs of spaces, so "  Dimas   B " becomes "Dimas B". */
export const normalizeName = (raw: string): string => raw.replace(/\s+/g, ' ').trim();

export const ProfileSchema = z.object({
  name: z
    .string()
    .transform(normalizeName)
    .pipe(
      z
        .string()
        .min(1, 'tulis namamu')
        .max(MAX_NAME_LENGTH, `paling banyak ${MAX_NAME_LENGTH} huruf`),
    ),
  traveler: z.enum(TRAVELERS),
});

export type Profile = z.infer<typeof ProfileSchema>;

/** The name to show for a player who has not chosen one yet. */
export const DEFAULT_PLAYER_NAME = 'Penjelajah';

/** The key a Kodeks entry is saved under: entry ids only have to be unique inside their chapter. */
export const codexKey = (chapterId: string, entryId: string): string => `${chapterId}/${entryId}`;
