---
id: game-clients
display_name: UI de juegos (registry de clients)
language: react
description: "How the shell mounts each game's client package through a registry without per-game logic"
applies_to: [frontend]
required_by: []
package: null
---

# Game Clients (React)

Every game provides its own UI in `packages/games/<game_id>/client` (ADR-006). The app keeps a **registry** that maps `game_id` to that entry, and the shell talks to every game through the same contract. The shell has no game-specific logic: adding a game means adding a package and a registry line.

## When to use

- Any screen that shows a game's instructions, round, result or share text.
- The `web` game host and, in `admin`, the challenge preview in solution mode.

## Structure

```
src/modules/game-host/
├── registry.ts          # game_id -> lazy import of the client entry
├── game-host.tsx        # loads the client, renders Instructions / Game / Result
└── share-button.tsx     # Web Share API with Clipboard fallback (web)
```

## Configuration

```ts
// src/modules/game-host/registry.ts
import type { GameId } from '@nerdose/core';

export const clientRegistry = {
  'devdle': () => import('@nerdose/game-devdle/client'),
  'grep-grid': () => import('@nerdose/game-grep-grid/client'),
  'timeline': () => import('@nerdose/game-timeline/client'),
  'big-o': () => import('@nerdose/game-big-o/client'),
  'bug-hunt': () => import('@nerdose/game-bug-hunt/client'),
} satisfies Record<GameId, () => Promise<GameClient>>;
```

`GameClient` is the shape of the `./client` entry defined by the game contract: React components `Instructions`, `Game`, `Result` and `share(result, number): string`. The exact props of those components are owned by the game packages and `@nerdose/core`; the app passes them through and does not reinterpret them.

## How to use

### Mounting a game

```tsx
const Client = lazy(clientRegistry[gameId]);

<Suspense fallback={<GameSkeleton />}>
  <GameHost gameId={gameId} />
</Suspense>
```

- The host fetches the public view and the play state with TanStack Query (`/api/games/{game_id}/today`), then hands them to the client components.
- Moves go through the game's `moveSchema` (Zod) before `POST .../move`.

### Share

- `share(result, number)` produces the text. The shell calls `navigator.share({ text })` when available and falls back to `navigator.clipboard.writeText`, with a visible confirmation message. After sharing it calls `track('share:<game_id>')` (see `analytics`).

### Heavy dependencies stay inside the game

- Shiki (big-o, bug-hunt) and dnd-kit (timeline) are dependencies of the game packages and are loaded in the game's own chunk. The shell never imports them.

### Admin preview

- `admin` mounts the same `Game`/`Result` components in **solution mode** with the full `payload` returned by `/api/admin/*`, in Spanish and in English side by side. The admin renders the preview inside a container that makes it read-only (no moves are sent).

## Rules

- Import only `@nerdose/game-<game_id>/client`. Never `./definition` or `./generator`, and never `@nerdose/polyglot`.
- The registry is the only place that lists games. No `if (gameId === ...)` or `switch` by game anywhere in `apps/*`.
- Each game is loaded with a dynamic `import()` so it is its own chunk.
- The shell renders games only through `Instructions`, `Game`, `Result` and `share`; it does not read game-specific fields.
- The `client` never receives the solution before the round ends in `web`; the app never requests or caches anything beyond the public view and the move responses.
- Share text is never built by the shell; it always comes from the game's `share()`.
- Validate every move with the game's `moveSchema` before sending, and still handle `422 invalid_move` from the `api`.
- Adding a game must require only a new package, a registry line and its translations.

## Integration with other conventions

- **routing**: `/:game_id` resolves the registry entry and lazy-loads it.
- **data-fetching**: public view, play state and moves go through TanStack Query hooks.
- **analytics**: share events use `track()`.
- **accessibility**: every game must be fully playable with keyboard and its feedback must not rely only on color.
