import type { GameDefinition } from '@nerdose/core';

import { lineCells, sameCell } from '../shared/geometry';
import {
  WORDS_COUNT,
  moveSchema,
  type GrepGridFeedback,
  type GrepGridMove,
  type GrepGridPayload,
  type GrepGridPublicView,
  type GrepGridResult,
  type GrepGridState,
  type GrepGridStats,
} from './schemas';

const isDone = (s: GrepGridState): boolean => s.gave_up || s.found_words.length === WORDS_COUNT;

export const grepGrid: GameDefinition<
  GrepGridPayload,
  GrepGridPublicView,
  GrepGridState,
  GrepGridMove,
  GrepGridFeedback,
  GrepGridResult,
  GrepGridStats
> = {
  id: 'grep-grid',
  version: 1,
  moveSchema,
  bankUsage: {
    bank: 'terms',
    lastUsedField: 'last_used_grep',
    windowDays: 30,
    itemsPerChallenge: WORDS_COUNT,
  },

  toPublic: (p, locale, state) => ({
    grid: p.grid.map((row) => [...row]),
    words: p.words.map((w) =>
      state?.found_words.some((f) => f.term_id === w.term_id)
        ? { term_id: w.term_id, word: w.word, definition: w.definition[locale] }
        : { term_id: w.term_id, word: w.word },
    ),
  }),

  initState: () => ({ found_words: [], gave_up: false }),

  applyMove(p, s, m, _now, ctx) {
    if (isDone(s)) return { error: 'invalid_move' };
    if (m.type === 'give_up') return { state: { ...s, gave_up: true }, feedback: null };

    const cells = lineCells(m.from, m.to);
    if (cells === null) return { error: 'invalid_move' };

    const placement = p.placements.find((x) => sameCell(x.from, m.from) && sameCell(x.to, m.to));
    const word = placement && p.words.find((w) => w.term_id === placement.term_id);
    if (!placement || !word) return { state: s, feedback: { found: false, reason: 'not_a_word' } };
    if (s.found_words.some((f) => f.term_id === placement.term_id)) {
      return { state: s, feedback: { found: false, reason: 'already_found' } };
    }
    return {
      state: { ...s, found_words: [...s.found_words, { term_id: word.term_id, cells }] },
      feedback: {
        found: true,
        term_id: word.term_id,
        word: word.word,
        definition: word.definition[ctx.locale],
        cells,
      },
    };
  },

  isFinished: isDone,

  result(p, s, locale) {
    const found = s.found_words.length;
    return {
      win: found === WORDS_COUNT,
      score: found,
      gave_up: s.gave_up,
      words: p.words.map((w) => {
        const placement = p.placements.find((x) => x.term_id === w.term_id);
        return {
          term_id: w.term_id,
          word: w.word,
          definition: w.definition[locale],
          found: s.found_words.some((f) => f.term_id === w.term_id),
          cells: (placement && lineCells(placement.from, placement.to)) ?? [],
        };
      }),
    };
  },

  isWin: (r) => r.win,
  score: (r) => r.score,

  initialStats: () => ({
    words_found: { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0 },
  }),

  reduceStats(prev, r) {
    const key = String(r.score) as keyof GrepGridStats['words_found'];
    return { words_found: { ...prev.words_found, [key]: prev.words_found[key] + 1 } };
  },

  historyLabel: (r) => `${r.score}/${WORDS_COUNT}`,
  culprits: (p) => p.words.map((w) => ({ kind: 'term', id: w.term_id, label: w.word })),
};

export { grepGrid as definition };
export {
  WORDS_COUNT,
  WORD_PATTERN,
  cellSchema,
  feedbackFoundSchema,
  feedbackNotFoundSchema,
  feedbackSchema,
  moveSchema,
  payloadSchema,
  publicViewSchema,
  resultSchema,
  stateSchema,
  statsSchema,
} from './schemas';
export type {
  GrepGridFeedback,
  GrepGridMove,
  GrepGridPayload,
  GrepGridPlacement,
  GrepGridPublicView,
  GrepGridResult,
  GrepGridState,
  GrepGridStats,
  GrepGridWord,
} from './schemas';
