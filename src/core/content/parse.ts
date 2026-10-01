import type { z } from 'zod';
import { type CodexFile, CodexFileSchema } from '../codex/schema';
import { type MissionContent, MissionContentSchema } from '../missions/schema';
import { type CharactersFile, CharactersFileSchema } from '../story/schema';
import { type Chapter, ChapterSchema } from './schema';

export class ContentError extends Error {
  readonly source: string;

  constructor(source: string, problems: string[]) {
    super(`${source}\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    this.name = 'ContentError';
    this.source = source;
  }
}

/** Validates raw data (parsed YAML) with a schema and returns it typed, or throws a readable ContentError. */
export function parseWith<S extends z.ZodType>(
  schema: S,
  raw: unknown,
  source: string,
): z.output<S> {
  const result = schema.safeParse(raw);
  if (result.success) return result.data;
  throw new ContentError(
    source,
    result.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
  );
}

export const parseChapter = (raw: unknown, source = 'chapter'): Chapter =>
  parseWith(ChapterSchema, raw, source);

export const parseMission = (raw: unknown, source = 'mission'): MissionContent =>
  parseWith(MissionContentSchema, raw, source);

export const parseCodex = (raw: unknown, source = 'codex'): CodexFile =>
  parseWith(CodexFileSchema, raw, source);

export const parseCharacters = (raw: unknown, source = 'characters'): CharactersFile =>
  parseWith(CharactersFileSchema, raw, source);
