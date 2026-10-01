// The story layer of the content: who speaks, what they say, and the small knowledge quizzes that
// missions can end with. Everything here is data written in YAML; the app only plays it.

import { z } from 'zod';
import { assetRef, slug, text } from '../content/primitives';

/** Ids that may speak without being listed in content/characters.yaml. */
export const SPECIAL_SPEAKERS = ['player', 'narrator'] as const;

export const CharacterSchema = z.object({
  name: text,
  role: text,
  /** shown as "tokoh rekaan" so invented people are never mistaken for history */
  fictional: z.boolean().default(false),
  /** one picture per mood; "neutral" is required and is the fallback */
  portraits: z
    .record(slug, assetRef)
    .refine((portraits) => 'neutral' in portraits, 'harus punya potret "neutral"'),
});

export const CharactersFileSchema = z.object({ characters: z.record(slug, CharacterSchema) });

export const DialogueLineSchema = z.object({
  /** a character id from characters.yaml, or "player" / "narrator" */
  who: slug,
  mood: slug.default('neutral'),
  text,
});

/** A few lines of dialogue, optionally over a background picture. */
export const SceneSchema = z.object({
  background: assetRef.optional(),
  lines: z.array(DialogueLineSchema).min(1),
});

export const QuizQuestionSchema = z
  .object({
    question: text,
    options: z.array(text).min(2).max(4),
    /** index into `options` of the right answer */
    answer: z.number().int().min(0),
    /** shown after answering, whatever the answer was */
    explanation: text,
  })
  .refine((q) => q.answer < q.options.length, {
    message: 'answer harus menunjuk ke salah satu opsi',
    path: ['answer'],
  });

export const QuizSchema = z
  .object({
    title: text,
    intro: text,
    questions: z.array(QuizQuestionSchema).min(1),
    /** how many right answers earn the reward */
    passAt: z.number().int().positive(),
  })
  .refine((quiz) => quiz.passAt <= quiz.questions.length, {
    message: 'passAt lebih besar daripada jumlah pertanyaan',
    path: ['passAt'],
  });

export type Character = z.infer<typeof CharacterSchema>;
export type CharactersFile = z.infer<typeof CharactersFileSchema>;
export type DialogueLine = z.infer<typeof DialogueLineSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type Quiz = z.infer<typeof QuizSchema>;
