# Catalog module

## GAME_CATALOG
- **Location:** apps/web/src/modules/catalog/games.ts
- **Signature:** `Record<GameId, { minutes: number; untimed: boolean; accentClass: string }>`
- **Usage:** `GAME_CATALOG[gameId].accentClass`

## deriveHomeView
- **Location:** apps/web/src/modules/catalog/home-view.ts
- **Signature:** `deriveHomeView({ today, isPending, isError, sessionStatus }): HomeView`
- **Usage:** `const view = deriveHomeView({ today: query.data, isPending: query.isPending, isError: query.isError, sessionStatus: status })`

## useDayCountdown
- **Location:** apps/web/src/modules/catalog/api/use-day-countdown.ts
- **Signature:** `useDayCountdown(secondsToReset: number, syncedAt: number): number`
- **Usage:** `useDayCountdown(view.secondsToReset, query.dataUpdatedAt)`

## ChallengeNumber
- **Location:** apps/web/src/modules/catalog/components/challenge-number.tsx
- **Signature:** `ChallengeNumber()`
- **Usage:** `<ChallengeNumber />` inside `AppHeader`

## GlobalStreakPill
- **Location:** apps/web/src/modules/catalog/components/global-streak-pill.tsx
- **Signature:** `GlobalStreakPill()` - reads `useToday()` and `useSession()`; renders `null` without data or on error; `—` when cookies are blocked or the session is unavailable
- **Usage:** `{isHome ? <GlobalStreakPill /> : null}` inside `AppHeader`

## GameCard / DayStatus / ProgressSummary
- **Location:** apps/web/src/modules/catalog/components/
- **Signature:** `GameCard({ gameId, view })`, `DayStatus({ view, syncedAt })`, `ProgressSummary({ summary, streaks })`

## formatCountdown
- **Location:** apps/web/src/lib/format-countdown.ts
- **Signature:** `formatCountdown(seconds: number): string`
- **Usage:** `formatCountdown(41000) // '11:23:20'`
