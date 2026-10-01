// The shape of everything authored under content/. This file is the single source of truth:
// the build, `bun run content:check` and the app all validate against it.
// Convention: keys are English, text shown to players is Indonesian (see docs/conventions.md).

import { z } from 'zod';
import { compareYears, isValidYear } from '../years';
import { assetRef, slug, text } from './primitives';

/** A year as a signed integer: negative = SM, positive = M. There is no year 0. */
export const YearSchema = z
  .number()
  .int()
  .refine(isValidYear, 'tahun 0 tidak ada: pakai bilangan negatif untuk SM dan positif untuk M');

export const YearSpecSchema = z
  .object({
    start: YearSchema,
    end: YearSchema.optional(),
    /** shown with "±" */
    approximate: z.boolean().default(false),
    /** true until the date has been checked against a source; `content:check` lists these */
    verify: z.boolean().default(false),
  })
  .refine((y) => y.end === undefined || compareYears(y.start, y.end) <= 0, {
    message: 'tahun akhir harus sama dengan atau setelah tahun mulai',
    path: ['end'],
  });

export const MISSION_TYPES = [
  'simulation',
  'math-puzzle',
  'investigation',
  'action',
  'cipher-puzzle',
  'resource-management',
  'branching',
  'timeline',
  'boss',
] as const;
export const MissionTypeSchema = z.enum(MISSION_TYPES);

export const WorkloadSchema = z.enum(['light', 'medium', 'heavy']);

export const PerspectiveSchema = z.object({
  name: text,
  role: text,
  /** shown to the player as "tokoh rekaan" so invented characters are never mistaken for history */
  fictional: z.boolean().default(false),
});

export const MissionSchema = z.object({
  id: slug,
  type: MissionTypeSchema,
  title: text,
  summary: text,
  place: text,
  /** where in time the mission happens; empty means "outside of time" (e.g. the exam) */
  years: z.array(YearSpecSchema),
  workload: WorkloadSchema,
  perspective: PerspectiveSchema,
});

export const ChapterSchema = z
  .object({
    id: slug,
    track: z.enum(['world', 'nusantara']),
    title: text,
    tagline: text,
    region: text,
    /** key of a theme in src/styles/themes.css */
    theme: slug,
    /** wide picture shown on the map preview and the chapter page */
    banner: assetRef.optional(),
    years: YearSpecSchema,
    /** position on the world map, in percent */
    map: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }),
    /** chapters whose exam must be passed first */
    requires: z.array(slug).default([]),
    /** how many missions unlock the exam: 'all' or a number */
    examRequires: z.union([z.literal('all'), z.number().int().positive()]).default('all'),
    missions: z.array(MissionSchema).min(1),
    exam: MissionSchema,
  })
  .superRefine((chapter, ctx) => {
    if (chapter.exam.type !== 'boss') {
      ctx.addIssue({ code: 'custom', path: ['exam', 'type'], message: 'ujian harus bertipe boss' });
    }
    const ids = [...chapter.missions.map((m) => m.id), chapter.exam.id];
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) {
        ctx.addIssue({ code: 'custom', path: ['missions'], message: `id misi kembar: ${id}` });
      }
      seen.add(id);
    }
    if (
      typeof chapter.examRequires === 'number' &&
      chapter.examRequires > chapter.missions.length
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['examRequires'],
        message: 'lebih besar daripada jumlah misi',
      });
    }
  });

export type YearSpec = z.infer<typeof YearSpecSchema>;
export type MissionType = z.infer<typeof MissionTypeSchema>;
export type Workload = z.infer<typeof WorkloadSchema>;
export type Mission = z.infer<typeof MissionSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
