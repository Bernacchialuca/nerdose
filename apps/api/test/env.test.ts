import { AppError } from '@nerdose/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadEnv } from '@/config/env';

const URL_OK = 'postgres://nerdose_api:a@127.0.0.1:5432/nerdose';
const VALID = {
  DATABASE_URL: URL_OK,
  LAUNCH_DATE: '2026-11-24',
  WEB_ORIGIN: 'http://localhost:5173',
  ADMIN_ORIGIN: 'http://localhost:5174',
  ADMIN_PASSWORD_HASH: 'scrypt$16384$8$1$c2FsdHNhbHRzYWx0c2FsdA==$aGFzaGhhc2hoYXNoaGFzaA==',
  ADMIN_JWT_SECRET: 'test-admin-jwt-secret-0123456789-abcdef',
};

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
    const rest: Record<string, string> = { ...VALID };
    delete rest.DATABASE_URL;
    const error = catchError(() => loadEnv(rest));
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('validation_error');
    expect((error as AppError).message).toBe('Variables de entorno inválidas: DATABASE_URL');
  });

  it('lanza con DATABASE_URL inválida', () => {
    const error = catchError(() => loadEnv({ ...VALID, DATABASE_URL: 'no-es-url' })) as AppError;
    expect(error.message).toBe('Variables de entorno inválidas: DATABASE_URL');
  });

  it('lanza con PORT numérico inválido', () => {
    const error = catchError(() => loadEnv({ ...VALID, PORT: 'abc' })) as AppError;
    expect(error.message).toBe('Variables de entorno inválidas: PORT');
  });

  it('aplica defaults con valores vacíos', () => {
    expect(loadEnv({ ...VALID, NODE_ENV: '', PORT: '', LOG_LEVEL: '', SERVICE_NAME: '' })).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
      LOG_LEVEL: 'info',
      SERVICE_NAME: 'api',
      REPORT_ALERT_COUNT: 3,
      REPORT_ALERT_RATIO: 0.05,
      REPORT_ALERT_RATIO_MIN_COUNT: 2,
      ...VALID,
    });
  });

  it('acepta todas las variables', () => {
    const env = loadEnv({
      NODE_ENV: 'test',
      PORT: '4010',
      LOG_LEVEL: 'silent',
      SERVICE_NAME: 'api-test',
      ...VALID,
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
      for (const [name, value] of Object.entries(VALID)) vi.stubEnv(name, value);
      vi.stubEnv('PORT', '4020');
      expect(loadEnv()).toMatchObject({ DATABASE_URL: URL_OK, PORT: 4020 });
    });
  });

  describe('variables de seguridad HTTP', () => {
    it('exige LAUNCH_DATE, WEB_ORIGIN y ADMIN_ORIGIN sin mostrar valores', () => {
      const error = catchError(() => loadEnv({ DATABASE_URL: URL_OK })) as AppError;
      expect(error.code).toBe('validation_error');
      for (const name of ['LAUNCH_DATE', 'WEB_ORIGIN', 'ADMIN_ORIGIN']) {
        expect(error.message).toContain(name);
      }
      expect(error.message).not.toContain(URL_OK);
    });

    it('rechaza formatos inválidos', () => {
      const date = catchError(() => loadEnv({ ...VALID, LAUNCH_DATE: '2026/11/24' })) as AppError;
      expect(date.code).toBe('validation_error');
      expect(date.message).toContain('LAUNCH_DATE');
      const origin = catchError(() => loadEnv({ ...VALID, WEB_ORIGIN: 'no-es-url' })) as AppError;
      expect(origin.code).toBe('validation_error');
      expect(origin.message).toContain('WEB_ORIGIN');
    });

    it('normaliza los orígenes y deja TRUST_PROXY_HEADER opcional', () => {
      const env = loadEnv({
        ...VALID,
        WEB_ORIGIN: 'http://localhost:5173/',
        TRUST_PROXY_HEADER: 'X-Forwarded-For',
      });
      expect(env).toMatchObject({
        LAUNCH_DATE: '2026-11-24',
        WEB_ORIGIN: 'http://localhost:5173',
        ADMIN_ORIGIN: 'http://localhost:5174',
        TRUST_PROXY_HEADER: 'X-Forwarded-For',
      });
      expect(loadEnv(VALID).TRUST_PROXY_HEADER).toBeUndefined();
    });

    // TS-39
    it('exige ADMIN_PASSWORD_HASH (formato completo) y ADMIN_JWT_SECRET (>= 32) sin mostrar valores', () => {
      const rest: Record<string, string> = { ...VALID };
      delete rest.ADMIN_PASSWORD_HASH;
      const missing = catchError(() => loadEnv(rest)) as AppError;
      expect(missing.code).toBe('validation_error');
      expect(missing.message).toBe('Variables de entorno inválidas: ADMIN_PASSWORD_HASH');

      const plain = catchError(() =>
        loadEnv({ ...VALID, ADMIN_PASSWORD_HASH: 'plain' }),
      ) as AppError;
      expect(plain.message).toContain('ADMIN_PASSWORD_HASH');
      expect(plain.message).not.toContain('plain');
      const truncated = catchError(() =>
        loadEnv({ ...VALID, ADMIN_PASSWORD_HASH: 'scrypt$16384$8$1$c2FsdA==' }),
      ) as AppError;
      expect(truncated.message).toContain('ADMIN_PASSWORD_HASH');

      const short = catchError(() => loadEnv({ ...VALID, ADMIN_JWT_SECRET: 'corto' })) as AppError;
      expect(short.message).toContain('ADMIN_JWT_SECRET');
      expect(short.message).not.toContain('corto');

      expect(loadEnv(VALID)).toMatchObject({
        ADMIN_PASSWORD_HASH: VALID.ADMIN_PASSWORD_HASH,
        ADMIN_JWT_SECRET: VALID.ADMIN_JWT_SECRET,
      });
    });

    // TS-46
    it('umbrales de reporte: defaults, coerción y validación', () => {
      expect(loadEnv(VALID)).toMatchObject({
        REPORT_ALERT_COUNT: 3,
        REPORT_ALERT_RATIO: 0.05,
        REPORT_ALERT_RATIO_MIN_COUNT: 2,
      });
      expect(loadEnv({ ...VALID, REPORT_ALERT_COUNT: '5' }).REPORT_ALERT_COUNT).toBe(5);
      const bad: Array<[string, string]> = [
        ['REPORT_ALERT_COUNT', '0'],
        ['REPORT_ALERT_RATIO', '1'],
        ['REPORT_ALERT_RATIO', '0'],
        ['REPORT_ALERT_RATIO_MIN_COUNT', '1.5'],
      ];
      for (const [name, value] of bad) {
        expect(() => loadEnv({ ...VALID, [name]: value })).toThrow(name);
      }
    });
  });
});
