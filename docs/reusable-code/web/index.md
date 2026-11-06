# Reusable Code Index - web

App `apps/web` (not a package; imported through the `@/` alias).

## API client (2 items) - see api-client.md
- **api / ApiError / configureApi** (apps/web/src/lib/api-client.ts) - Only place that calls `fetch`; typed `ApiError` with `code`, `status`, `retryAfter`
- **queryClient** (apps/web/src/app/query-client.ts) - TanStack Query client with the retry/staleTime policy

## Testing utils (1 item) - see api-client.md
- **renderWithProviders** (apps/web/src/test/render.tsx) - Renders routes in a memory router with a fresh QueryClient and i18n in `es`

## Session and i18n (4 items) - see session.md
- **SessionProvider / useSession** (apps/web/src/modules/session/) - Single session/locale context: bootstraps `POST /api/session`, exposes `status`, `canPlay`, `locale`, `changeLocale`
- **LanguageSelector** (apps/web/src/modules/session/components/language-selector.tsx) - Inline ES/EN control that persists through `PATCH /api/me/preferences`
- **useToday / todayKeys / fetchToday** (apps/web/src/modules/catalog/api/) - `GET /api/today?lang=` query keyed by the active locale
- **sessionKeys / createSession / updatePreferences** (apps/web/src/modules/session/api/session.ts) - Session API calls and types

## Components and hooks (6 items) - see components.md
- **CTA y links** - use `buttonClass` / `linkClass` from `@nerdose/ui` (see docs/reusable-code/ui/helpers.md)
- **MainNav** (apps/web/src/components/main-nav.tsx) - Primary navigation `<nav>` with active link
- **SiteFooter** (apps/web/src/components/site-footer.tsx) - Privacy notice and link to About
- **NotFound** (apps/web/src/app/not-found.tsx) - 404 screen
- **useMediaQuery / DESKTOP_MEDIA_QUERY** (apps/web/src/hooks/use-media-query.ts, apps/web/src/lib/breakpoints.ts) - Viewport hook with the `bp.lg` query
- **useDocumentTitle** (apps/web/src/hooks/use-document-title.ts) - Sets `document.title` for a route

## Testing utils (additional) - see components.md
- **server / defaultHandlers** (apps/web/src/test/msw.ts) - Shared MSW server with default API handlers
- **sessionFixture / todayFixture / todayNoSessionFixture** (apps/web/src/test/fixtures/) - snake_case fixtures
- **mockViewport** (apps/web/src/test/viewport.ts) - Stubs `window.matchMedia` for mobile/desktop
- **fontOf** (apps/web/src/test/font-family.ts) - Resolves `'mono' | 'sans'` for an element by walking up to the nearest `font-*` class

## Catalog (6 items) - see catalog.md
- **GAME_CATALOG** (apps/web/src/modules/catalog/games.ts) - Static per-game metadata (minutes, untimed, accent class) in `GAME_IDS` order
- **deriveHomeView** (apps/web/src/modules/catalog/home-view.ts) - Pure function deriving home state (loading/error/ready, cards, hero, summary) from `Today` and session status
- **useDayCountdown** (apps/web/src/modules/catalog/api/use-day-countdown.ts) - Seconds to reset; at 0 waits a 0-3 s jitter and invalidates `todayKeys.all` once
- **ChallengeNumber** (apps/web/src/modules/catalog/components/challenge-number.tsx) - `#number` of the daily challenge for the shell header
- **GameCard / DayStatus / ProgressSummary** (apps/web/src/modules/catalog/components/) - Presentational components that paint a `HomeView`
- **formatCountdown** (apps/web/src/lib/format-countdown.ts) - Seconds to `HH:MM:SS`
