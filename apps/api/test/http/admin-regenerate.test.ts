import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

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

type App = { request: (u: string, i?: RequestInit) => Response | Promise<Response> };
type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const regen = async (app: App, id: string, headers: Record<string, string> = {}) =>
  app.request(`/api/admin/challenges/${id}/regenerate`, {
    method: 'POST',
    headers: { ...ADMIN_HEADERS, ...(await adminAuth()), ...headers },
  });
const requests = () => dbs.owner.sql`SELECT * FROM generation_requests ORDER BY requested_at`;
const futureChallenge = (over: Record<string, unknown> = {}) =>
  dbs.insertChallenge({
    gameId: 'grep-grid',
    date: '2026-12-05',
    status: 'approved',
    ...over,
  });

describe('POST /api/admin/challenges/{id}/regenerate', () => {
  it('TS-16 inserta el pedido, hace pg_notify y no genera nada', async () => {
    const c = await futureChallenge();
    const { app } = await buildDbApp(dbs);
    const received: string[] = [];
    const sub = await dbs.owner.sql.listen('generation_requests', (p) => received.push(p));
    try {
      const res = await regen(app, c.id);
      expect(res.status).toBe(202);
      const body = (await res.json()) as Json;
      expect(body.status).toBe('pending');
      expect(body.request_id).toMatch(/^[0-9a-f-]{36}$/);
      expect(body.requested_at).toMatch(/Z$/);
      const rows = await requests();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        id: body.request_id,
        challenge_id: c.id,
        status: 'pending',
        new_challenge_id: null,
        error: null,
        processed_at: null,
      });
      await vi.waitFor(() => expect(received).toEqual([body.request_id]));
      const ch = await dbs.owner.sql`SELECT status FROM challenges`;
      expect(ch).toHaveLength(1);
      expect(ch[0]!.status).toBe('approved');
    } finally {
      await sub.unlisten();
    }
  });

  it('TS-17 es idempotente y TS-26 loguea created', async () => {
    const c = await futureChallenge();
    const { app, lines } = await buildDbApp(dbs);
    const a = (await (await regen(app, c.id)).json()) as Json;
    const res = await regen(app, c.id);
    expect(res.status).toBe(202);
    const b = (await res.json()) as Json;
    expect(b).toEqual(a);
    expect(await requests()).toHaveLength(1);
    const events = lines().filter((l) => l.event === 'ChallengeRegenerationRequested');
    expect(events).toMatchObject([
      { level: 'info', challenge_id: c.id, request_id: a.request_id, created: true },
      { created: false },
    ]);
  });

  it('TS-18 dos pedidos concurrentes devuelven el mismo request', async () => {
    const c = await futureChallenge();
    const { app } = await buildDbApp(dbs);
    const [r1, r2] = await Promise.all([regen(app, c.id), regen(app, c.id)]);
    expect([r1.status, r2.status]).toEqual([202, 202]);
    expect(((await r1.json()) as Json).request_id).toBe(((await r2.json()) as Json).request_id);
    expect(await requests()).toHaveLength(1);
  });

  it('TS-19 permite un pedido nuevo tras uno cerrado', async () => {
    const c = await futureChallenge();
    const failed = await dbs.insertGenerationRequest({
      challengeId: c.id,
      status: 'failed',
      error: 'no_valid_candidate',
      processedAt: new Date('2026-12-01T09:00:00Z'),
    });
    const { app } = await buildDbApp(dbs);
    const res = await regen(app, c.id);
    expect(res.status).toBe(202);
    expect(((await res.json()) as Json).request_id).not.toBe(failed.id);
    expect(await requests()).toHaveLength(2);
  });

  it('TS-20 estados no regenerables → 409', async () => {
    const { app } = await buildDbApp(dbs);
    const games = ['devdle', 'grep-grid', 'timeline', 'big-o'] as const;
    const specs = [
      { status: 'published' },
      { status: 'voided', voidReason: 'x', voidedAt: new Date('2026-12-01T09:00:00Z') },
      { status: 'rejected' },
      { status: 'draft' },
    ] as const;
    for (const [i, spec] of specs.entries()) {
      const c = await dbs.insertChallenge({ gameId: games[i]!, date: '2026-12-05', ...spec });
      const res = await regen(app, c.id);
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({
        error: { code: 'not_regenerable', message: 'El desafío no se puede regenerar.' },
      });
    }
    expect(await requests()).toHaveLength(0);
  });

  it('TS-21 fecha de hoy o pasada → 409', async () => {
    const a = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-01',
      status: 'approved',
    });
    const b = await dbs.insertChallenge({
      gameId: 'timeline',
      date: '2026-11-30',
      status: 'approved',
    });
    const { app } = await buildDbApp(dbs);
    expect((await regen(app, a.id)).status).toBe(409);
    expect((await regen(app, b.id)).status).toBe(409);
    expect(await requests()).toHaveLength(0);
  });

  it('TS-22 inexistente → 404', async () => {
    const { app } = await buildDbApp(dbs);
    const res = await regen(app, randomUUID());
    expect(res.status).toBe(404);
    expect(((await res.json()) as Json).error.code).toBe('not_found');
    expect(await requests()).toHaveLength(0);
  });

  it('TS-23 challenge_id no uuid → 422', async () => {
    const { app } = await buildDbApp(dbs);
    const res = await regen(app, 'abc');
    expect(res.status).toBe(422);
    expect(((await res.json()) as Json).error.code).toBe('validation_error');
  });

  it('TS-24 exige el Origin del admin', async () => {
    const c = await futureChallenge();
    const { app } = await buildDbApp(dbs);
    const res = await regen(app, c.id, { Origin: 'http://localhost:5173' });
    expect(res.status).toBe(403);
    expect(((await res.json()) as Json).error.code).toBe('forbidden_origin');
    expect(await requests()).toHaveLength(0);
  });

  it('TS-25 ROLLBACK si falla pg_notify', async () => {
    const c = await futureChallenge();
    const { app } = await buildDbApp(dbs, {
      wrapRegenerationRepo: (repo) =>
        Object.assign(Object.create(repo) as typeof repo, {
          notify: async () => {
            throw new Error('boom');
          },
        }),
    });
    const res = await regen(app, c.id);
    expect(res.status).toBe(500);
    expect(((await res.json()) as Json).error.code).toBe('internal_error');
    expect(await requests()).toHaveLength(0);
  });
});
