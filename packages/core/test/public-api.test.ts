import { describe, expect, expectTypeOf, it } from 'vitest';

import * as core from '../src/index';
import type { ErrorCode, GameDefinition, GameId, Locale, MoveError } from '../src/index';

describe('public API of the "." entry', () => {
  it('exports exactly the in-scope runtime values (TS-21)', () => {
    expect(Object.keys(core).sort()).toEqual([
      'AppError',
      'ERROR_CATALOG',
      'GAME_IDS',
      'createGameRegistry',
    ]);
  });

  it('exports the in-scope types', () => {
    expectTypeOf<ErrorCode>().not.toBeNever();
    expectTypeOf<GameId>().not.toBeNever();
    expectTypeOf<Locale>().not.toBeNever();
    expectTypeOf<MoveError>().not.toBeNever();
    expectTypeOf<GameDefinition<1, 2, 3, 4, 5, 6, 7>['version']>().toEqualTypeOf<number>();
  });
});
