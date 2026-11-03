import { AppError } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { loadMigrateEnv } from '../src/config/env';

const OWNER = 'postgres://nerdose_owner:o@127.0.0.1:5432/nerdose';
const API = 'postgres://nerdose_api:a@127.0.0.1:5432/nerdose';
const GENERATOR = 'postgres://nerdose_generator:g@127.0.0.1:5432/nerdose';

describe('loadMigrateEnv', () => {
  it('returns the three URLs when all are defined', () => {
    const env = loadMigrateEnv({
      DATABASE_URL_OWNER: OWNER,
      DATABASE_URL_API: API,
      DATABASE_URL_GENERATOR: GENERATOR,
    });
    expect(env).toMatchObject({
      DATABASE_URL_OWNER: OWNER,
      DATABASE_URL_API: API,
      DATABASE_URL_GENERATOR: GENERATOR,
    });
  });

  it('treats empty optional variables as undefined', () => {
    const env = loadMigrateEnv({
      DATABASE_URL_OWNER: OWNER,
      DATABASE_URL_API: '',
      DATABASE_URL_GENERATOR: undefined,
    });
    expect(env.DATABASE_URL_API).toBeUndefined();
    expect(env.DATABASE_URL_GENERATOR).toBeUndefined();
  });

  it.each([{}, { DATABASE_URL_OWNER: 'no-es-url' }])(
    'throws validation_error without a valid owner URL (%j)',
    (input) => {
      expect.assertions(3);
      try {
        loadMigrateEnv(input);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).code).toBe('validation_error');
        expect((error as AppError).message).toBe(
          'Variables de entorno inválidas: DATABASE_URL_OWNER',
        );
      }
    },
  );
});
