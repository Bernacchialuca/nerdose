import { describe, expect, expectTypeOf, it } from 'vitest';

import * as core from '../src/index';
import type {
  AnyGameGenerator,
  BankName,
  CodeLanguage,
  ErrorCode,
  GameDefinition,
  GameGenerator,
  GameId,
  GeneratorHistory,
  HistorySpec,
  Locale,
  MoveContext,
  MoveError,
  RecentChallenge,
  Rng,
  StreakInput,
  TermCategory,
  VerificationCheck,
  VerificationLog,
} from '../src/index';

describe('public API of the "." entry', () => {
  it('exports exactly the in-scope runtime values (S-006 TS-27)', () => {
    expect(Object.keys(core).sort()).toEqual([
      'AppError',
      'CODE_LANGUAGES',
      'ERROR_CATALOG',
      'GAME_IDS',
      'LOCALES',
      'TERM_CATEGORIES',
      'challengeNumber',
      'createGameRegistry',
      'isGameId',
      'liveStreak',
      'nextResetAt',
      'nextStreak',
      'rngFrom',
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

  it('exports the new contract types and signatures (TS-52)', () => {
    expectTypeOf<MoveContext>().not.toBeNever();
    expectTypeOf<GameGenerator<1>>().not.toBeNever();
    expectTypeOf<AnyGameGenerator>().not.toBeNever();
    expectTypeOf<HistorySpec>().not.toBeNever();
    expectTypeOf<BankName>().not.toBeNever();
    expectTypeOf<GeneratorHistory>().not.toBeNever();
    expectTypeOf<RecentChallenge<1>>().not.toBeNever();
    expectTypeOf<VerificationLog>().not.toBeNever();
    expectTypeOf<VerificationCheck>().not.toBeNever();
    expectTypeOf<TermCategory>().not.toBeNever();
    expectTypeOf<StreakInput>().not.toBeNever();
    expectTypeOf<Rng>().not.toBeNever();
    expectTypeOf(core.nextStreak).toEqualTypeOf<(input: StreakInput, day: string) => number>();
    expectTypeOf(core.liveStreak).toEqualTypeOf<(input: StreakInput, today: string) => number>();
    expectTypeOf(core.rngFrom).toEqualTypeOf<(seed: Uint8Array) => Rng>();
  });
});
