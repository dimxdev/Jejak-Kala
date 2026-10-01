import { expect, type Page } from '@playwright/test';

export const STORAGE_KEY = 'petualangan-sejarah:progress';

export interface SeedState {
  missionStars?: Record<string, number>;
  completedChapters?: string[];
  codex?: string[];
  profile?: { name: string; traveler: 'a' | 'b' | 'c' } | null;
  mode?: 'relaxed' | 'challenge';
}

/**
 * Saves a player (name, traveler, progress) before the page loads, as if they had played before. It only
 * writes when nothing is saved yet, so a reload during a test keeps what the game saved in between.
 */
export async function seed(page: Page, state: SeedState = {}): Promise<void> {
  const value = {
    missionStars: {},
    completedChapters: [],
    codex: [],
    profile: { name: 'Sari', traveler: 'a' },
    mode: 'relaxed',
    ...state,
  };
  await page.addInitScript(
    ({ key, saved }) => {
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, JSON.stringify({ state: saved, version: 2 }));
      }
    },
    { key: STORAGE_KEY, saved: value },
  );
}

/** Plays a dialogue scene to its end by pressing Lanjut / Selesai once per line. */
export async function finishScene(page: Page): Promise<void> {
  const counter = page.getByText(/^\d+ dari \d+$/).first();
  await expect(counter).toBeVisible();
  const total = Number(((await counter.textContent()) ?? '').split(' dari ')[1]);
  for (let line = 0; line < total; line++) {
    await page.getByRole('button', { name: /^(Lanjut|Selesai)$/ }).click();
  }
}
