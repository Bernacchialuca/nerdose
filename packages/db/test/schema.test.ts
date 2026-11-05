import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CODE_LANGUAGES, LOCALES } from '@nerdose/core';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { codeLanguageEnum, createDb, localeEnum, players } from '../src/index';
import type { NewPlayer, Player } from '../src/index';
import { MIGRATIONS_FOLDER } from '../src/migrations/run-migrations';

describe('players schema', () => {
  it('S006-TS-23: pgEnums use the values from @nerdose/core', () => {
    expect(localeEnum.enumValues).toEqual([...LOCALES]);
    expect(codeLanguageEnum.enumValues).toEqual([...CODE_LANGUAGES]);
    expect(localeEnum.enumName).toBe('locale');
    expect(codeLanguageEnum.enumName).toBe('code_language');
  });

  it('S006-TS-24: migration grants api only and never DELETE/TRUNCATE', () => {
    const sql = readFileSync(join(MIGRATIONS_FOLDER, '0001_players.sql'), 'utf8');
    expect(sql).toContain('GRANT SELECT, INSERT, UPDATE ON players TO nerdose_api;');
    expect(sql).not.toContain('nerdose_generator');
    expect(sql).not.toContain('DELETE');
    expect(sql).not.toContain('TRUNCATE');
  });

  it('S006-TS-28: public exports and inferred types', () => {
    expect(players).toBeDefined();
    expect(localeEnum).toBeDefined();
    expect(codeLanguageEnum).toBeDefined();
    expect(createDb).toBeDefined();
    expectTypeOf<Player['locale']>().toEqualTypeOf<'es' | 'en'>();
    expectTypeOf<Player['preferredCodeLanguage']>().toEqualTypeOf<'js' | 'go' | 'java'>();
    expectTypeOf<Player['userId']>().toEqualTypeOf<string | null>();
    expectTypeOf<NewPlayer['locale']>().toEqualTypeOf<'es' | 'en' | undefined>();
  });
});
