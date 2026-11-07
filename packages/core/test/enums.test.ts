import { describe, expect, expectTypeOf, it } from 'vitest';

import { CODE_LANGUAGES, LOCALES, TERM_CATEGORIES, isGameId } from '../src/index';
import type { CodeLanguage, GameId, Locale, TermCategory } from '../src/index';
import { GAME_IDS } from '../src/game-definition';

describe('shared enums', () => {
  it('lists LOCALES (TS-22)', () => {
    expect(LOCALES).toEqual(['es', 'en']);
  });

  it('lists CODE_LANGUAGES (TS-23)', () => {
    expect(CODE_LANGUAGES).toEqual(['js', 'go', 'java']);
  });

  it('isGameId accepts the five ids (TS-24)', () => {
    for (const id of ['devdle', 'bug-hunt', 'big-o', 'timeline', 'grep-grid']) {
      expect(isGameId(id)).toBe(true);
    }
    expect(GAME_IDS.every((id) => isGameId(id))).toBe(true);
  });

  it.each(['chess', 'Devdle', 'devdle ', '', 42, null, undefined, {}])(
    'isGameId rejects %j (TS-25)',
    (value) => {
      expect(isGameId(value)).toBe(false);
    },
  );

  it('derives types (TS-26)', () => {
    expectTypeOf<Locale>().toEqualTypeOf<'es' | 'en'>();
    expectTypeOf<CodeLanguage>().toEqualTypeOf<'js' | 'go' | 'java'>();
    const v: unknown = 'devdle';
    if (isGameId(v)) expectTypeOf(v).toEqualTypeOf<GameId>();
  });
});

describe('TERM_CATEGORIES', () => {
  it('lists the eight categories in fixed order (TS-16)', () => {
    expect(TERM_CATEGORIES).toEqual([
      'programming_languages',
      'git',
      'databases',
      'networking',
      'linux',
      'apis',
      'security',
      'software_engineering',
    ]);
    expect(TERM_CATEGORIES).toHaveLength(8);
  });

  it('derives TermCategory and is read-only (TS-17)', () => {
    expectTypeOf<TermCategory>().toEqualTypeOf<
      | 'programming_languages'
      | 'git'
      | 'databases'
      | 'networking'
      | 'linux'
      | 'apis'
      | 'security'
      | 'software_engineering'
    >();
    const mutate = (): void => {
      // @ts-expect-error TERM_CATEGORIES is readonly
      TERM_CATEGORIES.push('ai');
    };
    expectTypeOf(mutate).toBeFunction();
  });
});
