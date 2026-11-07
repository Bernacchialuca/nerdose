import { z } from 'zod';

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
    historyLabel: (r) => (r.won ? '✓' : '✗'),
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
