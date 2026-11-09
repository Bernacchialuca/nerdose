import { AppError } from '@nerdose/core';
import { generator } from '@nerdose/game-devdle/generator';
import { describe, expect, it } from 'vitest';

import { createGeneratorRegistry, generatorRegistry } from '@/games/registry';

describe('generatorRegistry', () => {
  it('registra solo devdle', () => {
    expect(generatorRegistry.ids()).toEqual(['devdle']);
    const entry = generatorRegistry.get('devdle');
    expect(entry).toMatchObject({ gameId: 'devdle', generator, version: 'devdle@1' });
    expect(entry.payloadSchema).toBeDefined();
  });

  it('lanza not_found con un juego no registrado', () => {
    let error: unknown;
    try {
      generatorRegistry.get('grep-grid');
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
