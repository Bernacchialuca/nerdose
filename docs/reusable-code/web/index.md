# Reusable Code Index - web

App `apps/web` (not a package; imported through the `@/` alias).

## API client (2 items) - see api-client.md
- **api / ApiError / configureApi** (apps/web/src/lib/api-client.ts) - Only place that calls `fetch`; typed `ApiError` with `code`, `status`, `retryAfter`
- **queryClient** (apps/web/src/app/query-client.ts) - TanStack Query client with the retry/staleTime policy

## Testing utils (2 items) - see api-client.md, game-host.md
- **renderWithProviders** (apps/web/src/test/render.tsx) - Renders routes in a memory router with a fresh QueryClient and i18n in `es`
- **gameHandlersFor / grepGridHandlers / timelineHandlers / game fixtures / stubSortableRects / game-route-helpers** (apps/web/src/test/) - Per-game MSW handlers, Grep Grid and Timeline API fixtures, dnd-kit rect stub and shared route-test helpers

## Game host (14 items) - see game-host.md
- **clientRegistry / hasGameClient** (apps/web/src/modules/game-host/registry.ts) - Only place that lists games (partial registry of dynamic `import()`s)
- **loadGameClient / gameScreens / useLoadedGameClient** (apps/web/src/modules/game-host/) - Memoized client loading with i18n registration and the per-game `React.lazy` screens
- **GameClient and props** (apps/web/src/modules/game-host/types.ts) - Structural copy of the `./client` contract
- **gameTodayKeys / fetchGameToday / useGameToday / useStartPlay / useSubmitMove / withSessionRetry** (apps/web/src/modules/game-host/api/) - Query/mutation layer for a game's day
- **deriveGameView / toMoveError** (apps/web/src/modules/game-host/game-view.ts) - Pure screen selector and error mapping
- **GameHostHeader** (apps/web/src/modules/game-host/components/game-host-header.tsx) - `GameHeader` for the game screens
- **ShareButton / ClientShareButton** (apps/web/src/modules/game-host/components/share-button.tsx) - Share with clipboard fallback and analytics
- **ResultExits / Confetti** (apps/web/src/modules/game-host/components/) - Result closing card (streaks + countdown + exits) and win confetti
- **useReport / useAcknowledgeVoid** (apps/web/src/modules/game-host/api/) - Mutations for reporting a challenge and acknowledging a voided one
- **ReportDialog / ReportLink** (apps/web/src/modules/game-host/components/) - O-01 report form and its trigger (generic, no per-game logic)
- **VoidedNoticeDialog** (apps/web/src/modules/game-host/components/voided-notice-dialog.tsx) - O-02 voided-challenge notice with «Marcar como completado»
- **ShellHandle** (apps/web/src/lib/route-handle.ts) - Route-provided header contract for the `Shell`
- **focusMainHeading** (apps/web/src/lib/focus-main-heading.ts) - Moves focus to `main h1`
- **env / parseEnv / initAnalytics** (apps/web/src/lib/env.ts, analytics.ts) - Validated env and Plausible injection

## Session and i18n (5 items) - see session.md
- **SessionProvider / useSession** (apps/web/src/modules/session/) - Single session/locale context: bootstraps `POST /api/session`, exposes `status`, `canPlay`, `locale`, `changeLocale`
- **LanguageSelector** (apps/web/src/modules/session/components/language-selector.tsx) - ES/EN `SegmentedControl` that persists through `PATCH /api/me/preferences`
- **useToday / todayKeys / fetchToday** (apps/web/src/modules/catalog/api/) - `GET /api/today?lang=` query keyed by the active locale
- **sessionKeys / createSession / updatePreferences** (apps/web/src/modules/session/api/session.ts) - Session API calls and types (`createSession` is also exported from the module index)

## Components and hooks (5 items) - see components.md
- **CTA y links** - use `buttonClass` / `linkClass` from `@nerdose/ui` (see docs/reusable-code/ui/helpers.md)
- **MainNav** (apps/web/src/components/main-nav.tsx) - Primary navigation `<nav>` (always in the header, `navItemClass`)
- **SiteFooter** (apps/web/src/components/site-footer.tsx) - Tagline, `exit 0`, privacy notice and link to About
- **NotFound** (apps/web/src/components/not-found.tsx) - 404 screen
- **useDocumentTitle** (apps/web/src/hooks/use-document-title.ts) - Sets `document.title` for a route

## Testing utils (additional) - see components.md
- **server / defaultHandlers** (apps/web/src/test/msw.ts) - Shared MSW server with default API handlers
- **sessionFixture / todayFixture / todayNoSessionFixture** (apps/web/src/test/fixtures/) - snake_case fixtures
- **gameTodayNotStarted / gameTodayInProgress / gameTodayWon / ... / moveWon / todayAfterWin** (apps/web/src/test/fixtures/game-today.ts) - `GameToday` and `MoveResponse` fixtures for Devdle
- **gameHandlers / apiError** (apps/web/src/test/msw.ts) - MSW helpers for `GET .../today`, `POST .../start`, `POST .../move` and error bodies
- **fontOf** (apps/web/src/test/font-family.ts) - Resolves `'mono' | 'sans'` for an element by walking up to the nearest `font-*` class

## Catalog (12 items) - see catalog.md
- **GAME_CATALOG** (apps/web/src/modules/catalog/games.ts) - Static per-game metadata (minutes, untimed, accent class) in `GAME_IDS` order
- **deriveHomeView** (apps/web/src/modules/catalog/home-view.ts) - Pure function deriving home state (loading/error/ready, cards with `next`, terminal rows, hero, summary) from `Today` and session status
- **useDayCountdown** (apps/web/src/modules/catalog/api/use-day-countdown.ts) - Seconds to reset; at 0 waits a 0-3 s jitter and invalidates `todayKeys.all` (plus optional `extraKeys`) once
- **nextPendingGame** (apps/web/src/modules/catalog/home-view.ts) - Next game to play (in progress first, then not started), optionally excluding one
- **ChallengeNumber** (apps/web/src/modules/catalog/components/challenge-number.tsx) - `#number` of the daily challenge for the shell header
- **GlobalStreakPill** (apps/web/src/modules/catalog/components/global-streak-pill.tsx) - Header streak pill linking to `/stats`; hidden without data
- **GameCard / DayTerminal / ProgressPanel / HowItWorks / NextGamePlaceholder** (apps/web/src/modules/catalog/components/) - Presentational components that paint a `HomeView`
- **formatDayLabel** (apps/web/src/lib/format-day.ts) - `'2026-11-03'` to `'martes 3 nov'` / `'Tuesday Nov 3'` (UTC)
- **formatCountdown** (apps/web/src/lib/format-countdown.ts) - Seconds to `HH:MM:SS`
