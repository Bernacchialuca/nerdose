---
id: data-fetching
display_name: Datos del servidor (TanStack Query)
language: react
description: "Same-origin JSON client, snake_case contracts and TanStack Query for all server data"
applies_to: [frontend]
required_by: []
package: "@tanstack/react-query"
---

# Data Fetching (React, TanStack Query)

All server data is read with **TanStack Query** on top of one thin `fetch` wrapper. The `api` is on the same origin as the app, speaks JSON in `snake_case` and returns typed errors (ADR-015). The client does not transform field names.

## When to use

- Any read from the `api`: today's challenges, a game's public view, player stats, reports, metrics.
- Any mutation against the `api`: start, move, report, preferences, void, regenerate.
- Not for purely local UI state (see `state-management`).

## Package

```
@tanstack/react-query            # server state, cache, retries
@tanstack/react-query-devtools   # dev only
zod                              # runtime validation of moves (schemas from @nerdose/game-*)
```

## Configuration

### Same origin and dev proxy

Production uses relative URLs (`/api/...`): `nerdose.dev` serves `web` and routes `/api/*` to the `api`; `admin.nerdose.dev` routes `/api/admin/*`. There is no CORS and no absolute base URL in the code. In development Vite emulates the same origin:

```ts
// vite.config.ts (web)
export default defineConfig({
  server: { proxy: { '/api': 'http://localhost:3000' } },
});
// vite.config.ts (admin)
//   server: { proxy: { '/api/admin': 'http://localhost:3000' } }
```

### API client

```ts
// src/lib/api-client.ts
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,       // error.code from the catalog in @nerdose/core
    message: string,             // error.message, already in the response locale
    readonly retryAfter?: number,
  ) { super(message); }
}

// Optional app-level hooks, registered once at startup (see error-handling and, in admin, auth).
type Hooks = { getHeaders?: () => Record<string, string>; onError?: (err: ApiError) => void };
let hooks: Hooks = {};
export const configureApi = (h: Hooks) => { hooks = h; };

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(path, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(json !== undefined && { 'Content-Type': 'application/json' }),
      ...hooks.getHeaders?.(),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (res.ok) return (res.status === 204 ? undefined : await res.json()) as T;
  const body = await res.json().catch(() => null);
  const err = new ApiError(
    res.status,
    body?.error?.code ?? 'internal_error',
    body?.error?.message ?? res.statusText,
    Number(res.headers.get('Retry-After')) || undefined,
  );
  hooks.onError?.(err);
  throw err;
}
```

- The wrapper is the only place that calls `fetch`. Responses are returned as parsed JSON, **keys untouched** (`snake_case`).
- Cookies (`nd_pid` in web) travel by default because the request is same-origin; do not set `credentials` or CORS options.
- Apps may register `getHeaders` and `onError` once at startup with `configureApi`, for cross-cutting needs (see `error-handling`; in `admin`, `auth` uses both). Feature code never sets auth headers by hand.

### QueryClient

```ts
// src/app/query-client.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
    },
    mutations: { retry: false },
  },
});
```

## How to use

### Queries with key factories

```ts
// src/modules/catalog/api/today.ts
export const todayKeys = { all: ['today'] as const };

export function useToday() {
  return useQuery({
    queryKey: todayKeys.all,
    queryFn: () => api<TodayResponse>('/api/today'),
  });
}
```

- One key factory per module; keys are arrays starting with the resource name.
- Response types come from `@nerdose/core` / the game package when they exist, otherwise from a type declared in the module's `api/` folder that mirrors `docs/apis/api.yaml` field by field.

### Mutations and invalidation

```ts
export function useSubmitMove(gameId: GameId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (move: unknown) =>
      api<MoveResponse>(`/api/games/${gameId}/today/move`, { method: 'POST', json: move }),
    onSuccess: (res) => {
      if (res.result !== null) { // the move closed the round
        qc.invalidateQueries({ queryKey: todayKeys.all });
        qc.invalidateQueries({ queryKey: ['me', 'stats'] });
      }
    },
  });
}
```

- Mutations invalidate the queries they make stale; they do not hand-edit caches unless the response carries the new state.
- Validate player moves with the game's `moveSchema` before sending; the `api` stays the source of truth and may still answer `422 invalid_move`.

### Polling

- Polling is explicit per query with `refetchInterval`, only where a flow demands it, and stops when its condition ends (e.g. `refetchInterval: (q) => hasPendingRegeneration(q.state.data) ? 5_000 : false`).

## Rules

- Call `fetch` only from `lib/api-client.ts`. No `axios`, no ad-hoc `fetch` in components.
- Server data lives in TanStack Query. Never copy query results into `useState` or a context.
- Do not convert keys to `camelCase` and do not rename API fields; types use the API names.
- URLs are relative (`/api/...`). No hardcoded hosts, no CORS configuration, no `VITE_API_URL`.
- Mutating requests send `Content-Type: application/json` (the wrapper does it when `json` is given).
- Mutations of a game round include `challenge_number`; the client never sends a date.
- Query keys come from per-module factories, never inline string literals repeated across files.
- Do not set `retry` on mutations; a repeated move is the user's decision.
- Branch on `ApiError.code`, never on `message` text or on the HTTP status alone.
- Never log or persist API responses outside the Query cache.

## Integration with other conventions

- **error-handling**: `ApiError` and its `code` drive recovery; error boundaries receive query errors.
- **state-management**: decides what is server state (here) versus local state.
- **game-clients**: game moves are validated with the `moveSchema` exported by each game's package before `useSubmitMove`.
- **testing-unit**: network is mocked at the `fetch` boundary, with `snake_case` fixtures.
