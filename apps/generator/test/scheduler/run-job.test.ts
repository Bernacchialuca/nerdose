import { afterAll, beforeAll, beforeEach, describe, expect, inject, it } from 'vitest';
import { createDb } from '@nerdose/db';
import { jobRuns } from '@nerdose/db';
import { eq } from 'drizzle-orm';

import { JobRunsRepository } from '@/scheduler/job-runs.repository';
import { runJob, type RunJobDeps } from '@/scheduler/run-job';

import { captureLogger } from '../helpers/logger';
import { setupTestDb } from '../helpers/db';

const t = setupTestDb();
const clock = { now: () => new Date('2026-12-01T12:00:00.000Z') };

function makeDeps(overrides: Partial<RunJobDeps> = {}) {
  const captured = captureLogger();
  const deps: RunJobDeps = {
    sql: t.svc.sql,
    db: t.svc.db,
    logger: captured.logger,
    clock,
    signal: new AbortController().signal,
    ...overrides,
  };
  return { deps, lines: captured.lines };
}

const rows = (job: string) => t.owner.db.select().from(jobRuns).where(eq(jobRuns.job, job));

async function lockFree(key: number) {
  const reserved = await t.owner.sql.reserve();
  try {
    const [row] = await reserved<{ l: boolean }[]>`SELECT pg_try_advisory_lock(${key}) AS l`;
    if (row?.l) await reserved`SELECT pg_advisory_unlock(${key})`;
    return row?.l === true;
  } finally {
    reserved.release();
  }
}

beforeAll(() => t.reset());
beforeEach(() => t.reset());
afterAll(() => t.cleanup());

describe('runJob', () => {
  it('registra una corrida exitosa', async () => {
    const { deps, lines } = makeDeps();
    const result = await runJob('sync_banks', async () => ({ summary: { inserted: 1 } }), deps);
    expect(result).toBe('success');
    const [row] = await rows('sync_banks');
    expect(row).toMatchObject({ status: 'success', summary: { inserted: 1 } });
    expect(row?.finishedAt).not.toBeNull();
    expect(lines()).toContainEqual(
      expect.objectContaining({ job: 'sync_banks', msg: 'Job finished', status: 'success' }),
    );
  });

  it('si el cuerpo lanza, resuelve failed y registra el error', async () => {
    const { deps, lines } = makeDeps();
    const result = await runJob(
      'fill',
      async () => {
        throw new Error('boom');
      },
      deps,
    );
    expect(result).toBe('failed');
    const [row] = await rows('fill');
    expect(row).toMatchObject({ status: 'failed', summary: { error: 'boom' } });
    expect(row?.finishedAt).not.toBeNull();
    expect(lines()).toContainEqual(
      expect.objectContaining({
        level: 'error',
        msg: 'Job failed',
        job: 'fill',
        err: expect.anything(),
      }),
    );
  });

  it('registra errores parciales informados por el cuerpo', async () => {
    const summary = { generated: 2, approved: 1, rejected: 1, missing: 0 };
    const { deps } = makeDeps();
    const result = await runJob('fill', async () => ({ summary, failed: true }), deps);
    expect(result).toBe('failed');
    const [row] = await rows('fill');
    expect(row).toMatchObject({ status: 'failed', summary });
  });

  it('sale sin hacer nada si otra sesión tiene el lock', async () => {
    const other = await t.owner.sql.reserve();
    await other`SELECT pg_try_advisory_lock(7001)`;
    try {
      const { deps, lines } = makeDeps();
      let called = false;
      const result = await runJob(
        'fill',
        async () => {
          called = true;
          return { summary: {} };
        },
        deps,
      );
      expect(result).toBe('skipped');
      expect(called).toBe(false);
      expect(await rows('fill')).toHaveLength(0);
      expect(lines()).toContainEqual(
        expect.objectContaining({
          level: 'info',
          job: 'fill',
          msg: 'Job already running elsewhere, skipping',
        }),
      );
      const free = await runJob('sync_banks', async () => ({ summary: {} }), makeDeps().deps);
      expect(free).toBe('success');
    } finally {
      await other`SELECT pg_advisory_unlock(7001)`;
      other.release();
    }
  });

  it('libera siempre los locks', async () => {
    const { deps } = makeDeps();
    await runJob('sync_banks', async () => ({ summary: {} }), deps);
    await runJob(
      'fill',
      async () => {
        throw new Error('x');
      },
      deps,
    );
    await runJob('fill', async () => ({ summary: {}, failed: true }), deps);
    expect(await lockFree(7001)).toBe(true);
    expect(await lockFree(7002)).toBe(true);
  });

  it('si falla el registro en job_runs, devuelve failed y libera el lock', async () => {
    const failing = {
      start: () => Promise.reject(new Error('db down')),
      finish: () => Promise.resolve(),
    };
    const { deps, lines } = makeDeps({ jobRuns: failing });
    await expect(runJob('sync_banks', async () => ({ summary: {} }), deps)).resolves.toBe('failed');
    expect(lines()).toContainEqual(expect.objectContaining({ msg: 'Job failed' }));
    expect(await lockFree(7002)).toBe(true);
  });

  it('dos corridas concurrentes de fill: una se saltea', async () => {
    const otherPool = createDb(inject('generatorUrl'), { max: 3 });
    try {
      let started = 0;
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const bothStarted = new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (started >= 1) {
            clearInterval(check);
            resolve();
          }
        }, 5);
      });
      const slow = async () => {
        started++;
        await gate;
        return { summary: {} };
      };
      const a = runJob('fill', slow, makeDeps().deps);
      await bothStarted;
      const b = runJob('fill', slow, makeDeps({ sql: otherPool.sql, db: otherPool.db }).deps);
      const second = await b;
      release();
      const results = [await a, second].sort();
      expect(results).toEqual(['skipped', 'success']);
      expect(await rows('fill')).toHaveLength(1);
    } finally {
      await otherPool.sql.end();
    }
  });

  it('se registra en el tracker', async () => {
    const { createJobTracker } = await import('@/scheduler/job-tracker');
    const tracker = createJobTracker();
    const { deps } = makeDeps({ tracker });
    const run = runJob('sync_banks', async () => ({ summary: {} }), deps);
    await tracker.idle();
    expect(await run).toBe('success');
  });

  it('JobRunsRepository inicia en running', async () => {
    const repo = new JobRunsRepository(t.svc.db);
    const id = await repo.start('fill');
    const [row] = await t.owner.db.select().from(jobRuns).where(eq(jobRuns.id, id));
    expect(row).toMatchObject({ status: 'running', finishedAt: null });
  });
});
