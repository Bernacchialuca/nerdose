import {
  BIG_O_OPTIONS,
  CODE_LANGUAGES,
  createGameRegistry,
  type BigOOption,
  type CodeLanguage,
  type GameDefinition,
} from '@nerdose/core';
import { devdle } from '@nerdose/game-devdle/definition';
import { grepGrid } from '@nerdose/game-grep-grid/definition';
import { timeline } from '@nerdose/game-timeline/definition';
import { z } from 'zod';

/** Juego de prueba con lenguaje de código (`id: 'big-o'`, exigido por `ck_plays_code_language_game`). */
export const CODE_PAYLOAD = { answer: 'o_n_log_n' } as const;

type CodeState = { language?: CodeLanguage; option?: BigOOption };
type CodeMove = { language: CodeLanguage; option: BigOOption };
type CodeResult = {
  win: boolean;
  score: number;
  option: BigOOption | undefined;
  answer: BigOOption;
};

export const codeGame: GameDefinition<
  typeof CODE_PAYLOAD,
  { options: readonly BigOOption[] },
  CodeState,
  CodeMove,
  null,
  CodeResult,
  Record<string, never>
> = {
  id: 'big-o',
  version: 1,
  bankUsage: null,
  moveSchema: z.strictObject({
    language: z.enum(CODE_LANGUAGES),
    option: z.enum(BIG_O_OPTIONS),
  }),
  toPublic: () => ({ options: BIG_O_OPTIONS }),
  initState: () => ({}),
  applyMove: (_p, s, m) =>
    s.option !== undefined
      ? { error: 'invalid_move' }
      : { state: { language: m.language, option: m.option }, feedback: null },
  isFinished: (s) => s.option !== undefined,
  result: (p, s) => ({
    win: s.option === p.answer,
    score: s.option === p.answer ? 1 : 0,
    option: s.option,
    answer: p.answer,
  }),
  isWin: (r) => r.win,
  score: (r) => r.score,
  initialStats: () => ({}),
  reduceStats: (prev) => prev,
  codeLanguage: (s) => s.language ?? null,
  historyLabel: (r) => (r.win ? '✓' : '✗'),
  culprits: () => [],
};

/** Variante que no declara lenguaje: el cierre no debe tocar la preferencia. */
export const codeGameNull = { ...codeGame, codeLanguage: () => null };

export const codeRegistry = createGameRegistry([devdle, grepGrid, timeline, codeGame]);
export const codeNullRegistry = createGameRegistry([devdle, grepGrid, timeline, codeGameNull]);
