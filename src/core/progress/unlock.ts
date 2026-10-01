// Rules for what the player can open. Pure functions over plain data, so they are easy to test
// and the same rules work for the UI, the save system and the e2e bot.

import type { Chapter } from '../content/schema';

export interface Progress {
  /** mission id -> stars earned. Missing or 0 = not finished, 1 to 3 = finished. */
  missionStars: Record<string, number>;
  /** ids of chapters whose Ujian Zaman has been passed */
  completedChapters: string[];
}

export type ChapterStatus = 'locked' | 'available' | 'in-progress' | 'completed';

export const emptyProgress = (): Progress => ({ missionStars: {}, completedChapters: [] });

export function isMissionCompleted(progress: Progress, missionId: string): boolean {
  return (progress.missionStars[missionId] ?? 0) >= 1;
}

export function completedMissionCount(chapter: Chapter, progress: Progress): number {
  return chapter.missions.filter((m) => isMissionCompleted(progress, m.id)).length;
}

/** How many finished missions the exam needs. */
export function missionsNeededForExam(chapter: Chapter): number {
  return chapter.examRequires === 'all' ? chapter.missions.length : chapter.examRequires;
}

export function isChapterUnlocked(chapter: Chapter, progress: Progress): boolean {
  return chapter.requires.every((id) => progress.completedChapters.includes(id));
}

export function isExamUnlocked(chapter: Chapter, progress: Progress): boolean {
  return (
    isChapterUnlocked(chapter, progress) &&
    completedMissionCount(chapter, progress) >= missionsNeededForExam(chapter)
  );
}

export function chapterStatus(chapter: Chapter, progress: Progress): ChapterStatus {
  if (!isChapterUnlocked(chapter, progress)) return 'locked';
  if (progress.completedChapters.includes(chapter.id)) return 'completed';
  return completedMissionCount(chapter, progress) > 0 ? 'in-progress' : 'available';
}
