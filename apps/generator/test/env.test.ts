import { AppError } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { loadEnv } from '@/config/env';

const URL_OK = 'postgres://nerdose_generator:a@127.0.0.1:5432/nerdose';

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

  it('lanza con LOG_LEVEL fuera del enum', () => {
    const error = catchError(() => loadEnv({ DATABASE_URL: URL_OK, LOG_LEVEL: 'verbose' })) as AppError;
    expect(error.message).toBe('Variables de entorno inválidas: LOG_LEVEL');
  });

  it('aplica defaults con valores vacíos', () => {
    expect(
      loadEnv({ DATABASE_URL: URL_OK, NODE_ENV: '', LOG_LEVEL: '', SERVICE_NAME: '' }),
    ).toEqual({
      NODE_ENV: 'development',
      
      LOG_LEVEL: 'info',
      SERVICE_NAME: 'generator',
      DATABASE_URL: URL_OK,
    });
  });

  it('acepta todas las variables', () => {
    const env = loadEnv({
      NODE_ENV: 'test',
      PORT: '4010',
      LOG_LEVEL: 'silent',
      SERVICE_NAME: 'generator-test',
      DATABASE_URL: URL_OK,
    });
    expect(env).toMatchObject({ NODE_ENV: 'test', LOG_LEVEL: 'silent', SERVICE_NAME: 'generator-test' });
  });

  it('no declara PORT', () => {
    expect('PORT' in loadEnv({ DATABASE_URL: URL_OK, PORT: '3000' })).toBe(false);
  });
});
