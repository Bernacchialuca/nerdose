import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { signAdminToken } from '@/domain/admin/admin-auth';

import { adminAuth, buildDbApp } from '../helpers/app';
import { useDatabases } from '../helpers/db';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(async () => {
  await dbs.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-01T10:00:00Z'));
});
afterEach(() => vi.useRealTimers());
afterAll(() => dbs.close());

const get = async (q: string, headers?: Record<string, string>) => {
  const { app } = await buildDbApp(dbs);
  return app.request(`/api/admin/metrics?${q}`, { headers });
};
const authed = async (q: string) => get(q, await adminAuth());

const UNAUTHORIZED = { error: { code: 'unauthorized', message: 'No autorizado.' } };
const INVALID = { error: { code: 'validation_error', message: 'Datos inválidos.' } };

describe('GET /api/admin/metrics (validación y acceso)', () => {
  it('sin JWT responde 401 (S-053 TS-13)', async () => {
    const res = await get('from=2026-11-01&to=2026-12-01');
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual(UNAUTHORIZED);
  });

  it('token vencido o de otro secreto responde 401 (S-053 TS-14)', async () => {
    const expired = await get(
      'from=2026-11-01&to=2026-12-01',
      await adminAuth(Math.floor(Date.now() / 1000) - 28801),
    );
    expect(expired.status).toBe(401);
    expect(await expired.json()).toEqual(UNAUTHORIZED);
    const { token } = await signAdminToken('otro-secreto-0123456789-abcdefghij');
    const other = await get('from=2026-11-01&to=2026-12-01', { Authorization: `Bearer ${token}` });
    expect(other.status).toBe(401);
    expect(await other.json()).toEqual(UNAUTHORIZED);
  });

  it('la auth va antes que la validación (S-053 TS-15)', async () => {
    const res = await get('from=2026-12-05&to=2026-12-01');
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe('unauthorized');
  });

  it('from > to responde 422 (S-053 TS-16)', async () => {
    const res = await authed('from=2026-12-01&to=2026-11-30');
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual(INVALID);
  });

  it('to futuro responde 422 y to = hoy responde 200 (S-053 TS-17)', async () => {
    vi.setSystemTime(new Date('2026-12-01T23:59:59Z'));
    const future = await authed('from=2026-11-01&to=2026-12-02');
    expect(future.status).toBe(422);
    expect(await future.json()).toEqual(INVALID);
    const today = await authed('from=2026-11-01&to=2026-12-01');
    expect(today.status).toBe(200);
    expect(Object.keys(await today.json()).sort()).toEqual([
      'challenge_quality',
      'daily_players',
      'retention',
      'streak_distribution',
      'summary',
    ]);
  });

  it('tope de 366 días de diferencia (S-053 TS-18)', async () => {
    const long = await authed('from=2025-11-30&to=2026-12-01');
    expect(long.status).toBe(422);
    expect(await long.json()).toEqual(INVALID);
    expect((await authed('from=2025-12-01&to=2026-12-01')).status).toBe(200);
  });

  it('query ausente o mal formada responde 422 (S-053 TS-19)', async () => {
    for (const q of [
      'to=2026-12-01',
      'from=2026-12-1&to=2026-12-01',
      'from=2026-02-30&to=2026-12-01',
      'from=hoy&to=2026-12-01',
    ]) {
      const res = await authed(q);
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual(INVALID);
    }
  });
});
