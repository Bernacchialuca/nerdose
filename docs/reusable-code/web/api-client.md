# API client and testing utils

## api / ApiError / configureApi
- **Location:** apps/web/src/lib/api-client.ts
- **Signature:** `api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T>`; `new ApiError(status, code, message, retryAfter?)`; `configureApi({ getHeaders?, onError? })`
- **Usage:** `const health = await api<Health>('/api/health')`; branch on `err.code`, never on `err.message`

## queryClient
- **Location:** apps/web/src/app/query-client.ts
- **Description:** no retry on 4xx `ApiError`, up to 2 retries otherwise, `staleTime` 30 s

## renderWithProviders
- **Location:** apps/web/src/test/render.tsx
- **Signature:** `renderWithProviders({ route?: string; routes?: RouteObject[] })`
- **Usage:** `renderWithProviders({ route: '/no-existe' })`
