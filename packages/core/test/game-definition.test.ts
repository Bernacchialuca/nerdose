import { describe, expect, expectTypeOf, it } from 'vitest';
import type { z } from 'zod';

import type { ErrorCode } from '../src/errors';
import { GAME_IDS } from '../src/game-definition';
import type {
  GameDefinition,
  GameId,
  Locale,
  MoveContext,
  MoveError,
} from '../src/game-definition';
import { makeDefinition, makeWordDefinition } from './fixtures/fake-definition';
import type { FakeDefinition } from './fixtures/fake-definition';

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

describe('MoveContext', () => {
  const now = new Date('2026-12-01T10:00:00.000Z');

  it('declares ctx as the fifth parameter of applyMove (TS-1)', () => {
    expectTypeOf<FakeDefinition['applyMove']>().parameters.toEqualTypeOf<
      [{ word: string }, { attempts: number }, { guess: string }, Date, MoveContext]
    >();
  });

  it('has the isValidWord shape (TS-2)', () => {
    expectTypeOf<MoveContext['isValidWord']>().toEqualTypeOf<(word: string) => boolean>();
    expectTypeOf<keyof MoveContext>().toEqualTypeOf<'isValidWord'>();
  });

  it('lets a game ignore ctx (TS-3)', () => {
    const result = makeDefinition('devdle').applyMove(
      { word: 'REACT' },
      { attempts: 0 },
      { guess: 'REACT' },
      now,
      { isValidWord: () => false },
    );
    expect(result).toEqual({ state: { attempts: 1 }, feedback: { ok: true } });
  });

  it('rejects words outside the list without mutating state (TS-4)', () => {
    const state = { attempts: 2 };
    const result = makeWordDefinition().applyMove(
      { word: 'REACT' },
      state,
      { guess: 'ZZZZZ' },
      now,
      { isValidWord: (w) => w === 'CACHE' },
    );
    expect(result).toEqual({ error: 'not_in_word_list' });
    expect(state).toEqual({ attempts: 2 });
  });

  it('accepts words in the list (TS-5)', () => {
    const result = makeWordDefinition().applyMove(
      { word: 'REACT' },
      { attempts: 2 },
      { guess: 'CACHE' },
      now,
      { isValidWord: (w) => w === 'CACHE' },
    );
    expect(result).toEqual({ state: { attempts: 3 }, feedback: { ok: false } });
  });

  it('requires ctx at the type level (TS-6)', () => {
    const call = (): unknown =>
      // @ts-expect-error ctx is required
      makeDefinition('devdle').applyMove(
        { word: 'REACT' },
        { attempts: 0 },
        { guess: 'REACT' },
        now,
      );
    expectTypeOf(call).toBeFunction();
  });
});
