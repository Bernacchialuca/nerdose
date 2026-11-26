import { TERM_CATEGORIES } from '@nerdose/core';
import type { GameDefinition } from '@nerdose/core';

import { scoreGuess } from './feedback';
import {
  MAX_GUESSES,
  WORD_PATTERN,
  moveSchema,
  type DevdleFeedback,
  type DevdleGuess,
  type DevdleMove,
  type DevdlePayload,
  type DevdlePublicView,
  type DevdleResult,
  type DevdleState,
  type DevdleStats,
} from './schemas';

const isSolved = (guess: DevdleGuess): boolean => guess.marks.every((m) => m === 'correct');

function isWon(s: DevdleState): boolean {
  const last = s.guesses.at(-1);
  return last !== undefined && isSolved(last);
}

const isOver = (s: DevdleState): boolean =>
  s.gave_up === true || isWon(s) || s.guesses.length >= MAX_GUESSES;

export const devdle: GameDefinition<
  DevdlePayload,
  DevdlePublicView,
  DevdleState,
  DevdleMove,
  DevdleFeedback,
  DevdleResult,
  DevdleStats
> = {
  id: 'devdle',
  version: 1,
  moveSchema,
  bankUsage: {
    bank: 'terms',
    lastUsedField: 'last_used_devdle',
    windowDays: 365,
    itemsPerChallenge: 1,
  },

  toPublic: (p) => ({
    length: p.word.length,
    possible_categories: [...TERM_CATEGORIES],
  }),

  initState: () => ({ guesses: [] }),

  applyMove(p, s, m, _now, ctx) {
    if (isOver(s)) return { error: 'invalid_move' };
    if ('give_up' in m) {
      return { state: { ...s, gave_up: true }, feedback: { gave_up: true } };
    }
    if ('hint' in m) {
      if (s.hint !== undefined || m.hint >= p.word.length) return { error: 'invalid_move' };
      const hint = { position: m.hint, letter: p.word.charAt(m.hint) };
      return { state: { ...s, hint }, feedback: { hint } };
    }
    if (!WORD_PATTERN.test(m.guess) || m.guess.length !== p.word.length) {
      return { error: 'invalid_move' };
    }
    // La respuesta del día se acepta aunque la lista válida no la contenga.
    if (m.guess !== p.word && !ctx.isValidWord(m.guess)) return { error: 'not_in_word_list' };
    const feedback: DevdleFeedback = { guess: m.guess, marks: scoreGuess(p.word, m.guess) };
    return { state: { ...s, guesses: [...s.guesses, feedback] }, feedback };
  },

  isFinished: isOver,

  result(p, s, locale) {
    const win = isWon(s);
    return {
      win,
      score: win ? s.guesses.length : MAX_GUESSES,
      word: p.word,
      category: p.category,
      definition: p.definition[locale],
      summary: p.summary[locale],
      guesses: s.guesses,
      hint: s.hint ?? null,
      ...(s.gave_up ? { gave_up: true } : {}),
    };
  },

  isWin: (r) => r.win,
  score: (r) => r.score,

  initialStats: () => ({ guesses: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 }, losses: 0 }),

  reduceStats(prev, r) {
    if (!r.win) return { guesses: { ...prev.guesses }, losses: prev.losses + 1 };
    const key = String(r.score) as keyof DevdleStats['guesses'];
    return { guesses: { ...prev.guesses, [key]: prev.guesses[key] + 1 }, losses: prev.losses };
  },

  codeLanguage: () => null,
  historyLabel: (r) => (r.win ? `✓ ${r.score}/${MAX_GUESSES}` : `✗ X/${MAX_GUESSES}`),
  culprits: (p) => [{ kind: 'term', id: p.term_id, label: p.word }],
};

export { devdle as definition };
export { scoreGuess } from './feedback';
export {
  MAX_GUESSES,
  WORD_PATTERN,
  giveUpMoveSchema,
  guessMoveSchema,
  guessSchema,
  hintMoveSchema,
  letterMarkSchema,
  moveSchema,
  payloadSchema,
  publicViewSchema,
  resultSchema,
  revealedHintSchema,
  stateSchema,
  statsSchema,
} from './schemas';
export type {
  DevdleFeedback,
  DevdleGuess,
  DevdleMove,
  DevdlePayload,
  DevdlePublicView,
  DevdleResult,
  DevdleRevealedHint,
  DevdleState,
  DevdleStats,
  LetterMark,
} from './schemas';
