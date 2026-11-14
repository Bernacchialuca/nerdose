# Reusable Code Index - admin

App `apps/admin` (not a package; imported through the `@/` alias → `src/`). Vite + React SPA, dev proxy `/api/admin` → `localhost:3000`.

## API client (3 items) - see api-client.md
- **api / ApiError / configureApi** (apps/admin/src/lib/api-client.ts) - Only place that calls `fetch`; typed `ApiError` with `code`, `status`, `retryAfter`
- **isApiError** (apps/admin/src/lib/api-errors.ts) - Type guard for `ApiError`, optionally filtered by `code`
- **queryClient** (apps/admin/src/app/query-client.ts) - TanStack Query client with the retry/staleTime policy
- **registerApiHooks** (apps/admin/src/app/api-hooks.ts) - Wires `Authorization: Bearer` and the global `401 unauthorized` handling into `configureApi`

## Components (12 items) - see components.md
- **Shell** (apps/admin/src/app/shell.tsx) - Protected layout: `AppHeader` with "Reportes (N)", "Próximos (n)" and "Stock" links and "Cerrar sesión", `<main>` with `<Outlet />`
- **RouteError** (apps/admin/src/app/route-error.tsx) - Route `errorElement`: generic "Algo salió mal" alert with "Reintentar" (reload)
- **routes / router** (apps/admin/src/app/router.tsx) - Route table (`/login`, protected `/` → `/reports`, `reports`, `upcoming`, `content`) and browser router
- **Providers** (apps/admin/src/app/providers.tsx) - `QueryClientProvider` + `AuthProvider`
- **Dialog** (apps/admin/src/components/dialog.tsx) - Modal/drawer with focus trap, Escape, focus return
- **TextField / TextAreaField / SelectField** (apps/admin/src/components/form-field.tsx) - Labelled controls with `aria-invalid` + error text
- **Tabs** (apps/admin/src/components/tabs.tsx) - Accessible tablist with arrow/Home/End navigation
- **dangerButtonClass** (apps/admin/src/components/danger-button.ts) - Classes for the destructive button
- **usePageTitle** (apps/admin/src/hooks/use-page-title.ts) - Sets `document.title` and focuses the route `<h1>`
- **ReportGroupsTable / ChallengeDrawer / VoidChallengeDialog / VoidNotice / PayloadView / VerificationLog / ReportItem** (apps/admin/src/modules/reports/components/) - Reports section UI
- **formatInstant / formatInstantUtc / formatRelative / formatTime** (apps/admin/src/lib/format-date.ts) - Spanish date formatting helpers (`formatTime` → `HH:mm`, `formatInstantUtc` → `YYYY-MM-DD HH:mm UTC`)
- **formatCount** (apps/admin/src/lib/format-number.ts) - `es-AR` number format with thousands separator from 4 digits (`1.050`)

## Auth module (4 items) - see auth.md
- **token-store** (apps/admin/src/modules/auth/token-store.ts) - Session in `sessionStorage` + external store (`subscribe`, `getSessionSnapshot`, `getEndReason`)
- **AuthProvider / useAuth** (apps/admin/src/modules/auth/auth-context.tsx) - Session state via `useSyncExternalStore`; `signIn`/`signOut`
- **RequireAuth** (apps/admin/src/modules/auth/require-auth.tsx) - Route guard redirecting to `/login`
- **useLogin** (apps/admin/src/modules/auth/api/login.ts) - Login mutation that stores the session

## Reports module (9 items) - see reports.md
- **useReportGroups / useUpdateReport / useVoidChallenge / reportKeys** (apps/admin/src/modules/reports/api/) - Data layer for reports and voiding
- **labels** (apps/admin/src/modules/reports/labels.ts) - Spanish labels, `challengeLabel`, `reasonsSummary`, `parseStatusParam`
- **PayloadBilingual / PayloadCommon / PayloadView** (apps/admin/src/modules/reports/components/payload-view.tsx) - Bilingual ES/EN panels and common-data panel; re-exported by `@/modules/reports` for `upcoming`
- **flattenPayload / readVerification** (apps/admin/src/modules/reports/payload-view-model.ts) - Pure view models for `PayloadView` and the verification log
- **voidSummary** (apps/admin/src/modules/reports/components/void-summary.ts) - Consequences text for the void modal

## Upcoming module (9 items) - see upcoming.md
- **useUpcoming / hasPendingRegeneration / useGenerationFailures / useRegenerateChallenge / upcomingKeys / failureKeys** (apps/admin/src/modules/upcoming/api/) - Data layer with conditional 5 s polling, shell counter and regenerate mutation
- **cellState / cellBadges / LEGEND / rowLabel / windowSubtitle / upcomingAlerts** (apps/admin/src/modules/upcoming/cell-state.ts) - Pure model of grid cells, legend, row labels and alert texts
- **registry (hasPreview / previewComponent)** (apps/admin/src/modules/upcoming/registry.ts) - Only place listing games: lazy `import()` of each `./client` `Preview`
- **ChallengePreview / PreviewErrorBoundary** (apps/admin/src/modules/upcoming/components/) - ES/EN solution previews with fallback to `PayloadBilingual`
- **UpcomingGrid / UpcomingAlerts / UpcomingChallengeDrawer / RegenerateDialog** (apps/admin/src/modules/upcoming/components/) - P-03 grid, live alerts, O-02 drawer and O-03 modal

## Testing utils (6 items) - see api-client.md
- **renderWithProviders** (apps/admin/src/test/render.tsx) - Renders routes with QueryClient, AuthProvider and the HTTP hooks; returns `{ queryClient, router, user }`
- **test setup** (apps/admin/src/test/setup.ts) - jest-dom, axe matchers, MSW lifecycle, `TZ=UTC`, session cleanup
- **msw server / adminHandlers / requests** (apps/admin/src/test/msw.ts) - MSW server with recording handlers for the admin endpoints (reports, void, login, upcoming, regenerate, generation-failures; default unrecorded `generation-failures` handler)
- **upcoming fixtures** (apps/admin/src/test/fixtures/upcoming.ts) - `upcoming()` builder, `UPCOMING_*` variants, game payloads, `FAILURES_*`, `REGEN_202`
- **fixtures** (apps/admin/src/test/fixtures/reports.ts) - `SESSION`, groups and reports fixtures from `api.yaml`
- **useFixedClock / useUpcomingClock** (apps/admin/src/test/helpers.ts) - Fake timers fixed at `2026-11-11T12:00:00Z` / `2026-12-01T14:10:00Z`

## Content stock module (6 items) - see content-stock.md
- **useContentStock / contentStockKeys** (apps/admin/src/modules/content-stock/api/) - Single query for `GET /api/admin/content/stock`, no polling
- **BANK_LABELS / stockAlerts / rejectionRows / windowLabel** (apps/admin/src/modules/content-stock/stock-model.ts) - Pure view model: bank names, one alert per consumer that cannot cycle, rejection rows, window label
- **StockContent / BankPanel / LastSyncPanel / BankRejectionsPanel / TopRejectedPanel / StockAlerts** (apps/admin/src/modules/content-stock/components/) - P-04 panels
- **CycleStatus** (apps/admin/src/modules/content-stock/components/cycle-status.tsx) - "Sí" / "⚠ No" text (state never by color alone)
- **StatList** (apps/admin/src/modules/content-stock/components/stat-list.tsx) - `<dl>` of label/value pairs
- **TableRegion** (apps/admin/src/modules/content-stock/components/table-region.tsx) - Keyboard-reachable scroll region (`role="region"`, `tabIndex=0`) for data tables
