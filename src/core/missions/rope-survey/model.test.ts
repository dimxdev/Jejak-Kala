import { describe, expect, it } from 'vitest';
import {
  circleError,
  circleSteps,
  egyptianCircleArea,
  impliedPi,
  isCornerC,
  isCornerD,
  isRight,
  modernCircleArea,
  parseAnswer,
  plotArea,
  plotStakes,
  readRope,
  ropeLength,
  squaredDistance,
  starsFor,
  triangleArea,
} from './model';
import { testParams as params } from './model.fixture';
import { type Point, RopeSurveyParamsSchema } from './schema';

describe('distances', () => {
  it('measures whole knots only when the distance is whole', () => {
    expect(ropeLength([0, 0], [3, 4])).toBe(5);
    expect(ropeLength([0, 0], [0, 7])).toBe(7);
    expect(ropeLength([0, 0], [1, 1])).toBeNull(); // the square root of 2
    expect(squaredDistance([1, 1], [4, 5])).toBe(25);
  });
});

describe('the plot', () => {
  it('has A and B given and C and D to be set', () => {
    expect(plotStakes(params)).toEqual({ a: [1, 1], b: [5, 1], c: [1, 4], d: [5, 4] });
  });

  it('is 12 setat', () => {
    expect(plotArea(params)).toBe(12);
  });
});

describe('the rope', () => {
  it('shows the 3-4-5 triangle when stake C is in the right place', () => {
    const reading = readRope(params, [1, 4]);
    expect(reading.ab).toBe(4);
    expect(reading.ac).toBe(3);
    expect(reading.bc).toBe(5);
    expect(reading.used).toBe(12);
    expect(reading.rightAtA).toBe(true);
  });

  it('uses all twelve knots only for the right triangle among the spots on the grid', () => {
    const withTwelve: Point[] = [];
    const rightAngle: Point[] = [];
    for (let x = 0; x <= params.grid.width; x++) {
      for (let y = 0; y <= params.grid.height; y++) {
        const reading = readRope(params, [x, y]);
        if (reading.used === params.rope.knots) withTwelve.push([x, y]);
        if (reading.rightAtA && reading.bc !== null && reading.ac !== null) rightAngle.push([x, y]);
      }
    }
    // exactly one spot in the grid closes a 12-knot triangle with the right angle at A
    const both = withTwelve.filter((p) => rightAngle.some((q) => q[0] === p[0] && q[1] === p[1]));
    expect(both).toEqual([[1, 4]]);
  });

  it('reports distances that are not whole knots', () => {
    const reading = readRope(params, [2, 2]);
    expect(reading.ac).toBeNull(); // sqrt(2)
    expect(reading.exact.ac).toBeCloseTo(Math.SQRT2, 5);
    expect(reading.used).toBeNull();
    expect(reading.rightAtA).toBe(false);
  });

  it('does not call a stake on top of A a right angle', () => {
    expect(readRope(params, [1, 1]).rightAtA).toBe(false);
  });

  it('knows a right angle at A without the right lengths', () => {
    const reading = readRope(params, [1, 3]); // straight below A, but only 2 away
    expect(reading.rightAtA).toBe(true);
    expect(reading.ac).toBe(2);
    expect(isCornerC(params, [1, 3])).toBe(false);
  });
});

describe('the corners', () => {
  it('accepts C only where the 3-4-5 triangle puts it', () => {
    expect(isCornerC(params, [1, 4])).toBe(true);
    expect(isCornerC(params, [2, 4])).toBe(false);
    expect(isCornerC(params, [5, 4])).toBe(false);
  });

  it('accepts D only where the rectangle closes', () => {
    expect(isCornerD(params, [5, 4])).toBe(true);
    expect(isCornerD(params, [5, 3])).toBe(false);
    expect(isCornerD(params, [4, 4])).toBe(false);
  });
});

