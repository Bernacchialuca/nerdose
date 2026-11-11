import { sign } from 'hono/jwt';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { signAdminToken } from '@/domain/admin/admin-auth';

import {
  adminToken,
  ADMIN_HEADERS,
  buildTestApp,
  TEST_ADMIN_JWT_SECRET,
  TEST_ADMIN_PASSWORD,
} from '../helpers/app';

const NOW = Math.floor(new Date('2026-12-01T12:00:00Z').getTime() / 1000);
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-01T12:00:00Z'));
});
afterEach(() => vi.useRealTimers());

const UNAUTHORIZED = { error: { code: 'unauthorized', message: 'No autorizado.' } };
const get = (
  app: ReturnType<typeof buildTestApp>['app'],
  token?: string,
  path = '/api/admin/reports',
) =>
  app.request(path, { headers: token === undefined ? {} : { Authorization: `Bearer ${token}` } });

describe('middleware JWT de /api/admin/*', () => {
  // TS-7
  it('TS-7 token vencido (8 h 1 min): 401 unauthorized', async () => {
    const { app } = buildTestApp();
    const res = await get(app, await adminToken(NOW - 28860));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual(UNAUTHORIZED);
  });

  // TS-8
  it('TS-8 ausente, malformado, otra firma, otro sub u otro alg: 401', async () => {
    const { app } = buildTestApp();
    const bad = [
      undefined,
      'abc',
      (await signAdminToken('b'.repeat(40), NOW)).token,
      await sign({ sub: 'player', iat: NOW, exp: NOW + 100 }, TEST_ADMIN_JWT_SECRET, 'HS256'),
      await sign({ sub: 'admin', iat: NOW, exp: NOW + 100 }, TEST_ADMIN_JWT_SECRET, 'HS512'),
      await sign({ sub: 'admin', iat: NOW }, TEST_ADMIN_JWT_SECRET, 'HS256'),
    ];
    for (const token of bad) {
      const res = await get(app, token);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual(UNAUTHORIZED);
    }
  });

  // TS-9
  it('TS-9 las rutas protegidas y las inexistentes exigen token', async () => {
    const { app } = buildTestApp();
    const id = '6a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
    const calls = [
      app.request(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: ADMIN_HEADERS,
        body: JSON.stringify({ status: 'resolved' }),
      }),
      app.request(`/api/admin/challenges/${id}/void`, {
        method: 'POST',
        headers: ADMIN_HEADERS,
        body: JSON.stringify({ void_reason: 'x', culprit: { kind: 'none' } }),
      }),
      get(app, undefined, '/api/admin/unknown'),
    ];
    for (const res of await Promise.all(calls)) {
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual(UNAUTHORIZED);
    }
  });

  // TS-10
  it('TS-10 login y health no piden token', async () => {
    const { app } = buildTestApp();
    const health = await app.request('/api/admin/health');
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({ status: 'ok', db: 'ok' });
    const login = await app.request('/api/admin/login', {
      method: 'POST',
      headers: { ...ADMIN_HEADERS, 'x-forwarded-for': '10.1.0.1' },
      body: JSON.stringify({ password: TEST_ADMIN_PASSWORD }),
    });
    expect(login.status).toBe(200);
  });

  // TS-11
  it('TS-11 token válido a 7 h 59 min: 200', async () => {
    const { app } = buildTestApp();
    const res = await get(app, await adminToken(NOW - 28740));
    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toBeNull();
  });
});
