import type { z } from 'zod';
import type { Locale } from './enums';

export const GAME_IDS = ['devdle', 'grep-grid', 'timeline', 'big-o', 'bug-hunt'] as const;

export type GameId = (typeof GAME_IDS)[number];

export type { Locale } from './enums';

export function isGameId(value: unknown): value is GameId {
  return typeof value === 'string' && (GAME_IDS as readonly string[]).includes(value);
}

export type MoveError = 'invalid_move' | 'not_in_word_list';

export interface MoveContext {
  isValidWord(word: string): boolean;
}

export interface GameDefinition<Payload, PublicView, State, Move, Feedback, Result, Stats> {
  id: GameId;
  version: number;
  moveSchema: z.ZodType<Move>;

  toPublic(p: Payload, locale: Locale): PublicView;
  initState(p: Payload, now: Date): State;
  applyMove(
    p: Payload,
    s: State,
    m: Move,
    now: Date,
    ctx: MoveContext,
  ): { state: State; feedback: Feedback } | { error: MoveError };
  isFinished(s: State): boolean;
  result(p: Payload, s: State, locale: Locale): Result;
  isWin(r: Result): boolean;
  score(r: Result): number;

  initialStats(): Stats;
  reduceStats(prev: Stats, r: Result): Stats;
  historyLabel(r: Result): string;
}
