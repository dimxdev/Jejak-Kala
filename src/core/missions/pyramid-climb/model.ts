// Scoring of mission 4. The platforming is for fun and for the third star; the maths at the gates is
// what the stars mostly measure, as in the other missions.

import type { PyramidClimbParams } from './schema';

export interface Tally {
  /** wrong tries at the three gates */
  mistakes: number;
  /** the player pressed "Lihat solusi" at least once */
  assisted: boolean;
  /** golden cubit rods collected */
  rods: number;
}

/**
 * 1 star for reaching the summit, a 2nd for a clean run (few wrong tries at the gates, no solution
 * shown), a 3rd for all three golden cubit rods. A solution that was shown caps the mission at 1 star.
 */
export function starsFor(params: PyramidClimbParams, tally: Tally): 1 | 2 | 3 {
  if (tally.assisted) return 1;
  const clean = tally.mistakes <= params.mistakesForTwoStars;
  const complete = tally.rods >= params.rods.length;
  return (1 + (clean ? 1 : 0) + (complete ? 1 : 0)) as 1 | 2 | 3;
}
