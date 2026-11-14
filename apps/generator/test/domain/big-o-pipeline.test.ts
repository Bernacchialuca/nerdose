import { createHmac } from 'node:crypto';

import { challenges, generationFailures, generationRequests } from '@nerdose/db';
import { and, asc, eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { ChallengePublishingRepository } from '@/domain/challenge-publishing/challenge-publishing.repository';
import { generateForDate, type GenerateDeps } from '@/domain/challenge-publishing/generate';
import { processNextRequest } from '@/domain/challenge-publishing/queue/process-request';
import { createGeneratorRegistry } from '@/games/registry';

import {
  AMBIG,
  approveBigO,
  bigO,
  bigOOnly,
  CHECKS13,
  forcedRecipe,
  scriptedRunner,
  TIMEOUT,
  withRunner,
} from '../helpers/big-o';
import { setupTestDb } from '../helpers/db';
import { captureLogger } from '../helpers/logger';
import { ENV, NOW, requestFor, SECRET } from '../helpers/regeneration';

const t = setupTestDb();
const seedHex = (date: string, attempt: number) =>
  createHmac('sha256', SECRET).update(`big-o:${date}:${attempt}`).digest('hex');

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
    .where(and(eq(challenges.gameId, 'big-o'), eq(challenges.date, date)))
    .orderBy(asc(challenges.attempt));

type Verification = {
  ok: boolean;
  reason?: string;
  checks: { name: string; ok: boolean; detail?: string }[];
};
const check = (v: unknown, name: string) =>
  (v as Verification).checks.find((c) => c.name === name)!;

describe('generateForDate con big-o', () => {
  it('TS-3 aprueba loops anidados O(n²) con ejecución real y guarda el log', async () => {
    const { deps } = setup();
    const result = await generateForDate(
      { entry: forcedRecipe(bigO, 'nest(linear,linear)', [1, 1]), date: '2026-12-02' },
      deps,
    );
    expect(result).toMatchObject({
      outcome: 'approved',
      generated: 1,
      approved: 1,
      rejected: 0,
      lastReason: null,
    });
    const rows = await rowsFor('2026-12-02');
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row).toMatchObject({
      status: 'approved',
      attempt: 0,
      number: 13,
      generatorVersion: 'big-o@1',
      seed: seedHex('2026-12-02', 0),
    });
    expect(row.payload).toMatchObject({
      answer: 'o_n2',
      recipe: 'nest(linear,linear)',
      date: '2026-12-02',
    });
    const v = row.verification as Verification;
    expect(v.ok).toBe(true);
    expect(v.checks.map((c) => c.name)).toEqual(CHECKS13);
    expect(v.checks.every((c) => c.ok)).toBe(true);
    expect(check(v, 'counts_agree').detail).toBe(
      'n=64,128,256,512,1024,2048,4096 counts=4096,16384,65536,262144,1048576,4194304,16777216',
    );
    expect(check(v, 'example_matches_run').detail).toBe('n=1024 ops=1048576');
    expect(check(v, 'fit_matches_answer').detail).toBe('best=o_n2 answer=o_n2');
  });

  it('TS-4 pipeline completo sin forzar', async () => {
    const { deps } = setup();
    const result = await generateForDate({ entry: bigO, date: '2026-12-02' }, deps);
    expect(result).toMatchObject({ outcome: 'approved', generated: 1 });
    const [row] = await rowsFor('2026-12-02');
    expect(row).toMatchObject({
      status: 'approved',
      attempt: 0,
      seed: seedHex('2026-12-02', 0),
      generatorVersion: 'big-o@1',
    });
    expect(row!.payload).toMatchObject({
      recipe: 'double_recursion(n-1,n-1)',
      answer: 'o_2n',
      explanation: { example: { n: 20, ops: 524288, trap_ops: null } },
    });
    expect(check(row!.verification, 'counts_agree').detail).toBe(
      'n=10,11,12,13,14,15,16,17,18,19,20 counts=512,1024,2048,4096,8192,16384,32768,65536,131072,262144,524288',
    );
  });

  it('TS-5 rechaza un ajuste ambiguo y reintenta con seed nuevo', async () => {
    const { deps, lines } = setup();
    const entry = withRunner(
      forcedRecipe(bigO, 'linear', [1], { dropExample: true }),
      scriptedRunner(({ round }) =>
        round === 0 ? { ok: true, stdout: AMBIG.join('\n') + '\n', durationMs: 5 } : undefined,
      ),
    );
    const result = await generateForDate({ entry, date: '2026-12-02' }, deps);
    expect(result).toMatchObject({ outcome: 'approved', generated: 2, approved: 1, rejected: 1 });
    const [first, second] = await rowsFor('2026-12-02');
    expect(first).toMatchObject({ status: 'rejected', seed: seedHex('2026-12-02', 0) });
    const v0 = first!.verification as Verification;
    expect(v0.ok).toBe(false);
    expect(v0.reason).toBe('fit_unambiguous');
    expect(check(v0, 'fit_unambiguous')).toMatchObject({
      ok: false,
      detail: 'ambiguous_fit: best=o_n (0.0879) second=o_n_log_n (0.1355) min=0.1759',
    });
    expect(check(v0, 'fit_quality').ok).toBe(true);
    expect(second).toMatchObject({ status: 'approved', seed: seedHex('2026-12-02', 1) });
    expect((second!.verification as Verification).ok).toBe(true);
    expect(check(second!.verification, 'fit_matches_answer').detail).toBe('best=o_n answer=o_n');
    expect(lines()).toContainEqual(
      expect.objectContaining({
        msg: 'ChallengeRejected',
        reason: 'fit_unambiguous',
        game_id: 'big-o',
        attempt: 0,
      }),
    );
  });

  it.each([
    [
      'TS-6 timeout de Go',
      scriptedRunner(({ round, lang }) => (round === 0 && lang === 'go' ? TIMEOUT : undefined)),
      'run_go: timeout',
      'run_go',
      'timeout (10000 ms)',
    ],
    [
      'TS-7 error de compilación de Java',
      scriptedRunner(({ round, lang }) =>
        round === 0 && lang === 'java'
          ? {
              ok: false as const,
              kind: 'compile_error' as const,
              stderr: 'Main.java:3: error: cannot find symbol\n1 error',
              durationMs: 900,
            }
          : undefined,
      ),
      'run_java: compile_error',
      'run_java',
      'compile_error (900 ms): Main.java:3: error: cannot find symbol',
    ],
    [
      'TS-8 toolchain ausente (JS)',
      scriptedRunner(({ round, lang }) =>
        round === 0 && lang === 'js'
          ? {
              ok: false as const,
              kind: 'toolchain_missing' as const,
              stderr: 'spawn node ENOENT',
              durationMs: 0,
            }
          : undefined,
      ),
      'run_js: toolchain_missing',
      'run_js',
      'toolchain_missing (0 ms): spawn node ENOENT',
    ],
  ])('%s: rechaza sin publicar y reintenta', async (_name, run, reason, checkName, detail) => {
    const { deps } = setup();
    const result = await generateForDate(
      { entry: withRunner(bigO, run), date: '2026-12-02' },
      deps,
    );
    expect(result).toMatchObject({ outcome: 'approved', generated: 2, approved: 1, rejected: 1 });
    const [first, second] = await rowsFor('2026-12-02');
    expect(first).toMatchObject({ status: 'rejected', attempt: 0 });
    expect(first!.payload).toMatchObject({ recipe: 'double_recursion(n-1,n-1)' });
    const v = first!.verification as Verification;
    expect(v.reason).toBe(reason);
    expect(check(v, checkName)).toMatchObject({ ok: false, detail });
    for (const lang of ['run_js', 'run_go', 'run_java'].filter((n) => n !== checkName)) {
      expect(check(v, lang).ok).toBe(true);
    }
    expect(v.checks.slice(7).map((c) => c.detail)).toEqual(Array(6).fill('skipped'));
    expect(second).toMatchObject({ status: 'approved', attempt: 1 });
    expect(second!.payload).toMatchObject({ recipe: 'nest(linear,halving)', answer: 'o_n_log_n' });
    expect((await rowsFor('2026-12-02')).filter((r) => r.status === 'approved')).toHaveLength(1);
  });

  it('TS-9 rechaza lenguajes que no concuerdan', async () => {
    const { deps } = setup();
    const run = scriptedRunner(({ round, lang, real }) =>
      round === 0 && lang === 'java'
        ? real().then((o) =>
            o.ok ? { ...o, stdout: o.stdout.replace(/524288\n$/, '524289\n') } : o,
          )
        : undefined,
    );
    const result = await generateForDate(
      { entry: withRunner(bigO, run), date: '2026-12-02' },
      deps,
    );
    expect(result).toMatchObject({ outcome: 'approved', generated: 2, approved: 1, rejected: 1 });
    const [first, second] = await rowsFor('2026-12-02');
    expect(first).toMatchObject({ status: 'rejected' });
    const v = first!.verification as Verification;
    expect(v.reason).toBe('counts_agree');
    expect(check(v, 'counts_agree')).toMatchObject({
      ok: false,
      detail: 'differs at n=20: js=524288 go=524288 java=524289',
    });
    for (const n of ['run_js', 'run_go', 'run_java']) expect(check(v, n).ok).toBe(true);
    expect(v.checks.slice(8).map((c) => c.detail)).toEqual(Array(5).fill('skipped'));
    expect(second).toMatchObject({ status: 'approved' });
  });
});

