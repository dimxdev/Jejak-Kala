import { describe, expect, it } from 'vitest';
import type { Character } from '@/core/story/schema';
import { resolveSpeaker } from './speakers';

const characters: Record<string, Character> = {
  meryt: {
    name: 'Meryt',
    role: 'Petani tepi Nil',
    fictional: true,
    portraits: { neutral: 'mesir/meryt-neutral', happy: 'mesir/meryt-happy' },
  },
};
const player = { name: 'Sari', portrait: 'shared/traveler-b' };

describe('resolveSpeaker', () => {
  it('finds the portrait for the mood', () => {
    expect(resolveSpeaker(characters, 'meryt', 'happy', player).portrait).toBe('mesir/meryt-happy');
  });

  it('falls back to the neutral portrait when the mood has none', () => {
    expect(resolveSpeaker(characters, 'meryt', 'angry', player).portrait).toBe(
      'mesir/meryt-neutral',
    );
  });

  it('shows the traveler the player chose', () => {
    expect(resolveSpeaker(characters, 'player', 'neutral', player)).toEqual({
      name: 'Sari',
      role: null,
      fictional: false,
      portrait: 'shared/traveler-b',
    });
  });

  it('gives the narrator no face and no name', () => {
    const narrator = resolveSpeaker(characters, 'narrator', 'neutral', player);
    expect(narrator.name).toBeNull();
    expect(narrator.portrait).toBeNull();
  });

  it('shows an unknown speaker by id rather than failing', () => {
    expect(resolveSpeaker(characters, 'tamu', 'neutral', player).name).toBe('tamu');
  });

  it('says when a character is invented', () => {
    expect(resolveSpeaker(characters, 'meryt', 'neutral', player).fictional).toBe(true);
  });
});
