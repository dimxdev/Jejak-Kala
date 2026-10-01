// Enforces the folder rules from docs/architecture.md so they cannot rot silently.

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../', import.meta.url));
const srcDir = join(root, 'src');
const toPosix = (p: string) => p.replaceAll('\\', '/');

const IMPORT_RE =
  /(?:^|\n)\s*(?:import|export)\s[^'"`]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g;

interface Import {
  file: string; // path relative to src, posix
  spec: string; // as written
  target: string | null; // resolved path relative to src, posix; null for packages
  pkg: string | null; // package name for bare imports
}

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && /\.(ts|tsx)$/.test(e.name) && !e.name.endsWith('.d.ts'))
    .map((e) => join(e.parentPath, e.name));
}

function importsOf(absFile: string): Import[] {
  const file = toPosix(relative(srcDir, absFile));
  const text = readFileSync(absFile, 'utf8');
  const found: Import[] = [];
  for (const match of text.matchAll(IMPORT_RE)) {
    const spec = match[1] ?? match[2] ?? match[3];
    if (!spec) continue;
    if (spec.startsWith('.')) {
      found.push({
        file,
        spec,
        target: toPosix(relative(srcDir, resolve(dirname(absFile), spec))),
        pkg: null,
      });
    } else if (spec.startsWith('@/')) {
      found.push({ file, spec, target: spec.slice(2), pkg: null });
    } else if (spec.startsWith('@content/')) {
      found.push({ file, spec, target: null, pkg: '@content' });
    } else {
      const parts = spec.split('/');
      const pkg = spec.startsWith('@') ? parts.slice(0, 2).join('/') : (parts[0] ?? spec);
      found.push({ file, spec, target: null, pkg });
    }
  }
  return found;
}

const all = listSourceFiles(srcDir).flatMap(importsOf);
const isTest = (file: string) => /\.test\.tsx?$/.test(file);
const layer = (path: string) => path.split('/')[0] ?? '';
const feature = (path: string) => (layer(path) === 'features' ? path.split('/')[1] : undefined);

const violations: string[] = [];
const report = (i: Import, why: string) => violations.push(`${i.file}: import "${i.spec}" ${why}`);

for (const i of all) {
  const from = layer(i.file);
  const to = i.target ? layer(i.target) : null;

  // core: pure TypeScript. Only zod, only relative imports inside core.
  if (from === 'core') {
    if (i.pkg && !['zod', 'vitest'].includes(i.pkg)) report(i, 'tidak boleh di core (hanya zod)');
    if (i.pkg && i.pkg === 'vitest' && !isTest(i.file)) report(i, 'hanya untuk berkas tes');
    if (i.spec.startsWith('@/')) report(i, 'core memakai import relatif, bukan alias');
    if (i.target && layer(i.target) !== 'core')
      report(i, 'core tidak boleh mengimpor di luar core');
  }

  // game (Phaser): no React, no UI layers.
  if (from === 'game') {
    if (i.pkg?.startsWith('react')) report(i, 'game tidak boleh memakai React');
    if (to === 'features' || to === 'app') report(i, 'game tidak boleh mengimpor features/app');
  }

  // shared: generic building blocks, below features and app.
  if (from === 'shared' && (to === 'features' || to === 'app' || to === 'game')) {
    report(i, 'shared tidak boleh mengimpor features/app/game');
  }

  // features: never app; other features only through their index.
  if (from === 'features') {
    if (to === 'app') report(i, 'features tidak boleh mengimpor app');
    const here = feature(i.file);
    const there = i.target ? feature(i.target) : undefined;
    if (there && there !== here) {
      const depth = (i.target ?? '').split('/').length;
      if (depth > 2) report(i, `impor ke dalam feature "${there}": pakai @/features/${there}`);
    }
  }
}

describe('arsitektur folder', () => {
  it('menemukan berkas sumber untuk diperiksa', () => {
    expect(all.length).toBeGreaterThan(0);
  });

  it('tidak ada pelanggaran aturan dependensi', () => {
    expect(violations).toEqual([]);
  });
});
