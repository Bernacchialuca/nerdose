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
- **Signature:** `renderWithProviders({ route?: string; routes?: RouteObject[] } = {})` (defaults: `'/'`, app `routes`)
- **Description:** fresh `QueryClient` with `retry: false` + `createMemoryRouter`. Unlike web, no i18n provider.
- **Usage:** `renderWithProviders({ route: '/no-existe' })`; custom tree: `renderWithProviders({ routes: [{ path: '/', element: <X />, errorElement: <RouteError /> }] })`

## test setup (jest-dom + axe)
- **Location:** apps/admin/src/test/setup.ts
- **Usage:** `import { axe } from 'vitest-axe'; expect(await axe(container)).toHaveNoViolations()`
