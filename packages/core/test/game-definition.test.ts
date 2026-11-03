import { describe, expect, expectTypeOf, it } from 'vitest';
import type { z } from 'zod';

import type { ErrorCode } from '../src/errors';
import { GAME_IDS } from '../src/game-definition';
import type { GameDefinition, GameId, Locale, MoveError } from '../src/game-definition';
import { makeDefinition } from './fixtures/fake-definition';

describe('game contract', () => {
  it('lists the five game ids (TS-8)', () => {
    expect(GAME_IDS).toEqual(['devdle', 'grep-grid', 'timeline', 'big-o', 'bug-hunt']);
    expectTypeOf<GameId>().toEqualTypeOf<
      'devdle' | 'grep-grid' | 'timeline' | 'big-o' | 'bug-hunt'
    >();
  });

  it('declares Locale (TS-9)', () => {
    expectTypeOf<Locale>().toEqualTypeOf<'es' | 'en'>();
  });

  it('declares MoveError as a subset of ErrorCode (TS-10)', () => {
    expectTypeOf<MoveError>().toEqualTypeOf<'invalid_move' | 'not_in_word_list'>();
    expectTypeOf<MoveError>().toExtend<ErrorCode>();
  });

  it('compiles a complete GameDefinition (TS-11)', () => {
    const def: GameDefinition<
      { word: string },
      { length: number },
      { attempts: number },
      { guess: string },
      { ok: boolean },
      { won: boolean },
      { played: number }
    > = makeDefinition('devdle');
    expectTypeOf(def.applyMove).returns.toEqualTypeOf<
      { state: { attempts: number }; feedback: { ok: boolean } } | { error: MoveError }
    >();
    expectTypeOf(def.moveSchema).toEqualTypeOf<z.ZodType<{ guess: string }>>();
    expect(def.id).toBe('devdle');
  });

  it('requires every member (TS-12)', () => {
    type Def = GameDefinition<null, null, null, null, null, null, null>;
    const rest = { ...makeDefinition('devdle'), historyLabel: undefined };
    delete rest.historyLabel;
    // @ts-expect-error historyLabel is missing
    const missing: Def = rest;
    // @ts-expect-error 'chess' is not a GameId
    const unknownId: Pick<Def, 'id'> = { id: 'chess' };
    expect(missing).toBeDefined();
    expect(unknownId).toBeDefined();
  });
});
