# Reusable Code Index - admin

App `apps/admin` (not a package; imported through the `@/` alias → `src/`). Vite + React SPA, dev proxy `/api/admin` → `localhost:3000`.

## API client (3 items) - see api-client.md
- **api / ApiError / configureApi** (apps/admin/src/lib/api-client.ts) - Only place that calls `fetch`; typed `ApiError` with `code`, `status`, `retryAfter`
- **isApiError** (apps/admin/src/lib/api-errors.ts) - Type guard for `ApiError`, optionally filtered by `code`
- **queryClient** (apps/admin/src/app/query-client.ts) - TanStack Query client with the retry/staleTime policy
- **registerApiHooks** (apps/admin/src/app/api-hooks.ts) - Wires `Authorization: Bearer` and the global `401 unauthorized` handling into `configureApi`

## Components (11 items) - see components.md
- **Shell** (apps/admin/src/app/shell.tsx) - Protected layout: `AppHeader` with "Reportes (N)" link and "Cerrar sesión", `<main>` with `<Outlet />`
- **RouteError** (apps/admin/src/app/route-error.tsx) - Route `errorElement`: generic "Algo salió mal" alert with "Reintentar" (reload)
- **routes / router** (apps/admin/src/app/router.tsx) - Route table (`/login`, protected `/` → `/reports`, `reports`) and browser router
- **Providers** (apps/admin/src/app/providers.tsx) - `QueryClientProvider` + `AuthProvider`
- **Dialog** (apps/admin/src/components/dialog.tsx) - Modal/drawer with focus trap, Escape, focus return
- **TextField / TextAreaField / SelectField** (apps/admin/src/components/form-field.tsx) - Labelled controls with `aria-invalid` + error text
- **Tabs** (apps/admin/src/components/tabs.tsx) - Accessible tablist with arrow/Home/End navigation
- **dangerButtonClass** (apps/admin/src/components/danger-button.ts) - Classes for the destructive button
- **usePageTitle** (apps/admin/src/hooks/use-page-title.ts) - Sets `document.title` and focuses the route `<h1>`
- **ReportGroupsTable / ChallengeDrawer / VoidChallengeDialog / VoidNotice / PayloadView / VerificationLog / ReportItem** (apps/admin/src/modules/reports/components/) - Reports section UI
- **formatInstant / formatRelative** (apps/admin/src/lib/format-date.ts) - Spanish date formatting helpers

## Auth module (4 items) - see auth.md
- **token-store** (apps/admin/src/modules/auth/token-store.ts) - Session in `sessionStorage` + external store (`subscribe`, `getSessionSnapshot`, `getEndReason`)
- **AuthProvider / useAuth** (apps/admin/src/modules/auth/auth-context.tsx) - Session state via `useSyncExternalStore`; `signIn`/`signOut`
- **RequireAuth** (apps/admin/src/modules/auth/require-auth.tsx) - Route guard redirecting to `/login`
- **useLogin** (apps/admin/src/modules/auth/api/login.ts) - Login mutation that stores the session

## Reports module (7 items) - see reports.md
- **useReportGroups / useUpdateReport / useVoidChallenge / reportKeys** (apps/admin/src/modules/reports/api/) - Data layer for reports and voiding
- **labels** (apps/admin/src/modules/reports/labels.ts) - Spanish labels, `challengeLabel`, `reasonsSummary`, `parseStatusParam`
- **flattenPayload / readVerification** (apps/admin/src/modules/reports/payload-view-model.ts) - Pure view models for `PayloadView` and the verification log
- **voidSummary** (apps/admin/src/modules/reports/components/void-summary.ts) - Consequences text for the void modal

## Testing utils (5 items) - see api-client.md
- **renderWithProviders** (apps/admin/src/test/render.tsx) - Renders routes with QueryClient, AuthProvider and the HTTP hooks; returns `{ queryClient, router, user }`
- **test setup** (apps/admin/src/test/setup.ts) - jest-dom, axe matchers, MSW lifecycle, `TZ=UTC`, session cleanup
- **msw server / adminHandlers / requests** (apps/admin/src/test/msw.ts) - MSW server with recording handlers for the admin endpoints
- **fixtures** (apps/admin/src/test/fixtures/reports.ts) - `SESSION`, groups and reports fixtures from `api.yaml`
- **useFixedClock** (apps/admin/src/test/helpers.ts) - Fake timers fixed at `2026-11-11T12:00:00Z`
