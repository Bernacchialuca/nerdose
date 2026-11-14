import { AppError } from '@nerdose/core';
import { payloadSchema as bigOPayloadSchema } from '@nerdose/game-big-o/definition';
import { generator as bigOGenerator } from '@nerdose/game-big-o/generator';
import { generator } from '@nerdose/game-devdle/generator';
import { generator as grepGridGenerator } from '@nerdose/game-grep-grid/generator';
import { generator as timelineGenerator } from '@nerdose/game-timeline/generator';
import { describe, expect, it } from 'vitest';

import { createGeneratorRegistry, generatorRegistry } from '@/games/registry';

describe('generatorRegistry', () => {
  it('registra devdle, grep-grid, timeline y big-o', () => {
    expect(generatorRegistry.ids()).toEqual(['devdle', 'grep-grid', 'timeline', 'big-o']);
    const entry = generatorRegistry.get('devdle');
    expect(entry).toMatchObject({ gameId: 'devdle', generator, version: 'devdle@1' });
    expect(entry.payloadSchema).toBeDefined();
    const grep = generatorRegistry.get('grep-grid');
    expect(grep).toMatchObject({
      gameId: 'grep-grid',
      generator: grepGridGenerator,
      version: 'grep-grid@1',
    });
    expect(grep.payloadSchema).toBeDefined();
    const timeline = generatorRegistry.get('timeline');
    expect(timeline).toMatchObject({
      gameId: 'timeline',
      generator: timelineGenerator,
      version: 'timeline@1',
    });
    expect(timeline.payloadSchema).toBeDefined();
    const bigO = generatorRegistry.get('big-o');
    expect(bigO).toMatchObject({ gameId: 'big-o', generator: bigOGenerator, version: 'big-o@1' });
    expect(bigO.generator).toBe(bigOGenerator);
    expect(bigO.payloadSchema).toBe(bigOPayloadSchema);
  });

  it('lanza not_found con un juego no registrado', () => {
    let error: unknown;
    try {
      generatorRegistry.get('bug-hunt');
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('not_found');
  });

  it('rechaza ids duplicados y desconocidos', () => {
    const entry = generatorRegistry.get('devdle');
    expect(() => createGeneratorRegistry([entry, entry])).toThrow('Duplicate');
    expect(() => createGeneratorRegistry([{ ...entry, gameId: 'nope' as never }])).toThrow(
      'Unknown',
    );
  });
});
