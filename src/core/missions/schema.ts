// What a mission file (content/chapters/<chapter>/missions/<mission-id>.yaml) contains.
//
// Every mission has the same envelope: an intro scene, an outro per star count, optional named scenes
// the mission's engine plays at its own moments, the Kodeks entries it unlocks, and an optional bonus
// quiz. The engine-specific part is `params`, validated by the schema of the engine named in `engine`.
// Adding an engine means adding one member to the union below, one entry to ENGINE_SCENES and one UI
// module (docs/architecture.md, "Misi sebagai modul").

import { z } from 'zod';
import { slug } from '../content/primitives';
import { QuizSchema, SceneSchema } from '../story/schema';
import { NileFloodParamsSchema } from './nile-flood/schema';
import { PyramidClimbParamsSchema } from './pyramid-climb/schema';
import { RopeSurveyParamsSchema } from './rope-survey/schema';

const envelope = {
  /** must equal the file name and a mission id in chapter.yaml */
  id: slug,
  intro: SceneSchema,
  /** played after the mission, by the number of stars earned */
  outro: z.object({ one: SceneSchema, two: SceneSchema, three: SceneSchema }),
  /** named scenes the engine plays at its own moments (see ENGINE_SCENES) */
  scenes: z.record(slug, SceneSchema).default({}),
  /** Kodeks entries unlocked by finishing the mission */
  codex: z.array(slug).default([]),
  /** an optional quiz after the mission; reaching `passAt` unlocks `bonusCodex` */
  bonusQuiz: QuizSchema.optional(),
  /** Kodeks entries earned by a bonus: the quiz above, or a challenge inside an engine that has one */
  bonusCodex: z.array(slug).default([]),
};

/** The scenes each engine needs, so a missing one is caught by `content:check` and not by a player. */
export const ENGINE_SCENES = {
  'nile-flood': ['akhet', 'peret', 'shemu'],
  'rope-survey': ['rope', 'area', 'triangle', 'circle'],
  'pyramid-climb': ['climb', 'gate1', 'gate2', 'gate3', 'summit'],
} as const satisfies Record<string, readonly string[]>;

/** Engines with a bonus challenge of their own: they report it as `bonus: true` when they finish. */
export const ENGINES_WITH_BONUS: readonly string[] = ['rope-survey', 'pyramid-climb'];

export const MissionContentSchema = z
  .discriminatedUnion('engine', [
    z.object({ ...envelope, engine: z.literal('nile-flood'), params: NileFloodParamsSchema }),
    z.object({ ...envelope, engine: z.literal('rope-survey'), params: RopeSurveyParamsSchema }),
    z.object({
      ...envelope,
      engine: z.literal('pyramid-climb'),
      params: PyramidClimbParamsSchema,
    }),
  ])
  .superRefine((mission, ctx) => {
    for (const scene of ENGINE_SCENES[mission.engine]) {
      if (!(scene in mission.scenes)) {
        ctx.addIssue({
          code: 'custom',
          path: ['scenes'],
          message: `engine "${mission.engine}" membutuhkan scene "${scene}"`,
        });
      }
    }
    if (
      mission.bonusCodex.length > 0 &&
      !mission.bonusQuiz &&
      !ENGINES_WITH_BONUS.includes(mission.engine)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['bonusCodex'],
        message: 'bonusCodex butuh bonusQuiz, atau mesin yang punya tantangan bonus',
      });
    }
  });

export type MissionContent = z.infer<typeof MissionContentSchema>;
export type MissionEngine = MissionContent['engine'];
export const MISSION_ENGINES = Object.keys(ENGINE_SCENES) as MissionEngine[];

/** The pictures an engine draws by itself (besides the scenes), so `content:check` can see they exist. */
export function engineAssets(mission: MissionContent): string[] {
  switch (mission.engine) {
    case 'pyramid-climb':
      return Object.values(mission.params.art);
    default:
      return [];
  }
}
