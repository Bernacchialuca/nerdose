import { describe, expect, it } from 'vitest';

import { AppError } from '../src/errors';
import { GAME_IDS } from '../src/game-definition';
import type { GameId } from '../src/game-definition';
import { createGameRegistry } from '../src/game-registry';
import { makeDefinition } from './fixtures/fake-definition';

function catchError(fn: () => unknown): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('expected function to throw');
}

describe('createGameRegistry', () => {
  it('throws not_found on an empty registry (TS-13)', () => {
    const error = catchError(() => createGameRegistry([]).get('devdle'));
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ code: 'not_found', status: 404 });
  });

  it.each([...GAME_IDS, 'chess', '', 'DEVDLE', '__proto__', 'constructor'])(
    'throws not_found for %j on an empty registry (TS-14)',
    (id) => {
      const error = catchError(() => createGameRegistry([]).get(id));
      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({ code: 'not_found', status: 404 });
    },
  );

  it('has no ids when empty (TS-15)', () => {
    expect(createGameRegistry([]).ids()).toEqual([]);
  });

  it('returns the registered definition (TS-16)', () => {
    const devdle = makeDefinition('devdle');
    const bigO = makeDefinition('big-o');
    const registry = createGameRegistry([devdle, bigO]);
    expect(registry.get('big-o')).toBe(bigO);
    const error = catchError(() => registry.get('timeline'));
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ code: 'not_found' });
  });

  it('returns ids in order without leaking state (TS-17)', () => {
    const registry = createGameRegistry([makeDefinition('devdle'), makeDefinition('big-o')]);
    const ids = registry.ids();
    expect(ids).toEqual(['devdle', 'big-o']);
    ids.push('timeline');
    expect(registry.ids()).toEqual(['devdle', 'big-o']);
  });

  it('fails on duplicated ids (TS-18)', () => {
    const error = catchError(() =>
      createGameRegistry([makeDefinition('devdle'), makeDefinition('devdle')]),
    );
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(AppError);
    expect((error as Error).message).toBe('Duplicate game id in registry: devdle');
  });

  it('fails on unknown ids (TS-19)', () => {
    const error = catchError(() =>
      createGameRegistry([{ ...makeDefinition('devdle'), id: 'chess' as GameId }]),
    );
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(AppError);
    expect((error as Error).message).toBe('Unknown game id in registry: chess');
  });
});
