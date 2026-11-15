---
id: game-clients
display_name: UI de juegos (registry de clients)
language: react
description: "How the shell mounts each game's client package through a registry without per-game logic"
applies_to: [frontend, library]
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

`GameClient` is the shape of the `./client` entry defined by the game contract: React components `Instructions`, `Game`, `Result` and `share(result, number, locale): string`. The exact props of those components are owned by the game packages and `@nerdose/core`; the app passes them through and does not reinterpret them.

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

- `share(result, number, locale)` produces the text; the host passes the active language and games without localized text ignore it. The shell calls `navigator.share({ text })` when available and falls back to `navigator.clipboard.writeText`, with a visible confirmation message. After sharing it calls `track('share:<game_id>')` (see `analytics`).

### Heavy dependencies stay inside the game

- Shiki (big-o, bug-hunt) and dnd-kit (timeline) are dependencies of the game packages and are loaded in the game's own chunk. The shell never imports them.

### Admin preview

- Each `client` also exports `Preview` with props `{ payload, language }` (REQ-008): read-only, shows the board with the solution overlaid, no API calls and no play state. `payload` is the full `{es,en}` payload and `language` picks the text. Games without `Preview` fall back to `PayloadView` in the admin.
- Contract: `Preview(props: { payload: unknown; language: Locale })`. It (a) parses `payload` with the game's own `payloadSchema` and lets the error propagate if it is invalid, (b) translates its texts with the package's own `i18n` resources according to `language` (it needs neither react-i18next nor the host's `t`), (c) uses `h3` headings and a root `<div lang={language}>` with no landmark of its own, (d) has no controls or effects (no `fetch`, no storage, no play state).
- What each game draws: Devdle, one solved row plus the word card (category, definition, summary); Grep Grid, the grid with the 8 words in `solution` state (same look as `found`, labelled "part of the solution") plus the word list with definitions; Timeline, the prompt plus the facts in `correct_order` with date and note.
- `admin` mounts `Preview` (and previously the same `Game`/`Result` components in **solution mode**) with the full `payload` returned by `/api/admin/*`, in Spanish and in English side by side. The admin renders the preview inside a container that makes it read-only (no moves are sent).

## Rules

- `web` never mounts `Preview`: it needs the full `payload`, which only `/api/admin/*` returns.
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

## Update (REQ-005)

- `GameProps.feedback: unknown | null`: the host passes the last `MoveResponse.feedback` to the `Game` component (`null` until the first move; it comes from `useSubmitMove().data`). The host does not interpret it; `GameRoute`/`GameScreens` forward it as-is.
- A client that needs it (Grep Grid: `not_a_word` and `already_found` do not change the state, they only exist in `feedback`) validates its shape and discards repeated values by identity, the same pattern as `moveError`. Clients that do not need it ignore it (Devdle).

## Update (REQ-009)

- `ClientBaseProps.codeLanguage: CodeLanguage` (generic: Big O and Bug Hunt use it, the other games ignore it) is `session.preferred_code_language ?? 'js'`. In a game package it is optional with default `'js'`, so a client is assignable to the host's component type whether or not the host already passes it. The `Game` reads it only on mount and when the challenge changes; switching the code tab is local state: no request, no persistence, and the chosen option survives it.
- Shiki (Big O, Bug Hunt) is loaded only through dynamic `import('shiki/…')` inside the game package (`highlight.ts`, own chunk), with the JS regex engine and the `css-variables` theme. The theme's `--shiki-*` variables are defined with `style` on the code block and point to DS tokens: no hex, no CSS file, no Shiki markup. While loading, or if loading fails, the same code is shown without color and with the same structure (no layout shift).
- Big O's `Preview` shows the code in plain text (it never loads Shiki, so the admin never pays for it) with local-view language tabs (CA-6: no effects, no fetch, no storage, no play state). The tabs are the only controls; the options are a read-only list, with the answer ("correcta") and the `trap_option` ("trampa") marked.

## Update (REQ-010)

- `GameClient.share(result, number, locale)`: the host (`share-button.tsx`) passes the active language; the games whose share text has no words ignore the third argument. Bug Hunt builds `🐛 Bug Hunt #N · <Language>` / `🟩 bug encontrado | 🟥 se me escapó` / `nerdose.dev` in `locale`, never the line nor the bug type.
- Bug Hunt's `Preview` shows the code in plain text (never loads Shiki) with local-view language tabs, the bug line tagged "línea del bug", non-eligible lines dimmed, the "tipo" and "mutación: from → to" chips, the visible tests (without the hidden row), the failing test, the fix of the active tab and the steps in `language`. The tabs are the only controls (no radios, hints or live regions).
- Bug Hunt's `Game` renders the eligible lines as a `radiogroup` (roving tabindex; arrows move focus, Space picks, Enter belongs to "Confirmar línea") and validates `moveSchema.parse({ language, line })` before `onMove`; the selected line is local state and is never restored on resume.
