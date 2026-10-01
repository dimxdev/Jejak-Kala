// The `params` of a "pyramid-climb" mission (mission 4 of Mesir, "Lereng Sempurna"): the level of the
// platform climb, the three measuring gates, and the numbers for the stars. The level is checked as a
// whole (`levelProblems`): every ledge reachable, no dead end, nothing unfair, so `content:check` fails
// on a level nobody could finish.

import { z } from 'zod';
import { assetRef, text } from '../../content/primitives';
import { levelProblems, MIN_LEDGE_WIDTH } from './level';
import { GAUGE_MAX, GAUGE_MIN, sekedOf } from './seked';

const px = z.number().int();

const LedgeSchema = z.object({ x: px.min(0), y: px, w: px.min(MIN_LEDGE_WIDTH) });
const PickupSchema = z.object({ x: px, y: px });

const GateSchema = z.object({
  /** where the gate stands: on a ledge, with room on both sides */
  x: px,
  /** the pyramid the gate asks about, in cubits */
  base: z.number().positive(),
  height: z.number().positive(),
  /** where the numbers come from, so the gate can say so: a made-up model, the Rhind papyrus, or the real pyramid */
  source: z.enum(['model', 'rhind', 'pyramid']),
  /** shown one at a time in Santai, from the gentlest to the one that nearly gives it away */
  hints: z.array(text).min(1).max(4),
  /** said after the gate opens: what the number means and where it comes from in history */
  explain: text,
});

const ScorpionSchema = z
  .object({ x1: px, x2: px, y: px, speed: z.number().min(30).max(160) })
  .refine((s) => s.x2 - s.x1 >= 150, {
    message: 'patroli kalajengking minimal 150 px',
    path: ['x2'],
  });

const SwingerSchema = z.object({
  x: px,
  y: px,
  length: z.number().min(150).max(600),
  amplitude: z.number().min(20).max(80),
  period: z.number().min(2).max(6),
  phase: z.number().min(0).lt(1),
});

/** The pictures the scene draws, as asset references ("<chapter>/<id>"); content:check makes sure they exist. */
const ArtSchema = z.object({
  /** the scenery behind the climb, drifting slowly as the camera moves */
  background: assetRef,
  /** the player, in the two poses the scene swaps between (side view, facing right) */
  walk: assetRef,
  jump: assetRef,
  scorpion: assetRef,
  /** the swinging block */
  block: assetRef,
  /** a measuring gate (the picture of one gateway; the scene draws two sides of the rope) */
  gate: assetRef,
  /** the golden cubit rod */
  rod: assetRef,
  /** the capstone at the summit */
  capstone: assetRef,
});

export const PyramidClimbParamsSchema = z
  .object({
    art: ArtSchema,
    world: z.object({ width: px.positive(), height: px.positive() }),
    start: z.object({ x: px }),
    /** the capstone at the summit */
    goal: z.object({ x: px }),
    ledges: z.array(LedgeSchema).min(2),
    gates: z.tuple([GateSchema, GateSchema, GateSchema]),
    /** where the player starts again after a fall or a hit, besides the start and the gates */
    checkpoints: z.array(px).default([]),
    /** the golden cubit rods: collecting all of them is the third star */
    rods: z.array(PickupSchema).length(3),
    /** hazards appear in Tantangan only */
    scorpions: z.array(ScorpionSchema).default([]),
    swingers: z.array(SwingerSchema).default([]),
    mistakesForTwoStars: z.number().int().min(0),
    /** wrong tries at one gate before "Lihat solusi" appears */
    solutionAfter: z.number().int().min(1),
  })
  .superRefine((params, ctx) => {
    for (const problem of levelProblems(params)) {
      ctx.addIssue({ code: 'custom', path: problem.path, message: problem.message });
    }
    params.gates.forEach((gate, i) => {
      const answer = sekedOf(gate);
      if (answer < GAUGE_MIN || answer > GAUGE_MAX) {
        ctx.addIssue({
          code: 'custom',
          path: ['gates', i],
          message: `seked ${answer.toFixed(2)} di luar jangkauan alat ukur (${GAUGE_MIN}-${GAUGE_MAX} telapak)`,
        });
      }
    });
  });

export type PyramidClimbParams = z.infer<typeof PyramidClimbParamsSchema>;
export type Gate = PyramidClimbParams['gates'][number];
export type ClimbArt = PyramidClimbParams['art'];
