import { describe, expect, it } from 'vitest';
import { emptyState, migrate, withCodex } from './progressStore';

describe('migrate', () => {
  it('keeps stars and finished chapters from version 1 and starts the rest empty', () => {
    const v1 = { missionStars: { 'm1-banjir-nil': 2 }, completedChapters: ['mesir'] };
    expect(migrate(v1, 1)).toEqual({
      missionStars: { 'm1-banjir-nil': 2 },
      completedChapters: ['mesir'],
      codex: [],
      profile: null,
      mode: 'relaxed',
    });
  });

  it('keeps everything from the current version', () => {
    const saved = {
      missionStars: { a: 3 },
      completedChapters: [],
      codex: ['mesir/nilometer'],
      profile: { name: 'Sari', traveler: 'c' },
      mode: 'challenge',
    };
    expect(migrate(saved, 2)).toEqual(saved);
  });

  it('falls back to an empty state for unusable data', () => {
    expect(migrate(null, 1)).toEqual(emptyState());
    expect(migrate('rusak', 2)).toEqual(emptyState());
  });

  it('fills fields that are missing in an otherwise current save', () => {
    expect(migrate({ missionStars: {} }, 2)).toEqual(emptyState());
  });
});

describe('withCodex', () => {
  it('adds new entries once', () => {
    expect(withCodex(['mesir/nilometer'], ['mesir/hasta', 'mesir/nilometer'])).toEqual([
      'mesir/nilometer',
      'mesir/hasta',
    ]);
  });

  it('returns an equal list when nothing is new', () => {
    expect(withCodex(['a', 'b'], ['b'])).toEqual(['a', 'b']);
  });
});
