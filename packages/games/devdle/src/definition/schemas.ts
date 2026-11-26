import { TERM_CATEGORIES } from '@nerdose/core';
import { z } from 'zod';

export const WORD_PATTERN = /^[A-Z]{4,12}$/;
export const MAX_GUESSES = 6;

export const guessMoveSchema = z.strictObject({ guess: z.string().regex(WORD_PATTERN) });
/** One per game: reveals the letter at `position` (0-based). */
export const hintMoveSchema = z.strictObject({ hint: z.number().int().min(0).max(11) });
/** Closes the game as a loss: counts for the streak and reveals the word. */
export const giveUpMoveSchema = z.strictObject({ give_up: z.literal(true) });
export const moveSchema = z.union([guessMoveSchema, hintMoveSchema, giveUpMoveSchema]);

export const letterMarkSchema = z.enum(['correct', 'present', 'absent']);
export const guessSchema = z.object({
  guess: z.string().regex(WORD_PATTERN),
  marks: z.array(letterMarkSchema),
});
export const revealedHintSchema = z.object({
  position: z.number().int().min(0).max(11),
  letter: z.string().regex(/^[A-Z]$/),
});
/** `hint` is optional so plays saved before the hint existed still parse. */
export const stateSchema = z.object({
  guesses: z.array(guessSchema).max(MAX_GUESSES),
  hint: revealedHintSchema.optional(),
  gave_up: z.literal(true).optional(),
});

const localizedSchema = z.object({ es: z.string(), en: z.string() });

export const payloadSchema = z.object({
  term_id: z.string().min(1),
  word: z.string().regex(WORD_PATTERN),
  category: z.enum(TERM_CATEGORIES),
  definition: localizedSchema,
  summary: localizedSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const publicViewSchema = z.object({
  length: z.number().int().min(4).max(12),
  possible_categories: z.array(z.enum(TERM_CATEGORIES)),
});

export const resultSchema = z.object({
  win: z.boolean(),
  score: z.number().int().min(1).max(6),
  word: z.string(),
  category: z.enum(TERM_CATEGORIES),
  definition: z.string(),
  summary: z.string(),
  guesses: z.array(guessSchema),
  hint: revealedHintSchema.nullable().optional(),
  gave_up: z.boolean().optional(),
});

const count = z.number().int().min(0);
export const statsSchema = z.object({
  guesses: z.object({ '1': count, '2': count, '3': count, '4': count, '5': count, '6': count }),
  losses: count,
});

export type LetterMark = z.infer<typeof letterMarkSchema>;
export type DevdlePayload = z.infer<typeof payloadSchema>;
export type DevdleMove = z.infer<typeof moveSchema>;
export type DevdleGuess = z.infer<typeof guessSchema>;
export type DevdleRevealedHint = z.infer<typeof revealedHintSchema>;
export type DevdleFeedback = DevdleGuess | { hint: DevdleRevealedHint } | { gave_up: true };
export type DevdleState = z.infer<typeof stateSchema>;
export type DevdlePublicView = z.infer<typeof publicViewSchema>;
export type DevdleResult = z.infer<typeof resultSchema>;
export type DevdleStats = z.infer<typeof statsSchema>;
