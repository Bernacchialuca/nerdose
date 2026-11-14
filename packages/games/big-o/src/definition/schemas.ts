import { BIG_O_OPTIONS, CODE_LANGUAGES, RECIPE_CATEGORIES } from '@nerdose/core';
import { z } from 'zod';

export const MIN_STEPS = 2;
export const MAX_STEPS = 6;

const localized = z.object({ es: z.string(), en: z.string() });
const option = z.enum(BIG_O_OPTIONS);
const language = z.enum(CODE_LANGUAGES);
const category = z.enum(RECIPE_CATEGORIES);
const posInt = z.number().int().min(1);

export const codeByLanguageSchema = z.object({
  js: z.string().min(1),
  go: z.string().min(1),
  java: z.string().min(1),
});

export const payloadSchema = z
  .object({
    recipe: z.string().min(1),
    recipe_category: category,
    code: codeByLanguageSchema,
    answer: option,
    trap_option: option.nullable(),
    explanation: z.object({
      steps: z.array(localized).min(MIN_STEPS).max(MAX_STEPS),
      line_notes: z.array(z.object({ line: posInt, text: localized })),
      tip: localized.nullable(),
      example: z
        .object({ n: posInt, ops: posInt, trap_ops: z.number().int().nullable() })
        .nullable(),
    }),
  })
  .superRefine((p, ctx) => {
    if (p.trap_option === p.answer) {
      ctx.addIssue({
        code: 'custom',
        path: ['trap_option'],
        message: 'trap_option must differ from answer',
      });
    }
    if (
      p.trap_option === null &&
      p.explanation.example !== null &&
      p.explanation.example.trap_ops !== null
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['explanation', 'example', 'trap_ops'],
        message: 'trap_ops requires a trap_option',
      });
    }
  });

export const moveSchema = z.strictObject({ language, option });

export const stateSchema = z
  .strictObject({ language: language.optional(), option: option.optional() })
  .refine((s) => (s.language === undefined) === (s.option === undefined), {
    message: 'language and option go together',
  });

export const publicViewSchema = z.strictObject({
  code: z.strictObject({ js: z.string(), go: z.string(), java: z.string() }),
  options: z.array(option).length(8),
});

export const feedbackSchema = z.null();

export const resultSchema = z.strictObject({
  win: z.boolean(),
  score: z.number().int().min(0).max(1),
  answer: option,
  chosen_option: option,
  code_language: language,
  recipe_category: category,
  trap_option: option.nullable(),
  explanation: z.strictObject({
    steps: z.array(z.string()).min(MIN_STEPS).max(MAX_STEPS),
    line_notes: z.array(z.strictObject({ line: posInt, text: z.string() })),
    tip: z.string().nullable(),
    example: z
      .strictObject({ n: posInt, ops: posInt, trap_ops: z.number().int().nullable() })
      .nullable(),
  }),
});

export const statsSchema = z.object({
  by_category: z.partialRecord(
    category,
    z.object({ played: z.number().int().min(0), correct: z.number().int().min(0) }),
  ),
});

export type CodeByLanguage = z.infer<typeof codeByLanguageSchema>;
export type BigOPayload = z.infer<typeof payloadSchema>;
export type BigOPayloadExplanation = BigOPayload['explanation'];
export type BigOMove = z.infer<typeof moveSchema>;
export type BigOState = z.infer<typeof stateSchema>;
export type BigOPublicView = z.infer<typeof publicViewSchema>;
export type BigOFeedback = z.infer<typeof feedbackSchema>;
export type BigOResult = z.infer<typeof resultSchema>;
export type BigOExplanation = BigOResult['explanation'];
export type BigOStats = z.infer<typeof statsSchema>;
