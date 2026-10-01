// Loads the locked art direction (assets-src/style/style.yaml) and turns an asset description into
// the exact prompt to paste into Gemini, so every asset is made with the same style block.

import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { z } from 'zod';
import { stylePath } from './paths.ts';

export const ASPECTS = ['1:1', '9:16', '3:4', '4:3', '16:9'] as const;
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const OutputSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('fit'),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    quality: z.number().int().min(1).max(100),
    /** width of the soft transparent edge, as a share of the shorter side (0 = none) */
    fade: z.number().min(0).max(0.25).default(0),
  }),
  z.object({
    type: z.literal('sprite'),
    height: z.number().int().positive(),
    /** a wide sprite (a gate, a rod) is also kept inside this width */
    width: z.number().int().positive().optional(),
    quality: z.number().int().min(1).max(100),
  }),
  z.object({ type: z.literal('none') }),
]);

const KindSchema = z.object({
  aspect: z.enum(ASPECTS),
  negative: z.enum(['scene', 'figure']),
  landscape: z.boolean().default(false),
  extra: z.string().optional(),
  output: OutputSchema,
});

export const StyleSchema = z.object({
  id: z.string(),
  name: z.string(),
  core: z.string().includes('{landscape}'),
  negatives: z.object({ scene: z.string(), figure: z.string() }),
  sprite_background: z.string(),
  kinds: z.record(z.string(), KindSchema),
  palettes: z.record(z.string(), z.record(z.string(), hex)),
});

export type Style = z.infer<typeof StyleSchema>;
export type Kind = z.infer<typeof KindSchema>;
export type Output = z.infer<typeof OutputSchema>;

export function loadStyle(path = stylePath): Style {
  return StyleSchema.parse(parse(readFileSync(path, 'utf8')));
}

const tidy = (text: string) => text.replace(/\s+/g, ' ').trim();

/** The style block for a kind, with or without the "soft gradients only in the sky" clause. */
export function styleCore(style: Style, landscape: boolean): string {
  return tidy(
    style.core.replace('{landscape}', landscape ? 'soft gradients only in the sky, ' : ''),
  );
}

export interface PromptRequest {
  kind: string;
  subject: string;
  /** a follow-up is sent in the same Gemini chat as an earlier image, so its text is used as written */
  followUp?: boolean;
}

export function kindOf(style: Style, kind: string): Kind {
  const found = style.kinds[kind];
  if (!found) throw new Error(`jenis aset tidak dikenal: "${kind}" (lihat style.yaml)`);
  return found;
}

/** Returns the aspect ratio to select in Gemini and the full prompt text to type. */
export function composePrompt(
  style: Style,
  { kind, subject, followUp = false }: PromptRequest,
): { aspect: string; prompt: string } {
  const spec = kindOf(style, kind);
  if (followUp) return { aspect: spec.aspect, prompt: tidy(subject) };

  const parts = [styleCore(style, spec.landscape), style.negatives[spec.negative], subject];
  if (spec.extra) parts.push(spec.extra);
  if (spec.output.type === 'sprite') parts.push(style.sprite_background);
  return { aspect: spec.aspect, prompt: tidy(parts.join(' ')) };
}
