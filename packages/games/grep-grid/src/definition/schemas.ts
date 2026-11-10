import { z } from 'zod';

import { DIRECTIONS, GRID_SIZE } from '../shared/geometry';

export const WORD_PATTERN = /^[A-Z]{4,12}$/;
export const WORDS_COUNT = 8;

const last = GRID_SIZE - 1;
const idSchema = z.string().min(1);
const localizedSchema = z.object({ es: z.string(), en: z.string() });

export const cellSchema = z.object({
  row: z.number().int().min(0).max(last),
  col: z.number().int().min(0).max(last),
});
const gridSchema = z
  .array(z.array(z.string().regex(/^[A-Z]$/)).length(GRID_SIZE))
  .length(GRID_SIZE);

export const moveSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('select'), from: cellSchema, to: cellSchema }),
  z.object({ type: z.literal('give_up') }),
]);

export const payloadSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  grid: gridSchema,
  words: z
    .array(
      z.object({
        term_id: idSchema,
        word: z.string().regex(WORD_PATTERN),
        definition: localizedSchema,
      }),
    )
    .length(WORDS_COUNT),
  placements: z
    .array(
      z.object({
        term_id: idSchema,
        from: cellSchema,
        to: cellSchema,
        direction: z.enum(DIRECTIONS),
      }),
    )
    .length(WORDS_COUNT),
});

export const stateSchema = z.object({
  found_words: z
    .array(z.object({ term_id: idSchema, cells: z.array(cellSchema) }))
    .max(WORDS_COUNT),
  gave_up: z.boolean(),
});

export const publicViewSchema = z.object({
  grid: gridSchema,
  words: z
    .array(z.object({ term_id: idSchema, word: z.string(), definition: z.string().optional() }))
    .length(WORDS_COUNT),
});

export const feedbackFoundSchema = z.object({
  found: z.literal(true),
  term_id: idSchema,
  word: z.string(),
  definition: z.string(),
  cells: z.array(cellSchema),
});
export const feedbackNotFoundSchema = z.object({
  found: z.literal(false),
  reason: z.enum(['not_a_word', 'already_found']),
});
export const feedbackSchema = z.union([feedbackFoundSchema, feedbackNotFoundSchema]).nullable();

export const resultSchema = z.object({
  win: z.boolean(),
  score: z.number().int().min(0).max(WORDS_COUNT),
  gave_up: z.boolean(),
  words: z
    .array(
      z.object({
        term_id: idSchema,
        word: z.string(),
        definition: z.string(),
        found: z.boolean(),
        cells: z.array(cellSchema),
      }),
    )
    .length(WORDS_COUNT),
});

const count = z.number().int().min(0);
export const statsSchema = z.object({
  words_found: z.object({
    '0': count,
    '1': count,
    '2': count,
    '3': count,
    '4': count,
    '5': count,
    '6': count,
    '7': count,
    '8': count,
  }),
});

export type GrepGridPayload = z.infer<typeof payloadSchema>;
export type GrepGridWord = GrepGridPayload['words'][number];
export type GrepGridPlacement = GrepGridPayload['placements'][number];
export type GrepGridMove = z.infer<typeof moveSchema>;
export type GrepGridState = z.infer<typeof stateSchema>;
export type GrepGridPublicView = z.infer<typeof publicViewSchema>;
export type GrepGridFeedback = z.infer<typeof feedbackSchema>;
export type GrepGridResult = z.infer<typeof resultSchema>;
export type GrepGridStats = z.infer<typeof statsSchema>;
