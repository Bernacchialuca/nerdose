# Reusable Code Index - core

Package `@nerdose/core` (`packages/core`), isomorphic entry `.`.

## Errors (2 items) - see errors.md
- **ERROR_CATALOG** (packages/core/src/errors.ts) - Closed catalog of 22 error codes with their HTTP status
- **AppError** (packages/core/src/errors.ts) - Domain error class; takes `status` from the catalog

## Game contract (8 items) - see game-contract.md
- **GAME_IDS / GameId / MoveError** (packages/core/src/game-definition.ts) - Game ids and shared literal types
- **isGameId** (packages/core/src/game-definition.ts) - Type guard narrowing `unknown` to `GameId`
- **GameDefinition** (packages/core/src/game-definition.ts) - Server-side contract every game package implements (ADR-006); `toPublic(p, locale, state?)` takes the Play state as optional 3rd parameter; `applyMove` takes `ctx: MoveContext` as 5th parameter
- **MoveContext** (packages/core/src/game-definition.ts) - `{ isValidWord(word), locale }` built by the api from `WordList.has` and the resolved locale
- **BankUsage / GameDefinition.bankUsage** (packages/core/src/game-definition.ts) - Bank a game consumes, `last_used_*` column, reuse window and items per challenge (`null` if none); the api builds the stock from the registry (REQ-008)
- **Culprit / CulpritKind / GameDefinition.culprits** (packages/core/src/game-definition.ts) - Bank item a challenge references (`term` | `timeline_fact`); `culprits(p)` returns them for the admin void flow (REQ-007)
- **GameDefinition.codeLanguage** (packages/core/src/game-definition.ts) - Required member `codeLanguage(s): CodeLanguage | null`; language the Play was confirmed with (Big O, Bug Hunt), `null` in games without code (REQ-009)
- **GameGenerator / AnyGameGenerator** (packages/core/src/game-generator.ts) - Generator contract with `historySpec`, `usedBankItems`, `generate`, `verify`; `verify` may return a `Promise` and `historySpec.aheadDays` is optional (REQ-009)
- **GeneratorHistory / RecentChallenge / HistorySpec / BankName / VerificationLog / VerificationCheck** (packages/core/src/game-generator.ts) - Generic history and verification log types

## Shared enums (11 items) - see enums.md
- **LOCALES / Locale** (packages/core/src/enums.ts) - Supported locales `es`, `en`
- **CODE_LANGUAGES / CodeLanguage** (packages/core/src/enums.ts) - Code languages `js`, `go`, `java`
- **BIG_O_OPTIONS / BigOOption** (packages/core/src/enums.ts) - The 8 Big O options in fixed order, aligned with `BigOOption` in `api.yaml`
- **RECIPE_CATEGORIES / RecipeCategory** (packages/core/src/enums.ts) - The 5 recipe categories (initial, extensible set), aligned with `RecipeCategory` in `api.yaml`; no pgEnum
- **BUG_TYPES / BugType** (packages/core/src/enums.ts) - The 7 Bug Hunt bug types in fixed order, aligned with `BugType` in `api.yaml`; no pgEnum (lives in `challenges.payload` and `extra.by_bug_type`)
- **TERM_CATEGORIES / TermCategory** (packages/core/src/enums.ts) - Eight term categories in fixed order (aligned with PG enum `term_category`)
- **TIMELINE_CATEGORIES / TimelineCategory** (packages/core/src/enums.ts) - Eight timeline fact categories in fixed order (aligned with PG enum `timeline_category`)
- **DATE_PRECISIONS / DatePrecision** (packages/core/src/enums.ts) - Date precisions `year`, `month`, `day` (aligned with PG enum `date_precision`)
- **GENERATION_REQUEST_STATUSES / GenerationRequestStatus** (packages/core/src/enums.ts) - Regeneration request statuses `pending`, `done`, `failed`, `cancelled` (aligned with PG enum `generation_request_status`)
- **REPORT_REASONS / ReportReason** (packages/core/src/enums.ts) - Report reasons (aligned with PG enum `report_reason`)
- **REPORT_STATUSES / ReportStatus** (packages/core/src/enums.ts) - Report statuses `open`, `resolved`, `dismissed` (aligned with PG enum `report_status`)

## Platform day (10 items) - see platform-day.md
- **today / challengeNumber / nextResetAt / secondsToReset** (packages/core/src/platform-day.ts) - Pure UTC day, challenge number and reset countdown functions
- **nextStreak / liveStreak / StreakInput** (packages/core/src/streaks.ts) - Single streak implementation with neutral days (ADR-011)
- **isStreakAlive** (packages/core/src/streaks.ts) - ADR-011 live-streak predicate (completed today or on/after the previous active day); base of `liveStreak`/`nextStreak`, used by the api for the admin streak distribution
- **validateMetricsRange / MetricsRangeReason / MetricsRangeResult** (packages/core/src/platform-day.ts) - Admin metrics range check (`from <= to`, `to <= today`, at most 366 days inclusive); returns `'ok'` or `from_after_to` | `future` | `too_long`; shared by api and admin
- **replayStreak / ReplayedStreak** (packages/core/src/streaks.ts) - Rebuilds a streak from completed and active days by chaining `nextStreak` (ADR-011 recompute)
- **rebuildGameStats / CompletedPlay / RebuiltGameStats** (packages/core/src/streaks.ts) - Rebuilds played/wins/extra from completed plays, skipping voided

## PRNG (1 item) - see prng.md
- **rngFrom / Rng** (packages/core/src/prng.ts) - Deterministic xoroshiro128+ from a seed, with `next`, `int`, `pick`

## Game registry (1 item) - see game-registry.md
- **createGameRegistry** (packages/core/src/game-registry.ts) - Validated registry of game definitions with `ids()` and `get(id)`

## Test fixtures (6 items)
- **makeDefinition** (packages/core/test/fixtures/fake-definition.ts) - Complete fake `GameDefinition` for tests
- **makeWordDefinition** (packages/core/test/fixtures/fake-definition.ts) - Fake `GameDefinition` whose `applyMove` uses `ctx.isValidWord`
- **makeLocalizedDefinition** (packages/core/test/fixtures/fake-definition.ts) - Fake `GameDefinition` that uses `ctx.locale` in the `Feedback` and `state` in `toPublic`
- **makeGenerator** (packages/core/test/fixtures/fake-generator.ts) - Fake `GameGenerator` with Devdle `historySpec`
- **makeCodeDefinition** (packages/core/test/fixtures/fake-definition.ts) - Fake Big O-shaped code game with `codeLanguage = s.language ?? null`
- **makeAsyncGenerator** (packages/core/test/fixtures/fake-generator.ts) - `makeGenerator()` with async `verify` and `historySpec.aheadDays: 2`
