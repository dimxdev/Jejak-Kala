import { describe, expect, it } from 'vitest';
import type { Chapter, Mission } from '../content/schema';
import {
  chapterStatus,
  emptyProgress,
  isChapterUnlocked,
  isExamUnlocked,
  isMissionCompleted,
  missionsNeededForExam,
} from './unlock';

const mission = (id: string): Mission => ({
  id,
  type: 'math-puzzle',
  title: id,
  summary: id,
  place: 'Tempat',
  years: [],
  workload: 'light',
  perspective: { name: 'Tokoh', role: 'Peran', fictional: true },
});

const chapter = (id: string, overrides: Partial<Chapter> = {}): Chapter => ({
  id,
  track: 'world',
  title: id,
  tagline: id,
  region: 'Wilayah',
  theme: 'mesir',
  years: { start: -3100, end: -30, approximate: true, verify: false },
  map: { x: 50, y: 50 },
  requires: [],
  examRequires: 'all',
  missions: [mission('a'), mission('b'), mission('c')],
  exam: { ...mission('ujian'), type: 'boss' },
  ...overrides,
});

describe('missions', () => {
  it('count as finished from 1 star', () => {
    const progress = { ...emptyProgress(), missionStars: { a: 1, b: 0 } };
    expect(isMissionCompleted(progress, 'a')).toBe(true);
    expect(isMissionCompleted(progress, 'b')).toBe(false);
    expect(isMissionCompleted(progress, 'c')).toBe(false);
  });
});

describe('the exam', () => {
  it('needs every mission when examRequires is "all"', () => {
    const c = chapter('mesir');
    expect(missionsNeededForExam(c)).toBe(3);
    expect(isExamUnlocked(c, { ...emptyProgress(), missionStars: { a: 1, b: 3 } })).toBe(false);
    expect(isExamUnlocked(c, { ...emptyProgress(), missionStars: { a: 1, b: 3, c: 2 } })).toBe(
      true,
    );
  });

  it('needs only the given number when examRequires is a number', () => {
    const c = chapter('mesir', { examRequires: 2 });
    expect(isExamUnlocked(c, { ...emptyProgress(), missionStars: { a: 1, c: 1 } })).toBe(true);
  });

  it('stays locked while the chapter itself is locked', () => {
    const c = chapter('yunani', { requires: ['mesir'] });
    const progress = { ...emptyProgress(), missionStars: { a: 1, b: 1, c: 1 } };
    expect(isExamUnlocked(c, progress)).toBe(false);
  });
});

describe('chapters', () => {
  const mesir = chapter('mesir');
  const next = chapter('yunani', { requires: ['mesir'] });

  it('are locked until the required chapters are completed', () => {
    expect(isChapterUnlocked(next, emptyProgress())).toBe(false);
    expect(isChapterUnlocked(next, { ...emptyProgress(), completedChapters: ['mesir'] })).toBe(
      true,
    );
  });

  it('report their status', () => {
    expect(chapterStatus(mesir, emptyProgress())).toBe('available');
    expect(chapterStatus(mesir, { ...emptyProgress(), missionStars: { a: 2 } })).toBe(
      'in-progress',
    );
    expect(chapterStatus(mesir, { ...emptyProgress(), completedChapters: ['mesir'] })).toBe(
      'completed',
    );
    expect(chapterStatus(next, emptyProgress())).toBe('locked');
  });
});
