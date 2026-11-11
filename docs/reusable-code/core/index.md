# Reusable Code Index - core

Package `@nerdose/core` (`packages/core`), isomorphic entry `.`.

## Errors (2 items) - see errors.md
- **ERROR_CATALOG** (packages/core/src/errors.ts) - Closed catalog of 21 error codes with their HTTP status
- **AppError** (packages/core/src/errors.ts) - Domain error class; takes `status` from the catalog

## Game contract (6 items) - see game-contract.md
- **GAME_IDS / GameId / MoveError** (packages/core/src/game-definition.ts) - Game ids and shared literal types
- **isGameId** (packages/core/src/game-definition.ts) - Type guard narrowing `unknown` to `GameId`
- **GameDefinition** (packages/core/src/game-definition.ts) - Server-side contract every game package implements (ADR-006); `toPublic(p, locale, state?)` takes the Play state as optional 3rd parameter; `applyMove` takes `ctx: MoveContext` as 5th parameter
- **MoveContext** (packages/core/src/game-definition.ts) - `{ isValidWord(word), locale }` built by the api from `WordList.has` and the resolved locale
- **GameGenerator / AnyGameGenerator** (packages/core/src/game-generator.ts) - Generator contract with `historySpec`, `usedBankItems`, `generate`, `verify`
- **GeneratorHistory / RecentChallenge / HistorySpec / BankName / VerificationLog / VerificationCheck** (packages/core/src/game-generator.ts) - Generic history and verification log types

## Shared enums (5 items) - see enums.md
- **LOCALES / Locale** (packages/core/src/enums.ts) - Supported locales `es`, `en`
- **CODE_LANGUAGES / CodeLanguage** (packages/core/src/enums.ts) - Code languages `js`, `go`, `java`
- **TERM_CATEGORIES / TermCategory** (packages/core/src/enums.ts) - Eight term categories in fixed order (aligned with PG enum `term_category`)
- **TIMELINE_CATEGORIES / TimelineCategory** (packages/core/src/enums.ts) - Six timeline fact categories in fixed order (aligned with PG enum `timeline_category`)
- **DATE_PRECISIONS / DatePrecision** (packages/core/src/enums.ts) - Date precisions `year`, `month`, `day` (aligned with PG enum `date_precision`)

## Platform day (6 items) - see platform-day.md
- **today / challengeNumber / nextResetAt / secondsToReset** (packages/core/src/platform-day.ts) - Pure UTC day, challenge number and reset countdown functions
- **nextStreak / liveStreak / StreakInput** (packages/core/src/streaks.ts) - Single streak implementation with neutral days (ADR-011)

## PRNG (1 item) - see prng.md
- **rngFrom / Rng** (packages/core/src/prng.ts) - Deterministic xoroshiro128+ from a seed, with `next`, `int`, `pick`

## Game registry (1 item) - see game-registry.md
- **createGameRegistry** (packages/core/src/game-registry.ts) - Validated registry of game definitions with `ids()` and `get(id)`

## Test fixtures (4 items)
- **makeDefinition** (packages/core/test/fixtures/fake-definition.ts) - Complete fake `GameDefinition` for tests
- **makeWordDefinition** (packages/core/test/fixtures/fake-definition.ts) - Fake `GameDefinition` whose `applyMove` uses `ctx.isValidWord`
- **makeLocalizedDefinition** (packages/core/test/fixtures/fake-definition.ts) - Fake `GameDefinition` that uses `ctx.locale` in the `Feedback` and `state` in `toPublic`
- **makeGenerator** (packages/core/test/fixtures/fake-generator.ts) - Fake `GameGenerator` with Devdle `historySpec`
