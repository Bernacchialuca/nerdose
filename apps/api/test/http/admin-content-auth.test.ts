import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { signAdminToken } from '@/domain/admin/admin-auth';

import { adminAuth, ADMIN_HEADERS, buildDbApp } from '../helpers/app';
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

const call = (
  app: { request: (u: string, i?: RequestInit) => Response | Promise<Response> },
  n: number,
  auth: Record<string, string>,
) => {
  const id = randomUUID();
  const targets = [
    ['GET', '/api/admin/challenges/upcoming'],
    ['POST', `/api/admin/challenges/${id}/regenerate`],
    ['GET', '/api/admin/generation-failures'],
    ['GET', '/api/admin/content/stock'],
  ] as const;
  const [method, path] = targets[n]!;
  return app.request(path, {
    method,
    headers: { ...(method === 'POST' ? ADMIN_HEADERS : {}), ...auth },
  });
};

const UNAUTHORIZED = { error: { code: 'unauthorized', message: 'No autorizado.' } };

describe('401 en los endpoints nuevos del admin', () => {
  const cases: Array<[string, () => Promise<Record<string, string>>]> = [
    ['sin token', async () => ({})],
    ['token vencido', async () => adminAuth(Math.floor(Date.now() / 1000) - 28801)],
    ['token malformado', async () => ({ Authorization: 'Bearer abc.def.ghi' })],
    [
      'otro secreto',
      async () => ({
        Authorization: `Bearer ${(await signAdminToken('otro-secreto-0123456789-abcdefghij')).token}`,
      }),
    ],
  ];
  for (const [name, auth] of cases) {
    it(`TS-38/39/40 ${name}`, async () => {
      const { app } = await buildDbApp(dbs);
      const headers = await auth();
      for (let n = 0; n < 4; n++) {
        const res = await call(app, n, headers);
        expect(res.status).toBe(401);
        expect(await res.json()).toEqual(UNAUTHORIZED);
      }
      expect(await dbs.owner.sql`SELECT 1 FROM generation_requests`).toHaveLength(0);
    });
  }
});
