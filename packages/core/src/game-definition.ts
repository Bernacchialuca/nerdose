import type { z } from 'zod';
import type { CodeLanguage, Locale } from './enums';
import type { BankName } from './game-generator';

export const GAME_IDS = ['devdle', 'grep-grid', 'timeline', 'big-o', 'bug-hunt'] as const;

export type GameId = (typeof GAME_IDS)[number];

export type { Locale } from './enums';

export function isGameId(value: unknown): value is GameId {
  return typeof value === 'string' && (GAME_IDS as readonly string[]).includes(value);
}

export type MoveError = 'invalid_move' | 'not_in_word_list';

export interface MoveContext {
  isValidWord(word: string): boolean;
  locale: Locale;
}

export type CulpritKind = 'term' | 'timeline_fact';

/** Bank item referenced by a challenge; the admin picks one when voiding (REQ-007). */
export interface Culprit {
  kind: CulpritKind;
  id: string;
  label: string;
}

/** Bank a game consumes and its reuse window; the api builds the content stock from it (REQ-008). */
export interface BankUsage {
  bank: BankName;
  lastUsedField: string;
  windowDays: number;
  itemsPerChallenge: number;
}

export interface GameDefinition<Payload, PublicView, State, Move, Feedback, Result, Stats> {
  id: GameId;
  version: number;
  moveSchema: z.ZodType<Move>;
  bankUsage: BankUsage | null;

  toPublic(p: Payload, locale: Locale, state?: State): PublicView;
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
  /** Language the Play was confirmed with (Big O, Bug Hunt); null for games without code (REQ-009). */
  codeLanguage(s: State): CodeLanguage | null;
  historyLabel(r: Result): string;
  culprits(p: Payload): Culprit[];
}
