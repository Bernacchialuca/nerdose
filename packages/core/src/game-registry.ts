import { AppError } from './errors';
import { GAME_IDS, type GameDefinition, type GameId } from './game-definition';

// Heterogeneous registry: each game has its own generic parameters.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyGameDefinition = GameDefinition<any, any, any, any, any, any, any>;

export function createGameRegistry(definitions: readonly AnyGameDefinition[]) {
  const byId = new Map<string, AnyGameDefinition>();
  for (const definition of definitions) {
    if (!(GAME_IDS as readonly string[]).includes(definition.id)) {
      throw new Error(`Unknown game id in registry: ${definition.id}`);
    }
    if (byId.has(definition.id)) {
      throw new Error(`Duplicate game id in registry: ${definition.id}`);
    }
    byId.set(definition.id, definition);
  }

  return {
    ids: (): GameId[] => [...byId.keys()] as GameId[],
    get(id: string): AnyGameDefinition {
      const game = byId.get(id);
      if (!game) throw new AppError('not_found');
      return game;
    },
  };
}

export type GameRegistry = ReturnType<typeof createGameRegistry>;
