import { fileURLToPath } from 'node:url';

import { Cron } from 'croner';
import { loadDataset } from '@nerdose/content';
import { challenges, generationRequests, jobRuns, terms } from '@nerdose/db';
import { asc, eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { createJobTracker } from '@/scheduler/job-tracker';
import { buildScheduledJobs, runStartup } from '@/startup';

import { BANK16, insertTerms } from './helpers/bank';
import { setupTestDb } from './helpers/db';
import { captureLogger } from './helpers/logger';
import { requestFor } from './helpers/regeneration';
import { devdleOnlyRegistry } from './helpers/registry';

const t = setupTestDb();

beforeEach(() => t.reset());
afterAll(() => t.cleanup());

describe('buildScheduledJobs', () => {
  it('declara fill cada hora al minuto 10 UTC', () => {
    const runFill = async () => undefined;
    expect(buildScheduledJobs(runFill)).toEqual([
      { name: 'fill', pattern: '10 * * * *', run: runFill },
    ]);
    expect(
      new Cron('10 * * * *', { timezone: 'UTC' })
        .nextRun(new Date('2026-12-01T12:00:00Z'))
        ?.toISOString(),
    ).toBe('2026-12-01T12:10:00.000Z');
  });
});

describe('runStartup', () => {
  const deps = (signal = new AbortController().signal) => {
    const captured = captureLogger();
    return {
      captured,
      deps: {
        sql: t.svc.sql,
        db: t.svc.db,
        logger: captured.logger,
        clock: { now: () => new Date('2026-12-01T12:00:00.000Z') },
        signal,
        tracker: createJobTracker(),
        env: {
          LAUNCH_DATE: '2026-11-20',
          GENERATOR_SECRET: 'test-secret-0123456789abcdef0123456789',
          GENERATION_MAX_ATTEMPTS: 20,
        },
        registry: devdleOnlyRegistry,
      },
    };
  };

  it('con un dataset inválido sync_banks falla y fill corre igual', async () => {
    await insertTerms(t.owner.db, BANK16);
    const { deps: d } = deps();
    const running = await runStartup({
      ...d,
      loadDataset: () =>
        loadDataset(fileURLToPath(new URL('./fixtures/datasets/invalid/', import.meta.url))),
    });
    try {
      expect(running).toBeDefined();
      const runs = await t.owner.db.select().from(jobRuns).orderBy(asc(jobRuns.startedAt));
      expect(runs.map((r) => [r.job, r.status])).toEqual([
        ['sync_banks', 'failed'],
        ['fill', 'success'],
      ]);
      expect(await t.owner.db.select().from(terms)).toHaveLength(BANK16.length);
    } finally {
      running?.scheduler.stop();
      await running?.queue.stop();
    }
  });

  it('arranca el listener y deja done un pedido pendiente previo', async () => {
    await insertTerms(t.owner.db, BANK16);
    const { deps: d } = deps();
    await runStartup(d).then(async (first) => {
      first?.scheduler.stop();
      await first?.queue.stop();
    });
    const [old] = await t.owner.db
      .select()
      .from(challenges)
      .where(eq(challenges.date, '2026-12-05'));
    const req = await requestFor(t.owner.db, old!.id);
    const running = await runStartup(d);
    try {
      const [row] = await t.owner.db
        .select()
        .from(generationRequests)
        .where(eq(generationRequests.id, req.id));
      expect(row!.status).toBe('done');
    } finally {
      running?.scheduler.stop();
      await running?.queue.stop();
    }
  });

  it('con la señal abortada no crea el scheduler', async () => {
    const controller = new AbortController();
    controller.abort();
    const { deps: d } = deps(controller.signal);
    expect(await runStartup(d)).toBeUndefined();
  });
});
