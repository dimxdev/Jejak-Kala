import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { Profile } from '@/core/progress/profile';
import { emptyProgress, type Progress } from '@/core/progress/unlock';

/** How a mission is played: Santai shows helpers, Tantangan shows raw numbers (docs/PLAN.md). */
export type Mode = 'relaxed' | 'challenge';

/** Everything saved on the device. Bump STORE_VERSION and extend `migrate` when this changes. */
export interface SavedState extends Progress {
  /** unlocked Kodeks entries, as "<chapter>/<entry>" (see codexKey) */
  codex: string[];
  /** null until the player has chosen a name and a traveler */
  profile: Profile | null;
  mode: Mode;
}

interface ProgressActions {
  completeMission: (missionId: string, stars: 1 | 2 | 3) => void;
  completeChapter: (chapterId: string) => void;
  unlockCodex: (keys: readonly string[]) => void;
  setProfile: (profile: Profile) => void;
  setMode: (mode: Mode) => void;
  reset: () => void;
}

export const STORE_VERSION = 2;

export const emptyState = (): SavedState => ({
  ...emptyProgress(),
  codex: [],
  profile: null,
  mode: 'relaxed',
});

/**
 * Brings saved data from an older version up to the current shape. Version 1 only knew mission stars and
 * finished chapters; everything added since starts empty.
 */
export function migrate(saved: unknown, fromVersion: number): SavedState {
  const base = emptyState();
  if (typeof saved !== 'object' || saved === null) return base;
  const old = saved as Partial<SavedState>;
  return {
    ...base,
    missionStars: old.missionStars ?? base.missionStars,
    completedChapters: old.completedChapters ?? base.completedChapters,
    ...(fromVersion >= 2
      ? { codex: old.codex ?? [], profile: old.profile ?? null, mode: old.mode ?? 'relaxed' }
      : {}),
  };
}

/** Pure version of the "unlock these entries" action, so it can be tested without a store. */
export const withCodex = (current: readonly string[], keys: readonly string[]): string[] => {
  const merged = new Set([...current, ...keys]);
  return merged.size === current.length ? [...current] : [...merged];
};

// Saved in localStorage for now. Moving to IndexedDB later only means changing `storage` here.
export const useProgressStore = create<SavedState & ProgressActions>()(
  persist(
    (set) => ({
      ...emptyState(),
      completeMission: (missionId, stars) =>
        set((state) => ({
          missionStars: {
            ...state.missionStars,
            [missionId]: Math.max(stars, state.missionStars[missionId] ?? 0),
          },
        })),
      completeChapter: (chapterId) =>
        set((state) =>
          state.completedChapters.includes(chapterId)
            ? state
            : { completedChapters: [...state.completedChapters, chapterId] },
        ),
      unlockCodex: (keys) => set((state) => ({ codex: withCodex(state.codex, keys) })),
      setProfile: (profile) => set({ profile }),
      setMode: (mode) => set({ mode }),
      reset: () => set(emptyState()),
    }),
    {
      name: 'petualangan-sejarah:progress',
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ missionStars, completedChapters, codex, profile, mode }) => ({
        missionStars,
        completedChapters,
        codex,
        profile,
        mode,
      }),
      migrate: (saved, fromVersion) => migrate(saved, fromVersion),
    },
  ),
);

/** The player's progress as plain data, ready for the rules in core/progress. */
export function useProgress(): Progress {
  return useProgressStore(
    useShallow(({ missionStars, completedChapters }) => ({ missionStars, completedChapters })),
  );
}
