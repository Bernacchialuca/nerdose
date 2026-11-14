import { challenges, generationFailures, jobRuns, terms } from '@nerdose/db';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { ChallengePublishingRepository } from '@/domain/challenge-publishing/challenge-publishing.repository';
import { fillJob } from '@/scheduler/jobs/fill.job';
import { runJob } from '@/scheduler/run-job';

import { BANK16, insertTerms } from '../helpers/bank';
import { setupTestDb } from '../helpers/db';
import { captureLogger } from '../helpers/logger';
import { devdleOnlyRegistry } from '../helpers/registry';
import { approveOld, requestFor } from '../helpers/regeneration';

const SECRET = 'test-secret-0123456789abcdef0123456789';
const NOW = new Date('2026-12-01T12:00:00.000Z');
const t = setupTestDb();

beforeEach(() => t.reset());
afterAll(() => t.cleanup());

const USED = [
  { term: 'REACT', category: 'programming_languages' as const, lastUsedDevdle: '2026-11-30' },
];

function run(attempts: number, launch = '2026-12-02', failUpsert = false) {
  const captured = captureLogger();
  const base = new ChallengePublishingRepository(t.svc.db);
  const repo = {
    coveredDates: base.coveredDates.bind(base),
    bankItems: base.bankItems.bind(base),
    recentChallenges: base.recentChallenges.bind(base),
    insertDraft: base.insertDraft.bind(base),
    approve: base.approve.bind(base),
    reject: base.reject.bind(base),
    upsertGenerationFailure: failUpsert
      ? () => Promise.reject(new Error('boom'))
      : base.upsertGenerationFailure.bind(base),
  };
  const body = fillJob({
    db: t.svc.db,
    env: { GENERATOR_SECRET: SECRET, LAUNCH_DATE: launch, GENERATION_MAX_ATTEMPTS: attempts },
    registry: devdleOnlyRegistry,
    repo,
  });
  const result = runJob('fill', body, {
    sql: t.svc.sql,
    db: t.svc.db,
    logger: captured.logger,
    clock: { now: () => NOW },
    signal: new AbortController().signal,
  });
  return { result, lines: captured.lines };
}

const failures = () => t.owner.db.select().from(generationFailures);
const lastRun = async () => (await t.owner.db.select().from(jobRuns))[0]!;

describe('fill: generation_failures', () => {
  it('registra la falla solo para today+1 y conserva summary.missing', async () => {
    await insertTerms(t.owner.db, USED);
    expect(await run(3).result).toBe('success');
    const rows = await failures();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      gameId: 'devdle',
      date: '2026-12-02',
      attempts: 3,
      lastReason: 'not_used_365',
    });
    const job = await lastRun();
    expect(job.status).toBe('success');
    expect((job.summary as { missing: number }).missing).toBe(14);
  });

  it('una segunda corrida actualiza la fila sin duplicar', async () => {
    await insertTerms(t.owner.db, USED);
    await run(3).result;
    const [first] = await failures();
    await run(5).result;
    const rows = await failures();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ attempts: 5, lastReason: 'not_used_365' });
    expect(rows[0]!.updatedAt.getTime()).toBeGreaterThan(first!.createdAt.getTime());
  });

  it('no registra fallas si today+1 no está en el rango', async () => {
    await insertTerms(t.owner.db, USED);
    await run(2, '2026-12-10').result;
    expect(await failures()).toHaveLength(0);
    expect((await lastRun()).summary).toMatchObject({ missing: 6 });
  });

  it('una corrida posterior que logra el desafío no borra la falla', async () => {
    await insertTerms(t.owner.db, USED);
    await run(3).result;
    await t.owner.db.update(terms).set({ lastUsedDevdle: null }).where(eq(terms.term, 'REACT'));
    await run(3).result;
    const [approved] = await t.owner.db
      .select()
      .from(challenges)
      .where(and(eq(challenges.date, '2026-12-02'), eq(challenges.status, 'approved')));
    expect(approved).toBeDefined();
    const rows = await failures();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.attempts).toBe(3);
  });

  it('un error en el UPSERT marca failed y sigue con las demás fechas', async () => {
    await insertTerms(t.owner.db, USED);
    const { result, lines } = run(3, '2026-12-02', true);
    expect(await result).toBe('failed');
    expect(lines()).toContainEqual(
      expect.objectContaining({
        level: 'error',
        msg: 'Gap generation failed',
        game_id: 'devdle',
        date: '2026-12-02',
      }),
    );
    expect(((await lastRun()).summary as { generated: number }).generated).toBeGreaterThan(3);
  });

  it('el rol nerdose_generator puede escribir las tablas de la cola', async () => {
    await insertTerms(t.owner.db, BANK16);
    await approveOld(t.svc.db);
    const [old] = await t.owner.db.select().from(challenges);
    const req = await requestFor(t.owner.db, old!.id);
    await t.svc.db
      .insert(generationFailures)
      .values({ gameId: 'devdle', date: '2026-12-02', attempts: 1, lastReason: null });
    await new ChallengePublishingRepository(t.svc.db).finishRequest(req.id, {
      status: 'failed',
      error: 'x',
    });
    expect(await failures()).toHaveLength(1);
  });
});
