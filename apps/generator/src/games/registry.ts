import { AppError, isGameId } from '@nerdose/core';
import type { AnyGameGenerator, GameId } from '@nerdose/core';
import {
  definition as bigODefinition,
  payloadSchema as bigOPayloadSchema,
} from '@nerdose/game-big-o/definition';
import { generator as bigOGenerator } from '@nerdose/game-big-o/generator';
import {
  definition as bugHuntDefinition,
  payloadSchema as bugHuntPayloadSchema,
} from '@nerdose/game-bug-hunt/definition';
import { generator as bugHuntGenerator } from '@nerdose/game-bug-hunt/generator';
import {
  definition as devdleDefinition,
  payloadSchema as devdlePayloadSchema,
} from '@nerdose/game-devdle/definition';
import { generator as devdleGenerator } from '@nerdose/game-devdle/generator';
import {
  definition as grepGridDefinition,
  payloadSchema as grepGridPayloadSchema,
} from '@nerdose/game-grep-grid/definition';
import { generator as grepGridGenerator } from '@nerdose/game-grep-grid/generator';
import {
  definition as timelineDefinition,
  payloadSchema as timelinePayloadSchema,
} from '@nerdose/game-timeline/definition';
import { generator as timelineGenerator } from '@nerdose/game-timeline/generator';
import type { z } from 'zod';

export type GeneratorEntry = {
  gameId: GameId;
  generator: AnyGameGenerator;
  payloadSchema: z.ZodType<unknown>;
  version: string;
};

export function createGeneratorRegistry(entries: readonly GeneratorEntry[]) {
  const byId = new Map<string, GeneratorEntry>();
  for (const entry of entries) {
    if (!isGameId(entry.gameId)) throw new Error(`Unknown game id in registry: ${entry.gameId}`);
    if (byId.has(entry.gameId)) throw new Error(`Duplicate game id in registry: ${entry.gameId}`);
    byId.set(entry.gameId, entry);
  }

  return {
    ids: (): GameId[] => [...byId.keys()] as GameId[],
    get(id: string): GeneratorEntry {
      const entry = byId.get(id);
      if (!entry) throw new AppError('not_found');
      return entry;
    },
  };
}

export type GeneratorRegistry = ReturnType<typeof createGeneratorRegistry>;

export const generatorRegistry = createGeneratorRegistry([
  {
    gameId: 'devdle',
    generator: devdleGenerator,
    payloadSchema: devdlePayloadSchema,
    version: `devdle@${devdleDefinition.version}`,
  },
  {
    gameId: 'grep-grid',
    generator: grepGridGenerator,
    payloadSchema: grepGridPayloadSchema,
    version: `grep-grid@${grepGridDefinition.version}`,
  },
  {
    gameId: 'timeline',
    generator: timelineGenerator,
    payloadSchema: timelinePayloadSchema,
    version: `timeline@${timelineDefinition.version}`,
  },
  {
    gameId: 'big-o',
    generator: bigOGenerator,
    payloadSchema: bigOPayloadSchema,
    version: `big-o@${bigODefinition.version}`,
  },
  {
    gameId: 'bug-hunt',
    generator: bugHuntGenerator,
    payloadSchema: bugHuntPayloadSchema,
    version: `bug-hunt@${bugHuntDefinition.version}`,
  },
]);
