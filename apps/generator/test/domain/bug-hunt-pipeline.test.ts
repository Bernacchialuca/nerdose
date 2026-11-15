import { createHmac } from 'node:crypto';

import {
  challenges,
  generationFailures,
  generationRequests,
  terms,
  timelineFacts,
} from '@nerdose/db';
import { and, asc, eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { ChallengePublishingRepository } from '@/domain/challenge-publishing/challenge-publishing.repository';
import { generateForDate, type GenerateDeps } from '@/domain/challenge-publishing/generate';
import { processNextRequest } from '@/domain/challenge-publishing/queue/process-request';
import { createGeneratorRegistry } from '@/games/registry';

import {
  approveBugHunt,
  BH_CHECKS,
  bugHunt,
  bugHuntOnly,
  bump,
  countingRunner,
  equivalentOf,
  firstCandidate,
  onePassingOf,
  scriptedBugHuntRunner,
  withBugHuntRunner,
} from '../helpers/bug-hunt';
import { TIMEOUT } from '../helpers/big-o';
import { setupTestDb } from '../helpers/db';
import { captureLogger } from '../helpers/logger';
import { ENV, NOW, requestFor, SECRET } from '../helpers/regeneration';

const t = setupTestDb();
const seedHex = (date: string, attempt: number) =>
  createHmac('sha256', SECRET).update(`bug-hunt:${date}:${attempt}`).digest('hex');
const MS = /^\d+ ms$/;

beforeEach(() => t.reset());
afterAll(() => t.cleanup());

function setup(maxAttempts = 20) {
  const captured = captureLogger();
  const deps: GenerateDeps = {
    repo: new ChallengePublishingRepository(t.svc.db),
    env: { ...ENV, GENERATION_MAX_ATTEMPTS: maxAttempts },
    log: captured.logger,
    signal: new AbortController().signal,
  };
  return { deps, lines: captured.lines };
}

const rowsFor = (date: string) =>
  t.owner.db
    .select()
    .from(challenges)
    .where(and(eq(challenges.gameId, 'bug-hunt'), eq(challenges.date, date)))
    .orderBy(asc(challenges.attempt));

type Verification = {
  ok: boolean;
  reason?: string;
  checks: { name: string; ok: boolean; detail?: string }[];
};
const check = (v: unknown, name: string) =>
  (v as Verification).checks.find((c) => c.name === name)!;
const checksOf = (v: unknown, from: number, to?: number) =>
  (v as Verification).checks.slice(from, to);

const D0 = '2026-12-02';

describe('generateForDate con bug-hunt', () => {
  it('TS-3 aprueba con ejecución real y guarda el log completo', async () => {
    const { deps, lines } = setup();
    const result = await generateForDate({ entry: bugHunt, date: D0 }, deps);
    expect(result).toMatchObject({
      outcome: 'approved',
      generated: 1,
      approved: 1,
      rejected: 0,
      lastReason: null,
    });
    const rows = await rowsFor(D0);
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row).toMatchObject({
      status: 'approved',
      attempt: 0,
      number: 13,
      generatorVersion: 'bug-hunt@1',
      seed: seedHex(D0, 0),
    });
    expect(row.payload).toMatchObject({
      date: D0,
      template: 'max_window_sum',
      bug_type: 'off_by_one',
      function_name: 'minWindowSum',
      bug_line: 7,
      mutation: { operator: 'bound_plus_one', node: 'n13', from: 'k', to: 'k + 1' },
      failing_test: { input: [[2, -1, 4], 1], expected: -1, actual: 2 },
    });
    const payload = row.payload as { tests: unknown[]; code: { js: string } };
    expect(payload.tests).toHaveLength(10);
    expect(payload.code.js.split('\n')).toHaveLength(14);
    const v = row.verification as Verification;
    expect(v.ok).toBe(true);
    expect(v.checks.map((c) => c.name)).toEqual(BH_CHECKS);
    expect(v.checks.every((c) => c.ok)).toBe(true);
    for (const c of checksOf(v, 0, 5)) expect(c.detail).toBeUndefined();
    for (const c of checksOf(v, 5, 11)) expect(c.detail).toMatch(MS);
    expect(check(v, 'correct_agrees').detail).toBe('10 tests');
    expect(check(v, 'mutant_agrees').detail).toBe('10 tests');
    expect(await t.owner.db.select().from(terms)).toHaveLength(0);
    expect(await t.owner.db.select().from(timelineFacts)).toHaveLength(0);
    expect(lines()).toContainEqual(
      expect.objectContaining({
        msg: 'ChallengeApproved',
        game_id: 'bug-hunt',
        date: D0,
        attempt: 0,
      }),
    );
  });

  it.each([
    [
      'TS-4 mutante equivalente',
      equivalentOf,
      'tests_consistent: equivalent_mutant',
      'equivalent_mutant: no failing test',
    ],
    [
      'TS-5 un solo test que pasa',
      onePassingOf,
      'tests_consistent: not_enough_passing',
      'not_enough_passing: 1 passing, 3 visible',
    ],
  ])('%s: rechaza sin ejecutar y reintenta', async (_name, mutate, reason, detail) => {
    const { deps, lines } = setup();
    const c = countingRunner();
    const entry = withBugHuntRunner(firstCandidate(bugHunt, mutate), c.run);
    const result = await generateForDate({ entry, date: D0 }, deps);
    expect(result).toMatchObject({
      outcome: 'approved',
      generated: 2,
      approved: 1,
      rejected: 1,
      lastReason: reason,
    });
    const [first, second] = await rowsFor(D0);
    expect(first).toMatchObject({ status: 'rejected', seed: seedHex(D0, 0) });
    const v = first!.verification as Verification;
    expect(v.ok).toBe(false);
    expect(v.reason).toBe(reason);
    expect(check(v, 'tests_consistent')).toMatchObject({ ok: false, detail });
    for (const n of ['texts_bilingual', 'code_shape', 'lines_consistent', 'variety_combo']) {
      expect(check(v, n).ok).toBe(true);
    }
    expect(checksOf(v, 5)).toEqual(
      BH_CHECKS.slice(5).map((name) => ({ name, ok: false, detail: 'skipped' })),
    );
    expect(second).toMatchObject({ status: 'approved', seed: seedHex(D0, 1) });
    expect((second!.payload as { template: string }).template).toBe('is_sorted');
    expect((second!.verification as Verification).ok).toBe(true);
    expect(c.calls()).toBe(6);
    expect(lines()).toContainEqual(
      expect.objectContaining({
        msg: 'ChallengeRejected',
        reason,
        game_id: 'bug-hunt',
        attempt: 0,
      }),
    );
  });

  it('TS-4 deja el payload equivalente guardado en el rechazo', async () => {
    const { deps } = setup();
    const entry = withBugHuntRunner(firstCandidate(bugHunt, equivalentOf), countingRunner().run);
    await generateForDate({ entry, date: D0 }, deps);
    const [first] = await rowsFor(D0);
    const p = first!.payload as {
      tests: { expected: unknown; actual: unknown }[];
      failing_test: unknown;
    };
    expect(p.tests.every((x) => x.actual === x.expected)).toBe(true);
    expect(p.failing_test).toEqual({ input: [[5], 1], expected: 5, actual: 5 });
  });

  it.each([
    [
      'TS-6 la correcta no concuerda',
      scriptedBugHuntRunner(({ round, variant, lang, real }) =>
        round === 0 && variant === 'correct' && lang === 'java' ? real().then(bump) : undefined,
      ),
      'correct_agrees',
      'differs at tests[9] minWindowSum([13, 20, 18], 1): js=13 go=13 java=14',
      ['mutant_agrees', '10 tests'],
    ],
    [
      'TS-7 la mutada no concuerda',
      scriptedBugHuntRunner(({ round, variant, lang, real }) =>
        round === 0 && variant === 'mutant' && lang === 'go' ? real().then(bump) : undefined,
      ),
      'mutant_agrees',
      'differs at tests[9] minWindowSum([13, 20, 18], 1): js=11 go=12 java=11',
      ['correct_agrees', '10 tests'],
    ],
  ])('%s', async (_name, run, name, detail, [otherCheck, otherDetail]) => {
    const { deps } = setup();
    const result = await generateForDate(
      { entry: withBugHuntRunner(bugHunt, run), date: D0 },
      deps,
    );
    expect(result).toMatchObject({
      outcome: 'approved',
      generated: 2,
      approved: 1,
      rejected: 1,
      lastReason: name,
    });
    const [first, second] = await rowsFor(D0);
    expect(first).toMatchObject({ status: 'rejected', attempt: 0 });
    expect((first!.payload as { template: string }).template).toBe('max_window_sum');
    const v = first!.verification as Verification;
    expect(v.reason).toBe(name);
    expect(check(v, name)).toMatchObject({ ok: false, detail });
    expect(check(v, otherCheck!)).toMatchObject({ ok: true, detail: otherDetail });
    expect(checksOf(v, 5, 11).every((c) => c.ok)).toBe(true);
    expect(second).toMatchObject({ status: 'approved', seed: seedHex(D0, 1) });
    expect((second!.payload as { function_name: string }).function_name).toBe(
      'isStrictlyAscending',
    );
    expect((await rowsFor(D0)).filter((r) => r.status === 'approved')).toHaveLength(1);
  });

  it.each([
    [
      'TS-8 timeout de la mutada en Go',
      scriptedBugHuntRunner(({ round, variant, lang }) =>
        round === 0 && variant === 'mutant' && lang === 'go' ? TIMEOUT : undefined,
      ),
      'run_mutant_go: timeout',
      'run_mutant_go',
      'timeout (10000 ms)',
      { correct_agrees: '10 tests', mutant_agrees: 'skipped' },
    ],
    [
      'TS-9 compilación fallida de la correcta en Java',
      scriptedBugHuntRunner(({ round, variant, lang }) =>
        round === 0 && variant === 'correct' && lang === 'java'
          ? {
              ok: false as const,
              kind: 'compile_error' as const,
              stderr: 'Main.java:5: error: cannot find symbol\n1 error',
              durationMs: 900,
            }
          : undefined,
      ),
      'run_correct_java: compile_error',
      'run_correct_java',
      'compile_error (900 ms): Main.java:5: error: cannot find symbol',
      { correct_agrees: 'skipped', mutant_agrees: '10 tests' },
    ],
    [
      'TS-10 toolchain ausente (JS)',
      scriptedBugHuntRunner(({ round, variant, lang }) =>
        round === 0 && variant === 'correct' && lang === 'js'
          ? {
              ok: false as const,
              kind: 'toolchain_missing' as const,
              stderr: 'spawn node ENOENT',
              durationMs: 0,
            }
          : undefined,
      ),
      'run_correct_js: toolchain_missing',
      'run_correct_js',
      'toolchain_missing (0 ms): spawn node ENOENT',
      { correct_agrees: 'skipped', mutant_agrees: '10 tests' },
    ],
  ])('%s', async (_name, run, reason, checkName, detail, agrees) => {
    const { deps } = setup();
    const result = await generateForDate(
      { entry: withBugHuntRunner(bugHunt, run), date: D0 },
      deps,
    );
    expect(result).toMatchObject({
      outcome: 'approved',
      generated: 2,
      approved: 1,
      rejected: 1,
      lastReason: reason,
    });
    const [first, second] = await rowsFor(D0);
    expect(first).toMatchObject({ status: 'rejected', attempt: 0 });
    expect((first!.payload as { template: string }).template).toBe('max_window_sum');
    const v = first!.verification as Verification;
    expect(v.reason).toBe(reason);
    expect(check(v, checkName)).toMatchObject({ ok: false, detail });
    for (const c of checksOf(v, 5, 11).filter((c) => c.name !== checkName)) {
      expect(c.ok).toBe(true);
    }
    expect(check(v, 'correct_agrees').detail).toBe(agrees.correct_agrees);
    expect(check(v, 'mutant_agrees').detail).toBe(agrees.mutant_agrees);
    expect(check(v, 'correct_agrees').ok).toBe(agrees.correct_agrees !== 'skipped');
    expect(check(v, 'mutant_agrees').ok).toBe(agrees.mutant_agrees !== 'skipped');
    expect(second).toMatchObject({ status: 'approved', attempt: 1 });
    expect((second!.payload as { function_name: string }).function_name).toBe(
      'isStrictlyAscending',
    );
    expect((await rowsFor(D0)).filter((r) => r.status === 'approved')).toHaveLength(1);
  });
});

