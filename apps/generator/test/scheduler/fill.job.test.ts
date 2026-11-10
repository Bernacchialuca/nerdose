import { createDb, challenges, terms } from '@nerdose/db';
import { makeChallenge } from '@nerdose/db/testing';
import { and, asc, eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, inject, it } from 'vitest';

import { ChallengePublishingRepository } from '@/domain/challenge-publishing/challenge-publishing.repository';
import { fillJob } from '@/scheduler/jobs/fill.job';
import { createGeneratorRegistry, generatorRegistry } from '@/games/registry';
import { runJob, type RunJobDeps } from '@/scheduler/run-job';
import { jobRuns } from '@nerdose/db';

import { BANK16, insertTerms } from '../helpers/bank';
import { setupTestDb } from '../helpers/db';
import { captureLogger } from '../helpers/logger';
import { devdleOnlyRegistry } from '../helpers/registry';

const SECRET = 'test-secret-0123456789abcdef0123456789';
const NOW = new Date('2026-12-01T12:00:00.000Z');
const t = setupTestDb();

function setup(
  options: {
    launch?: string;
    attempts?: number;
    registry?: ReturnType<typeof createGeneratorRegistry>;
    signal?: AbortSignal;
    wrapRepo?: (repo: ChallengePublishingRepository) => ReturnType<typeof makeRepo>;
    pool?: ReturnType<typeof createDb>;
  } = {},
) {
  const pool = options.pool ?? t.svc;
  const captured = captureLogger();
  const signal = options.signal ?? new AbortController().signal;
  const deps: RunJobDeps = {
    sql: pool.sql,
    db: pool.db,
    logger: captured.logger,
    clock: { now: () => NOW },
    signal,
  };
  const baseRepo = new ChallengePublishingRepository(pool.db);
  const body = fillJob({
    db: pool.db,
    env: {
      GENERATOR_SECRET: SECRET,
      LAUNCH_DATE: options.launch ?? '2026-11-20',
      GENERATION_MAX_ATTEMPTS: options.attempts ?? 20,
    },
    registry: options.registry ?? devdleOnlyRegistry,
    repo: options.wrapRepo ? options.wrapRepo(baseRepo) : baseRepo,
  });
  return { run: () => runJob('fill', body, deps), deps, body, lines: captured.lines };
}

function makeRepo(repo: ChallengePublishingRepository) {
  return {
    coveredDates: repo.coveredDates.bind(repo),
    bankItems: repo.bankItems.bind(repo),
    recentChallenges: repo.recentChallenges.bind(repo),
    insertDraft: repo.insertDraft.bind(repo),
    approve: repo.approve.bind(repo),
    reject: repo.reject.bind(repo),
  };
}

const challengesOf = (status?: 'approved') =>
  t.owner.db
    .select()
    .from(challenges)
    .where(
      status
        ? and(eq(challenges.gameId, 'devdle'), eq(challenges.status, status))
        : eq(challenges.gameId, 'devdle'),
    )
    .orderBy(asc(challenges.date));
const seededPayload = (date: string, category = 'security') => ({
  term_id: '00000000-0000-4000-8000-000000000000',
  word: 'OTHER',
  category,
  definition: { es: 'a', en: 'b' },
  summary: { es: 'a', en: 'b' },
  date,
});
const lastRun = async () => (await t.owner.db.select().from(jobRuns)).at(-1)!;

beforeEach(async () => {
  await t.reset();
  await insertTerms(t.owner.db, BANK16);
});
afterAll(() => t.cleanup());

