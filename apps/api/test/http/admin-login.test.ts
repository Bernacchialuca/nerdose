import { verify } from 'hono/jwt';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_HEADERS,
  buildTestApp,
  TEST_ADMIN_JWT_SECRET,
  TEST_ADMIN_PASSWORD,
  TEST_ADMIN_PASSWORD_HASH,
} from '../helpers/app';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-01T12:00:00Z'));
});
afterEach(() => vi.useRealTimers());

const login = (
  app: ReturnType<typeof buildTestApp>['app'],
  body: unknown,
  ip: string,
  headers: Record<string, string> = ADMIN_HEADERS,
) =>
  app.request('/api/admin/login', {
    method: 'POST',
    headers: { ...headers, 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });

describe('POST /api/admin/login', () => {
  // TS-1
  it('TS-1 contraseña correcta: 200 con JWT HS256 de 8 h y sin secretos en logs', async () => {
    const { app, lines } = buildTestApp();
    const res = await login(app, { password: TEST_ADMIN_PASSWORD }, '10.0.0.1');
    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toBeNull();
    const body = (await res.json()) as { token: string; expires_at: string };
    expect(body.expires_at).toBe('2026-12-01T20:00:00.000Z');
    expect(await verify(body.token, TEST_ADMIN_JWT_SECRET, 'HS256')).toEqual({
      sub: 'admin',
      iat: 1796126400,
      exp: 1796155200,
    });
    const logs = JSON.stringify(lines());
    expect(lines().some((l) => l.event === 'AdminLoginSucceeded')).toBe(true);
    for (const secret of [TEST_ADMIN_PASSWORD, body.token, TEST_ADMIN_PASSWORD_HASH]) {
      expect(logs).not.toContain(secret);
    }
  });

  // TS-2
  it('TS-2 contraseña incorrecta: 401 invalid_credentials', async () => {
    const { app, lines } = buildTestApp();
    const res = await login(app, { password: 'otra' }, '10.0.0.2');
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      error: { code: 'invalid_credentials', message: 'Credenciales inválidas.' },
    });
    expect(lines().some((l) => l.event === 'AdminLoginFailed')).toBe(true);
    expect(JSON.stringify(lines())).not.toContain('otra');
  });

  // TS-3
  it('TS-3 body inválido: 422 validation_error', async () => {
    const { app } = buildTestApp();
    for (const body of [{}, { password: '' }]) {
      const res = await login(app, body, '10.0.0.3');
      expect(res.status).toBe(422);
      expect(((await res.json()) as { error: { code: string } }).error.code).toBe(
        'validation_error',
      );
    }
  });

  // TS-4
  it('TS-4 Origin ajeno: 403; sin Content-Type JSON: 415', async () => {
    const { app } = buildTestApp();
    const origin = await login(app, { password: TEST_ADMIN_PASSWORD }, '10.0.0.4', {
      ...ADMIN_HEADERS,
      Origin: 'http://localhost:5173',
    });
    expect(origin.status).toBe(403);
    expect(((await origin.json()) as { error: { code: string } }).error.code).toBe(
      'forbidden_origin',
    );
    const media = await login(app, { password: TEST_ADMIN_PASSWORD }, '10.0.0.4', {
      Origin: ADMIN_HEADERS.Origin,
      'Content-Type': 'text/plain',
    });
    expect(media.status).toBe(415);
  });

  // TS-5, TS-6
  it('TS-5/6 sexto intento: 429 con Retry-After sin evaluar la contraseña; el límite es por IP', async () => {
    const { app, lines } = buildTestApp();
    for (let i = 0; i < 5; i++) {
      expect((await login(app, { password: 'mal' }, '10.0.0.5')).status).toBe(401);
    }
    const sixth = await login(app, { password: TEST_ADMIN_PASSWORD }, '10.0.0.5');
    expect(sixth.status).toBe(429);
    expect(sixth.headers.get('retry-after')).toBe('900');
    expect(((await sixth.json()) as { error: { code: string } }).error.code).toBe('rate_limited');
    expect(lines().filter((l) => l.event === 'AdminLoginFailed')).toHaveLength(5);
    expect(lines().filter((l) => l.event === 'AdminLoginSucceeded')).toHaveLength(0);

    const other = await login(app, { password: TEST_ADMIN_PASSWORD }, '10.0.0.6');
    expect(other.status).toBe(200);
  });
});
