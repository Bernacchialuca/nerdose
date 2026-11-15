import { challenges, generationFailures, jobRuns } from '@nerdose/db';
import { and, asc, eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { ChallengePublishingRepository } from '@/domain/challenge-publishing/challenge-publishing.repository';
import { createGeneratorRegistry } from '@/games/registry';
import { fillJob } from '@/scheduler/jobs/fill.job';
import { runJob } from '@/scheduler/run-job';

import { TIMEOUT } from '../helpers/big-o';
import { BH_CHECKS, bugHunt, bugHuntOnly, withBugHuntRunner } from '../helpers/bug-hunt';
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

const bugHuntRows = () =>
  t.owner.db.select().from(challenges).where(eq(challenges.gameId, 'bug-hunt'));
const runs = () => t.owner.db.select().from(jobRuns).orderBy(asc(jobRuns.startedAt));

describe('fill con bug-hunt', () => {
  it('TS-11 20 intentos sin candidato para today+1 registran la falla una sola vez', async () => {
    const registry = createGeneratorRegistry([
      withBugHuntRunner(bugHunt, () => Promise.resolve(TIMEOUT)),
    ]);
    expect(await run('2026-11-20', registry)).toBe('success');

    const failures = await t.owner.db.select().from(generationFailures);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatchObject({
      gameId: 'bug-hunt',
      date: '2026-12-02',
      attempts: 20,
      lastReason: 'run_correct_js: timeout',
    });
    const summary = { generated: 280, approved: 0, rejected: 280, missing: 14 };
    expect((await runs()).at(-1)!.summary).toEqual(summary);
    const rows = await bugHuntRows();
    expect(rows.filter((r) => r.status === 'approved')).toHaveLength(0);
    const day = rows.filter((r) => r.date === '2026-12-02').sort((a, b) => a.attempt - b.attempt);
    expect(day.map((r) => r.attempt)).toEqual(Array.from({ length: 20 }, (_, i) => i));
    for (const r of day) {
      expect(r.status).toBe('rejected');
      const v = r.verification as {
        reason: string;
        checks: { name: string; ok: boolean; detail?: string }[];
      };
      expect(v.reason).toBe('run_correct_js: timeout');
      for (const c of v.checks.filter((c) => c.name.startsWith('run_'))) {
        expect(c).toMatchObject({ ok: false, detail: 'timeout (10000 ms)' });
      }
    }

    expect(await run('2026-11-20', registry)).toBe('success');
    expect((await runs()).at(-1)!.summary).toEqual(summary);
    const after = await t.owner.db.select().from(generationFailures);
    expect(after).toHaveLength(1);
    expect(after[0]).toMatchObject({ attempts: 20, lastReason: 'run_correct_js: timeout' });
    expect(after[0]!.updatedAt.getTime()).toBeGreaterThan(after[0]!.createdAt.getTime());
  });

  it('TS-12 con ejecución real aprueba todas las fechas y es idempotente', async () => {
    expect(await run('2026-12-13', bugHuntOnly)).toBe('success');
    expect((await runs()).at(-1)!.summary).toEqual({
      generated: 3,
      approved: 3,
      rejected: 0,
      missing: 0,
    });
    const approved = await t.owner.db
      .select()
      .from(challenges)
      .where(and(eq(challenges.gameId, 'bug-hunt'), eq(challenges.status, 'approved')))
      .orderBy(asc(challenges.date));
    expect(
      approved.map((r) => {
        const p = r.payload as {
          template: string;
          bug_type: string;
          function_name: string;
        };
        return {
          date: r.date,
          number: r.number,
          attempt: r.attempt,
          template: p.template,
          bug_type: p.bug_type,
          function_name: p.function_name,
        };
      }),
    ).toEqual([
      {
        date: '2026-12-13',
        number: 1,
        attempt: 0,
        template: 'sum_range',
        bug_type: 'wrong_operator',
        function_name: 'sumBefore',
      },
      {
        date: '2026-12-14',
        number: 2,
        attempt: 0,
        template: 'extreme_index',
        bug_type: 'misplaced_return',
        function_name: 'lastMinIndex',
      },
      {
        date: '2026-12-15',
        number: 3,
        attempt: 0,
        template: 'count_where',
        bug_type: 'wrong_operator',
        function_name: 'countMultiplesOf4',
      },
    ]);
    for (const r of approved) {
      expect(r.generatorVersion).toBe('bug-hunt@1');
      const v = r.verification as { ok: boolean; checks: { name: string }[] };
      expect(v.ok).toBe(true);
      expect(v.checks.map((c) => c.name)).toEqual(BH_CHECKS);
    }
    expect(await t.owner.db.select().from(generationFailures)).toHaveLength(0);

    const count = (await t.owner.db.select().from(challenges)).length;
    expect(await run('2026-12-13', bugHuntOnly)).toBe('success');
    expect((await runs()).at(-1)!.summary).toEqual({
      generated: 0,
      approved: 0,
      rejected: 0,
      missing: 0,
    });
    expect((await t.owner.db.select().from(challenges)).length).toBe(count);
  });
});
