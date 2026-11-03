# Game registry

## createGameRegistry
- **Location:** packages/core/src/game-registry.ts
- **Signature:** `createGameRegistry(definitions: readonly AnyGameDefinition[]): { ids(): GameId[]; get(id: string): AnyGameDefinition }`
- **Description:** Throws plain `Error` on duplicated or unknown ids at construction; `get` throws `AppError('not_found')` for unregistered ids.
- **Usage:** `const games = createGameRegistry([]); games.get('devdle'); // AppError not_found`
