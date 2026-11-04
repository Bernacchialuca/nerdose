import { describe, expect, expectTypeOf, it } from 'vitest';

import * as core from '../src/index';
import type {
  CodeLanguage,
  ErrorCode,
  GameDefinition,
  GameId,
  Locale,
  MoveError,
} from '../src/index';

describe('public API of the "." entry', () => {
  it('exports exactly the in-scope runtime values (S-006 TS-27)', () => {
    expect(Object.keys(core).sort()).toEqual([
      'AppError',
      'CODE_LANGUAGES',
      'ERROR_CATALOG',
      'GAME_IDS',
      'LOCALES',
      'challengeNumber',
      'createGameRegistry',
      'isGameId',
      'nextResetAt',
      'secondsToReset',
      'today',
    ]);
  });

  it('exports the in-scope types', () => {
    expectTypeOf<ErrorCode>().not.toBeNever();
    expectTypeOf<GameId>().not.toBeNever();
    expectTypeOf<Locale>().not.toBeNever();
    expectTypeOf<CodeLanguage>().not.toBeNever();
    expectTypeOf<MoveError>().not.toBeNever();
    expectTypeOf<GameDefinition<1, 2, 3, 4, 5, 6, 7>['version']>().toEqualTypeOf<number>();
  });
});