describe('job fill', () => {
  it('rellena los 14 días con number, términos distintos y rotación de categoría', async () => {
    expect(await setup().run()).toBe('success');
    expect((await lastRun()).summary).toEqual({
      generated: 14,
      approved: 14,
      rejected: 0,
      missing: 0,
    });
    const rows = await challengesOf('approved');
    expect(rows.map((r) => r.date)).toEqual(
      Array.from({ length: 14 }, (_, i) => `2026-12-${String(i + 2).padStart(2, '0')}`),
    );
    expect(rows.map((r) => r.number)).toEqual(Array.from({ length: 14 }, (_, i) => 13 + i));
    expect((await challengesOf()).filter((r) => r.date <= '2026-12-01')).toHaveLength(0);
    const payloads = rows.map((r) => r.payload as { term_id: string; category: string });
    expect(new Set(payloads.map((p) => p.term_id)).size).toBe(14);
    const used = await t.owner.db.select().from(terms);
    for (const [i, row] of rows.entries()) {
      const term = used.find((u) => u.id === payloads[i]!.term_id);
      expect(term?.lastUsedDevdle).toBe(row.date);
      for (const back of [1, 2, 3]) {
        if (i - back >= 0) expect(payloads[i]!.category).not.toBe(payloads[i - back]!.category);
      }
    }
  });

  it('es idempotente', async () => {
    await setup().run();
    const before = (await challengesOf()).length;
    expect(await setup().run()).toBe('success');
    expect((await lastRun()).summary).toEqual({
      generated: 0,
      approved: 0,
      rejected: 0,
      missing: 0,
    });
    expect((await challengesOf()).length).toBe(before);
  });

  it('solo rellena los huecos: published, voided cubren; rejected no', async () => {
    await makeChallenge(t.owner.db, {
      gameId: 'devdle',
      date: '2026-12-02',
      status: 'published',
      number: 13,
      payload: seededPayload('2026-12-02'),
    });
    await makeChallenge(t.owner.db, {
      gameId: 'devdle',
      date: '2026-12-03',
      status: 'voided',
      number: 14,
      payload: seededPayload('2026-12-03'),
      voidReason: 'test',
      voidedAt: NOW,
    });
    await makeChallenge(t.owner.db, {
      gameId: 'devdle',
      date: '2026-12-04',
      status: 'rejected',
      number: 15,
      payload: seededPayload('2026-12-04'),
    });
    await setup().run();
    expect((await lastRun()).summary).toMatchObject({ generated: 12, approved: 12 });
    const all = await challengesOf();
    expect(all.filter((r) => r.date === '2026-12-02')).toHaveLength(1);
    expect(all.filter((r) => r.date === '2026-12-03')).toHaveLength(1);
    expect(all.filter((r) => r.date === '2026-12-04' && r.status === 'approved')).toHaveLength(1);
  });

  it('respeta un LAUNCH_DATE futuro', async () => {
    await setup({ launch: '2026-12-10' }).run();
    const rows = await challengesOf('approved');
    expect(rows).toHaveLength(6);
    expect(rows.map((r) => r.number)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(rows[0]!.date).toBe('2026-12-10');
  });

  it('una fecha que se agota cuenta en missing y loguea', async () => {
    await t.reset();
    await insertTerms(t.owner.db, [
      { term: 'REACT', category: 'programming_languages', lastUsedDevdle: '2026-11-30' },
    ]);
    const s = setup({ launch: '2026-12-15', attempts: 3 });
    expect(await s.run()).toBe('success');
    expect((await lastRun()).summary).toEqual({
      generated: 3,
      approved: 0,
      rejected: 3,
      missing: 1,
    });
    expect(s.lines()).toContainEqual(
      expect.objectContaining({
        msg: 'ChallengeGenerationFailed',
        game_id: 'devdle',
        date: '2026-12-15',
        attempts: 3,
      }),
    );
  });

  it('un error en un hueco no frena los demás y deja el job failed', async () => {
    await t.reset();
    const s = setup({ launch: '2026-12-14' });
    expect(await s.run()).toBe('failed');
    const run = await lastRun();
    expect(run.status).toBe('failed');
    expect(run.summary).toEqual({ generated: 0, approved: 0, rejected: 0, missing: 0 });
    const errors = s.lines().filter((l) => l.msg === 'Gap generation failed');
    expect(errors).toHaveLength(2);
    errors.forEach((l) => expect(l).toMatchObject({ level: 'error', game_id: 'devdle' }));
  });

  it('un payload aprobado no cambia con otra versión del generator', async () => {
    await setup().run();
    const [before] = (await challengesOf('approved')).filter((r) => r.date === '2026-12-05');
    const registry = createGeneratorRegistry([
      { ...generatorRegistry.get('devdle'), version: 'devdle@99' },
    ]);
    await setup({ registry }).run();
    const all = await challengesOf();
    expect(all).toHaveLength(14);
    const [after] = all.filter((r) => r.date === '2026-12-05');
    expect(after).toMatchObject({
      payload: before!.payload,
      seed: before!.seed,
      attempt: before!.attempt,
      generatorVersion: 'devdle@1',
    });
  });

  it('dos instancias sobre las mismas fechas: una corre y la otra se saltea', async () => {
    const other = createDb(inject('generatorUrl'), { max: 3 });
    try {
      const results = await Promise.all([setup().run(), setup({ pool: other }).run()]);
      expect([...results].sort()).toEqual(['skipped', 'success']);
      const rows = await challengesOf('approved');
      expect(rows).toHaveLength(14);
      expect(new Set(rows.map((r) => r.date)).size).toBe(14);
    } finally {
      await other.sql.end();
    }
  });

  it('el apagado a mitad del relleno termina el candidato y no arranca otro', async () => {
    const controller = new AbortController();
    const s = setup({
      signal: controller.signal,
      wrapRepo: (repo) => ({
        ...makeRepo(repo),
        approve: async (...args) => {
          const result = await repo.approve(...args);
          controller.abort();
          return result;
        },
      }),
    });
    expect(await s.run()).toBe('success');
    expect((await lastRun()).summary).toEqual({
      generated: 1,
      approved: 1,
      rejected: 0,
      missing: 0,
    });
    const rows = await challengesOf();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ date: '2026-12-02', status: 'approved' });
  });

  it('usa los desafíos vigentes como historial de categorías', async () => {
    await makeChallenge(t.owner.db, {
      gameId: 'devdle',
      date: '2026-12-01',
      status: 'published',
      number: 12,
      payload: {
        term_id: '00000000-0000-4000-8000-000000000000',
        word: 'OTHER',
        category: 'linux',
        definition: { es: 'a', en: 'b' },
        summary: { es: 'a', en: 'b' },
        date: '2026-12-01',
      },
    });
    await setup().run();
    const first = (await challengesOf('approved')).find((r) => r.date === '2026-12-02')!;
    expect((first.payload as { category: string }).category).not.toBe('linux');
  });
});
