---
id: routing
display_name: Routing (React Router)
language: react
description: "Client-side routing for the web SPA with React Router and lazy-loaded game routes"
applies_to: [frontend]
required_by: []
package: react-router
---

# Routing (React, React Router)

Client-side routing with **React Router** in data-router mode (`createBrowserRouter`). The route table is small and fixed; each game's screen is a lazy chunk so the home loads fast on 4G (NFR-P02). There is no server routing: the host serves `index.html` for every path (deferred hosting requirement).

## When to use

- Any navigation between screens of `web`: home, a game, stats, about.
- Any code split by screen or by game.

## Package

```
react-router      # createBrowserRouter, Link, useParams, useNavigate
```

## Structure

```
src/
├── app/
│   ├── router.tsx                 # the route table
│   └── shell.tsx                  # layout: header, banners, <Outlet />
└── modules/
    ├── catalog/routes/home.tsx            # /
    ├── game-host/routes/game.tsx          # /:game_id
    ├── stats/routes/stats.tsx             # /stats
    └── about/routes/about.tsx             # /about
```

## Route table

| Path | Module | Notes |
|---|---|---|
| `/` | `catalog` | Home: today's state of the 5 games, streak, countdown |
| `/:game_id` | `game-host` | Instructions, round and result of one game. `game_id` in `devdle \| grep-grid \| timeline \| big-o \| bug-hunt`; anything else renders the not-found screen |
| `/stats` | `stats` | Player stats |
| `/about` | `about` | About / how it works |
| `*` | `shell` | Not found |

## Configuration

```tsx
// src/app/router.tsx
export const router = createBrowserRouter([
  {
    element: <Shell />,
    errorElement: <RouteError />,
    children: [
      { index: true, lazy: () => import('@/modules/catalog/routes/home') },
      { path: ':game_id', lazy: () => import('@/modules/game-host/routes/game') },
      { path: 'stats', lazy: () => import('@/modules/stats/routes/stats') },
      { path: 'about', lazy: () => import('@/modules/about/routes/about') },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
```

## How to use

### One chunk per game

The game-host route resolves the game from the registry and loads its `client` entry with `React.lazy`; see `game-clients`. The route component wraps it in `<Suspense>` with an accessible loading state.

```tsx
const GameView = lazy(() => loadGameClient(gameId)); // registry lookup, no per-game branching
```

### Validating `:game_id`

```tsx
const { game_id } = useParams();
if (!isGameId(game_id)) return <NotFound />;   // isGameId comes from @nerdose/core
```

### Navigation and focus

- Use `<Link>` / `useNavigate`, never `window.location` for in-app navigation.
- On route change, move focus to the page `<h1>` (or the `main` landmark) and update `document.title`, so keyboard and screen-reader users know the screen changed.

### Day change

- Routes do not depend on the day. When the countdown reaches 0 the catalog and the open game refetch their queries (see `data-fetching`); the URL does not change.

## Rules

- All routes are declared in `src/app/router.tsx`; no routes defined elsewhere.
- Every route component is lazy-loaded (`lazy` or `React.lazy`). The shell and the home are the only eagerly loaded UI.
- A game's code is loaded only when its route (or its preview of instructions) is opened; the home never imports a game's `client` entry.
- Route components are thin: they compose module components and read params; logic lives in module hooks.
- `:game_id` is validated before use; an unknown id shows the not-found screen, never a broken game.
- No per-game `if`/`switch` in the router or the shell; the registry decides (see `game-clients`).
- Route-level errors render through `errorElement` (see `error-handling`).
- Each route sets a meaningful `document.title` and moves focus on navigation.
- Links to external sites use `rel="noopener noreferrer"`.

## Integration with other conventions

- **game-clients**: `/:game_id` mounts the game's lazy `client` through the registry.
- **error-handling**: `errorElement` and the not-found screen.
- **accessibility**: focus management and page titles on navigation.
- **analytics**: pageviews are reported by Plausible's own script on route changes when enabled.
