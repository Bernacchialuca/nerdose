import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api-client';
import {
  gameTodayInProgress,
  gameTodayNextDay,
  gameTodayNone,
  gameTodayNotStarted,
  gameTodayVoided,
  gameTodayVoidedFinished,
  gameTodayWon,
  GAME_STATS,
  RESULT_WIN,
} from '@/test/fixtures/game-today';

import type { GameToday } from './api/game-today';
import { deriveGameView, toMoveError } from './game-view';

type Overrides = Partial<Parameters<typeof deriveGameView>[0]>;

function view(data: GameToday | undefined, overrides: Overrides = {}) {
  return deriveGameView({
    hasClient: true,
    query: { data, isPending: data === undefined, isError: false, error: null },
    sessionStatus: 'active',
    dayChanged: false,
    voidedDuringPlay: false,
    actionError: null,
    ...overrides,
  });
}

const apiError = (code: string, status = 422) => new ApiError(status, code, `msg ${code}`);

describe('deriveGameView', () => {
  it('sin client', () => {
    expect(view(undefined, { hasClient: false })).toEqual({ kind: 'noClient' });
  });

  it('loading y loadError', () => {
    expect(view(undefined)).toEqual({ kind: 'loading' });
    expect(
      view(undefined, {
        query: {
          data: undefined,
          isPending: false,
          isError: true,
          error: apiError('internal_error', 500),
        },
      }),
    ).toEqual({ kind: 'loadError' });
  });

  it('not_found equivale a sin desafío', () => {
    expect(
      view(undefined, {
        query: {
          data: undefined,
          isPending: false,
          isError: true,
          error: apiError('not_found', 404),
        },
        dayChanged: true,
      }),
    ).toEqual({ kind: 'noChallenge', number: null, dayChanged: true });
  });

  it('sin desafío y anulado sin Play', () => {
    expect(view(gameTodayNone)).toEqual({ kind: 'noChallenge', number: 128, dayChanged: false });
    expect(view(gameTodayVoided)).toEqual({ kind: 'voided', number: 128 });
  });

  it('anulado con Play terminada o Play voided', () => {
    expect(view(gameTodayVoidedFinished)).toEqual({
      kind: 'voidedResult',
      number: 128,
      gameStats: GAME_STATS,
    });
    const playVoided: GameToday = {
      ...gameTodayNotStarted,
      play: { status: 'voided', state: null, score: null, code_language: null },
    };
    expect(view(playVoided).kind).toBe('voidedResult');
  });

  it('instrucciones con aviso de día nuevo', () => {
    expect(view(gameTodayNextDay, { dayChanged: true })).toEqual({
      kind: 'instructions',
      number: 129,
      dayChanged: true,
      session: 'ok',
    });
  });

  it('partida en curso', () => {
    const v = view(gameTodayInProgress);
    expect(v).toMatchObject({ kind: 'playing', number: 128, locked: false, moveError: null });
    expect(view(gameTodayInProgress, { voidedDuringPlay: true })).toMatchObject({ locked: true });
  });

  it('resultado', () => {
    expect(view(gameTodayWon)).toEqual({
      kind: 'result',
      number: 128,
      result: RESULT_WIN,
      gameStats: GAME_STATS,
    });
  });

  it('sesión: cookies bloqueadas, no_session en la acción y unavailable', () => {
    expect(view(gameTodayNotStarted, { sessionStatus: 'cookies_blocked' })).toMatchObject({
      session: 'noSession',
    });
    expect(view(gameTodayNotStarted, { actionError: apiError('no_session', 401) })).toMatchObject({
      session: 'noSession',
    });
    expect(view(gameTodayNotStarted, { sessionStatus: 'unavailable' })).toMatchObject({
      session: 'unavailable',
    });
  });

  it('moveError solo para códigos inline y con identidad estable', () => {
    const error = apiError('not_in_word_list');
    const a = view(gameTodayInProgress, { actionError: error });
    const b = view(gameTodayInProgress, { actionError: error });
    expect(a).toMatchObject({
      moveError: { code: 'not_in_word_list', message: 'msg not_in_word_list' },
    });
    expect(a.kind === 'playing' && b.kind === 'playing' && a.moveError === b.moveError).toBe(true);
    for (const code of ['rate_limited', 'invalid_move', 'validation_error']) {
      expect(toMoveError(apiError(code))).not.toBeNull();
    }
    expect(toMoveError(apiError('internal_error', 500))).toBeNull();
    expect(toMoveError(new Error('red'))).toBeNull();
  });

  it('moveFailed: red o 5xx, no 4xx', () => {
    expect(view(gameTodayInProgress, { actionError: new TypeError('red') })).toMatchObject({
      moveFailed: true,
    });
    expect(
      view(gameTodayInProgress, { actionError: apiError('internal_error', 500) }),
    ).toMatchObject({ moveFailed: true });
    expect(view(gameTodayInProgress, { actionError: apiError('rate_limited', 429) })).toMatchObject(
      {
        moveFailed: false,
      },
    );
    expect(view(gameTodayInProgress)).toMatchObject({ moveFailed: false });
  });
});
