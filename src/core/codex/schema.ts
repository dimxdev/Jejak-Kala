// The Kodeks: the player's notebook of people, places, objects and ideas. Entries are written per chapter
// in content/chapters/<id>/codex.yaml and unlocked by finishing missions.
//
// Every entry carries a credibility label, so the player always sees how sure history is about it. This
// is the heart of "belajar sejarah sungguhan": evidence, tradition, debate and myth are told apart.

import { z } from 'zod';
import { assetRef, slug, text } from '../content/primitives';
import { YearSpecSchema } from '../content/schema';

export const CODEX_CATEGORIES = ['person', 'place', 'artifact', 'concept'] as const;
export const CodexCategorySchema = z.enum(CODEX_CATEGORIES);

/**
 * proven    = Terbukti, backed by evidence we can check
 * tradition = Menurut tradisi, handed down but not directly proven
 * debated   = Perdebatan, experts disagree
 * myth      = Mitos, popular but not supported by the evidence
 * game      = Model game, something the game made up to be playable (never presented as history)
 */
export const CREDIBILITIES = ['proven', 'tradition', 'debated', 'myth', 'game'] as const;
export const CredibilitySchema = z.enum(CREDIBILITIES);

export const SourceSchema = z.object({
  title: text,
  url: z.url().optional(),
  /** what the source is used for, e.g. "kutipan Pliny" */
  note: text.optional(),
});

export const CodexEntrySchema = z.object({
  id: slug,
  category: CodexCategorySchema,
  title: text,
  /** when it happened or existed (empty for timeless ideas) */
  years: z.array(YearSpecSchema).default([]),
  credibility: CredibilitySchema,
  /** one or two sentences, shown on the card */
  summary: text,
  /** the entry itself, one paragraph per item */
  body: z.array(text).min(1),
  /** the "Dalam" layer: sources, caveats and debates for readers who want more */
  deep: z.array(text).default([]),
  sources: z.array(SourceSchema).default([]),
  /** pictures from the assets, shown side by side (up to three) */
  images: z.array(assetRef).max(3).default([]),
  /** ids of related entries in the same chapter */
  related: z.array(slug).default([]),
  /** true until the facts have been checked against the sources; `content:check` lists these */
  verify: z.boolean().default(false),
});

export const CodexFileSchema = z
  .object({ entries: z.array(CodexEntrySchema).min(1) })
  .superRefine((file, ctx) => {
    const ids = new Set(file.entries.map((entry) => entry.id));
    const seen = new Set<string>();
    file.entries.forEach((entry, i) => {
      if (seen.has(entry.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['entries', i, 'id'],
          message: `id kembar: ${entry.id}`,
        });
      }
      seen.add(entry.id);
      entry.related.forEach((other, j) => {
        if (!ids.has(other)) {
          ctx.addIssue({
            code: 'custom',
            path: ['entries', i, 'related', j],
            message: `entri "${other}" tidak ada di kodeks ini`,
          });
        }
      });
    });
  });

export type CodexCategory = z.infer<typeof CodexCategorySchema>;
export type Credibility = z.infer<typeof CredibilitySchema>;
export type CodexEntry = z.infer<typeof CodexEntrySchema>;
export type CodexFile = z.infer<typeof CodexFileSchema>;
