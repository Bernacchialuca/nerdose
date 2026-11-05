import { AppError } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { describeMigrateError } from '../src/migrations/describe-error';

describe('describeMigrateError', () => {
  it.each(['ECONNREFUSED', '28P01', '3D000', 'ENOTFOUND', 'CONNECT_TIMEOUT'])(
    'describes connection error %s (code and cause.code)',
    (code) => {
      const expected = `No se pudo conectar a PostgreSQL con DATABASE_URL_OWNER (${code})`;
      expect(describeMigrateError(Object.assign(new Error('x'), { code }))).toBe(expected);
      expect(describeMigrateError(new Error('wrapped', { cause: { code } }))).toBe(expected);
    },
  );

  it('describes other errors', () => {
    expect(
      describeMigrateError(
        new AppError('validation_error', 'DATABASE_URL_API no tiene contraseña'),
      ),
    ).toBe('db:migrate falló: DATABASE_URL_API no tiene contraseña');
    expect(describeMigrateError(new Error('boom'))).toBe('db:migrate falló: boom');
    expect(describeMigrateError('raro')).toBe('db:migrate falló: raro');
  });
});
