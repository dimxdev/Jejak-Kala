import { describe, expect, it } from 'vitest';
import {
  cornerGap,
  DEFAULT_TOLERANCE,
  GAUGE_MAX,
  GAUGE_MIN,
  GAUGE_STEP,
  gaugeOf,
  gaugeValue,
  isRightSeked,
  sekedOf,
  sekedSteps,
  slopeDegrees,
} from './seked';

// the three gates of mission 4
const model = { base: 28, height: 14 };
const rhind56 = { base: 360, height: 250 };
const greatPyramid = { base: 440, height: 280 };

describe('seked', () => {
  it('is 7 palms when the face rises as much as it runs', () => {
    expect(sekedOf(model)).toBe(7);
  });

  it('gives 5 1/25 palms for Rhind problem 56 (a base of 360 cubits and a height of 250)', () => {
    expect(sekedOf(rhind56)).toBeCloseTo(5 + 1 / 25, 10);
  });

  it('gives 5 1/2 palms for the proportions of the Great Pyramid', () => {
    expect(sekedOf(greatPyramid)).toBe(5.5);
  });

  it('lists the steps of the working', () => {
    const steps = sekedSteps(rhind56);
    expect(steps.halfBase).toBe(180);
    expect(steps.ratio).toBeCloseTo(0.72, 10); // 1/2 + 1/5 + 1/50 of a cubit, as the papyrus writes it
    expect(steps.palms).toBeCloseTo(5.04, 10);
  });

  it('gets a smaller seked, a steeper face, from a taller pyramid', () => {
    expect(sekedOf({ base: 440, height: 300 })).toBeLessThan(sekedOf(greatPyramid));
  });
});

describe('gauge', () => {
  it('counts palms and fingers (4 fingers to a palm)', () => {
    expect(gaugeValue({ palms: 5, fingers: 2 })).toBe(5.5);
    expect(gaugeValue({ palms: 7, fingers: 0 })).toBe(7);
  });

  it('turns a value into the nearest setting', () => {
    expect(gaugeOf(5.5)).toEqual({ palms: 5, fingers: 2 });
    expect(gaugeOf(5.04)).toEqual({ palms: 5, fingers: 0 });
    expect(gaugeOf(5.9)).toEqual({ palms: 6, fingers: 0 }); // 5 palms and 4 fingers is 6 palms
    expect(gaugeOf(7)).toEqual({ palms: 7, fingers: 0 });
  });

  it('has settings that round-trip', () => {
    for (let value = GAUGE_MIN; value <= GAUGE_MAX; value += GAUGE_STEP) {
      expect(gaugeValue(gaugeOf(value))).toBeCloseTo(value, 10);
    }
  });
});

describe('checking an answer', () => {
  it('accepts the nearest setting of the gauge', () => {
    expect(isRightSeked(7, model)).toBe(true);
    expect(isRightSeked(5, rhind56)).toBe(true); // 5 palms is the nearest to 5 1/25
    expect(isRightSeked(5.5, greatPyramid)).toBe(true);
  });

  it('rejects the neighbouring settings, a finger away', () => {
    expect(isRightSeked(5.25, rhind56)).toBe(false);
    expect(isRightSeked(4.75, rhind56)).toBe(false);
    expect(isRightSeked(5.25, greatPyramid)).toBe(false);
    expect(isRightSeked(5.75, greatPyramid)).toBe(false);
    expect(isRightSeked(6.75, model)).toBe(false);
  });

  it('is never ambiguous: every gate has exactly one right setting on the gauge', () => {
    for (const problem of [model, rhind56, greatPyramid]) {
      const right: number[] = [];
      for (let value = GAUGE_MIN; value <= GAUGE_MAX; value += GAUGE_STEP) {
        if (isRightSeked(value, problem)) right.push(value);
      }
      expect(right, JSON.stringify(problem)).toHaveLength(1);
    }
  });

  it('keeps the tolerance at half a finger', () => {
    expect(DEFAULT_TOLERANCE).toBe(GAUGE_STEP / 2);
  });
});

describe('the corner gap (how far a trial slope misses the corner)', () => {
  it('is zero for the exact seked', () => {
    expect(cornerGap(greatPyramid, 5.5)).toBeCloseTo(0, 10);
  });

  it('is negative for a face that is too steep and positive for one that is too flat', () => {
    expect(cornerGap(greatPyramid, 5)).toBeLessThan(0);
    expect(cornerGap(greatPyramid, 6)).toBeGreaterThan(0);
  });

  it('grows with every finger by the same amount', () => {
    const one = cornerGap(greatPyramid, 5.75) - cornerGap(greatPyramid, 5.5);
    const two = cornerGap(greatPyramid, 6) - cornerGap(greatPyramid, 5.75);
    expect(one).toBeCloseTo(two, 10);
    expect(one).toBeCloseTo((280 * 0.25) / 7, 10); // 10 cubits per finger
  });
});

describe('slope angle', () => {
  it('is 45 degrees at a seked of 7 palms', () => {
    expect(slopeDegrees(7)).toBeCloseTo(45, 6);
  });

  it('is about 51.8 degrees for the Great Pyramid (5 1/2 palms)', () => {
    expect(slopeDegrees(5.5)).toBeCloseTo(51.85, 1);
  });
});
