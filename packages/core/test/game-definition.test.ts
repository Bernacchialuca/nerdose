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
import {
  makeDefinition,
  makeLocalizedDefinition,
  makeWordDefinition,
} from './fixtures/fake-definition';
import type { FakeDefinition } from './fixtures/fake-definition';

const P_DOCKER = {
  word: 'DOCKER',
  definition: { es: 'plataforma de contenedores', en: 'container platform' },
};

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
    expectTypeOf<keyof MoveContext>().toEqualTypeOf<'isValidWord' | 'locale'>();
    expectTypeOf<MoveContext['locale']>().toEqualTypeOf<Locale>();
    expectTypeOf<MoveContext['locale']>().toEqualTypeOf<'es' | 'en'>();
  });

  it('requires locale (S-022 TS-3)', () => {
    // @ts-expect-error locale is required
    const ctx: MoveContext = { isValidWord: () => true };
    expect(ctx).toBeDefined();
  });

  it('rejects a locale outside es | en (S-022 TS-4)', () => {
    // @ts-expect-error 'fr' is not a Locale
    const ctx: MoveContext = { isValidWord: () => true, locale: 'fr' };
    expect(ctx).toBeDefined();
  });

  it('lets a game ignore ctx (TS-3)', () => {
    const result = makeDefinition('devdle').applyMove(
      { word: 'REACT' },
      { attempts: 0 },
      { guess: 'REACT' },
      now,
      { isValidWord: () => false, locale: 'es' },
    );
    const resultEn = makeDefinition('devdle').applyMove(
      { word: 'REACT' },
      { attempts: 0 },
      { guess: 'REACT' },
      now,
      { isValidWord: () => false, locale: 'en' },
    );
    expect(result).toEqual({ state: { attempts: 1 }, feedback: { ok: true } });
    expect(resultEn).toEqual(result);
  });

  it('rejects words outside the list without mutating state (TS-4)', () => {
    const state = { attempts: 2 };
    const result = makeWordDefinition().applyMove(
      { word: 'REACT' },
      state,
      { guess: 'ZZZZZ' },
      now,
      { isValidWord: (w) => w === 'CACHE', locale: 'es' },
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
      { isValidWord: (w) => w === 'CACHE', locale: 'en' },
    );
    expect(result).toEqual({ state: { attempts: 3 }, feedback: { ok: false } });
  });

  it('localizes the feedback with ctx.locale = es (S-022 TS-9)', () => {
    const result = makeLocalizedDefinition().applyMove(
      P_DOCKER,
      { found: false },
      { guess: 'DOCKER' },
      now,
      { isValidWord: () => true, locale: 'es' },
    );
    expect(result).toEqual({
      state: { found: true },
      feedback: { ok: true, definition: 'plataforma de contenedores' },
    });
  });

  it('localizes the feedback with ctx.locale = en (S-022 TS-10)', () => {
    const result = makeLocalizedDefinition().applyMove(
      P_DOCKER,
      { found: false },
      { guess: 'DOCKER' },
      now,
      { isValidWord: () => true, locale: 'en' },
    );
    expect(result).toEqual({
      state: { found: true },
      feedback: { ok: true, definition: 'container platform' },
    });
    if ('error' in result) throw new Error('expected a feedback');
    expect(typeof result.feedback.definition).toBe('string');
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

describe('toPublic with state', () => {
  it('declares state as an optional third parameter typed as State (S-022 TS-12)', () => {
    expectTypeOf<FakeDefinition['toPublic']>().parameters.toEqualTypeOf<
      [p: { word: string }, locale: Locale, state?: { attempts: number }]
    >();
    expectTypeOf<FakeDefinition['toPublic']>().returns.toEqualTypeOf<{ length: number }>();
  });

  it('accepts a one-parameter implementation (S-022 TS-13)', () => {
    const def: FakeDefinition = makeDefinition('devdle');
    expect(def.toPublic.length).toBe(1);
  });

  it('is callable with two arguments (S-022 TS-14)', () => {
    expect(makeDefinition('devdle').toPublic({ word: 'REACT' }, 'es')).toEqual({ length: 5 });
  });

  it('is callable with three arguments on a game that ignores state (S-022 TS-15)', () => {
    const view = makeDefinition('devdle').toPublic({ word: 'REACT' }, 'en', { attempts: 3 });
    expect(view).toEqual({ length: 5 });
    expect(view).toEqual(makeDefinition('devdle').toPublic({ word: 'REACT' }, 'es'));
  });

  it('checks state against the State generic (S-022 TS-16)', () => {
    const call = (): unknown =>
      // @ts-expect-error state must match State
      makeDefinition('devdle').toPublic({ word: 'REACT' }, 'es', { attempts: 'tres' });
    expectTypeOf(call).toBeFunction();
  });

  it('reveals nothing without a state (S-022 TS-17)', () => {
    const view = makeLocalizedDefinition().toPublic(P_DOCKER, 'es');
    expect(view).toEqual({ length: 6 });
    expect('definition' in view).toBe(false);
  });

  it('reveals nothing with an explicit undefined state (S-022 TS-18)', () => {
    const view = makeLocalizedDefinition().toPublic(P_DOCKER, 'es', undefined);
    expect(view).toEqual({ length: 6 });
    expect('definition' in view).toBe(false);
  });

  it('reveals nothing with the initial state (S-022 TS-19)', () => {
    const view = makeLocalizedDefinition().toPublic(P_DOCKER, 'es', { found: false });
    expect(view).toEqual({ length: 6 });
    expect('definition' in view).toBe(false);
    const json = JSON.stringify(view);
    expect(json).not.toContain('plataforma de contenedores');
    expect(json).not.toContain('container platform');
  });

  it('reveals what was already discovered, in es (S-022 TS-20)', () => {
    const view = makeLocalizedDefinition().toPublic(P_DOCKER, 'es', { found: true });
    expect(view).toEqual({ length: 6, definition: 'plataforma de contenedores' });
  });

  it('reveals what was already discovered, in en (S-022 TS-21)', () => {
    const es = makeLocalizedDefinition().toPublic(P_DOCKER, 'es', { found: true });
    const en = makeLocalizedDefinition().toPublic(P_DOCKER, 'en', { found: true });
    expect(en).toEqual({ length: 6, definition: 'container platform' });
    expect(en.length).toBe(es.length);
  });
});
