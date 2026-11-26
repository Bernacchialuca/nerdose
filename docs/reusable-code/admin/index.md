# Reusable Code Index - admin

App `apps/admin` (not a package; imported through the `@/` alias → `src/`). Vite + React SPA, dev proxy `/api/admin` → `localhost:3000`.

## API client (3 items) - see api-client.md
- **api / ApiError / configureApi** (apps/admin/src/lib/api-client.ts) - Only place that calls `fetch`; typed `ApiError` with `code`, `status`, `retryAfter`
- **isApiError** (apps/admin/src/lib/api-errors.ts) - Type guard for `ApiError`, optionally filtered by `code`
- **queryClient** (apps/admin/src/app/query-client.ts) - TanStack Query client with the retry/staleTime policy
- **registerApiHooks** (apps/admin/src/app/api-hooks.ts) - Wires `Authorization: Bearer` and the global `401 unauthorized` handling into `configureApi`

## Components (14 items) - see components.md
- **Shell** (apps/admin/src/app/shell.tsx) - Protected layout: `AppHeader` with "Reportes (N)", "Próximos (n)", "Bancos", "Stock" and "Métricas" links and "Cerrar sesión", `<main>` with `<Outlet />`
- **RouteError** (apps/admin/src/app/route-error.tsx) - Route `errorElement`: generic "Algo salió mal" alert with "Reintentar" (reload)
- **routes / router** (apps/admin/src/app/router.tsx) - Route table (`/login`, protected `/` → `/reports`, `reports`, `upcoming`, `banks`, `content`, `metrics`) and browser router
- **Providers** (apps/admin/src/app/providers.tsx) - `QueryClientProvider` + `AuthProvider`
- **Dialog** (apps/admin/src/components/dialog.tsx) - Modal/drawer with focus trap, Escape, focus return
- **TextField / TextAreaField / SelectField** (apps/admin/src/components/form-field.tsx) - Labelled controls with `aria-invalid` + error text; `TextField` also takes `invalid` / `describedBy` to mark the field and link an external alert
- **TableRegion** (apps/admin/src/components/table-region.tsx) - Keyboard-reachable scroll region (`role="region"`, `tabIndex=0`) for data tables; shared by `content-stock` and `metrics`
- **Tabs** (apps/admin/src/components/tabs.tsx) - Accessible tablist with arrow/Home/End navigation
- **Pagination / usePagination** (apps/admin/src/components/pagination.tsx) - «‹ Anterior · 1–25 de N {noun} · página p de P · Siguiente ›» `nav` (polite live text, hidden with a single page) and client-side paging for lists that arrive whole (clamps back when the list shrinks); used by Reportes (20), Métricas (15, `METRICS_PAGE_SIZE`), top rejected (10) and, server-side, Bancos (25) — REQ-012
- **dangerButtonClass** (apps/admin/src/components/danger-button.ts) - Classes for the destructive button
- **usePageTitle** (apps/admin/src/hooks/use-page-title.ts) - Sets `document.title` and focuses the route `<h1>`
- **ReportGroupsTable / ChallengeDrawer / VoidChallengeDialog / VoidNotice / PayloadView / VerificationLog / ReportItem** (apps/admin/src/modules/reports/components/) - Reports section UI
- **formatInstant / formatInstantUtc / formatRelative / formatTime / formatDay / formatDayShort** (apps/admin/src/lib/format-date.ts) - Spanish date formatting helpers (`formatTime` → `HH:mm`, `formatInstantUtc` → `YYYY-MM-DD HH:mm UTC`, `formatDay` → `dd/mm/aaaa` and `formatDayShort` → `dd/mm` from a `YYYY-MM-DD` string, no timezone)
- **formatCount** (apps/admin/src/lib/format-number.ts) - `es-AR` number format with thousands separator from 4 digits (`1.050`)

