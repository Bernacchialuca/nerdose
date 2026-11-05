import { AppError } from '@nerdose/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadEnv } from '@/config/env';

const URL_OK = 'postgres://nerdose_api:a@127.0.0.1:5432/nerdose';

function catchError(fn: () => unknown): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }
  return undefined;
}

describe('loadEnv', () => {
  it('lanza validation_error sin DATABASE_URL', () => {
    const error = catchError(() => loadEnv({}));
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('validation_error');
    expect((error as AppError).message).toBe('Variables de entorno inválidas: DATABASE_URL');
  });

  it('lanza con DATABASE_URL inválida', () => {
    const error = catchError(() => loadEnv({ DATABASE_URL: 'no-es-url' })) as AppError;
    expect(error.message).toBe('Variables de entorno inválidas: DATABASE_URL');
  });

  it('lanza con PORT numérico inválido', () => {
    const error = catchError(() => loadEnv({ DATABASE_URL: URL_OK, PORT: 'abc' })) as AppError;
    expect(error.message).toBe('Variables de entorno inválidas: PORT');
  });

  it('aplica defaults con valores vacíos', () => {
    expect(
      loadEnv({ DATABASE_URL: URL_OK, NODE_ENV: '', PORT: '', LOG_LEVEL: '', SERVICE_NAME: '' }),
    ).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
      LOG_LEVEL: 'info',
      SERVICE_NAME: 'api',
      DATABASE_URL: URL_OK,
    });
  });

  it('acepta todas las variables', () => {
    const env = loadEnv({
      NODE_ENV: 'test',
      PORT: '4010',
      LOG_LEVEL: 'silent',
      SERVICE_NAME: 'api-test',
      DATABASE_URL: URL_OK,
    });
    expect(env).toMatchObject({
      PORT: 4010,
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      SERVICE_NAME: 'api-test',
    });
  });

  describe('sin argumento', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('lee process.env', () => {
      vi.stubEnv('DATABASE_URL', URL_OK);
      vi.stubEnv('PORT', '4020');
      expect(loadEnv()).toMatchObject({ DATABASE_URL: URL_OK, PORT: 4020 });
    });
  });
});
