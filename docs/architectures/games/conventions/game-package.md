---
id: game-package
display_name: Estructura de un paquete de juego
language: node
description: Layout of a packages/games/<game_id> package, its three entries (definition, client, generator) and what each entry may import
applies_to: [library]
required_by: []
package: null
---

# Game Package (Node, workspace library)

Each game is a package `@nerdose/game-<game_id>` under `packages/games/<game_id>` that implements the contract of `@nerdose/core` (ADR-006) and exposes **three separate entries** (ADR-003). Adding a game means adding a package and registering it in the registries of `api`, `web`/`admin` and `generator`; no routes, tables or streak logic change.

## When to use

- Creating one of the five games (`devdle`, `grep-grid`, `timeline`, `big-o`, `bug-hunt`).
- Changing what a game exposes to a consumer.

## Package

```
@nerdose/core       # GameDefinition, GameGenerator, GameId, Locale, MoveError, AppError
zod                 # moveSchema and payload schemas
react               # only in ./client (peer dependency)
```

Game-specific dependencies stay inside the game package (Shiki for `big-o` and `bug-hunt`, dnd-kit for `timeline`, `@nerdose/polyglot` for the generators of `big-o` and `bug-hunt`).

## Structure

```
packages/games/<game_id>/
├── package.json              # name @nerdose/game-<game_id>, exports map below
├── src/
│   ├── definition/           # server contract: GameDefinition implementation
│   │   ├── index.ts          # exports `definition`
│   │   ├── schemas.ts        # Zod: payload, move, public view, result
│   │   └── *.test.ts         # contract tests incl. anti-spoiler
│   ├── client/               # React UI: Instructions, Game, Result, share()
│   │   ├── index.ts
│   │   └── *.test.tsx
│   ├── generator/            # GameGenerator: generate() and verify()
│   │   ├── index.ts          # exports `generator`
│   │   └── *.test.ts
│   └── shared/               # pure types and helpers used by more than one entry
└── (extra assets of the game, e.g. wordlist/ for devdle)
```

```jsonc
// package.json (exports)
{
  "name": "@nerdose/game-devdle",
  "exports": {
    "./definition": "./src/definition/index.ts",
    "./client": "./src/client/index.ts",
    "./generator": "./src/generator/index.ts"
  }
}
```

There is no root `.` export: a consumer must pick an entry.

## How to use

### What each entry exports

| Entry | Exports | Consumer |
|---|---|---|
| `./definition` | `definition`: object implementing `GameDefinition` (`moveSchema`, `toPublic`, `initState`, `applyMove`, `isFinished`, `result`, `isWin`, `score`, `initialStats`, `reduceStats`, `historyLabel`) | `apps/api`, and `./client`/`./generator` for types |
| `./client` | React components `Instructions`, `Game`, `Result` and `share(result, number)` | `apps/web`, `apps/admin` |
| `./generator` | `generator`: `GameGenerator` with `generate({ date, seed, history })` and `verify(payload, ctx)` | `apps/generator` |

### What each entry may import

| Entry | May import | Must not import |
|---|---|---|
| `./definition` | `@nerdose/core` (`.`), `zod`, `shared/` | `@nerdose/polyglot`, `node:*`, React, `./generator`, `./client`, anything that executes code |
| `./client` | `@nerdose/core` (`.`), `zod`, `react`, `@nerdose/ui`, `shared/`, types from `./definition` | `@nerdose/polyglot`, `node:*`, `@nerdose/core/notify`, `./generator`, runtime code of `./definition` that carries solutions |
| `./generator` | `@nerdose/core` (`.`), `zod`, `@nerdose/polyglot`, `shared/`, `./definition` | `./client`, React |

`shared/` holds only pure, isomorphic code (types, constants, helpers) with no Node or React dependencies.

### Registries

- `apps/api`: `game_id -> definition` (only `./definition`).
- `apps/web` / `apps/admin`: `game_id -> () => import('@nerdose/game-<id>/client')` (see `game-clients`).
- `apps/generator`: `game_id -> generator` (only `./generator`, and `./definition` if needed to validate).

## Rules

- One package per game, with `game_id` in `devdle | grep-grid | timeline | big-o | bug-hunt` and package name `@nerdose/game-<game_id>`.
- `exports` contains exactly `./definition`, `./client` and `./generator`. No default entry.
- `./definition` implements every method of `GameDefinition`; `toPublic` never includes the solution (per-game list in ADR-006).
- Every game has an anti-spoiler contract test: serialize `toPublic(payload)` and every pre-result response and verify none contains a solution value.
- `moveSchema` is the single schema used by `web` (before sending) and by `api` (validation); a parse failure is `422 invalid_move`.
- `share(result, number)` never includes the solution and ends with `nerdose.dev`.
- `generate` is deterministic: same `{ date, seed, history }` gives the same payload. It never uses `Math.random()` or the current time; randomness comes from the PRNG built from the seed.
- Every player-facing text of a `Payload` is `{ es, en }`; `verify` fails if a language is missing.
- `./definition` and `./client` never import `@nerdose/polyglot`, `node:child_process` or anything that executes code (enforced by ESLint, see `monorepo-tooling`).
- Heavy dependencies (Shiki, dnd-kit) belong to the game package and load in the game's own chunk.
- Changing the `GameDefinition` interface touches all five packages in the same commit.

## Integration with other conventions

- **game-registry**: how `api` consumes `./definition`.
- **game-clients**: how `web`/`admin` consume `./client`.
- **validation**: `moveSchema` and payload schemas with Zod.
- **testing**: contract, determinism and unit tests per entry.
- **styling** / **accessibility** / **testing-unit**: apply to `./client`.
- **monorepo-tooling**: import boundaries enforced by lint.
