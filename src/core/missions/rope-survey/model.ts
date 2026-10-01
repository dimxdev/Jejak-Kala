// The rules of the "Tali Para Penyurvei" mission as pure functions, so the screens only show what these
// return and the tests (model.test.ts) hold the numbers in place.

import type { Point, RopeSurveyParams } from './schema';

export const squaredDistance = (p: Point, q: Point): number =>
  (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;

/** The distance in knots when it is a whole number (the rope only has whole knots), otherwise null. */
export function ropeLength(p: Point, q: Point): number | null {
  const squared = squaredDistance(p, q);
  const root = Math.round(Math.sqrt(squared));
  return root * root === squared ? root : null;
}

/** The four stakes of the plot: A and B survived, C and D are what the player has to set. */
export function plotStakes(params: RopeSurveyParams): { a: Point; b: Point; c: Point; d: Point } {
  const { a, width, height } = params.plot;
  return {
    a,
    b: [a[0] + width, a[1]],
    c: [a[0], a[1] + height],
    d: [a[0] + width, a[1] + height],
  };
}

export const samePoint = (p: Point, q: Point): boolean => p[0] === q[0] && p[1] === q[1];

/** What the rope shows while the player tries a spot for stake C: the three sides of triangle ABC. */
export interface RopeReading {
  /** side lengths in knots; null when the distance is not a whole number of knots */
  ab: number | null;
  ac: number | null;
  bc: number | null;
  /** the same distances as plain numbers, for display when they are not whole */
  exact: { ab: number; ac: number; bc: number };
  /** knots used by the three sides, when all are whole numbers */
  used: number | null;
  /** the angle at A is a right angle */
  rightAtA: boolean;
}

export function readRope(params: RopeSurveyParams, c: Point): RopeReading {
  const { a, b } = plotStakes(params);
  const ab = ropeLength(a, b);
  const ac = ropeLength(a, c);
  const bc = ropeLength(b, c);
  const dot = (b[0] - a[0]) * (c[0] - a[0]) + (b[1] - a[1]) * (c[1] - a[1]);
  return {
    ab,
    ac,
    bc,
    exact: {
      ab: Math.sqrt(squaredDistance(a, b)),
      ac: Math.sqrt(squaredDistance(a, c)),
      bc: Math.sqrt(squaredDistance(b, c)),
    },
    used: ab !== null && ac !== null && bc !== null ? ab + ac + bc : null,
    rightAtA: dot === 0 && !samePoint(a, c),
  };
}

/** Is C the right spot: a right angle at A, AC = 3 and BC = 5 knots (for the 3-4-5 rope)? */
export const isCornerC = (params: RopeSurveyParams, c: Point): boolean =>
  samePoint(c, plotStakes(params).c);

/** Is D the right spot: it closes the rectangle A B D C? */
export const isCornerD = (params: RopeSurveyParams, d: Point): boolean =>
  samePoint(d, plotStakes(params).d);

/** Area of the restored plot in setat (one setat is a square of 1 khet by 1 khet). */
export const plotArea = (params: RopeSurveyParams): number =>
  params.plot.width * params.plot.height;

/** Rhind problem 51: half the base times the height. */
export const triangleArea = (params: RopeSurveyParams): number =>
  (params.triangle.base * params.triangle.height) / 2;

/** Rhind problem 50: take away a ninth of the diameter and square what is left. */
export const egyptianCircleArea = (diameter: number): number => ((8 * diameter) / 9) ** 2;

/** The area with the modern formula, pi r squared. */
export const modernCircleArea = (diameter: number): number => Math.PI * (diameter / 2) ** 2;

/** The steps of the Egyptian method for a diameter: a ninth, what is left, and the area. */
export function circleSteps(diameter: number): { ninth: number; rest: number; area: number } {
  const ninth = diameter / 9;
  const rest = diameter - ninth;
  return { ninth, rest, area: rest * rest };
}

/** How much larger the Egyptian area is than the modern one, as a fraction (about 0.006 = 0.6%). */
export const circleError = (diameter: number): number =>
  egyptianCircleArea(diameter) / modernCircleArea(diameter) - 1;

/** The value of pi hidden in the Egyptian method: (16/9)^2 = 256/81. */
export const impliedPi = (): number => 256 / 81;

/**
 * Reads what the player typed: whole or decimal numbers, with a comma or a point. Anything else
 * (empty, letters, a fraction) is null, so the screen can ask again instead of counting a mistake.
 */
export function parseAnswer(input: string): number | null {
  const cleaned = input.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/** Is a typed answer right? Decimals are compared to two places so 20 and 20,00 are the same. */
export const isRight = (answer: number | null, expected: number): boolean =>
  answer !== null && Math.abs(answer - expected) < 0.005;

/** What the player did in the whole mission, as the stars need it. */
export interface Tally {
  /** wrong tries in the main tasks (the stakes, the plot, the triangle) */
  mistakes: number;
  /** the player pressed "Lihat solusi" at least once */
  assisted: boolean;
  /** the circle challenge was solved */
  circleSolved: boolean;
}

/**
 * 1 star for finishing, a 2nd for a clean run (few mistakes, no solution shown), a 3rd for the circle
 * challenge. A solution that was shown caps the mission at 1 star.
 */
export function starsFor(params: RopeSurveyParams, tally: Tally): 1 | 2 | 3 {
  if (tally.assisted) return 1;
  const clean = tally.mistakes <= params.mistakesForTwoStars;
  const extra = (clean ? 1 : 0) + (tally.circleSolved ? 1 : 0);
  return (1 + extra) as 1 | 2 | 3;
}
