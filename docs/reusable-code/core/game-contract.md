# Game contract

## GAME_IDS, GameId, Locale, MoveError
- **Location:** packages/core/src/game-definition.ts
- **Description:** `GAME_IDS` is the runtime list of the five ids; `GameId` derives from it. `Locale = 'es' | 'en'`. `MoveError = 'invalid_move' | 'not_in_word_list'`.

## GameDefinition
- **Location:** packages/core/src/game-definition.ts
- **Signature:** `GameDefinition<Payload, PublicView, State, Move, Feedback, Result, Stats>` (exact to ADR-006)
- **Usage:** each `packages/games/<id>` exports an object implementing it.
