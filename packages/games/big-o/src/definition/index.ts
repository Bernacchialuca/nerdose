import { BIG_O_OPTIONS, type GameDefinition } from '@nerdose/core';

import { OPTION_LABEL } from '../shared/labels';
import {
  moveSchema,
  type BigOFeedback,
  type BigOMove,
  type BigOPayload,
  type BigOPublicView,
  type BigOResult,
  type BigOState,
  type BigOStats,
} from './schemas';

export const bigO: GameDefinition<
  BigOPayload,
  BigOPublicView,
  BigOState,
  BigOMove,
  BigOFeedback,
  BigOResult,
  BigOStats
> = {
  id: 'big-o',
  version: 1,
  moveSchema,
  bankUsage: null,
  toPublic: (p) => ({
    code: { js: p.code.js, go: p.code.go, java: p.code.java },
    options: [...BIG_O_OPTIONS],
  }),
  initState: () => ({}),
  applyMove(_p, s, m) {
    if (s.option !== undefined) return { error: 'invalid_move' };
    return { state: { language: m.language, option: m.option }, feedback: null };
  },
  isFinished: (s) => s.option !== undefined,
  result(p, s, locale) {
    if (s.option === undefined || s.language === undefined) {
      // La api solo lo llama con la Play won/lost: un estado sin confirmar es un bug, no un error esperado.
      throw new Error('big-o: result requires a confirmed state');
    }
    const win = s.option === p.answer;
    const { steps, line_notes, tip, example } = p.explanation;
    return {
      win,
      score: win ? 1 : 0,
      answer: p.answer,
      chosen_option: s.option,
      code_language: s.language,
      recipe_category: p.recipe_category,
      trap_option: p.trap_option,
      explanation: {
        steps: steps.map((step) => step[locale]),
        line_notes: line_notes.map((note) => ({ line: note.line, text: note.text[locale] })),
        tip: tip ? tip[locale] : null,
        example: example ? { n: example.n, ops: example.ops, trap_ops: example.trap_ops } : null,
      },
    };
  },
  isWin: (r) => r.win,
  score: (r) => r.score,
  initialStats: () => ({ by_category: {} }),
  reduceStats(prev, r) {
    const cur = prev.by_category[r.recipe_category] ?? { played: 0, correct: 0 };
    return {
      by_category: {
        ...prev.by_category,
        [r.recipe_category]: { played: cur.played + 1, correct: cur.correct + (r.win ? 1 : 0) },
      },
    };
  },
  codeLanguage: (s) => s.language ?? null,
  historyLabel: (r) => (r.win ? `✓ ${OPTION_LABEL[r.answer]}` : '✗'),
  culprits: () => [],
};

export { bigO as definition };
export {
  MAX_STEPS,
  MIN_STEPS,
  codeByLanguageSchema,
  feedbackSchema,
  moveSchema,
  payloadSchema,
  publicViewSchema,
  resultSchema,
  stateSchema,
  statsSchema,
} from './schemas';
export type {
  BigOExplanation,
  BigOFeedback,
  BigOMove,
  BigOPayload,
  BigOPayloadExplanation,
  BigOPublicView,
  BigOResult,
  BigOState,
  BigOStats,
  CodeByLanguage,
} from './schemas';
