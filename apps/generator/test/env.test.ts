import { AppError } from '@nerdose/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadEnv } from '@/config/env';

const URL_OK = 'postgres://nerdose_generator:a@127.0.0.1:5432/nerdose';
const SECRET = 'test-secret-0123456789abcdef0123456789';
const BASE = { DATABASE_URL: URL_OK, LAUNCH_DATE: '2026-11-20', GENERATOR_SECRET: SECRET };

function catchError(fn: () => unknown): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }
  return undefined;
}

const message = (env: Record<string, string>) =>
  (catchError(() => loadEnv(env)) as AppError).message;

describe('loadEnv', () => {
  it('lanza validation_error sin las tres requeridas', () => {
    const error = catchError(() => loadEnv({}));
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('validation_error');
    const text = (error as AppError).message;
    expect(text.startsWith('Variables de entorno inválidas: ')).toBe(true);
    expect(text).toContain('DATABASE_URL');
    expect(text).toContain('LAUNCH_DATE');
    expect(text).toContain('GENERATOR_SECRET');
  });

  it('lanza con DATABASE_URL inválida', () => {
    expect(message({ ...BASE, DATABASE_URL: 'no-es-url' })).toBe(
      'Variables de entorno inválidas: DATABASE_URL',
    );
  });

  it('lanza con LOG_LEVEL fuera del enum', () => {
    expect(message({ ...BASE, LOG_LEVEL: 'verbose' })).toBe(
      'Variables de entorno inválidas: LOG_LEVEL',
    );
  });

  it('lanza si falta solo LAUNCH_DATE', () => {
    expect(message({ DATABASE_URL: URL_OK, GENERATOR_SECRET: SECRET })).toBe(
      'Variables de entorno inválidas: LAUNCH_DATE',
    );
  });

  it('lanza si falta solo GENERATOR_SECRET', () => {
    expect(message({ DATABASE_URL: URL_OK, LAUNCH_DATE: '2026-11-20' })).toBe(
      'Variables de entorno inválidas: GENERATOR_SECRET',
    );
  });

  it('rechaza un secreto corto sin filtrar su valor', () => {
    const text = message({ ...BASE, GENERATOR_SECRET: 'x'.repeat(31) });
    expect(text).toBe('Variables de entorno inválidas: GENERATOR_SECRET');
    expect(text).not.toContain('x'.repeat(31));
  });

  it.each(['20-11-2026', '2026-02-30'])('rechaza LAUNCH_DATE %s', (value) => {
    expect(message({ ...BASE, LAUNCH_DATE: value })).toBe(
      'Variables de entorno inválidas: LAUNCH_DATE',
    );
  });

  it('aplica defaults y coerción de intentos', () => {
    const env = loadEnv(BASE);
    expect(env.GENERATION_MAX_ATTEMPTS).toBe(20);
    expect(env.LAUNCH_DATE).toBe('2026-11-20');
    expect(loadEnv({ ...BASE, GENERATION_MAX_ATTEMPTS: '5' }).GENERATION_MAX_ATTEMPTS).toBe(5);
  });

  it.each(['0', 'abc'])('rechaza GENERATION_MAX_ATTEMPTS %s', (value) => {
    expect(message({ ...BASE, GENERATION_MAX_ATTEMPTS: value })).toBe(
      'Variables de entorno inválidas: GENERATION_MAX_ATTEMPTS',
    );
  });

  it('aplica defaults con valores vacíos', () => {
    expect(
      loadEnv({
        ...BASE,
        NODE_ENV: '',
        LOG_LEVEL: '',
        SERVICE_NAME: '',
        GENERATION_MAX_ATTEMPTS: '',
      }),
    ).toEqual({
      NODE_ENV: 'development',
      LOG_LEVEL: 'info',
      SERVICE_NAME: 'generator',
      DATABASE_URL: URL_OK,
      LAUNCH_DATE: '2026-11-20',
      GENERATOR_SECRET: SECRET,
      GENERATION_MAX_ATTEMPTS: 20,
    });
  });

  it('acepta todas las variables', () => {
    const env = loadEnv({
      ...BASE,
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      SERVICE_NAME: 'generator-test',
      GENERATION_MAX_ATTEMPTS: '3',
    });
    expect(env).toMatchObject({
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      SERVICE_NAME: 'generator-test',
      GENERATION_MAX_ATTEMPTS: 3,
    });
  });

  it('no declara PORT', () => {
    expect('PORT' in loadEnv({ ...BASE, PORT: '3000' })).toBe(false);
  });

  describe('sin argumento', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('lee process.env', () => {
      vi.stubEnv('DATABASE_URL', URL_OK);
      vi.stubEnv('LAUNCH_DATE', '2026-11-20');
      vi.stubEnv('GENERATOR_SECRET', SECRET);
      vi.stubEnv('SERVICE_NAME', 'generator-env');
      expect(loadEnv()).toMatchObject({ DATABASE_URL: URL_OK, SERVICE_NAME: 'generator-env' });
    });
  });
});
