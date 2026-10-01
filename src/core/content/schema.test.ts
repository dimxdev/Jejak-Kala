import { describe, expect, it } from 'vitest';
import { ContentError, parseChapter } from './parse';

const mission = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  type: 'math-puzzle',
  title: 'Judul',
  summary: 'Ringkasan',
  place: 'Tempat',
  years: [{ start: -2500, approximate: true }],
  workload: 'light',
  perspective: { name: 'Meryt', role: 'Petani', fictional: true },
  ...extra,
});

const validChapter = () => ({
  id: 'mesir',
  track: 'world',
  title: 'Mesir Kuno',
  tagline: 'Tagline',
  region: 'Lembah Nil',
  theme: 'mesir',
  years: { start: -3100, end: -30, approximate: true },
  map: { x: 58, y: 54 },
  missions: [mission('m1'), mission('m2')],
  exam: mission('ujian', { type: 'boss', years: [] }),
});

describe('parseChapter', () => {
  it('accepts a valid chapter and fills in defaults', () => {
    const chapter = parseChapter(validChapter());
    expect(chapter.requires).toEqual([]);
    expect(chapter.examRequires).toBe('all');
    expect(chapter.years.verify).toBe(false);
  });

  it('rejects the non-existent year 0', () => {
    const raw = validChapter();
    raw.years = { start: 0, end: -30, approximate: true };
    expect(() => parseChapter(raw, 'mesir/chapter.yaml')).toThrow(/tahun 0 tidak ada/);
  });

  it('rejects an end year before the start year', () => {
    const raw = validChapter();
    raw.years = { start: -30, end: -3100, approximate: true };
    expect(() => parseChapter(raw)).toThrow(/tahun akhir/);
  });

  it('rejects duplicate mission ids, including the exam id', () => {
    const raw = validChapter();
    raw.missions = [mission('m1'), mission('m1')];
    expect(() => parseChapter(raw)).toThrow(/id misi kembar/);
    const raw2 = validChapter();
    raw2.exam = mission('m1', { type: 'boss', years: [] });
    expect(() => parseChapter(raw2)).toThrow(/id misi kembar/);
  });

  it('requires the exam to be a boss mission', () => {
    const raw = validChapter();
    raw.exam = mission('ujian');
    expect(() => parseChapter(raw)).toThrow(/ujian harus bertipe boss/);
  });

  it('rejects ids that are not kebab-case', () => {
    const raw = validChapter();
    raw.id = 'Mesir Kuno';
    expect(() => parseChapter(raw)).toThrow(ContentError);
  });

  it('rejects an examRequires larger than the number of missions', () => {
    const raw = { ...validChapter(), examRequires: 9 };
    expect(() => parseChapter(raw)).toThrow(/jumlah misi/);
  });

  it('names the file and the field that is wrong', () => {
    const raw = validChapter();
    raw.title = '';
    try {
      parseChapter(raw, 'mesir/chapter.yaml');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ContentError);
      expect((error as Error).message).toContain('mesir/chapter.yaml');
      expect((error as Error).message).toContain('title');
    }
  });
});
