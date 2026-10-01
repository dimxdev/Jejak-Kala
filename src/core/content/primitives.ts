// Small building blocks shared by every content schema.

import { z } from 'zod';

/** An id or file name part: lower-case words joined by hyphens. */
export const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'harus huruf kecil, angka, dan tanda hubung (kebab-case)');

/** Text shown to the player: must not be empty. */
export const text = z.string().trim().min(1, 'tidak boleh kosong');

/**
 * A picture shipped with the app, written "<scope>/<id>": scope is a chapter id or "shared", id is the
 * asset id from assets-src/chapters/<scope>/manifest.yaml. `bun run content:check` makes sure it exists.
 */
export const assetRef = z
  .string()
  .regex(/^[a-z0-9-]+\/[a-z0-9-]+$/, 'harus berbentuk "<bab>/<id-aset>", mis. mesir/banner');
