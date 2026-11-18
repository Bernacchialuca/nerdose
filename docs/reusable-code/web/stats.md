# Stats module

Module `apps/web/src/modules/stats/` (`/stats`). Its `index.ts` only exports `statsKeys`, the `MyStats`/`StatsHistoryEntry` types and `useInvalidateStatsOnDayChange` (avoids cycles with `game-host`).

## statsKeys / fetchMyStats / MyStats
- **Location:** apps/web/src/modules/stats/api/my-stats.ts
- **Signature:** `statsKeys.all = ['me','stats']`, `statsKeys.detail(locale)`; `fetchMyStats(locale, before: string | null): Promise<MyStats>` (`GET /api/me/stats?lang=&history_before=`); `MyStats` mirrors `api.yaml` field by field (snake_case)
- **Usage:** `queryClient.invalidateQueries({ queryKey: statsKeys.all })`

## useMyStats
- **Location:** apps/web/src/modules/stats/api/use-my-stats.ts
- **Signature:** `useMyStats()` - `useInfiniteQuery` keyed by locale, `pageParam = history_next_before`, disabled unless the session is `active`/`unavailable`, `keepPreviousData`; after a locale change it refetches as many pages as were loaded before
- **Usage:** `const query = useMyStats(); query.fetchNextPage()`

## useInvalidateStatsOnDayChange
- **Location:** apps/web/src/modules/stats/api/use-invalidate-stats-on-day-change.ts
- **Signature:** `useInvalidateStatsOnDayChange(): void` - invalidates `statsKeys.all` when `useToday().data.date` changes from a known value (mounted once in `Shell`)

## deriveStatsView
- **Location:** apps/web/src/modules/stats/stats-view.ts
- **Signature:** `deriveStatsView({ sessionStatus, query, todayDate }): StatsView` (`loading | error{rateLimited} | ready{noSession, localBanner, empty, today, global, games, heatmap, history, hasMore, loadingMore, loadMoreError}`); games always in `GAME_IDS` order
- **Usage:** `const view = deriveStatsView({ sessionStatus: status, query, todayDate })`

## formatShortDate / formatWinRate / formatCount
- **Location:** apps/web/src/modules/stats/format.ts
- **Signature:** `formatShortDate('2026-11-03', 'es') // 'mar 03/11'` (UTC); `formatWinRate(0.76, 'en') // '76%'`, `null -> '—'`; `formatCount(n, locale)`

## Components
- **Location:** apps/web/src/modules/stats/components/
- **Description:** `StatsInvitation({ noSession })`, `StatsKpis({ global, locale })` (with local `StatCard`), `GameStatsCard({ gameId, stats, locale })` (local `Metric`; mounts the client's `StatsSummary` lazily through `GameStatsSummary`), `ActivityPanel({ today, days, locale })` (wraps `Heatmap`), `HistoryPanel({ rows, locale, hasMore, loadingMore, loadMoreError, onLoadMore })` (responsive table via container queries, «Ver más» with live region and focus handling)

## my-stats fixtures
- **Location:** apps/web/src/test/fixtures/my-stats.ts
- **Description:** `myStatsPage1`, `myStatsPage2`, `myStatsEmpty` (`MyStats`); `defaultHandlers` serves `GET /api/me/stats` with them
