// The hazards of the Tantangan mode: scorpions that patrol a ledge and stone blocks that swing on ropes.
// Where each one is depends only on the time, so the scene just asks "where is it now?" and the tests can
// check that every hazard leaves the player a safe moment.

import { PLAYER } from './physics';

/** A box with its top-left corner at (x, y). */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** The player's box when he stands with his feet at (x, y). */
export function playerBox(x: number, y: number): Box {
  return { x: x - PLAYER.width / 2, y: y - PLAYER.height, w: PLAYER.width, h: PLAYER.height };
}

/** A box made smaller on every side: hazards hurt only when they clearly touch. */
export function shrink(box: Box, by: number): Box {
  return { x: box.x + by, y: box.y + by, w: box.w - 2 * by, h: box.h - 2 * by };
}

// ---- scorpions ----

export interface ScorpionDef {
  /** the patrol runs between these two x on the ledge top at `y` */
  x1: number;
  x2: number;
  y: number;
  /** px per second */
  speed: number;
}

export const SCORPION_SIZE = { w: 76, h: 44 } as const;

/** Where the scorpion is at time `t` (seconds), and which way it faces (1 right, -1 left). */
export function scorpionAt(def: ScorpionDef, t: number): { x: number; facing: 1 | -1 } {
  const length = def.x2 - def.x1;
  const lap = (2 * length) / def.speed;
  const phase = (((t % lap) + lap) % lap) * def.speed; // 0 .. 2 * length
  return phase <= length
    ? { x: def.x1 + phase, facing: 1 }
    : { x: def.x2 - (phase - length), facing: -1 };
}

export function scorpionBox(def: ScorpionDef, t: number): Box {
  const { x } = scorpionAt(def, t);
  return { x: x - SCORPION_SIZE.w / 2, y: def.y - SCORPION_SIZE.h, ...SCORPION_SIZE };
}

// ---- swinging blocks ----

export interface SwingerDef {
  /** the rope hangs from (x, y) */
  x: number;
  y: number;
  /** rope length in px */
  length: number;
  /** the largest angle from straight down, in degrees */
  amplitude: number;
  /** seconds for one full swing there and back */
  period: number;
  /** where in the swing it starts, as a share of the period (0 to 1) */
  phase: number;
}

export const BLOCK_SIZE = 84;

/** The angle of the rope from straight down at time `t`, in radians (positive: to the right). */
export function swingAngle(def: SwingerDef, t: number): number {
  const amplitude = (def.amplitude * Math.PI) / 180;
  return amplitude * Math.sin(2 * Math.PI * (t / def.period + def.phase));
}

/** The centre of the block at time `t`. */
export function swingerCenter(def: SwingerDef, t: number): { x: number; y: number } {
  const angle = swingAngle(def, t);
  return { x: def.x + def.length * Math.sin(angle), y: def.y + def.length * Math.cos(angle) };
}

export function swingerBox(def: SwingerDef, t: number): Box {
  const { x, y } = swingerCenter(def, t);
  return { x: x - BLOCK_SIZE / 2, y: y - BLOCK_SIZE / 2, w: BLOCK_SIZE, h: BLOCK_SIZE };
}

/**
 * The share of start moments (0 to 1) at which a player running straight through the whole swing zone at
 * full speed is not hit. A level is fair only if there is a real window to run through.
 */
export function swingerCrossableShare(def: SwingerDef, ground: number): number {
  const radians = (def.amplitude * Math.PI) / 180;
  const reach = def.length * Math.sin(radians) + BLOCK_SIZE / 2 + PLAYER.width / 2;
  const from = def.x - reach - 20;
  const to = def.x + reach + 20;
  const duration = (to - from) / PLAYER.speed;
  const starts = Math.round(def.period / 0.02);
  let clear = 0;
  for (let s = 0; s < starts; s++) {
    const begin = s * 0.02;
    let hit = false;
    for (let t = 0; t <= duration && !hit; t += 1 / 60) {
      const player = shrink(playerBox(from + PLAYER.speed * t, ground), 6);
      hit = overlaps(player, shrink(swingerBox(def, begin + t), 10));
    }
    if (!hit) clear++;
  }
  return clear / starts;
}
