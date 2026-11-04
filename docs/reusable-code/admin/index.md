# Reusable Code Index - admin

App `apps/admin` (not a package; imported through the `@/` alias → `src/`). Vite + React SPA, dev proxy `/api/admin` → `localhost:3000`.

## API client (2 items) - see api-client.md
- **api / ApiError / configureApi** (apps/admin/src/lib/api-client.ts) - Only place that calls `fetch`; typed `ApiError` with `code`, `status`, `retryAfter`
- **queryClient** (apps/admin/src/app/query-client.ts) - TanStack Query client with the retry/staleTime policy

## Components (4 items) - see components.md
- **Shell** (apps/admin/src/app/shell.tsx) - Layout: `> nerdose` header, single `<main>` with "Admin" h1 and `<Outlet />`; sets document title
- **RouteError** (apps/admin/src/app/route-error.tsx) - Route `errorElement`: generic "Algo salió mal" alert with "Reintentar" (reload), never shows error details
- **routes / router** (apps/admin/src/app/router.tsx) - Route table (`RouteObject[]`) and browser router built from it
- **Providers** (apps/admin/src/app/providers.tsx) - App-wide providers (`QueryClientProvider`)

## Testing utils (2 items) - see api-client.md
- **renderWithProviders** (apps/admin/src/test/render.tsx) - Renders routes in a memory router with a fresh QueryClient (no retries)
- **test setup (jest-dom + axe)** (apps/admin/src/test/setup.ts) - Registers jest-dom and `vitest-axe` matchers (`toHaveNoViolations`), cleanup after each test
