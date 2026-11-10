import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadDataset } from '@nerdose/content';
import { challenges, createDb, jobRuns, terms } from '@nerdose/db';
import { truncateAll } from '@nerdose/db/testing';
import { today } from '@nerdose/core';
import { asc, eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeEach, describe, expect, inject, it } from 'vitest';

import { freePort, silentServer } from './helpers/net';
import { startGenerator } from './helpers/process';

const CWD = fileURLToPath(new URL('..', import.meta.url));
const SECRET = 'test-secret-0123456789abcdef0123456789';
const owner = createDb(inject('ownerUrl'), { max: 2 });
const startEnv = (extra: Record<string, string> = {}) => ({
  DATABASE_URL: inject('generatorUrl'),
  LAUNCH_DATE: '2026-01-01',
  GENERATOR_SECRET: SECRET,
  ...extra,
});

beforeEach(() => truncateAll(owner));
afterAll(() => owner.sql.end());

let running: ReturnType<typeof startGenerator> | undefined;
const closers: Array<() => Promise<void>> = [];

afterEach(async () => {
  if (running) await running.stop('SIGKILL');
  running = undefined;
  await Promise.all(closers.splice(0).map((close) => close()));
});

const isStarted = (line: Record<string, unknown>) => line.msg === 'Scheduler started';

describe('proceso del generator', () => {
  it('aborta sin DATABASE_URL, nombrando la variable', () => {
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
      cwd: CWD,
      env: { PATH: process.env.PATH, NODE_ENV: 'test' },
      encoding: 'utf8',
      timeout: 60_000,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('DATABASE_URL');
    expect(result.stdout).not.toContain('Scheduler started');
  });

  it('aborta sin LAUNCH_DATE, nombrando la variable', () => {
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
      cwd: CWD,
      env: {
        PATH: process.env.PATH,
        NODE_ENV: 'test',
        DATABASE_URL: inject('generatorUrl'),
        GENERATOR_SECRET: SECRET,
      },
      encoding: 'utf8',
      timeout: 60_000,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('LAUNCH_DATE');
    expect(result.stdout).not.toContain('Scheduler started');
  });

  it('arranca en orden: rol, sync_banks, fill y scheduler', async () => {
    const url = inject('generatorUrl');
    running = startGenerator(startEnv());
    const started = await running.waitForLog(isStarted);
    expect(started.jobs).toBe(1);
    const all = running.parsed();
    const indexOf = (predicate: (line: Record<string, unknown>) => boolean) =>
      all.findIndex(predicate);
    const role = indexOf((l) => l.db_role === 'nerdose_generator');
    const sync = indexOf(
      (l) => l.job === 'sync_banks' && l.msg === 'Job finished' && l.status === 'success',
    );
    const fill = indexOf(
      (l) => l.job === 'fill' && l.msg === 'Job finished' && l.status === 'success',
    );
    const scheduler = indexOf(isStarted);
    expect(role).toBeGreaterThanOrEqual(0);
    expect(role).toBeLessThan(sync);
    expect(sync).toBeLessThan(fill);
    expect(fill).toBeLessThan(scheduler);

    const approvedTerms = await owner.db.select().from(terms).where(eq(terms.status, 'approved'));
    expect(approvedTerms).toHaveLength(loadDataset().manifest.counts.terms.approved);
    const runs = await owner.db.select().from(jobRuns).orderBy(asc(jobRuns.startedAt));
    expect(runs.map((r) => [r.job, r.status])).toEqual([
      ['sync_banks', 'success'],
      ['fill', 'success'],
    ]);
    const fillStart = runs[1]!.startedAt;
    const expected = Array.from({ length: 14 }, (_, i) => {
      const day = new Date(`${today(fillStart)}T00:00:00.000Z`);
      day.setUTCDate(day.getUTCDate() + i + 1);
      return day.toISOString().slice(0, 10);
    });
    const rows = await owner.db
      .select()
      .from(challenges)
      .where(eq(challenges.status, 'approved'))
      .orderBy(asc(challenges.date));
    for (const gameId of ['devdle', 'grep-grid']) {
      expect(rows.filter((r) => r.gameId === gameId).map((r) => r.date)).toEqual(expected);
    }
    expect(rows).toHaveLength(expected.length * 2);

    const raw = running.lines().join('\n');
    expect(raw).not.toContain(SECRET);
    expect(raw).not.toContain(new URL(url).password);
    expect(raw).not.toContain(url);
  });

  it('se apaga con SIGTERM, código 0 y sin locks tomados', async () => {
    running = startGenerator(startEnv());
    await running.waitForLog(isStarted);
    expect(await running.stop('SIGTERM')).toBe(0);
    expect(running.parsed().filter((l) => l.msg === 'Shutdown complete')).toHaveLength(1);
    const reserved = await owner.sql.reserve();
    try {
      for (const key of [7001, 7002]) {
        const [row] = await reserved<{ l: boolean }[]>`SELECT pg_try_advisory_lock(${key}) AS l`;
        expect(row?.l).toBe(true);
        await reserved`SELECT pg_advisory_unlock(${key})`;
      }
    } finally {
      reserved.release();
    }
  });

  it('un SIGTERM repetido no reinicia el apagado', async () => {
    running = startGenerator(startEnv());
    await running.waitForLog(isStarted);
    running.kill('SIGTERM');
    running.kill('SIGTERM');
    expect(await running.exited).toBe(0);
    expect(running.parsed().filter((line) => line.msg === 'Shutdown complete')).toHaveLength(1);
  });

  it.each([
    [
      'rechazada',
      async () => `postgres://nerdose_generator:x@127.0.0.1:${await freePort()}/nerdose`,
    ],
    [
      'colgada',
      async () => {
        const silent = await silentServer();
        closers.push(silent.close);
        return `postgres://nerdose_generator:x@127.0.0.1:${silent.port}/nerdose`;
      },
    ],
  ])('con la base %s sale con código 1', async (_name, makeUrl) => {
    const url = await makeUrl();
    const start = Date.now();
    running = startGenerator(startEnv({ DATABASE_URL: url }));
    expect(await running.exited).toBe(1);
    expect(Date.now() - start).toBeLessThan(10_000);
    const all = running.parsed();
    expect(all).toContainEqual(
      expect.objectContaining({
        level: 'fatal',
        msg: 'Database unavailable at startup',
        err: expect.anything(),
      }),
    );
    expect(all.some(isStarted)).toBe(false);
    expect(running.lines().join('\n')).not.toContain(url);
  });
});
