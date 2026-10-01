import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const assetsSrcDir = join(root, 'assets-src');
export const publicAssetsDir = join(root, 'public', 'assets');
export const stylePath = join(assetsSrcDir, 'style', 'style.yaml');

export const manifestPath = (chapter: string) =>
  join(assetsSrcDir, 'chapters', chapter, 'manifest.yaml');
export const processedPath = (chapter: string, id: string) =>
  join(publicAssetsDir, chapter, `${id}.webp`);
