import { challenges, createDb, generationRequests } from '@nerdose/db';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeEach, describe, expect, inject, it, vi } from 'vitest';

import {
  startQueueListener,
  type QueueListener,
  type QueueListenerDeps,
} from '@/domain/challenge-publishing/queue/queue-listener';
import {
  processNextRequest,
  type ProcessResult,
} from '@/domain/challenge-publishing/queue/process-request';

import { BANK16, insertTerms } from '../helpers/bank';
import { setupTestDb } from '../helpers/db';
import { captureLogger } from '../helpers/logger';
import { approveOld, ENV, NOW, requestFor } from '../helpers/regeneration';
import { devdleOnlyRegistry } from '../helpers/registry';

const t = setupTestDb();
const open: QueueListener[] = [];

beforeEach(() => t.reset());
afterEach(async () => {
  vi.useRealTimers();
  await Promise.all(open.splice(0).map((l) => l.stop()));
});
afterAll(() => t.cleanup());

async function seedOlds(dates: string[]) {
  await insertTerms(t.owner.db, BANK16);
  const ids: string[] = [];
  for (const date of dates) {
    await approveOld(t.svc.db, date);
    const [row] = await t.owner.db.select().from(challenges).where(eq(challenges.date, date));
    ids.push(row!.id);
  }
  return ids;
}

async function start(extra: Partial<QueueListenerDeps> = {}, pool = t.svc) {
  const captured = captureLogger();
  const listener = await startQueueListener({
    sql: pool.sql,
    db: pool.db,
    env: ENV,
    registry: devdleOnlyRegistry,
    clock: { now: () => NOW },
    logger: captured.logger,
    signal: new AbortController().signal,
    ...extra,
  });
  open.push(listener);
  return { listener, lines: captured.lines };
}

const statusOf = async (id: string) =>
  (await t.owner.db.select().from(generationRequests).where(eq(generationRequests.id, id)))[0]!
    .status;
const notify = (id: string) => t.owner.sql`SELECT pg_notify('generation_requests', ${id})`;

describe('startQueueListener', () => {
  it('drena los pedidos pendientes al arrancar', async () => {
    const [a, b] = await seedOlds(['2026-12-05', '2026-12-06']);
    const r1 = await requestFor(t.owner.db, a!);
    const r2 = await requestFor(t.owner.db, b!);
    const { lines } = await start();
    expect(await statusOf(r1.id)).toBe('done');
    expect(await statusOf(r2.id)).toBe('done');
    expect(lines().some((l) => l.msg === 'Queue listener started')).toBe(true);
  });

  it('un NOTIFY dispara el drain', async () => {
    const [a] = await seedOlds(['2026-12-05']);
    await start();
    const req = await requestFor(t.owner.db, a!);
    await notify(req.id);
    await vi.waitFor(async () => expect(await statusOf(req.id)).toBe('done'), { timeout: 10_000 });
  });

  it('el poll de respaldo atiende pedidos sin NOTIFY', async () => {
    const [a] = await seedOlds(['2026-12-05']);
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    await start();
    const req = await requestFor(t.owner.db, a!);
    vi.advanceTimersByTime(59_999);
    await new Promise((resolve) => setImmediate(resolve));
    expect(await statusOf(req.id)).toBe('pending');
    vi.advanceTimersByTime(1);
    vi.useRealTimers();
    await vi.waitFor(async () => expect(await statusOf(req.id)).toBe('done'), { timeout: 10_000 });
  });

  it('es single-flight: nunca hay dos procesos concurrentes', async () => {
    const [a, b, c] = await seedOlds(['2026-12-05', '2026-12-06', '2026-12-07']);
    let active = 0;
    let max = 0;
    const process = async (deps: Parameters<typeof processNextRequest>[0]) => {
      active++;
      max = Math.max(max, active);
      try {
        return await processNextRequest(deps);
      } finally {
        active--;
      }
    };
    await start({ process });
    const reqs = await Promise.all([a, b, c].map((id) => requestFor(t.owner.db, id!)));
    await Promise.all(reqs.slice(0, 3).map((r) => notify(r.id)));
    await vi.waitFor(
      async () => {
        for (const r of reqs) expect(await statusOf(r.id)).toBe('done');
      },
      { timeout: 15_000 },
    );
    expect(max).toBe(1);
  });

  it('el drain corta ante un error sin reintentar en loop', async () => {
    const calls: ProcessResult[] = [];
    const process = vi.fn(async () => {
      calls.push('error');
      return 'error' as const;
    });
    await start({ process });
    // El onlisten inicial y el drain de arranque se fusionan: a lo sumo una repetición, sin loop caliente.
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(calls.length).toBeLessThanOrEqual(2);
    const settled = calls.length;
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(calls).toHaveLength(settled);
  });

  it('stop() detiene el LISTEN y el poll, y es idempotente', async () => {
    const [a] = await seedOlds(['2026-12-05']);
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const { listener } = await start();
    await listener.stop();
    await listener.stop();
    const req = await requestFor(t.owner.db, a!);
    await notify(req.id);
    vi.advanceTimersByTime(60_000);
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(await statusOf(req.id)).toBe('pending');
  });

  it('el LISTEN no consume conexiones del pool', async () => {
    const [a] = await seedOlds(['2026-12-05']);
    const small = createDb(inject('generatorUrl'), { max: 2 });
    try {
      await start({}, small);
      const req = await requestFor(t.owner.db, a!);
      await notify(req.id);
      await vi.waitFor(async () => expect(await statusOf(req.id)).toBe('done'), {
        timeout: 10_000,
      });
    } finally {
      await open.splice(0).reduce((p, l) => p.then(() => l.stop()), Promise.resolve());
      await small.sql.end();
    }
  });
});
