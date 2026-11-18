import type { InfiniteData } from '@tanstack/react-query';

import { GAME_IDS } from '@nerdose/core';
import type { GameId } from '@nerdose/core';

import { ApiError } from '@/lib/api-client';
import type { GameStatsView } from '@/modules/game-host';
import type { SessionStatus } from '@/modules/session';

import type { MyStats, StatsHistoryEntry } from './api/my-stats';

export type GameCardView = { gameId: GameId; stats: GameStatsView | null };

export type StatsView =
  | { kind: 'loading' }
  | { kind: 'error'; rateLimited: boolean }
  | {
      kind: 'ready';
      /** `cookies_blocked` o 401 `no_session`. */
      noSession: boolean;
      /** 401 `no_session` con un `status` distinto de `cookies_blocked`: el `Shell` no pinta el aviso. */
      localBanner: boolean;
      empty: boolean;
      today: string;
      global: MyStats['global'];
      games: GameCardView[];
      heatmap: MyStats['heatmap'];
      history: StatsHistoryEntry[];
      hasMore: boolean;
      loadingMore: boolean;
      loadMoreError: boolean;
    };

export type StatsQueryState = {
  data?: InfiniteData<MyStats> | undefined;
  error: unknown;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isFetchNextPageError?: boolean;
};

const EMPTY_GLOBAL: MyStats['global'] = { current_streak: 0, max_streak: 0, total_completed: 0 };

const emptyReady = (today: string, localBanner: boolean): StatsView => ({
  kind: 'ready',
  noSession: true,
  localBanner,
  empty: true,
  today,
  global: EMPTY_GLOBAL,
  games: GAME_IDS.map((gameId) => ({ gameId, stats: null })),
  heatmap: [],
  history: [],
  hasMore: false,
  loadingMore: false,
  loadMoreError: false,
});

export function deriveStatsView({
  sessionStatus,
  query,
  todayDate,
}: {
  sessionStatus: SessionStatus;
  query: StatsQueryState;
  todayDate: string | undefined;
}): StatsView {
  if (sessionStatus === 'cookies_blocked') {
    return todayDate === undefined ? { kind: 'loading' } : emptyReady(todayDate, false);
  }
  if (sessionStatus === 'loading') return { kind: 'loading' };

  const { data, error } = query;
  const code = error instanceof ApiError ? error.code : null;
  if (!data && code === 'no_session') return emptyReady(todayDate ?? '', true);

  const first = data?.pages[0];
  if (data && first && query.isFetchNextPageError) return ready(data, first, query, true);
  if (error) return { kind: 'error', rateLimited: code === 'rate_limited' };
  if (!data || !first) return { kind: 'loading' };
  return ready(data, first, query, false);
}

function ready(
  data: InfiniteData<MyStats>,
  first: MyStats,
  query: StatsQueryState,
  loadMoreError: boolean,
): StatsView {
  const history = data.pages.flatMap((p) => p.history);
  return {
    kind: 'ready',
    noSession: false,
    localBanner: false,
    empty: first.global.total_completed === 0 && history.length === 0,
    today: first.today,
    global: first.global,
    games: GAME_IDS.map((gameId) => ({
      gameId,
      stats: first.games.find((g) => g.game_id === gameId) ?? null,
    })),
    heatmap: first.heatmap,
    history,
    hasMore: query.hasNextPage ?? false,
    loadingMore: query.isFetchingNextPage ?? false,
    loadMoreError,
  };
}
