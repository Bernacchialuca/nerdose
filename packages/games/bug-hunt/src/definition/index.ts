import type { CodeLanguage, GameDefinition } from '@nerdose/core';

import {
  moveSchema,
  type BugHuntFeedback,
  type BugHuntMove,
  type BugHuntPayload,
  type BugHuntPublicView,
  type BugHuntResult,
  type BugHuntState,
  type BugHuntStats,
} from './schemas';

const copyInput = (input: (number | number[])[]) =>
  input.map((a) => (Array.isArray(a) ? [...a] : a));

export const bugHunt: GameDefinition<
  BugHuntPayload,
  BugHuntPublicView,
  BugHuntState,
  BugHuntMove,
  BugHuntFeedback,
  BugHuntResult,
  BugHuntStats
> = {
  id: 'bug-hunt',
  version: 1,
  moveSchema,
  bankUsage: null,
  toPublic: (p, locale) => ({
    function_name: p.function_name,
    spec: p.spec[locale],
    code: { js: p.code.js, go: p.code.go, java: p.code.java },
    // Ascending even if the payload already is: the list shape cannot depend on bug_line.
    pickable_lines: [...p.pickable_lines].sort((a, b) => a - b),
    visible_tests: p.visible_tests.map((t) => ({
      input: copyInput(t.input),
      expected: t.expected,
    })),
  }),
  initState: () => ({}),
  applyMove(p, s, m) {
    if (s.line !== undefined) return { error: 'invalid_move' };
    if (!p.pickable_lines.includes(m.line)) return { error: 'invalid_move' };
    return { state: { language: m.language, line: m.line }, feedback: null };
  },
  isFinished: (s) => s.line !== undefined,
  result(p, s, locale) {
    if (s.line === undefined || s.language === undefined) {
      // The api only calls this with a won/lost Play: an unconfirmed state is a bug, not an expected error.
      throw new Error('bug-hunt: result requires a confirmed state');
    }
    const lineFix = (lang: CodeLanguage) => {
      const before = p.code[lang].split('\n')[p.bug_line - 1];
      // verify (lines_consistent) prevents this in every published challenge.
      if (before === undefined) throw new Error('bug-hunt: bug_line out of range');
      return { before, after: p.fix[lang] };
    };
    const win = s.line === p.bug_line;
    return {
      win,
      score: win ? 1 : 0,
      chosen_line: s.line,
      code_language: s.language,
      bug_line: p.bug_line,
      bug_type: p.bug_type,
      function_name: p.function_name,
      failing_test: {
        input: copyInput(p.failing_test.input),
        expected: p.failing_test.expected,
        actual: p.failing_test.actual,
      },
      fix: { js: lineFix('js'), go: lineFix('go'), java: lineFix('java') },
      explanation: { steps: p.explanation.steps.map((step) => step[locale]) },
    };
  },
  isWin: (r) => r.win,
  score: (r) => r.score,
  initialStats: () => ({ by_language: {}, by_bug_type: {} }),
  reduceStats(prev, r) {
    const add = (c: { played: number; correct: number } | undefined) => ({
      played: (c?.played ?? 0) + 1,
      correct: (c?.correct ?? 0) + (r.win ? 1 : 0),
    });
    return {
      by_language: {
        ...prev.by_language,
        [r.code_language]: add(prev.by_language[r.code_language]),
      },
      by_bug_type: { ...prev.by_bug_type, [r.bug_type]: add(prev.by_bug_type[r.bug_type]) },
    };
  },
  codeLanguage: (s) => s.language ?? null,
  historyLabel: (r) => `${r.win ? '✓' : '✗'} L${r.bug_line}`,
  culprits: () => [],
};

export { bugHunt as definition };
export {
  MAX_STEPS,
  MAX_VISIBLE_TESTS,
  MIN_STEPS,
  MIN_VISIBLE_TESTS,
  codeByLanguageSchema,
  feedbackSchema,
  moveSchema,
  payloadSchema,
  publicViewSchema,
  resultSchema,
  stateSchema,
  statsSchema,
  testCaseSchema,
  visibleTestSchema,
} from './schemas';
export type {
  BugHuntExplanation,
  BugHuntFeedback,
  BugHuntLineFix,
  BugHuntMove,
  BugHuntPayload,
  BugHuntPublicView,
  BugHuntResult,
  BugHuntState,
  BugHuntStats,
  BugHuntTestCase,
  BugHuntVisibleTest,
  CodeByLanguage,
} from './schemas';
