# Catalog module

## GAME_CATALOG
- **Location:** apps/web/src/modules/catalog/games.ts
- **Signature:** `Record<GameId, { minutes: number; untimed: boolean; accentClass: string }>`
- **Usage:** `GAME_CATALOG[gameId].accentClass`

## deriveHomeView
- **Location:** apps/web/src/modules/catalog/home-view.ts
- **Signature:** `deriveHomeView({ today, isPending, isError, sessionStatus }): HomeView` - `ready` also carries `date`, `next` (game to continue) and `terminal: { rows, streak }`; each `CardView` has `next: boolean`
- **Usage:** `const view = deriveHomeView({ today: query.data, isPending: query.isPending, isError: query.isError, sessionStatus: status })`

## useDayCountdown
- **Location:** apps/web/src/modules/catalog/api/use-day-countdown.ts
- **Signature:** `useDayCountdown(secondsToReset: number, syncedAt: number, extraKeys?: readonly QueryKey[]): number` - on expiry it invalidates `todayKeys.all` and every key in `extraKeys`
- **Usage:** `useDayCountdown(view.secondsToReset, query.dataUpdatedAt)`

## nextPendingGame
- **Location:** apps/web/src/modules/catalog/home-view.ts
- **Signature:** `nextPendingGame(today: Today, exclude?: GameId): GameId | null` - first published game in progress (in `GAME_IDS` order), else the first not started
- **Usage:** `nextPendingGame(today, 'devdle') // 'grep-grid'`

## ChallengeNumber
- **Location:** apps/web/src/modules/catalog/components/challenge-number.tsx
- **Signature:** `ChallengeNumber()`
- **Usage:** `<ChallengeNumber />` inside `AppHeader`

## GlobalStreakPill
- **Location:** apps/web/src/modules/catalog/components/global-streak-pill.tsx
- **Signature:** `GlobalStreakPill()` - reads `useToday()` and `useSession()`; renders `null` without data or on error; `—` when cookies are blocked or the session is unavailable
- **Usage:** `{isHome ? <GlobalStreakPill /> : null}` inside `AppHeader`

## GameCard / DayTerminal / ProgressPanel / HowItWorks / NextGamePlaceholder
- **Location:** apps/web/src/modules/catalog/components/
- **Signature:** `GameCard({ gameId, view })`, `DayTerminal({ view, syncedAt, className? })`, `ProgressPanel({ view })`, `HowItWorks()`, `NextGamePlaceholder()`
- **Usage:** presentational pieces that paint a `HomeView` with `@nerdose/ui` (`Card`, `TerminalWindow`, `Panel`, `StreakNumber`)

## formatDayLabel
- **Location:** apps/web/src/lib/format-day.ts
- **Signature:** `formatDayLabel(date: string, locale: Locale): string`
- **Usage:** `formatDayLabel('2026-11-03', 'es') // 'martes 3 nov'`

## formatCountdown
- **Location:** apps/web/src/lib/format-countdown.ts
- **Signature:** `formatCountdown(seconds: number): string`
- **Usage:** `formatCountdown(41000) // '11:23:20'`
