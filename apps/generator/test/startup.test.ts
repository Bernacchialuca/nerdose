import { fileURLToPath } from 'node:url';

import { Cron } from 'croner';
import { loadDataset } from '@nerdose/content';
import { jobRuns, terms } from '@nerdose/db';
import { asc } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { generatorRegistry } from '@/games/registry';
import { createJobTracker } from '@/scheduler/job-tracker';
import { buildScheduledJobs, runStartup } from '@/startup';

import { BANK16, insertTerms } from './helpers/bank';
import { setupTestDb } from './helpers/db';
import { captureLogger } from './helpers/logger';

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
        registry: generatorRegistry,
      },
    };
  };

  it('con un dataset inválido sync_banks falla y fill corre igual', async () => {
    await insertTerms(t.owner.db, BANK16);
    const { deps: d } = deps();
    const scheduler = await runStartup({
      ...d,
      loadDataset: () =>
        loadDataset(fileURLToPath(new URL('./fixtures/datasets/invalid/', import.meta.url))),
    });
    try {
      expect(scheduler).toBeDefined();
      const runs = await t.owner.db.select().from(jobRuns).orderBy(asc(jobRuns.startedAt));
      expect(runs.map((r) => [r.job, r.status])).toEqual([
        ['sync_banks', 'failed'],
        ['fill', 'success'],
      ]);
      expect(await t.owner.db.select().from(terms)).toHaveLength(BANK16.length);
    } finally {
      scheduler?.stop();
    }
  });

  it('con la señal abortada no crea el scheduler', async () => {
    const controller = new AbortController();
    controller.abort();
    const { deps: d } = deps(controller.signal);
    expect(await runStartup(d)).toBeUndefined();
  });
});
