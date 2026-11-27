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
    "./generator": "./src/generator/index.ts",
    "./wordlist": "./wordlist/words.txt"   // devdle only: data resource, not code
  }
}
```

There is no root `.` export: a consumer must pick an entry.

## How to use

### What each entry exports

| Entry | Exports | Consumer |
|---|---|---|
| `./definition` | `definition`: object implementing `GameDefinition` (`id`, `version`, `moveSchema`, `bankUsage`, `toPublic`, `initState`, `applyMove`, `isFinished`, `result`, `isWin`, `score`, `initialStats`, `reduceStats`, `codeLanguage`, `historyLabel`, `culprits`), plus the Zod schemas (`payloadSchema`, `moveSchema`, `stateSchema`, `publicViewSchema`, `resultSchema`, `statsSchema`) and their types | `apps/api`; `apps/generator` (`payloadSchema`, `version`); `./client`/`./generator` for types |
| `./client` | React components `Instructions`, `Game`, `Result`, `Preview({ payload, language })`, `StatsSummary({ extra, locale, t })`, `share(result, number, locale)`, `i18n` and `HELP_TARGET_ID` | `apps/web`, `apps/admin` (`Preview` only) |
| `./generator` | `generator`: `GameGenerator` with `historySpec`, `usedBankItems(payload)`, `generate({ date, seed, history })` and `verify(payload, history)` (returns `VerificationLog` or `Promise<VerificationLog>`) | `apps/generator` |

Members of `GameDefinition` that only some games use are still mandatory and take a neutral value in the others, so the shell never branches by `game_id`:

| Member | Games that use it | Neutral value |
|---|---|---|
| `bankUsage: BankUsage \| null` | `devdle`, `grep-grid` (`terms`), `timeline` (`timeline_facts`) | `null` (`big-o`, `bug-hunt`) |
| `culprits(p): Culprit[]` | games with a bank: the items of the payload that the admin can blame when voiding | `[]` (`big-o`: the culprit of a void is `template`) |
| `codeLanguage(s): CodeLanguage \| null` | `big-o`, `bug-hunt`: the language the Play was confirmed with (`s.language ?? null`); the `api` stores it in `plays.code_language` and in `players.preferred_code_language` | `null` (`devdle`, `grep-grid`, `timeline`) |

### What each entry may import

| Entry | May import | Must not import |
|---|---|---|
| `./definition` | `@nerdose/core` (`.`), `zod`, `shared/` | `@nerdose/polyglot`, `node:*`, React, `./generator`, `./client`, anything that executes code |
| `./client` | `@nerdose/core` (`.`), `zod`, `react`, `@nerdose/ui`, `shared/`, types from `./definition` | `@nerdose/polyglot`, `node:*`, `./generator`, runtime code of `./definition` that carries solutions |
| `./generator` | `@nerdose/core` (`.`), `zod`, `@nerdose/polyglot`, `shared/`, `./definition` | `./client`, React |

`shared/` holds only pure, isomorphic code (types, constants, helpers) with no Node or React dependencies.

### Registries

- `apps/api`: `game_id -> definition` (only `./definition`).
- `apps/web` / `apps/admin`: `game_id -> () => import('@nerdose/game-<id>/client')` (see `game-clients`).
- `apps/generator`: `game_id -> generator` (only `./generator`, and `./definition` if needed to validate).

## Rules

- One package per game, with `game_id` in `devdle | grep-grid | timeline | big-o | bug-hunt` and package name `@nerdose/game-<game_id>`.
- `exports` contains exactly `./definition`, `./client` and `./generator` (code entries). No default entry. A package may add a data resource (e.g. `./wordlist` in `devdle`, read only by the `api` with `node:fs`; `web` and `admin` never import it).
- `./definition` implements every method of `GameDefinition`; `toPublic` never includes the solution (per-game list in ADR-006).
- Every game has an anti-spoiler contract test: serialize `toPublic(payload)` and every pre-result response and verify none contains a solution value.
- `moveSchema` is the single schema used by `web` (before sending) and by `api` (validation); a parse failure is `422 invalid_move`.
- `share(result, number, locale)` never includes the solution nor the site: the `web` host appends `window.location.host` as the last line, so no domain is hard-coded; `locale` is optional in the game package (default `'es'`), so games without localized share text ignore it.
- `generate` is deterministic: same `{ date, seed, history }` gives the same payload. It never uses `Math.random()` or the current time; randomness comes from the PRNG built from the seed.
- Every player-facing text of a `Payload` is `{ es, en }`; `verify` fails if a language is missing.
- `verify` may be `async` (games that execute code through `@nerdose/polyglot`); the `generator` always `await`s it. It receives no date: a game whose variety checks need `D` carries it in the payload (`date`), as every game does (`big-o` declares it optional and fails `variety_*` without it).
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

## Update (REQ-009)

- `GameDefinition.codeLanguage(s)` joins `bankUsage` and `culprits` as a mandatory member with a neutral value (`null`) in the games without code (see the table above).
- `GameGenerator.verify` may return a `Promise`; `HistorySpec.aheadDays` is optional (default 0) and lets a game without a bank read approved challenges after `D` (`big-o`: `{ bank: null, lastUsedField: '', recentDays: 30, aheadDays: 30 }`).
- `big-o` is the first package whose `./generator` imports `@nerdose/polyglot` (`runInLanguage`, `wrapFunction`, the emitters and the tree builder); its `./client` loads Shiki lazily inside the game's chunk.

## Update (REQ-010)

- `./client` exports `share(result, number, locale)` (the host passes the active language; `locale` defaults to `'es'` in the package so the client is assignable before and after the host changes its type). `bug-hunt` is the first game whose share text is localized (`🟩 bug encontrado` / `🟩 bug found`).
- The Shiki infrastructure (`highlight.ts`, `shiki-vars.ts`, `use-tokenizer.ts`, the `radio` helper) is duplicated between `big-o` and `bug-hunt`: game packages do not import each other and Shiki cannot live in `@nerdose/ui` (ADR-002). Accepted duplication; if a third code game appears it is extracted to its own package.
- `bug-hunt/src/shared/format.ts` (`formatCall`, `formatValue`, `formatArgs`) is used by both `client` and `generator`, so the call the player sees equals the one in the server-side explanation (`generator/format.ts` re-exports it).

## Update (REQ-011)

- `./client` exports `StatsSummary({ extra, locale, t })` as a mandatory member (like `Preview`): it shows the game's own stats from `GameStatsView.extra` (parsed with the game's `statsSchema`).
- The values are derived by pure functions in `src/client/stats.ts` of each package (no React, no clock, no network, no storage; they do not mutate their input). `formatPercent` is duplicated per package (accepted duplication, ADR-002).
- `StatsSummary` never imports the board: `test/stats-summary-boundaries.test.ts` walks the relative import graph of `src/client/stats-summary.tsx` and fails if it reaches the board, Shiki or dnd-kit.
- The `streak` progress bar is drawn by `src/client/stat-bar.tsx`, duplicated in `timeline`, `big-o` and `bug-hunt` (D2) until `@nerdose/ui` implements the `streak` variant. Devdle extracts its bars to `distribution-bars.tsx`, shared by `Distribution` and `StatsSummary`.
- A game with no games played renders only `stats.none` (D1).
