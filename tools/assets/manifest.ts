// The list of assets of one chapter: what each is, how it is prompted, and where it stands.
// assets-src/chapters/<chapter>/manifest.yaml

import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { z } from 'zod';
import { manifestPath } from './paths.ts';
import { ASPECTS, type Style } from './style.ts';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'harus kebab-case');

export const STATUSES = ['todo', 'generated', 'approved'] as const;

export const AssetSchema = z.object({
  id: slug,
  /** one of the kinds in style.yaml */
  kind: z.string(),
  /** the part of the prompt that changes per asset (English); the style block is added by the tool */
  subject: z.string().trim().min(1),
  /** only when it differs from the kind's default */
  aspect: z.enum(ASPECTS).optional(),
  followUp: z.boolean().default(false),
  /** raw image, relative to assets-src/ */
  file: z.string().optional(),
  /** todo = not made yet, generated = made but not reviewed, approved = reviewed and shipped */
  status: z.enum(STATUSES).default('todo'),
  /** Gemini chat to continue for follow-ups, so a character keeps the same look */
  chat: z.string().optional(),
  note: z.string().optional(),
});

export const ManifestSchema = z.object({
  chapter: slug,
  assets: z.array(AssetSchema),
});

export type Asset = z.infer<typeof AssetSchema>;
export type Manifest = z.infer<typeof ManifestSchema>;

export function loadManifest(chapter: string): Manifest {
  const path = manifestPath(chapter);
  if (!existsSync(path)) throw new Error(`manifest tidak ditemukan: ${path}`);
  return ManifestSchema.parse(parse(readFileSync(path, 'utf8')));
}

/** Problems that the schema alone cannot see (duplicates, unknown kinds, missing files). */
export function manifestProblems(manifest: Manifest, style: Style): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const asset of manifest.assets) {
    if (seen.has(asset.id)) problems.push(`id kembar: ${asset.id}`);
    seen.add(asset.id);
    if (!(asset.kind in style.kinds))
      problems.push(`${asset.id}: jenis tidak dikenal "${asset.kind}"`);
    if (asset.status !== 'todo' && !asset.file)
      problems.push(`${asset.id}: status ${asset.status} tetapi "file" kosong`);
  }
  return problems;
}
