// The contract between the Phaser side (this folder) and the React side (features/missions/pyramid-climb).
// The scene never touches React: it calls `ClimbEvents` when something happens, and React drives it
// through the `ClimbHandle`. Keyboard and touch buttons are read by React and passed in as `setInput`.

import type { ClimbArt, PyramidClimbParams } from '@/core/missions/pyramid-climb/schema';

/** What the player is asking Hemiunu to do right now. */
export interface ClimbInput {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export const NO_INPUT: ClimbInput = { left: false, right: false, jump: false };

export interface ClimbConfig {
  params: PyramidClimbParams;
  /** picture address for every key in `params.art`, already resolved by the caller */
  images: Record<keyof ClimbArt, string>;
  /** scorpions and swinging blocks (Tantangan) */
  hazards: boolean;
  /** calm the idle and walking motion */
  reducedMotion: boolean;
}

/** Things that happen in the game, reported to the page. */
export interface ClimbEvents {
  /** the player walked up to gate `index` (0, 1 or 2); the scene waits until `openGate` or `backOff` */
  onGate(index: number): void;
  /** a golden cubit rod was collected: `count` of them so far */
  onRod(count: number): void;
  /** the player reached the capstone after all three gates */
  onSummit(): void;
  /** how far along the climb the player is, 0 to 1 (a few times per second) */
  onProgress(fraction: number): void;
  /** seconds of play so far, once per second */
  onTick(seconds: number): void;
  /** a hazard hit the player, who starts again from the last checkpoint */
  onHit(): void;
}

/** What the page can do to the running game. */
export interface ClimbHandle {
  setInput(input: ClimbInput): void;
  /** stop everything while a panel or a dialogue is on top */
  setPaused(paused: boolean): void;
  /** the question at gate `index` was answered: the gate opens and the way on is free */
  openGate(index: number): void;
  /** the player does not want to answer yet: he steps back from gate `index` */
  backOff(index: number): void;
  /** go straight to the next gate (or the capstone after the last one) */
  skip(): void;
  destroy(): void;
}
