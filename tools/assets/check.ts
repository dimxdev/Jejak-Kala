// Validates every chapter manifest and makes sure approved assets have their shipped file.
//   bun run assets:check
// The raw images are not in git, so this only looks at the manifest and public/assets.

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadManifest, manifestProblems } from './manifest.ts';
import { assetsSrcDir, processedPath } from './paths.ts';
import { kindOf, loadStyle } from './style.ts';

export interface AssetsReport {
  problems: string[];
  counts: Record<string, number>;
}

export function checkAssets(): AssetsReport {
  const style = loadStyle();
  const report: AssetsReport = { problems: [], counts: { todo: 0, generated: 0, approved: 0 } };
  const chaptersDir = join(assetsSrcDir, 'chapters');
  if (!existsSync(chaptersDir)) return report;

  for (const entry of readdirSync(chaptersDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !existsSync(join(chaptersDir, entry.name, 'manifest.yaml')))
      continue;
    try {
      const manifest = loadManifest(entry.name);
      if (manifest.chapter !== entry.name) {
        report.problems.push(
          `${entry.name}: "chapter" di manifest (${manifest.chapter}) harus sama dengan nama folder`,
        );
      }
      report.problems.push(...manifestProblems(manifest, style).map((p) => `${entry.name}: ${p}`));
      for (const asset of manifest.assets) {
        report.counts[asset.status] = (report.counts[asset.status] ?? 0) + 1;
        const shipped = kindOf(style, asset.kind).output.type !== 'none';
        if (
          asset.status === 'approved' &&
          shipped &&
          !existsSync(processedPath(entry.name, asset.id))
        ) {
          report.problems.push(
            `${entry.name}/${asset.id}: sudah approved tetapi public/assets/${entry.name}/${asset.id}.webp belum dibuat (jalankan assets:build)`,
          );
        }
      }
    } catch (error) {
      report.problems.push(
        `${entry.name}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return report;
}

if (import.meta.main) {
  const report = checkAssets();
  for (const p of report.problems) console.error(`GALAT ${p}`);
  console.log(
    `aset: ${report.counts.approved} approved, ${report.counts.generated} generated, ${report.counts.todo} todo`,
  );
  if (report.problems.length > 0) process.exit(1);
}
