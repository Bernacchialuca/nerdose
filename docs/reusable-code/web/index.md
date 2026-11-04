# Reusable Code Index - web

App `apps/web` (not a package; imported through the `@/` alias).

## API client (2 items) - see api-client.md
- **api / ApiError / configureApi** (apps/web/src/lib/api-client.ts) - Only place that calls `fetch`; typed `ApiError` with `code`, `status`, `retryAfter`
- **queryClient** (apps/web/src/app/query-client.ts) - TanStack Query client with the retry/staleTime policy

## Testing utils (1 item) - see api-client.md
- **renderWithProviders** (apps/web/src/test/render.tsx) - Renders routes in a memory router with a fresh QueryClient and i18n in `es`
