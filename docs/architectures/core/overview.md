# core — Overview

## Proposito
Paquete `@nerdose/core` (`packages/core`): la lógica y los contratos que comparten `api`, `generator`, `web` y `admin`. La entrada `.` es **isomorfa** (corre en Node y en el navegador, sin `node:*`) y expone el contrato `GameDefinition` y sus tipos, el registry de juegos, el día UTC de la plataforma, el número de desafío, las rachas con días neutros, el seed/PRNG y el `ERROR_CATALOG` con `AppError`.

## Tipo de servicio
Library en node (TypeScript estricto, Node.js 24 LTS). Vive en `packages/core` y la consumen todas las apps. ADR-003, 006, 008, 011, 013 y 015.

## Modulos del dominio
- **game-contract**: `GameId`, `Locale`, `GameDefinition`, `MoveError` y `createGameRegistry()` (ADR-006).
- **errors**: `ERROR_CATALOG`, `AppError` y `ErrorCode` (ADR-015).
- **platform-day**: `today()`, `challengeNumber()`, `nextStreak()`, `liveStreak()` y `isStreakAlive(lastCompleted, prevActiveDay, today)` (el predicado sobre el que se construye `liveStreak`, también usado por las métricas del admin), más `validateMetricsRange(from, to, today)` (isomorfa, compartida por `api` y `admin`: `from <= to`, `to <= today`, `to − from <= 365`; motivos `from_after_to`, `future`, `too_long`) (ADR-008, ADR-011, REQ-011).
- **seed-prng**: derivación y uso del seed y del PRNG (ADR-007).

## Notas adicionales
- **Convenciones copiadas tal cual** (con `library` agregado a `applies_to`): `error-handling`, `validation`, `testing`, `game-registry` y `platform-day` vienen de `api`. Si se cambia una, hay que cambiar la otra. No hay convenciones nuevas.
- **Seed y PRNG:** el seed (`HMAC-SHA256(GENERATOR_SECRET, "{game_id}:{date}:{attempt}")`, con `node:crypto`) se calcula **solo en `apps/generator`** (convención `challenge-generation` del generator): necesita `GENERATOR_SECRET`, que existe solo ahí, y `node:crypto`, que no puede ir en la entrada isomorfa. `core` expone solo el PRNG determinista `rngFrom(seed: Uint8Array)` sobre `pure-rand` (xoroshiro128+), que es isomorfo y lo usan los `generator` de cada juego.
- **Reglas de entrada:** `@nerdose/core` tiene una sola entrada `.`, que no importa `node:*` (ADR-003; la entrada `./notify` se eliminó con el ADR-017).
- **Idioma de las convenciones:** siguen el template del workflow (contenido y encabezados en inglés, `display_name` en español); `overview.md` e `index.md` van en español.

---

**Manifest:** [manifest.yaml](./manifest.yaml)
**Indice de arquitectura:** [index.md](./index.md)

## Update (REQ-006)

- `TIMELINE_CATEGORIES`, `TimelineCategory`, `DATE_PRECISIONS` and `DatePrecision` live in `core/src/enums.ts` (like `TERM_CATEGORIES`); `@nerdose/content` re-exports them. The `timeline` game package imports them from `core`, so it does not depend on `content` at runtime.

## Update (REQ-007)

- `replayStreak` and `rebuildGameStats` (`core/src/streaks.ts`): pure recompute of ADR-011, the base of `recomputeStats` in the `api`.
- `GameDefinition.culprits(p): Culprit[]` (types `Culprit` and `CulpritKind` in `game-definition.ts`).
- `invalid_culprit` (422) in `ERROR_CATALOG`.
- `REPORT_REASONS` and `REPORT_STATUSES` in `enums.ts`.

## Update (REQ-008)

- `BankUsage` and `GameDefinition.bankUsage: BankUsage | null` (`game-definition.ts`): which bank a game consumes, its `last_used_*` field, its reuse window and the items per challenge. The `api` builds the content stock from it (convention `game-registry`).
- `GENERATION_REQUEST_STATUSES` (`pending`, `done`, `failed`, `cancelled`) and `GenerationRequestStatus` in `enums.ts`: the status of the regeneration queue (`generation_requests`).
- The `./client` entry of every game adds `Preview({ payload, language })` (ADR-006). It lives in the game packages, not in `core`; the admin keeps its own structural `PreviewProps` type.

## Update (REQ-009)

- `GameDefinition.codeLanguage(s: State): CodeLanguage | null` (`game-definition.ts`): the language the Play was confirmed with. Big O and Bug Hunt return `s.language ?? null`; Devdle, Grep Grid and Timeline return `null`. The `api` stores it in `plays.code_language` when closing the Play and, if it is not `null`, updates `players.preferred_code_language` in the same transaction, without branching by `game_id` (ADR-006). Same pattern as `culprits` and `bankUsage`: a mandatory member with a neutral value in the games that do not use it.
- `GameGenerator.verify(p, history): VerificationLog | Promise<VerificationLog>` (`game-generator.ts`): games that execute code (Big O, Bug Hunt) are asynchronous; `generateForDate` always `await`s it, so the synchronous generators do not change.
- `HistorySpec.aheadDays?: number` (default 0): days after `D` also read as history. The `generator` reads `recentChallenges` in `[D - recentDays, D + aheadDays]` excluding the row of `D`. Big O: `{ bank: null, lastUsedField: '', recentDays: 30, aheadDays: 30 }`.
- `BIG_O_OPTIONS` (`o_1`, `o_log_n`, `o_n`, `o_n_log_n`, `o_n2`, `o_n3`, `o_2n`, `o_n_fact`, in this fixed order) with `BigOOption`, and `RECIPE_CATEGORIES` (`simple_loops`, `nested_loops`, `recursion`, `divide_and_conquer`, `binary_search`) with `RecipeCategory`, in `enums.ts` next to `CODE_LANGUAGES`. The order of `BIG_O_OPTIONS` is the order of `public_view.options` (never dependent on the answer).
- `core` does not import `@nerdose/polyglot` nor execute code: the toolchain check at startup (`warn` if Go >= 1.25 or JDK 21 are missing) lives in `apps/generator` and uses `checkToolchains()` of `@nerdose/polyglot`.

## Update (REQ-010)

- `BUG_TYPES` (`off_by_one`, `comparison`, `wrong_operator`, `wrong_variable`, `bad_initialization`, `misplaced_return`, `inverted_condition`, in this fixed order) with `BugType`, in `enums.ts` after `RECIPE_CATEGORIES`. Bug Hunt uses it in its payload and its result, and in the per-`bug_type` stats; it never appears in a public view (ADR-006). No pgEnum: the values live in `jsonb`.
- Bug Hunt implements `codeLanguage` as `s.language ?? null`, like Big O, and its `verify` is asynchronous (it runs code through `@nerdose/polyglot`).
