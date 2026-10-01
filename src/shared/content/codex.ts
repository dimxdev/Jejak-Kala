import type { CodexFile } from '@/core/codex/schema';
import { parseCodex } from '@/core/content/parse';

// The Kodeks of a chapter is loaded when it is needed (the Kodeks page, the end of a mission).
const loaders = import.meta.glob('@content/chapters/*/codex.yaml', { import: 'default' });

const chapterOf = (path: string): string | undefined =>
  path.match(/\/chapters\/([^/]+)\/codex\.yaml$/)?.[1];

/** The Kodeks of one chapter, or null when the chapter has none yet. */
export async function loadCodex(chapterId: string): Promise<CodexFile | null> {
  const path = Object.keys(loaders).find((p) => chapterOf(p) === chapterId);
  const load = path ? loaders[path] : undefined;
  if (!path || !load) return null;
  return parseCodex(await load(), path);
}

/** Every chapter's Kodeks, by chapter id. */
export async function loadAllCodex(): Promise<Record<string, CodexFile>> {
  const all: Record<string, CodexFile> = {};
  await Promise.all(
    Object.keys(loaders).map(async (path) => {
      const chapterId = chapterOf(path);
      const load = loaders[path];
      if (chapterId && load) all[chapterId] = parseCodex(await load(), path);
    }),
  );
  return all;
}
