import { ApiError } from '@/lib/api-client';
import type { SessionStatus } from '@/modules/session';

import type { GameToday } from './api/game-today';
import type { GameStatsView, MoveErrorInfo } from './types';

type Input = {
  hasClient: boolean;
  query: { data: GameToday | undefined; isPending: boolean; isError: boolean; error: unknown };
  sessionStatus: SessionStatus;
  /** Llegó `challenge_expired` y todavía no se tocó «Empezar». */
  dayChanged: boolean;
  /** Una jugada respondió `challenge_voided`. */
  voidedDuringPlay: boolean;
  /** Error de la última mutación (start o move). */
  actionError: unknown;
};

export type Session = 'ok' | 'noSession' | 'unavailable';

export type GameView =
  | { kind: 'noClient' }
  | { kind: 'loading' }
  | { kind: 'loadError' }
  | { kind: 'noChallenge'; number: number | null; dayChanged: boolean }
  | { kind: 'voided'; number: number | null }
  | { kind: 'voidedResult'; number: number | null; gameStats: GameStatsView | null }
  | { kind: 'instructions'; number: number; dayChanged: boolean; session: Session }
  | {
      kind: 'playing';
      number: number;
      publicView: unknown;
      state: unknown;
      locked: boolean;
      moveError: MoveErrorInfo | null;
      session: Session;
      moveFailed: boolean;
    }
  | { kind: 'result'; number: number; result: unknown; gameStats: GameStatsView | null };

const INLINE_MOVE_ERRORS = ['not_in_word_list', 'rate_limited', 'invalid_move', 'validation_error'];

// Memoizado por identidad: el client compara referencias para descartar el hint.
const moveErrors = new WeakMap<ApiError, MoveErrorInfo>();

export function toMoveError(error: unknown): MoveErrorInfo | null {
  if (!(error instanceof ApiError) || !INLINE_MOVE_ERRORS.includes(error.code)) return null;
  let info = moveErrors.get(error);
  if (!info) {
    info = { code: error.code, message: error.message };
    moveErrors.set(error, info);
  }
  return info;
}

function toSession(sessionStatus: SessionStatus, actionError: unknown): Session {
  if (
    sessionStatus === 'cookies_blocked' ||
    (actionError instanceof ApiError && actionError.code === 'no_session')
  ) {
    return 'noSession';
  }
  return sessionStatus === 'unavailable' ? 'unavailable' : 'ok';
}

export function deriveGameView({
  hasClient,
  query,
  sessionStatus,
  dayChanged,
  voidedDuringPlay,
  actionError,
}: Input): GameView {
  if (!hasClient) return { kind: 'noClient' };
  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.code === 'not_found';
    return notFound ? { kind: 'noChallenge', number: null, dayChanged } : { kind: 'loadError' };
  }
  const data = query.data;
  if (query.isPending || data === undefined) return { kind: 'loading' };

  if (data.challenge_status === 'none' || data.number === null) {
    return { kind: 'noChallenge', number: data.number, dayChanged };
  }
  const { number, play } = data;
  const finished = play?.status === 'won' || play?.status === 'lost';
  if (play?.status === 'voided' || (data.challenge_status === 'voided' && finished)) {
    return { kind: 'voidedResult', number, gameStats: data.game_stats };
  }
  if (data.challenge_status === 'voided') return { kind: 'voided', number };

  const session = toSession(sessionStatus, actionError);
  if (play === null) return { kind: 'instructions', number, dayChanged, session };
  if (play.status === 'in_progress') {
    return {
      kind: 'playing',
      number,
      publicView: data.public_view,
      state: play.state,
      locked: voidedDuringPlay,
      moveError: toMoveError(actionError),
      session,
      moveFailed:
        actionError !== null &&
        actionError !== undefined &&
        (!(actionError instanceof ApiError) || actionError.status >= 500),
    };
  }
  return { kind: 'result', number, result: data.result, gameStats: data.game_stats };
}
