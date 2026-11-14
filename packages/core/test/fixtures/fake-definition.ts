import { z } from 'zod';

import { BIG_O_OPTIONS, CODE_LANGUAGES } from '../../src/enums';
import type { BigOOption, CodeLanguage } from '../../src/enums';
import type { GameDefinition, GameId } from '../../src/game-definition';

export type FakeDefinition = GameDefinition<
  { word: string },
  { length: number },
  { attempts: number },
  { guess: string },
  { ok: boolean },
  { won: boolean },
  { played: number }
>;

export function makeDefinition(id: GameId): FakeDefinition {
  return {
    id,
    version: 1,
    moveSchema: z.object({ guess: z.string() }),
    bankUsage: null,
    toPublic: (p) => ({ length: p.word.length }),
    initState: () => ({ attempts: 0 }),
    applyMove: (p, s, m) => ({
      state: { attempts: s.attempts + 1 },
      feedback: { ok: m.guess === p.word },
    }),
    isFinished: (s) => s.attempts >= 6,
    result: () => ({ won: false }),
    isWin: (r) => r.won,
    score: (r) => (r.won ? 1 : 0),
    initialStats: () => ({ played: 0 }),
    reduceStats: (prev) => ({ played: prev.played + 1 }),
    codeLanguage: () => null,
    historyLabel: (r) => (r.won ? '✓' : '✗'),
    culprits: () => [],
  };
}

export function makeWordDefinition(): FakeDefinition {
  return {
    ...makeDefinition('devdle'),
    applyMove: (p, s, m, _now, ctx) =>
      ctx.isValidWord(m.guess)
        ? { state: { attempts: s.attempts + 1 }, feedback: { ok: m.guess === p.word } }
        : { error: 'not_in_word_list' },
  };
}

export type LocalizedDefinition = GameDefinition<
  { word: string; definition: { es: string; en: string } },
  { length: number; definition?: string },
  { found: boolean },
  { guess: string },
  { ok: boolean; definition: string },
  { won: boolean },
  { played: number }
>;

export function makeLocalizedDefinition(): LocalizedDefinition {
  return {
    id: 'grep-grid',
    version: 1,
    moveSchema: z.object({ guess: z.string() }),
    bankUsage: {
      bank: 'terms',
      lastUsedField: 'last_used_grep',
      windowDays: 30,
      itemsPerChallenge: 8,
    },
    toPublic: (p, locale, state) =>
      state?.found
        ? { length: p.word.length, definition: p.definition[locale] }
        : { length: p.word.length },
    initState: () => ({ found: false }),
    applyMove: (p, s, m, _now, ctx) => ({
      state: { found: s.found || m.guess === p.word },
      feedback: { ok: m.guess === p.word, definition: p.definition[ctx.locale] },
    }),
    isFinished: (s) => s.found,
    result: (_p, s) => ({ won: s.found }),
    isWin: (r) => r.won,
    score: (r) => (r.won ? 1 : 0),
    initialStats: () => ({ played: 0 }),
    reduceStats: (prev) => ({ played: prev.played + 1 }),
    codeLanguage: () => null,
    historyLabel: (r) => (r.won ? '1/1' : '0/1'),
    culprits: (p) => [{ kind: 'term', id: '00000000-0000-4000-8000-000000000001', label: p.word }],
  };
}

export type CodeDefinition = GameDefinition<
  { answer: BigOOption },
  { options: readonly BigOOption[] },
  { language?: CodeLanguage; option?: BigOOption },
  { language: CodeLanguage; option: BigOOption },
  null,
  { win: boolean },
  { played: number }
>;

export function makeCodeDefinition(): CodeDefinition {
  return {
    id: 'big-o',
    version: 1,
    moveSchema: z.strictObject({ language: z.enum(CODE_LANGUAGES), option: z.enum(BIG_O_OPTIONS) }),
    bankUsage: null,
    toPublic: () => ({ options: BIG_O_OPTIONS }),
    initState: () => ({}),
    applyMove: (_p, s, m) =>
      s.option !== undefined
        ? { error: 'invalid_move' }
        : { state: { language: m.language, option: m.option }, feedback: null },
    isFinished: (s) => s.option !== undefined,
    result: (p, s) => ({ win: s.option === p.answer }),
    isWin: (r) => r.win,
    score: (r) => (r.win ? 1 : 0),
    initialStats: () => ({ played: 0 }),
    reduceStats: (prev) => ({ played: prev.played + 1 }),
    codeLanguage: (s) => s.language ?? null,
    historyLabel: (r) => (r.win ? '✓' : '✗'),
    culprits: () => [],
  };
}
