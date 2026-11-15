import { BUG_TYPES, CODE_LANGUAGES } from '@nerdose/core';
import { z } from 'zod';

export const MIN_STEPS = 2;
export const MAX_STEPS = 4;
export const MIN_VISIBLE_TESTS = 2;
export const MAX_VISIBLE_TESTS = 3;

const localized = z.object({ es: z.string(), en: z.string() });
const language = z.enum(CODE_LANGUAGES);
const bugType = z.enum(BUG_TYPES);
const posInt = z.number().int().min(1);
const int32 = z.number().int().min(-2147483648).max(2147483647);
const arg = z.union([int32, z.array(int32)]);
const value = z.union([int32, z.boolean()]);
const input = z.array(arg).min(1);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const codeByLanguageSchema = z.object({
  js: z.string().min(1),
  go: z.string().min(1),
  java: z.string().min(1),
});

export const testCaseSchema = z.object({ input, expected: value, actual: value });
export const visibleTestSchema = z.object({ input, expected: value });

// Structural shape only: content rules (counts, ordering, equivalence) belong to `verify`.
export const payloadSchema = z.object({
  date: day.optional(),
  template: z.string().min(1),
  params: z.record(z.string(), z.union([z.string(), int32, z.boolean()])),
  function_name: z.string().regex(/^[a-z][A-Za-z0-9]*$/),
  bug_type: bugType,
  mutation: z.object({
    operator: z.string().min(1),
    node: z.string().min(1),
    from: z.string(),
    to: z.string(),
  }),
  spec: localized,
  code: codeByLanguageSchema,
  bug_line: posInt,
  fix: codeByLanguageSchema,
  pickable_lines: z.array(posInt).min(1),
  tests: z.array(testCaseSchema).min(1),
  visible_tests: z.array(visibleTestSchema),
  failing_test: testCaseSchema,
  explanation: z.object({ steps: z.array(localized).min(MIN_STEPS).max(MAX_STEPS) }),
});

export const moveSchema = z.strictObject({ language, line: posInt });

export const stateSchema = z
  .strictObject({ language: language.optional(), line: posInt.optional() })
  .refine((s) => (s.language === undefined) === (s.line === undefined), {
    message: 'language and line go together',
  });

export const publicViewSchema = z.strictObject({
  function_name: z.string(),
  spec: z.string(),
  code: z.strictObject({ js: z.string(), go: z.string(), java: z.string() }),
  pickable_lines: z.array(posInt).min(1),
  visible_tests: z
    .array(z.strictObject({ input, expected: value }))
    .min(MIN_VISIBLE_TESTS)
    .max(MAX_VISIBLE_TESTS),
});

export const feedbackSchema = z.null();

const lineFix = z.strictObject({ before: z.string(), after: z.string() });

export const resultSchema = z.strictObject({
  win: z.boolean(),
  score: z.number().int().min(0).max(1),
  chosen_line: posInt,
  code_language: language,
  bug_line: posInt,
  bug_type: bugType,
  function_name: z.string(),
  failing_test: z.strictObject({ input, expected: value, actual: value }),
  fix: z.strictObject({ js: lineFix, go: lineFix, java: lineFix }),
  explanation: z.strictObject({ steps: z.array(z.string()).min(MIN_STEPS).max(MAX_STEPS) }),
});

const counter = z.object({ played: z.number().int().min(0), correct: z.number().int().min(0) });

export const statsSchema = z.object({
  by_language: z.partialRecord(language, counter),
  by_bug_type: z.partialRecord(bugType, counter),
});

export type CodeByLanguage = z.infer<typeof codeByLanguageSchema>;
export type BugHuntTestCase = z.infer<typeof testCaseSchema>;
export type BugHuntVisibleTest = z.infer<typeof visibleTestSchema>;
export type BugHuntPayload = z.infer<typeof payloadSchema>;
export type BugHuntMove = z.infer<typeof moveSchema>;
export type BugHuntState = z.infer<typeof stateSchema>;
export type BugHuntPublicView = z.infer<typeof publicViewSchema>;
export type BugHuntFeedback = z.infer<typeof feedbackSchema>;
export type BugHuntResult = z.infer<typeof resultSchema>;
export type BugHuntLineFix = BugHuntResult['fix']['js'];
export type BugHuntExplanation = BugHuntResult['explanation'];
export type BugHuntStats = z.infer<typeof statsSchema>;
