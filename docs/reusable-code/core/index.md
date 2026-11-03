# Reusable Code Index - core

Package `@nerdose/core` (`packages/core`), isomorphic entry `.`.

## Errors (2 items) - see errors.md
- **ERROR_CATALOG** (packages/core/src/errors.ts) - Closed catalog of 21 error codes with their HTTP status
- **AppError** (packages/core/src/errors.ts) - Domain error class; takes `status` from the catalog

## Game contract (2 items) - see game-contract.md
- **GAME_IDS / GameId / Locale / MoveError** (packages/core/src/game-definition.ts) - Game ids and shared literal types
- **GameDefinition** (packages/core/src/game-definition.ts) - Server-side contract every game package implements (ADR-006)

## Game registry (1 item) - see game-registry.md
- **createGameRegistry** (packages/core/src/game-registry.ts) - Validated registry of game definitions with `ids()` and `get(id)`

## Test fixtures (1 item)
- **makeDefinition** (packages/core/test/fixtures/fake-definition.ts) - Complete fake `GameDefinition` for tests
