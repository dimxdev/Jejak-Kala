import raw from '@content/characters.yaml';
import { parseCharacters } from '@/core/content/parse';
import type { Character } from '@/core/story/schema';

// The cast is small, so it is bundled and validated once at start-up.
export const characters: Readonly<Record<string, Character>> = parseCharacters(
  raw,
  'content/characters.yaml',
).characters;
