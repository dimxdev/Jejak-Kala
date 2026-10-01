import { parseChapter } from '@/core/content/parse';
import type { Chapter } from '@/core/content/schema';
import { compareYears } from '@/core/years';

// Chapter metadata is small, so every chapter.yaml is bundled and validated once at start-up.
// Heavier per-chapter content (mission data, codex) will be loaded lazily when a chapter is opened.
const modules = import.meta.glob('@content/chapters/*/chapter.yaml', {
  eager: true,
  import: 'default',
});

/** All chapters, oldest first. */
export const chapters: readonly Chapter[] = Object.entries(modules)
  .map(([path, raw]) => parseChapter(raw, path))
  .sort((a, b) => compareYears(a.years.start, b.years.start));

export function getChapter(id: string | undefined): Chapter | undefined {
  return chapters.find((chapter) => chapter.id === id);
}