describe('regeneración con bug-hunt', () => {
  function regen(registry: Parameters<typeof processNextRequest>[0]['registry'], attempts = 20) {
    return processNextRequest({
      db: t.svc.db,
      env: { ...ENV, GENERATION_MAX_ATTEMPTS: attempts },
      registry,
      clock: { now: () => NOW },
      log: captureLogger().logger,
      signal: new AbortController().signal,
    });
  }

  const D = '2026-12-05';

  it('TS-13 reemplazo atómico de un Bug Hunt futuro', async () => {
    await approveBugHunt(t.svc.db, D);
    const old = (await rowsFor(D))[0]!;
    expect(old.payload).toMatchObject({
      template: 'last_index_where',
      function_name: 'lastEven',
    });
    await requestFor(t.owner.db, old.id);

    expect(await regen(bugHuntOnly)).toBe('done');

    const rows = await rowsFor(D);
    const oldAfter = rows.find((r) => r.id === old.id)!;
    expect(oldAfter.status).toBe('rejected');
    expect(oldAfter.verification).toMatchObject({ ok: true, reason: 'regenerated' });
    expect((oldAfter.verification as Verification).checks.map((c) => c.name)).toEqual(BH_CHECKS);
    const [req] = await t.owner.db.select().from(generationRequests);
    expect(req).toMatchObject({ status: 'done', error: null });
    expect(req!.newChallengeId).not.toBeNull();
    expect(req!.processedAt).not.toBeNull();
    const nuevo = rows.find((r) => r.id === req!.newChallengeId)!;
    expect(nuevo).toMatchObject({
      status: 'approved',
      gameId: 'bug-hunt',
      date: D,
      attempt: 1,
      seed: seedHex(D, 1),
      generatorVersion: 'bug-hunt@1',
    });
    expect(nuevo.payload).toMatchObject({
      template: 'count_where',
      bug_type: 'off_by_one',
      function_name: 'countEven',
      bug_line: 3,
    });
    const v = nuevo.verification as Verification;
    expect(v.ok).toBe(true);
    expect(v.checks.map((c) => c.name)).toEqual(BH_CHECKS);
    expect(rows.filter((r) => r.status === 'approved')).toHaveLength(1);
  });

  it('TS-14 si ningún candidato pasa, el viejo sigue vigente', async () => {
    await approveBugHunt(t.svc.db, D);
    const old = (await rowsFor(D))[0]!;
    await requestFor(t.owner.db, old.id);

    const registry = createGeneratorRegistry([
      withBugHuntRunner(bugHunt, () => Promise.resolve(TIMEOUT)),
    ]);
    expect(await regen(registry, 3)).toBe('failed');

    const [req] = await t.owner.db.select().from(generationRequests);
    expect(req).toMatchObject({
      status: 'failed',
      error: 'run_correct_js: timeout',
      newChallengeId: null,
    });
    const rows = await rowsFor(D);
    expect(rows.find((r) => r.id === old.id)!.status).toBe('approved');
    const fresh = rows.filter((r) => r.id !== old.id);
    expect(fresh.map((r) => r.attempt)).toEqual([1, 2, 3]);
    for (const r of fresh) {
      expect(r.status).toBe('rejected');
      expect((r.verification as Verification).reason).toBe('run_correct_js: timeout');
    }
    expect(await t.owner.db.select().from(generationFailures)).toHaveLength(0);
  });
});
