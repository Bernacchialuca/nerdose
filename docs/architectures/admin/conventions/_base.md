---
id: _base
display_name: Convenciones generales (React + Vite)
language: react
description: "Base conventions for the nerdose React 19 + Vite single-page apps (always active)"
applies_to: [frontend]
required_by: []
package: react
---

# Base Conventions (React, Vite)

Always active in `web` and `admin`. Defines what does not vary across modules or screens: SPA with Vite (no SSR), strict TypeScript, project layout, import boundaries with the monorepo packages, environment variables and dates. This is a custom base because the catalog only ships `nextjs`, which assumes App Router and Server Components that these apps do not use.

## SPA, no server rendering

- The app is a client-rendered single-page app built with **Vite**, React 19 and TypeScript. There is no SSR, no Server Components and no server code inside `apps/web` or `apps/admin`.
- Entry point is `index.html` + `src/main.tsx`, which mounts `<App />` inside `StrictMode`.
- All data comes from the `api` over HTTP (see `data-fetching`). The static build is served by the hosting layer (deferred); the app never assumes a Node runtime.
- Heavy or per-feature code is split with `React.lazy` + dynamic `import()` (see `routing`).

## TypeScript

- TypeScript is mandatory. `tsconfig.json` extends the monorepo base with `strict: true` and `noUncheckedIndexedAccess: true`.
- `target: ES2022` or higher, `moduleResolution: bundler`, `jsx: react-jsx`.
- No `any` except at boundaries with untyped libraries, and then wrapped in a typed function.
- Path alias `@/*` resolves to `src/*` (configured in `tsconfig.json` and in `vite.config.ts`).
- API payload types come from the shared packages (`@nerdose/core`, `@nerdose/game-<game_id>`); do not redeclare them locally.

## Project structure

```
apps/{web|admin}/
├── index.html
├── vite.config.ts                # aliases, dev proxy, VITE_* handling
├── src/
│   ├── main.tsx                  # mounts <App />
│   ├── app/                      # providers, router, shell/layout, error boundaries
│   ├── modules/                  # one folder per domain module (see manifest `modules`)
│   │   └── {module}/
│   │       ├── routes/           # route components (lazy-loaded entry points)
│   │       ├── components/       # components used only by this module
│   │       ├── api/              # query/mutation hooks + query keys of the module
│   │       └── index.ts          # public surface of the module
│   ├── components/               # app-wide reusable components (not in @nerdose/ui)
│   ├── lib/
│   │   ├── env.ts                # typed, validated import.meta.env
│   │   ├── api-client.ts         # fetch wrapper (see data-fetching)
│   │   └── utils.ts              # cn() and small pure helpers
│   ├── hooks/                    # generic custom hooks
│   ├── i18n/                     # web only: i18next setup and ES/EN resources
│   └── test/                     # test setup and shared test utilities
├── e2e/                          # Playwright specs
├── public/                       # static assets served as-is
└── package.json
```

- **`app/`**: wiring only (providers, router, layout). No business logic.
- **`modules/{module}/`**: everything that belongs to one module. A module never imports from another module's internals; it uses that module's `index.ts` or goes through `lib/` or a shared package.
- **`components/`**: reusable pieces specific to the app. Anything shared by `web` and `admin` belongs in `@nerdose/ui`, not copied.
- **`lib/`**: no JSX. Clients, validated env, pure helpers.
- The shell contains **no per-game logic** (see `game-clients`).

## Monorepo boundaries

- Internal packages are imported by name: `@nerdose/core`, `@nerdose/ui`, `@nerdose/game-<game_id>/client`.
- From a game package, only the `./client` entry may be imported. Never `./definition` or `./generator`.
- Never import `@nerdose/db`, `@nerdose/polyglot` or `@nerdose/content`.
- Never import from another app (`apps/*` do not depend on each other).
- Shared UI goes to `packages/ui`; if a component is needed in both apps, move it there instead of duplicating it.

## Naming

| Element | Convention | Example |
|---|---|---|
| Files (general) | `kebab-case` | `game-card.tsx`, `format-date.ts` |
| Components (exported) | `PascalCase` | `export function GameCard()` |
| Folders | `kebab-case` | `game-host/`, `content-stock/` |
| Hooks | `use-*` file, `useX` export | `use-today.ts` -> `useToday` |
| Query keys | factory per module | `todayKeys.all`, `reportKeys.list(filters)` |
| Types / interfaces | `PascalCase`, no `I` prefix | `TodayResponse` |
| Constants | `SCREAMING_SNAKE_CASE` | `RESET_JITTER_MAX_MS` |
| API fields | `snake_case`, exactly as the API | `challenge_number`, `seconds_to_reset` |

Component files export one main component; tests live next to the file as `*.test.tsx`.

## Imports

- Absolute imports via `@/*`. No `../../../`.
- Order within a file: (1) external libraries and `@nerdose/*`, (2) `@/` imports, (3) relative imports from the same folder. Separate groups with a blank line.
- Type-only imports use `import type`.

## Environment variables

- All `import.meta.env` access happens in **one place** (`src/lib/env.ts`), validated with Zod at module load so a bad build fails fast.
- Only `VITE_*` variables reach the bundle. Everything in the bundle is public: never put secrets in a `VITE_*` variable.
- Known variables: `VITE_PLAUSIBLE_DOMAIN` and `VITE_PLAUSIBLE_SCRIPT_URL` (web only, see `analytics`). Plausible's script URL is required only when the domain is set.
- The rest of the code consumes the typed `env` object, not `import.meta.env`.

## Dates

- At system boundaries (HTTP, logs) dates are ISO 8601 UTC; day dates are `YYYY-MM-DD`.
- The client **never decides what "today" is**: the day and challenge number come from the `api`. Countdowns use `seconds_to_reset` / `next_reset_at` from the response.
- Format dates for display with `Intl.DateTimeFormat` using the active locale. Never assume the browser timezone equals UTC.

## Async / Promises

- `async/await` over `.then()`.
- Components are never `async`. Data loading goes through TanStack Query hooks (see `data-fetching`).
- Unhandled promise rejections are a bug. Event handlers that call async code handle or surface the error.

## Comments

- Default: no comments. Clear names explain the code.
- Comment only the why when it is not obvious (workaround, external constraint, surprising decision).
- No `// TODO` without an associated issue.