describe('Rhind problems 50 and 51', () => {
  it('finds the triangle of 4 by 10 khet to be 20 setat', () => {
    expect(triangleArea(params)).toBe(20);
  });

  it('finds the round field of 9 khet to be 64 setat, step by step', () => {
    expect(circleSteps(9)).toEqual({ ninth: 1, rest: 8, area: 64 });
    expect(egyptianCircleArea(9)).toBe(64);
  });

  it('is within about 0.6% of the modern formula', () => {
    expect(modernCircleArea(9)).toBeCloseTo(63.617, 3);
    expect(circleError(9)).toBeGreaterThan(0.005);
    expect(circleError(9)).toBeLessThan(0.007);
  });

  it('hides pi = 256/81 in the method', () => {
    expect(impliedPi()).toBeCloseTo(3.1605, 4);
    // the Egyptian area of a circle of diameter d is impliedPi * d^2 / 4
    expect(egyptianCircleArea(18)).toBeCloseTo((impliedPi() * 18 ** 2) / 4, 8);
  });
});

describe('parseAnswer and isRight', () => {
  it('reads whole and decimal numbers with a comma or a point', () => {
    expect(parseAnswer('20')).toBe(20);
    expect(parseAnswer('  20 ')).toBe(20);
    expect(parseAnswer('63,6')).toBeCloseTo(63.6);
    expect(parseAnswer('63.6')).toBeCloseTo(63.6);
  });

  it('refuses everything else instead of counting it as a wrong answer', () => {
    for (const input of ['', '   ', 'dua puluh', '1/2', '-5', '2 0', '20x', '.5']) {
      expect(parseAnswer(input), JSON.stringify(input)).toBeNull();
    }
  });

  it('treats 20 and 20.00 as the same answer', () => {
    expect(isRight(20, 20)).toBe(true);
    expect(isRight(20.001, 20)).toBe(true);
    expect(isRight(21, 20)).toBe(false);
    expect(isRight(null, 20)).toBe(false);
  });
});

describe('starsFor', () => {
  const clean = { mistakes: 0, assisted: false, circleSolved: false };

  it('gives 2 stars for a clean run and 3 with the circle challenge', () => {
    expect(starsFor(params, clean)).toBe(2);
    expect(starsFor(params, { ...clean, circleSolved: true })).toBe(3);
  });

  it('allows a few mistakes for the second star', () => {
    expect(starsFor(params, { ...clean, mistakes: 2 })).toBe(2);
    expect(starsFor(params, { ...clean, mistakes: 3 })).toBe(1);
  });

  it('still rewards the circle challenge after many mistakes', () => {
    expect(starsFor(params, { ...clean, mistakes: 9, circleSolved: true })).toBe(2);
  });

  it('caps the mission at 1 star when a solution was shown', () => {
    expect(starsFor(params, { ...clean, assisted: true, circleSolved: true })).toBe(1);
  });
});

describe('RopeSurveyParamsSchema', () => {
  const raw = () => structuredClone(params) as Record<string, unknown>;
  const message = (value: unknown) => {
    const result = RopeSurveyParamsSchema.safeParse(value);
    return result.success ? '' : result.error.issues.map((i) => i.message).join(' | ');
  };

  it('accepts the test parameters', () => {
    expect(RopeSurveyParamsSchema.safeParse(raw()).success).toBe(true);
  });

  it('wants a rope that makes a right triangle', () => {
    expect(message({ ...raw(), rope: { knots: 13, sides: [3, 4, 6] } })).toMatch(/siku-siku/);
  });

  it('wants every knot used', () => {
    expect(message({ ...raw(), rope: { knots: 24, sides: [3, 4, 5] } })).toMatch(/jumlah simpul/);
  });

  it('wants the plot to match the rope', () => {
    expect(message({ ...raw(), plot: { a: [1, 1], width: 5, height: 3 } })).toMatch(/sisi panjang/);
  });

  it('wants the right angle to fit in only one direction', () => {
    expect(message({ ...raw(), plot: { a: [1, 4], width: 4, height: 3 } })).toMatch(/dua arah/);
  });

  it('wants a plot that fits in the grid', () => {
    expect(message({ ...raw(), plot: { a: [4, 1], width: 4, height: 3 } })).toMatch(/muat/);
  });

  it('wants a whole number of setat for the triangle and the circle', () => {
    expect(message({ ...raw(), triangle: { base: 3, height: 5 } })).toMatch(/bilangan bulat/);
    expect(message({ ...raw(), circle: { diameter: 10 } })).toMatch(/kelipatan 9/);
  });
});
