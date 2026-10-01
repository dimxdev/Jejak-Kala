import type { Character } from '@/core/story/schema';

/** Who is shown for a line of dialogue: a name, what they are, and a picture if there is one. */
export interface Speaker {
  name: string | null;
  role: string | null;
  fictional: boolean;
  /** an asset reference like "mesir/meryt-happy", or null for the narrator */
  portrait: string | null;
}

/**
 * Turns the `who` and `mood` of a dialogue line into what the screen shows. "player" is the traveler the
 * player chose, "narrator" has no face, anyone else is looked up in content/characters.yaml (and falls
 * back to the neutral portrait when the mood has none).
 */
export function resolveSpeaker(
  characters: Readonly<Record<string, Character>>,
  who: string,
  mood: string,
  player: { name: string; portrait: string },
): Speaker {
  if (who === 'narrator') return { name: null, role: null, fictional: false, portrait: null };
  if (who === 'player') {
    return { name: player.name, role: null, fictional: false, portrait: player.portrait };
  }
  const character = characters[who];
  if (!character) return { name: who, role: null, fictional: false, portrait: null };
  return {
    name: character.name,
    role: character.role,
    fictional: character.fictional,
    portrait: character.portraits[mood] ?? character.portraits.neutral ?? null,
  };
}
