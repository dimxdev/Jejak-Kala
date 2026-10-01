import { describe, expect, it } from 'vitest';
import {
  BLOCK_SIZE,
  overlaps,
  playerBox,
  SCORPION_SIZE,
  type ScorpionDef,
  type SwingerDef,
  scorpionAt,
  scorpionBox,
  shrink,
  swingAngle,
  swingerBox,
  swingerCenter,
  swingerCrossableShare,
} from './hazards';
import { PLAYER } from './physics';

const scorpion: ScorpionDef = { x1: 100, x2: 400, y: 500, speed: 100 };
const swinger: SwingerDef = { x: 600, y: 100, length: 300, amplitude: 50, period: 3, phase: 0 };

describe('boxes', () => {
  it('overlap only when they really share space (touching edges do not count)', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    expect(overlaps(a, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    expect(overlaps(a, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
    expect(overlaps(a, { x: 0, y: 10, w: 10, h: 10 })).toBe(false);
    expect(overlaps(a, { x: -20, y: 0, w: 10, h: 10 })).toBe(false);
  });

  it('puts the player box on his feet and shrinks evenly', () => {
    const box = playerBox(200, 500);
    expect(box).toEqual({
      x: 200 - PLAYER.width / 2,
      y: 500 - PLAYER.height,
      w: PLAYER.width,
      h: PLAYER.height,
    });
    expect(shrink({ x: 0, y: 0, w: 10, h: 10 }, 2)).toEqual({ x: 2, y: 2, w: 6, h: 6 });
  });
});

describe('scorpion patrol', () => {
  it('walks right, turns at the end and comes back, forever', () => {
    expect(scorpionAt(scorpion, 0)).toEqual({ x: 100, facing: 1 });
    expect(scorpionAt(scorpion, 1.5)).toEqual({ x: 250, facing: 1 });
    expect(scorpionAt(scorpion, 3)).toEqual({ x: 400, facing: 1 });
    expect(scorpionAt(scorpion, 4.5)).toEqual({ x: 250, facing: -1 });
    expect(scorpionAt(scorpion, 6).x).toBeCloseTo(100);
    expect(scorpionAt(scorpion, 6 + 1.5)).toEqual(scorpionAt(scorpion, 1.5));
  });

  it('never leaves its stretch of ledge', () => {
    for (let t = 0; t < 30; t += 0.37) {
      const { x } = scorpionAt(scorpion, t);
      expect(x).toBeGreaterThanOrEqual(scorpion.x1);
      expect(x).toBeLessThanOrEqual(scorpion.x2);
    }
  });

  it('stands on the ledge top', () => {
    const box = scorpionBox(scorpion, 0);
    expect(box.y + box.h).toBe(scorpion.y);
    expect(box.w).toBe(SCORPION_SIZE.w);
  });
});

describe('swinging block', () => {
  it('hangs straight down at the start and reaches the amplitude a quarter period later', () => {
    expect(swingAngle(swinger, 0)).toBeCloseTo(0);
    expect(swingAngle(swinger, 0.75)).toBeCloseTo((50 * Math.PI) / 180);
    expect(swingAngle(swinger, 2.25)).toBeCloseTo((-50 * Math.PI) / 180);
  });

  it('is at its lowest hanging straight down and rises towards the ends of the swing', () => {
    const bottom = swingerCenter(swinger, 0);
    expect(bottom).toEqual({ x: 600, y: 400 });
    expect(swingerCenter(swinger, 0.75).y).toBeLessThan(bottom.y);
  });

  it('starts at another point of the swing with a phase', () => {
    const shifted = { ...swinger, phase: 0.25 };
    expect(swingAngle(shifted, 0)).toBeCloseTo(swingAngle(swinger, 0.75));
  });

  it('keeps the rope length constant', () => {
    for (let t = 0; t < 6; t += 0.31) {
      const { x, y } = swingerCenter(swinger, t);
      expect(Math.hypot(x - swinger.x, y - swinger.y)).toBeCloseTo(swinger.length, 6);
    }
  });

  it('is a square block around the centre', () => {
    const box = swingerBox(swinger, 0);
    expect(box).toEqual({
      x: 600 - BLOCK_SIZE / 2,
      y: 400 - BLOCK_SIZE / 2,
      w: BLOCK_SIZE,
      h: BLOCK_SIZE,
    });
  });
});

describe('running through a swinging block', () => {
  // hanging straight down the block (centre y = 400) reaches the player; at the ends of the swing it is above his head
  const ground = 480;
  const fair = { ...swinger, amplitude: 55, period: 3.6 };

  it('leaves a window to run through for a swing that rises above his head', () => {
    const share = swingerCrossableShare(fair, ground);
    expect(share).toBeGreaterThan(0.2);
    expect(share).toBeLessThan(0.6);
  });

  it('leaves no window for a fast, wide swing', () => {
    expect(swingerCrossableShare({ ...fair, period: 2, amplitude: 78 }, ground)).toBe(0);
  });
});