describe('regeneración con big-o', () => {
  function regen(registry: Parameters<typeof processNextRequest>[0]['registry'], attempts = 20) {
    const captured = captureLogger();
    return processNextRequest({
      db: t.svc.db,
      env: { ...ENV, GENERATION_MAX_ATTEMPTS: attempts },
      registry,
      clock: { now: () => NOW },
      log: captured.logger,
      signal: new AbortController().signal,
    });
  }

  const D = '2026-12-05';
  const oldRow = async () => (await rowsFor(D))[0]!;

  it('TS-12 reemplazo atómico de un Big O futuro', async () => {
    await approveBigO(t.svc.db, D);
    const old = await oldRow();
    expect(old.payload).toMatchObject({ recipe: 'nest(constant,halving)', answer: 'o_log_n' });
    await requestFor(t.owner.db, old.id);

    expect(await regen(bigOOnly)).toBe('done');

    const rows = await rowsFor(D);
    const oldAfter = rows.find((r) => r.id === old.id)!;
    expect(oldAfter.status).toBe('rejected');
    expect(oldAfter.verification).toMatchObject({ ok: true, reason: 'regenerated' });
    expect((oldAfter.verification as Verification).checks.map((c) => c.name)).toEqual(CHECKS13);
    const [req] = await t.owner.db.select().from(generationRequests);
    expect(req).toMatchObject({ status: 'done', error: null });
    expect(req!.newChallengeId).not.toBeNull();
    expect(req!.processedAt).not.toBeNull();
    const nuevo = rows.find((r) => r.id === req!.newChallengeId)!;
    expect(nuevo).toMatchObject({
      status: 'approved',
      gameId: 'big-o',
      date: D,
      attempt: 1,
      seed: seedHex(D, 1),
      generatorVersion: 'big-o@1',
    });
    expect(nuevo.payload).toMatchObject({ recipe: 'nest(linear,constant)', answer: 'o_n' });
    const v = nuevo.verification as Verification;
    expect(v.ok).toBe(true);
    expect(v.checks.map((c) => c.name)).toEqual(CHECKS13);
    expect(rows.filter((r) => r.status === 'approved')).toHaveLength(1);
  });

  it('TS-13 si ningún candidato pasa, el viejo sigue vigente', async () => {
    await approveBigO(t.svc.db, D);
    const old = await oldRow();
    await requestFor(t.owner.db, old.id);

    const registry = createGeneratorRegistry([withRunner(bigO, () => Promise.resolve(TIMEOUT))]);
    expect(await regen(registry, 3)).toBe('failed');

    const [req] = await t.owner.db.select().from(generationRequests);
    expect(req).toMatchObject({ status: 'failed', error: 'run_js: timeout', newChallengeId: null });
    const rows = await rowsFor(D);
    expect(rows.find((r) => r.id === old.id)!.status).toBe('approved');
    const fresh = rows.filter((r) => r.id !== old.id);
    expect(fresh.map((r) => r.attempt)).toEqual([1, 2, 3]);
    for (const r of fresh) {
      expect(r.status).toBe('rejected');
      expect((r.verification as Verification).reason).toBe('run_js: timeout');
    }
    expect(await t.owner.db.select().from(generationFailures)).toHaveLength(0);
  });
});
