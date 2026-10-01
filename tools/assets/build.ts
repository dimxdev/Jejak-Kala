// Processes the raw images of a chapter into public/assets/<chapter>/<id>.webp.
//   bun run assets:build mesir                  approved assets that are out of date
//   bun run assets:build mesir --only m1-bg-akhet,banner
//   bun run assets:build mesir --include-generated   also preview assets that are not reviewed yet
//   bun run assets:build mesir --force          rebuild everything

import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { loadManifest, manifestProblems } from './manifest.ts';
import { assetsSrcDir, processedPath, stylePath } from './paths.ts';
import { processFit, processSprite } from './pipeline.ts';
import { kindOf, loadStyle } from './style.ts';

const args = process.argv.slice(2);
const chapter = args.find((a) => !a.startsWith('--'));
if (!chapter) {
  console.error('pakai: bun run assets:build <bab> [--only id,id] [--include-generated] [--force]');
  process.exit(1);
}
const only = args.includes('--only')
  ? new Set((args[args.indexOf('--only') + 1] ?? '').split(','))
  : null;
const includeGenerated = args.includes('--include-generated');
const force = args.includes('--force');

const style = loadStyle();
const manifest = loadManifest(chapter);
const problems = manifestProblems(manifest, style);
if (problems.length > 0) {
  for (const p of problems) console.error(`GALAT ${p}`);
  process.exit(1);
}

const styleTime = statSync(stylePath).mtimeMs;
let built = 0;
let failed = 0;
let totalBytes = 0;

for (const asset of manifest.assets) {
  if (only && !only.has(asset.id)) continue;
  const shipped = asset.status === 'approved' || (includeGenerated && asset.status === 'generated');
  if (!shipped) continue;

  const output = kindOf(style, asset.kind).output;
  if (output.type === 'none') continue;

  const src = join(assetsSrcDir, asset.file ?? '');
  const out = processedPath(chapter, asset.id);
  if (!existsSync(src)) {
    console.log(`miss  ${asset.id}  (berkas mentah tidak ada: ${asset.file})`);
    if (!existsSync(out)) failed++;
    continue;
  }
  if (
    !force &&
    existsSync(out) &&
    statSync(out).mtimeMs > Math.max(statSync(src).mtimeMs, styleTime)
  ) {
    console.log(`skip  ${asset.id}  (sudah terbaru)`);
    continue;
  }

  try {
    const done =
      output.type === 'sprite'
        ? await processSprite(src, out, output)
        : await processFit(src, out, output);
    totalBytes += done.bytes;
    built++;
    console.log(
      `ok    ${asset.id.padEnd(22)} ${asset.kind.padEnd(12)} ${`${done.width}x${done.height}`.padEnd(10)} ${(done.bytes / 1024).toFixed(0).padStart(4)} KB`,
    );
  } catch (error) {
    failed++;
    console.error(`GALAT ${asset.id}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log(`\n${built} dibuat (${(totalBytes / 1024).toFixed(0)} KB), ${failed} gagal.`);
if (failed > 0) process.exit(1);