## Auth module (4 items) - see auth.md
- **token-store** (apps/admin/src/modules/auth/token-store.ts) - Session in `sessionStorage` + external store (`subscribe`, `getSessionSnapshot`, `getEndReason`)
- **AuthProvider / useAuth** (apps/admin/src/modules/auth/auth-context.tsx) - Session state via `useSyncExternalStore`; `signIn`/`signOut`
- **RequireAuth** (apps/admin/src/modules/auth/require-auth.tsx) - Route guard redirecting to `/login`
- **useLogin** (apps/admin/src/modules/auth/api/login.ts) - Login mutation that stores the session

## Reports module (9 items) - see reports.md
- **useReportGroups / useUpdateReport / useVoidChallenge / reportKeys** (apps/admin/src/modules/reports/api/) - Data layer for reports and voiding
- **labels** (apps/admin/src/modules/reports/labels.ts) - Spanish labels, `challengeLabel`, `reasonsSummary`, `parseStatusParam`
- **PayloadTexts / PayloadCommon / PayloadView** (apps/admin/src/modules/reports/components/payload-view.tsx) - Spanish texts panel «Textos» (was `PayloadBilingual` ES/EN until REQ-012) and common-data panel; re-exported by `@/modules/reports` for `upcoming`
- **flattenPayload / readVerification** (apps/admin/src/modules/reports/payload-view-model.ts) - Pure view models for `PayloadView` and the verification log
- **voidSummary** (apps/admin/src/modules/reports/components/void-summary.ts) - Consequences text for the void modal

## Upcoming module (9 items) - see upcoming.md
- **useUpcoming / hasPendingRegeneration / useGenerationFailures / useRegenerateChallenge / upcomingKeys / failureKeys** (apps/admin/src/modules/upcoming/api/) - Data layer with conditional 5 s polling, shell counter and regenerate mutation
- **cellState / cellBadges / LEGEND / rowLabel / windowSubtitle / upcomingAlerts** (apps/admin/src/modules/upcoming/cell-state.ts) - Pure model of grid cells, legend, row labels and alert texts
- **registry (hasPreview / previewComponent)** (apps/admin/src/modules/upcoming/registry.ts) - Only place listing games: lazy `import()` of each `./client` `Preview`
- **ChallengePreview / PreviewErrorBoundary** (apps/admin/src/modules/upcoming/components/) - Spanish-only solution preview («Vista previa») with fallback to `PayloadTexts` (REQ-012)
- **UpcomingGrid / UpcomingAlerts / UpcomingChallengeDrawer / RegenerateDialog** (apps/admin/src/modules/upcoming/components/) - P-03 grid, live alerts, O-02 drawer and O-03 modal

## Testing utils (8 items) - see api-client.md
- **renderWithProviders** (apps/admin/src/test/render.tsx) - Renders routes with QueryClient, AuthProvider and the HTTP hooks; returns `{ queryClient, router, user }`
- **test setup** (apps/admin/src/test/setup.ts) - jest-dom, axe matchers, MSW lifecycle, `TZ=UTC`, session cleanup
- **msw server / adminHandlers / requests** (apps/admin/src/test/msw.ts) - MSW server with recording handlers for the admin endpoints (reports, void, login, upcoming, regenerate, generation-failures, metrics via `metrics / metricsSequence / metricsByRange / metricsPending / metricsNetworkError`; default unrecorded `generation-failures` handler)
- **upcoming fixtures** (apps/admin/src/test/fixtures/upcoming.ts) - `upcoming()` builder, `UPCOMING_*` variants, game payloads (`BIG_O_PAYLOAD`, `BIG_O_VERIFICATION`, `BUG_HUNT_PAYLOAD`, `BUG_HUNT_VERIFICATION`), `UPCOMING_BIG_O_BAD_PAYLOAD`, `UPCOMING_BUG_HUNT` (5 games), `UPCOMING_BUG_HUNT_BAD_PAYLOAD`, `FAILURES_*`, `REGEN_202`
- **fixtures** (apps/admin/src/test/fixtures/reports.ts) - `SESSION`, groups and reports fixtures from `api.yaml`
- **buildAdmin / compiledCss** (apps/admin/src/test/vite-build.ts) - In-memory Vite build of the admin (memoized per test file) and its compiled CSS, for build guards
- **metrics fixtures** (apps/admin/src/test/fixtures/metrics.ts) - `METRICS_OK`, `METRICS_EMPTY`, `STREAKS_ZERO`, `metrics(overrides)`
- **useFixedClock / useUpcomingClock / useMetricsClock** (apps/admin/src/test/helpers.ts) - Fake timers fixed at `2026-11-11T12:00:00Z` / `2026-12-01T14:10:00Z` / `2026-12-10T12:00:00Z`

