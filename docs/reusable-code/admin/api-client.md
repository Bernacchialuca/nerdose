# API client and testing utils

Same implementation as `apps/web` (`docs/reusable-code/web/api-client.md`), copied per app, not shared.

## api / ApiError / configureApi
- **Location:** apps/admin/src/lib/api-client.ts
- **Signature:** `api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T>`; `new ApiError(status, code, message, retryAfter?)`; `configureApi({ getHeaders?, onError? })`
- **Description:** sends `Accept: application/json`; `json` is serialized with `Content-Type`. 204 → `undefined`. Errors parse `{ error: { code, message } }` (fallback `internal_error` / statusText) and `Retry-After`; `onError` runs before throwing.
- **Usage:** `const health = await api<Health>('/api/admin/health')`; branch on `err.code`, never on `err.message`

## queryClient
- **Location:** apps/admin/src/app/query-client.ts
- **Description:** `staleTime` 30 s, no refetch on window focus, no retry on 4xx `ApiError`, up to 2 retries otherwise; mutations never retry

## renderWithProviders
- **Location:** apps/admin/src/test/render.tsx
- **Signature:** `renderWithProviders({ route?, routes?, session? } = {})` → render result + `{ queryClient, router, user }`
- **Description:** fresh `QueryClient` (`retry: false`), `registerApiHooks`, `AuthProvider` and `createMemoryRouter`; `session` pre-seeds `sessionStorage`. No i18n provider.
- **Usage:** `renderWithProviders({ route: '/no-existe' })`; custom tree: `renderWithProviders({ routes: [{ path: '/', element: <X />, errorElement: <RouteError /> }] })`

## test setup (jest-dom + axe)
- **Location:** apps/admin/src/test/setup.ts
- **Description:** also starts MSW (`onUnhandledFrame: 'error'`), sets `TZ=UTC`, clears `sessionStorage` and recorded requests after each test.
- **Usage:** `import { axe } from 'vitest-axe'; expect(await axe(container)).toHaveNoViolations()`

## msw server / adminHandlers / requests
- **Location:** apps/admin/src/test/msw.ts
- **Description:** `server.use(adminHandlers.reports('open', body))`, `patchReport(id, body, init?)`, `voidChallenge(id, ...)`, `login(...)`, `metrics(body, init?)`, `metricsSequence([{ body, init? }])`, `metricsByRange({ '?from=…&to=…': body })`, `metricsPending()`, `metricsNetworkError()`; handlers record each request in `requests` (`requestsTo(method, pathname)`).

## metrics fixtures / useMetricsClock
- **Location:** apps/admin/src/test/fixtures/metrics.ts, apps/admin/src/test/helpers.ts
- **Description:** `METRICS_OK` (range 2026-12-01..03), `METRICS_EMPTY`, `STREAKS_ZERO`, `metrics(overrides)`; `useMetricsClock()` fixes time at `2026-12-10T12:00:00Z`.

## fixtures / useFixedClock
- **Location:** apps/admin/src/test/fixtures/reports.ts, apps/admin/src/test/helpers.ts
- **Description:** `SESSION`, `DEVDLE_GROUP`, `TIMELINE_GROUP`, `VOIDED_GROUP`, `OPEN_GROUPS`; `useFixedClock()` fixes time at `2026-11-11T12:00:00Z`.

## registerApiHooks / isApiError
- **Location:** apps/admin/src/app/api-hooks.ts, apps/admin/src/lib/api-errors.ts
- **Description:** `registerApiHooks(queryClient)` sets the Bearer header and, on `401 unauthorized`, clears the session and the cache. `isApiError(e, code?)` narrows to `ApiError`.
