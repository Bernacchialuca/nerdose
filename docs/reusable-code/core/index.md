# Reusable Code Index - core

Package `@nerdose/core` (`packages/core`), isomorphic entry `.`.

## Errors (2 items) - see errors.md
- **ERROR_CATALOG** (packages/core/src/errors.ts) - Closed catalog of 21 error codes with their HTTP status
- **AppError** (packages/core/src/errors.ts) - Domain error class; takes `status` from the catalog

## Game contract (3 items) - see game-contract.md
- **GAME_IDS / GameId / MoveError** (packages/core/src/game-definition.ts) - Game ids and shared literal types
- **isGameId** (packages/core/src/game-definition.ts) - Type guard narrowing `unknown` to `GameId`
- **GameDefinition** (packages/core/src/game-definition.ts) - Server-side contract every game package implements (ADR-006)

## Shared enums (2 items) - see enums.md
- **LOCALES / Locale** (packages/core/src/enums.ts) - Supported locales `es`, `en`
- **CODE_LANGUAGES / CodeLanguage** (packages/core/src/enums.ts) - Code languages `js`, `go`, `java`

## Platform day (4 items) - see platform-day.md
- **today / challengeNumber / nextResetAt / secondsToReset** (packages/core/src/platform-day.ts) - Pure UTC day, challenge number and reset countdown functions

## Game registry (1 item) - see game-registry.md
- **createGameRegistry** (packages/core/src/game-registry.ts) - Validated registry of game definitions with `ids()` and `get(id)`

## Test fixtures (1 item)
- **makeDefinition** (packages/core/test/fixtures/fake-definition.ts) - Complete fake `GameDefinition` for tests
