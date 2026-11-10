import { AppError } from '@nerdose/core';
import { generator } from '@nerdose/game-devdle/generator';
import { generator as grepGridGenerator } from '@nerdose/game-grep-grid/generator';
import { describe, expect, it } from 'vitest';

import { createGeneratorRegistry, generatorRegistry } from '@/games/registry';

describe('generatorRegistry', () => {
  it('registra devdle y grep-grid', () => {
    expect(generatorRegistry.ids()).toEqual(['devdle', 'grep-grid']);
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
  });

  it('lanza not_found con un juego no registrado', () => {
    let error: unknown;
    try {
      generatorRegistry.get('timeline');
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
