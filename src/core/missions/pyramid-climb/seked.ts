// The seked: how the Egyptians described the slope of a pyramid (Rhind Mathematical Papyrus, problems 56-60).
// It is the horizontal distance, in palms, that the face runs for every cubit it rises:
//
//     seked = (half the base / the height) x 7 palms
//
// A cubit is 7 palms and a palm is 4 fingers, so the gauge in the game counts palms and fingers.

export const PALMS_PER_CUBIT = 7;
export const FINGERS_PER_PALM = 4;

/** What a gate asks about: a pyramid of this base and height, both in cubits. */
export interface SekedProblem {
  base: number;
  height: number;
}

/** The exact seked in palms. */
export function sekedOf({ base, height }: SekedProblem): number {
  return (base / 2 / height) * PALMS_PER_CUBIT;
}

/** The numbers behind the answer, step by step, for hints and for the explanation after the gate. */
export function sekedSteps(problem: SekedProblem): {
  halfBase: number;
  /** cubits of run for each cubit of rise */
  ratio: number;
  palms: number;
} {
  const halfBase = problem.base / 2;
  const ratio = halfBase / problem.height;
  return { halfBase, ratio, palms: ratio * PALMS_PER_CUBIT };
}

/** A setting of the gauge: whole palms and 0 to 3 fingers. */
export interface Gauge {
  palms: number;
  fingers: number;
}

export const GAUGE_MIN = 3;
export const GAUGE_MAX = 9;
export const GAUGE_STEP = 1 / FINGERS_PER_PALM;

export function gaugeValue({ palms, fingers }: Gauge): number {
  return palms + fingers / FINGERS_PER_PALM;
}

/** The gauge setting nearest to a value in palms (the gauge cannot show less than a finger). */
export function gaugeOf(value: number): Gauge {
  const fingersInAll = Math.round(value * FINGERS_PER_PALM);
  return {
    palms: Math.floor(fingersInAll / FINGERS_PER_PALM),
    fingers: fingersInAll % FINGERS_PER_PALM,
  };
}

/** Half a finger: the gauge counts in fingers, so the right setting is the nearest one. */
export const DEFAULT_TOLERANCE = GAUGE_STEP / 2;

export function isRightSeked(
  value: number,
  problem: SekedProblem,
  tolerance = DEFAULT_TOLERANCE,
): boolean {
  return Math.abs(value - sekedOf(problem)) <= tolerance + 1e-9;
}

/**
 * Where a face with the gauge's seked would meet the ground, compared with the real corner of the
 * pyramid: negative when it ends short of the corner (too steep), positive when it overshoots (too
 * flat), 0 when it lands on the corner. In cubits.
 */
export function cornerGap(problem: SekedProblem, value: number): number {
  const run = (problem.height * value) / PALMS_PER_CUBIT;
  return run - problem.base / 2;
}

/** The slope as an angle above the ground, in degrees (for the Kodeks and the explanations). */
export function slopeDegrees(sekedPalms: number): number {
  return (Math.atan(PALMS_PER_CUBIT / sekedPalms) * 180) / Math.PI;
}
