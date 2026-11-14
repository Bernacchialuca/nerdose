import { challenges, generationFailures, jobRuns } from '@nerdose/db';
import { and, asc, eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { ChallengePublishingRepository } from '@/domain/challenge-publishing/challenge-publishing.repository';
import { createGeneratorRegistry } from '@/games/registry';
import { fillJob } from '@/scheduler/jobs/fill.job';
import { runJob } from '@/scheduler/run-job';

import { bigO, bigOOnly, CHECKS13, TIMEOUT, withRunner } from '../helpers/big-o';
import { setupTestDb } from '../helpers/db';
import { captureLogger } from '../helpers/logger';
import { NOW, SECRET } from '../helpers/regeneration';

const t = setupTestDb();

beforeEach(() => t.reset());
afterAll(() => t.cleanup());

function run(launch: string, registry: ReturnType<typeof createGeneratorRegistry>) {
  const body = fillJob({
    db: t.svc.db,
    env: { GENERATOR_SECRET: SECRET, LAUNCH_DATE: launch, GENERATION_MAX_ATTEMPTS: 20 },
    registry,
    repo: new ChallengePublishingRepository(t.svc.db),
  });
  return runJob('fill', body, {
    sql: t.svc.sql,
    db: t.svc.db,
    logger: captureLogger().logger,
    clock: { now: () => NOW },
    signal: new AbortController().signal,
  });
}

const bigORows = () => t.owner.db.select().from(challenges).where(eq(challenges.gameId, 'big-o'));
const runs = () => t.owner.db.select().from(jobRuns).orderBy(asc(jobRuns.startedAt));

describe('fill con big-o', () => {
  it('TS-10 20 intentos sin candidato para today+1 registran generation_failures', async () => {
    const registry = createGeneratorRegistry([withRunner(bigO, () => Promise.resolve(TIMEOUT))]);
    expect(await run('2026-11-20', registry)).toBe('success');

    const failures = await t.owner.db.select().from(generationFailures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatchObject({
      gameId: 'big-o',
      date: '2026-12-02',
      attempts: 20,
      lastReason: 'run_js: timeout',
    });
    expect((await runs()).at(-1)!.summary).toEqual({
      generated: 280,
      approved: 0,
      rejected: 280,
      missing: 14,
    });
    const rows = await bigORows();
    expect(rows.filter((r) => r.status === 'approved')).toHaveLength(0);
    const day = rows.filter((r) => r.date === '2026-12-02').sort((a, b) => a.attempt - b.attempt);
    expect(day.map((r) => r.attempt)).toEqual(Array.from({ length: 20 }, (_, i) => i));
    for (const r of day) {
      expect(r.status).toBe('rejected');
      expect(r.verification).toMatchObject({ reason: 'run_js: timeout' });
    }
  });

  it('TS-11 con ejecución real aprueba todas las fechas y es idempotente', async () => {
    expect(await run('2026-12-13', bigOOnly)).toBe('success');
    expect((await runs()).at(-1)!.summary).toEqual({
      generated: 3,
      approved: 3,
      rejected: 0,
      missing: 0,
    });
    const approved = await t.owner.db
      .select()
      .from(challenges)
      .where(and(eq(challenges.gameId, 'big-o'), eq(challenges.status, 'approved')))
      .orderBy(asc(challenges.date));
    expect(
      approved.map((r) => ({
        date: r.date,
        number: r.number,
        attempt: r.attempt,
        recipe: (r.payload as { recipe: string }).recipe,
        answer: (r.payload as { answer: string }).answer,
      })),
    ).toEqual([
      {
        date: '2026-12-13',
        number: 1,
        attempt: 0,
        recipe: 'cubic_halving_recursion',
        answer: 'o_n3',
      },
      { date: '2026-12-14', number: 2, attempt: 0, recipe: 'dc(2,constant)', answer: 'o_n' },
      { date: '2026-12-15', number: 3, attempt: 0, recipe: 'halving', answer: 'o_log_n' },
    ]);
    for (const r of approved) {
      expect(r.generatorVersion).toBe('big-o@1');
      const v = r.verification as { ok: boolean; checks: { name: string }[] };
      expect(v.ok).toBe(true);
      expect(v.checks.map((c) => c.name)).toEqual(CHECKS13);
    }
    expect(await t.owner.db.select().from(generationFailures)).toHaveLength(0);

    const count = (await t.owner.db.select().from(challenges)).length;
    expect(await run('2026-12-13', bigOOnly)).toBe('success');
    expect((await runs()).at(-1)!.summary).toEqual({
      generated: 0,
      approved: 0,
      rejected: 0,
      missing: 0,
    });
    expect((await t.owner.db.select().from(challenges)).length).toBe(count);
  });
});