## Content stock module (5 items) - see content-stock.md
- **useContentStock / contentStockKeys** (apps/admin/src/modules/content-stock/api/) - Single query for `GET /api/admin/content/stock`, no polling
- **BANK_LABELS / stockAlerts / windowLabel** (apps/admin/src/modules/content-stock/stock-model.ts) - Pure view model: bank names, one alert per consumer that cannot cycle, window label (`rejectionRows` removed in REQ-012)
- **StockContent / BankPanel / LastSyncPanel / BankRejectionsLink / TopRejectedPanel / StockAlerts** (apps/admin/src/modules/content-stock/components/) - P-04 panels; `BankRejectionsLink` (REQ-012) summarizes rejected items per bank with a link to Bancos (replaces the `BankRejectionsPanel` table); `TopRejectedPanel` pages by 10
- **CycleStatus** (apps/admin/src/modules/content-stock/components/cycle-status.tsx) - "Sí" / "⚠ No" text (state never by color alone)
- **StatList** (apps/admin/src/modules/content-stock/components/stat-list.tsx) - `<dl>` of label/value pairs

## Metrics module (8 items) - see metrics.md
- **useMetrics / metricsKeys** (apps/admin/src/modules/metrics/api/) - Single query for `GET /api/admin/metrics?from&to` (disabled with a `null` range), no polling; `MetricsResponse` types mirror `api.yaml`
- **defaultRange / readRange / rangeCheck** (apps/admin/src/modules/metrics/range.ts) - Default last-30-days UTC range, URL parsing and range validation on top of core's `validateMetricsRange`
- **formatPercent / dailyRows / retentionRows / streakRows / sortQuality / nextSort / challengeCell** (apps/admin/src/modules/metrics/metrics-model.ts) - Pure table view model (one-decimal percentages, `—` for `null`, zero-filled days, quality sort with `null` last) plus `NOTES`, `EMPTY_RANGE`, `QUALITY_COLUMNS`
- **MetricsView / RangeForm / RangeAlert / SystemAlert / LoadingNotice** (apps/admin/src/modules/metrics/components/) - Draft range, state precedence and form
- **MetricsContent / SummaryFigures** (apps/admin/src/modules/metrics/components/) - Four summary cards and the four panels
- **DailyPlayersTable / RetentionTable / StreakTable / QualityTable / EmptyRow** (apps/admin/src/modules/metrics/components/) - Accessible HTML tables (caption, associated footnote); `QualityTable` sortable with `aria-sort`

## Banks module (4 items) - see banks.md
- **useBankItems / bankItemsKeys / bankItemsPath / BANK_PAGE_SIZE** (apps/admin/src/modules/banks/api/use-bank-items.ts) - Query over `GET /api/admin/content/items` (page size 25, `keepPreviousData` so the table does not flicker)
- **BANK_TABS / categoryOptions / categoryLabel / reasonLabel / STATUS_OPTIONS / parseBankQuery / bankQueryParams** (apps/admin/src/modules/banks/labels.ts) - Pure view model: tabs, per-bank categories, readable rejection reasons, URL <-> query (invalid values fall back to defaults)
- **BankItemsTable** (apps/admin/src/modules/banks/components/bank-items-table.tsx) - Items table (description, «fuera de Devdle» badge from `excluded_from`, status and reason, last use per game, date for facts, sitelinks)
- **Banks route** (apps/admin/src/modules/banks/routes/banks.tsx) - P-06 `/banks`: tabs Términos / Hechos, search with a 300 ms debounce, filters in the URL, `Pagination`
