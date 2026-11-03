---
id: state-management
display_name: Manejo de estado
language: react
description: "Where each kind of state lives in the SPA: server cache, URL, local component state and minimal context"
applies_to: [frontend]
required_by: []
package: null
---

# State Management (React)

No global state library. Each kind of state has one home: server data in TanStack Query, navigational state in the URL, ephemeral UI state in the component, and a small number of app-wide values in React context. The goal is to avoid duplicated truth between the `api` and the UI.

## When to use

- Deciding where a new piece of state should live.
- Reviewing a component that mirrors server data into local state.

## Decision tree

| The state is... | It lives in |
|---|---|
| Data that comes from the `api` (today, play, stats, reports, metrics) | TanStack Query (`data-fetching`) |
| Which screen, game or filter is selected and should survive reload or be shareable | URL (route params / search params) |
| Local to one component or a small subtree (open/closed, current input, selected item) | `useState` / `useReducer` |
| In-progress game interaction that the game owns (selection, drag order) | State inside the game's `client` |
| App-wide, rarely changing and needed far from its source (locale, session status) | A React context, in `app/` |
| Must survive a reload and is not server data | Browser storage, explicitly (see below) |

## How to use

### Server state

```tsx
const { data } = useToday();                  // never: const [today, setToday] = useState(data)
```

- Derive values during render (`const done = data.games.filter(...)`); do not store derived values.

### URL state

- Use route params for identity (`/:game_id`) and `useSearchParams` for filters in lists.

### Local state

- Keep state as low as possible and lift it only when two siblings need it.
- Use `useReducer` when the next state depends on several fields or on an action (e.g. Timeline ordering).

### Context

```tsx
// src/app/providers.tsx
export function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

- Contexts hold stable, low-frequency values only. Each module's cross-cutting context is listed in the app's overview.
- Expose a hook (`useX`) that throws a clear error when used outside its provider.

### Browser storage

- Store only per-viewer conveniences, never data that the `api` owns. Wrap reads and writes in `try/catch`; the app must work when storage is unavailable.
- Never store the solution, game state of an unfinished round, or tokens in `localStorage`.

## Rules

- Server data is read only through TanStack Query; never copied into `useState`, context or any store.
- No global state libraries (Redux, Zustand, MobX, Jotai) in v1.
- State that identifies a screen or filter goes in the URL, not in a context.
- Contexts are few, low-frequency and defined in `app/`; no context holds server data that has a query.
- Derived values are computed during render, not stored.
- `useEffect` is not used to sync one piece of state into another.
- Storage access is wrapped in `try/catch` and has a working fallback.
- The solution and in-progress game truth are never persisted client-side; the `api` owns them.

## Integration with other conventions

- **data-fetching**: owns everything that comes from the server.
- **routing**: owns URL state.
- **game-clients**: the game's own UI state stays inside its `client`.
