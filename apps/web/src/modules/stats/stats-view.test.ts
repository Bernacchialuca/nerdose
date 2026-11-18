import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api-client';
import { myStatsEmpty, myStatsPage1 } from '@/test/fixtures/my-stats';

import { deriveStatsView } from './stats-view';

const data = (...pages: (typeof myStatsPage1)[]) => ({ pages, pageParams: [null] });

describe('deriveStatsView', () => {
  it('TS-11: respeta el orden de GAME_IDS aunque la api responda en otro', () => {
    const reversed = { ...myStatsPage1, games: [...myStatsPage1.games].reverse() };
    const view = deriveStatsView({
      sessionStatus: 'active',
      query: { data: data(reversed), error: null },
      todayDate: '2026-11-03',
    });
    expect(view.kind === 'ready' && view.games.map((g) => g.gameId)).toEqual([
      'devdle',
      'grep-grid',
      'timeline',
      'big-o',
      'bug-hunt',
    ]);
  });

  it('TS-12: cookies bloqueadas = vista vacía sin sesión', () => {
    const view = deriveStatsView({
      sessionStatus: 'cookies_blocked',
      query: { error: null },
      todayDate: '2026-11-03',
    });
    expect(view).toMatchObject({
      kind: 'ready',
      noSession: true,
      localBanner: false,
      empty: true,
      global: { current_streak: 0, max_streak: 0, total_completed: 0 },
      heatmap: [],
      today: '2026-11-03',
      history: [],
      hasMore: false,
    });
    expect(view.kind === 'ready' && view.games.every((g) => g.stats === null)).toBe(true);
  });

  it('cookies bloqueadas sin fecha de today sigue cargando', () => {
    expect(
      deriveStatsView({
        sessionStatus: 'cookies_blocked',
        query: { error: null },
        todayDate: undefined,
      }),
    ).toEqual({ kind: 'loading' });
  });

  it('sesión en bootstrap = loading', () => {
    expect(
      deriveStatsView({
        sessionStatus: 'loading',
        query: { error: null },
        todayDate: '2026-11-03',
      }),
    ).toEqual({ kind: 'loading' });
  });

  it('TS-13: 401 no_session no es error', () => {
    const view = deriveStatsView({
      sessionStatus: 'active',
      query: { error: new ApiError(401, 'no_session', 'x') },
      todayDate: '2026-11-03',
    });
    expect(view).toMatchObject({ kind: 'ready', noSession: true, localBanner: true });
  });

  it('TS-14: 429 = error con texto propio', () => {
    const view = deriveStatsView({
      sessionStatus: 'active',
      query: { error: new ApiError(429, 'rate_limited', 'x', 5) },
      todayDate: '2026-11-03',
    });
    expect(view).toEqual({ kind: 'error', rateLimited: true });
    expect(
      deriveStatsView({
        sessionStatus: 'active',
        query: { error: new Error('net') },
        todayDate: 'x',
      }),
    ).toEqual({ kind: 'error', rateLimited: false });
  });

  it('TS-15: error al cargar más conserva los datos', () => {
    const view = deriveStatsView({
      sessionStatus: 'active',
      query: { data: data(myStatsPage1), error: new Error('x'), isFetchNextPageError: true },
      todayDate: '2026-11-03',
    });
    expect(view).toMatchObject({ kind: 'ready', loadMoreError: true });
    expect(view.kind === 'ready' && view.history).toHaveLength(3);
  });

  it('TS-16: jugador nuevo con sesión', () => {
    const view = deriveStatsView({
      sessionStatus: 'active',
      query: { data: data(myStatsEmpty as never), error: null },
      todayDate: '2026-11-03',
    });
    expect(view).toMatchObject({ kind: 'ready', empty: true, noSession: false, hasMore: false });
  });

  it('sin datos ni error = loading', () => {
    expect(
      deriveStatsView({ sessionStatus: 'active', query: { error: null }, todayDate: 'x' }),
    ).toEqual({ kind: 'loading' });
  });
});
