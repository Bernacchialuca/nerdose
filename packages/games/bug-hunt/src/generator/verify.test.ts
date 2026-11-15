import type { VerificationCheck, VerificationLog } from '@nerdose/core';
import type { RunOutcome } from '@nerdose/polyglot';
import { describe, expect, it } from 'vitest';

import { payloadSchema, type BugHuntPayload } from '../definition';
import { PAYLOAD, PAYLOAD_BOOL } from '../definition/test-fixtures';

import { bugTypesOf, TEMPLATES } from './catalog';
import { createGenerate, generate } from './generate';
import { buildSources } from './harness';
import {
  D,
  emptyHistory,
  fakeRunnerFor,
  PROBE_FEW_ONLY,
  PROBE_ONLY_EQUIV,
  PROBE_VARIETY,
  rowWithKey,
  seed,
  seedFrom,
  type FakeOverrides,
} from './test-fixtures';
import { catalogPayload } from './test-utils';
import { createVerify, VERIFY_CHECKS } from './verify';

const P = PAYLOAD;
const B = PAYLOAD_BOOL;
const h0 = emptyHistory;
const named = (log: VerificationLog, name: string) =>
  log.checks.find((c) => c.name === name) as VerificationCheck;
const sources = (p: BugHuntPayload) => {
  const r = buildSources(p);
  if (!r.ok) throw new Error(r.error);
  return r.sources;
};
async function verifyWith(p: BugHuntPayload, overrides: FakeOverrides = {}, history = h0) {
  const fake = fakeRunnerFor(P, overrides);
  const log = await createVerify({ run: fake.run })(p, history);
  return { log, calls: fake.calls };
}
const fail = (
  kind: Extract<RunOutcome, { ok: false }>['kind'],
  stderr: string,
  durationMs: number,
): RunOutcome => ({
  ok: false,
  kind,
  stderr,
  durationMs,
});
const SKIPPED = { ok: false, detail: 'skipped' };

describe('verify, happy path', () => {
  it('approves P with the 13 checks (TS-14)', async () => {
    const { log, calls } = await verifyWith(P);
    expect(log.ok).toBe(true);
    expect(log.reason).toBeUndefined();
    expect(log.checks.map((c) => c.name)).toEqual([...VERIFY_CHECKS]);
    expect(log.checks.every((c) => c.ok)).toBe(true);
    expect(calls).toHaveLength(6);
    for (const lang of ['js', 'go', 'java'] as const) {
      const mine = calls.filter((c) => c.lang === lang);
      expect(mine.map((c) => c.source)).toEqual([
        sources(P).correct[lang],
        sources(P).mutant[lang],
      ]);
    }
    expect(
      calls.every((c) => JSON.stringify(c.options) === JSON.stringify({ timeoutMs: 10000 })),
    ).toBe(true);
    expect(named(log, 'run_correct_js').detail).toBe('120 ms');
    expect(named(log, 'correct_agrees').detail).toBe('8 tests');
    expect(named(log, 'mutant_agrees').detail).toBe('8 tests');
    expect(named(log, 'texts_bilingual').detail).toBeUndefined();
  });

  it('approves booleans (TS-15)', async () => {
    const fake = fakeRunnerFor(B);
    const log = await createVerify({ run: fake.run })(B, h0);
    expect(log.ok).toBe(true);
    const go = fake.calls.find((c) => c.lang === 'go');
    expect(go?.source).toContain('fmt.Println(anyAbove(');
    expect(log.checks.every((c) => c.ok)).toBe(true);
  });

  it('runs languages in parallel and variants in sequence (TS-16)', async () => {
    const starts: string[] = [];
    const resolvers: (() => void)[] = [];
    const fake = fakeRunnerFor(P);
    const run = (lang: 'js' | 'go' | 'java', source: string, options?: { timeoutMs?: number }) => {
      starts.push(lang);
      return new Promise<RunOutcome>((resolve) => {
        resolvers.push(() => void fake.run(lang, source, options).then(resolve));
      });
    };
    const pending = createVerify({ run })(P, h0);
    await Promise.resolve();
    expect([...starts].sort()).toEqual(['go', 'java', 'js']);
    resolvers[1]?.();
    await new Promise<void>((r) => setImmediate(r));
    expect(starts).toHaveLength(4);
    expect(starts[3]).toBe('go');
    for (const r of resolvers.slice(0)) r();
    let guard = 0;
    while (starts.length < 6 && guard++ < 20) {
      await new Promise<void>((r) => setImmediate(r));
      for (const r of resolvers) r();
    }
    for (const r of resolvers) r();
    const log = await pending;
    expect(log.ok).toBe(true);
    expect(starts).toHaveLength(6);
  });
});

describe('verify, failures in memory', () => {
  const noDate = (() => {
    const rest: Partial<BugHuntPayload> = { ...P };
    delete rest.date;
    return rest as BugHuntPayload;
  })();
  const stale = { bankItems: [], recentChallenges: [rowWithKey('2026-09-22', P)] };
  const badSpec = { ...structuredClone(P), spec: { es: P.spec.es, en: '  ' } };
  it.each([
    ['texts_bilingual', badSpec, h0],
    ['code_shape', { ...P, code: { ...P.code, java: `${P.code.java}\n` } }, h0],
    ['lines_consistent', { ...P, bug_line: 6 }, h0],
    ['variety_combo', P, stale],
    ['variety_combo', noDate, h0],
  ] as [string, BugHuntPayload, typeof h0][])(
    '%s does not execute (TS-17)',
    async (reason, p, h) => {
      const { log, calls } = await verifyWith(p, {}, h);
      expect(calls).toHaveLength(0);
      expect(log.ok).toBe(false);
      expect(log.reason).toBe(reason);
      for (const c of log.checks.slice(5)) expect(c).toMatchObject(SKIPPED);
      if (reason === 'variety_combo') {
        for (const n of ['texts_bilingual', 'code_shape', 'lines_consistent', 'tests_consistent']) {
          expect(named(log, n).ok).toBe(true);
        }
      }
    },
  );

  it('builds the reason of tests_consistent (TS-20)', async () => {
    const make = (t: Parameters<typeof createGenerate>[0][number]) =>
      payloadSchema.parse(createGenerate([t])({ date: D, seed: seedFrom('fail', 0), history: h0 }));
    const a = await verifyWith(make(PROBE_ONLY_EQUIV));
    const b = await verifyWith(make(PROBE_FEW_ONLY));
    const c = await verifyWith({
      ...P,
      failing_test: P.tests[7] as BugHuntPayload['failing_test'],
    });
    expect(a.log.reason).toBe('tests_consistent: equivalent_mutant');
    expect(named(a.log, 'tests_consistent').detail).toBe('equivalent_mutant: no failing test');
    expect(b.log.reason).toBe('tests_consistent: not_enough_passing');
    expect(c.log.reason).toBe('tests_consistent');
    for (const r of [a, b, c]) expect(r.calls).toHaveLength(0);
  });
});

describe('verify, runner failures', () => {
  it.each([
    [
      'timeout',
      { correct_go: fail('timeout', '', 10003) },
      'run_correct_go: timeout',
      'run_correct_go',
      'timeout (10003 ms)',
    ],
    [
      'compile_error',
      {
        mutant_java: fail(
          'compile_error',
          "Main.java:4: error: ';' expected\nerror: compilation failed",
          812,
        ),
      },
      'run_mutant_java: compile_error',
      'run_mutant_java',
      "compile_error (812 ms): Main.java:4: error: ';' expected",
    ],
    [
      'toolchain_missing',
      {
        correct_js: fail('toolchain_missing', 'spawn node ENOENT', 3),
        mutant_js: fail('toolchain_missing', 'spawn node ENOENT', 3),
      },
      'run_correct_js: toolchain_missing',
      'run_correct_js',
      'toolchain_missing (3 ms): spawn node ENOENT',
    ],
    [
      'runtime_error',
      {
        mutant_go: fail(
          'runtime_error',
          'panic: runtime error: index out of range [3] with length 3\n\ngoroutine 1 [running]:',
          15,
        ),
      },
      'run_mutant_go: runtime_error',
      'run_mutant_go',
      'runtime_error (15 ms): panic: runtime error: index out of range [3] with length 3',
    ],
    [
      'output_too_large',
      { correct_java: fail('output_too_large', '', 900) },
      'run_correct_java: output_too_large',
      'run_correct_java',
      'output_too_large (900 ms)',
    ],
    [
      'go header',
      {
        correct_go: fail(
          'compile_error',
          '# command-line-arguments\n./main.go:6:13: declared and not used: x\n',
          640,
        ),
      },
      'run_correct_go: compile_error',
      'run_correct_go',
      'compile_error (640 ms): ./main.go:6:13: declared and not used: x',
    ],
  ] as [string, FakeOverrides, string, string, string][])(
    '%s (TS-18)',
    async (_n, o, reason, name, detail) => {
      const { log, calls } = await verifyWith(P, o);
      expect(log.ok).toBe(false);
      expect(log.reason).toBe(reason);
      expect(named(log, name).detail).toBe(detail);
      expect(calls).toHaveLength(6);
    },
  );

  it('reports several failures and invalid output (TS-19)', async () => {
    const a = await verifyWith(P, {
      correct_java: fail('timeout', '', 10001),
      mutant_js: fail('compile_error', 'SyntaxError: x', 5),
    });
    expect(a.log.reason).toBe('run_correct_java: timeout');
    expect(named(a.log, 'run_mutant_js').ok).toBe(false);
    const b = await verifyWith(P, { correct_js: '0\n0\n' });
    expect(b.log.reason).toBe('run_correct_js: invalid_output');
    expect(named(b.log, 'run_correct_js').detail).toBe('invalid_output: expected 8 values, got 2');
    const c = await verifyWith(P, { mutant_go: '0\n0\n1\nundefined\n2\n2\n0\n2\n' });
    expect(c.log.reason).toBe('run_mutant_go: invalid_output');
    expect(named(c.log, 'run_mutant_go').detail).toBe(
      'invalid_output: line 4 is not an integer or boolean',
    );
  });

  it('skips the agreement of a variant whose runs failed', async () => {
    const { log } = await verifyWith(P, { correct_go: fail('timeout', '', 1) });
    expect(named(log, 'correct_agrees')).toMatchObject(SKIPPED);
    expect(named(log, 'mutant_agrees').ok).toBe(true);
  });

  it('reports the impossible harness without running (TS-23)', async () => {
    const { log, calls } = await verifyWith({ ...P, function_name: 'main' });
    expect(calls).toHaveLength(0);
    for (const v of ['correct', 'mutant']) {
      for (const l of ['js', 'go', 'java']) {
        expect(named(log, `run_${v}_${l}`)).toMatchObject({
          ok: false,
          detail: 'harness_error: invalid_identifier: main',
        });
      }
    }
    expect(named(log, 'correct_agrees')).toMatchObject(SKIPPED);
    expect(named(log, 'mutant_agrees')).toMatchObject(SKIPPED);
    expect(log.reason).toBe('run_correct_js: harness_error');
  });
});

describe('verify, agreement', () => {
  it('correct_agrees (TS-21)', async () => {
    const a = await verifyWith(P, { correct_java: [1, 0, 1, 0, 2, 0, 0, 0] });
    expect(a.log.reason).toBe('correct_agrees');
    expect(named(a.log, 'correct_agrees').detail).toBe(
      'differs at tests[0] maxIndex([]): js=0 go=0 java=1',
    );
    expect(named(a.log, 'mutant_agrees').ok).toBe(true);
    const wrong = [0, 0, 1, 0, 2, 0, 0, 1];
    const b = await verifyWith(P, { correct_js: wrong, correct_go: wrong, correct_java: wrong });
    expect(b.log.reason).toBe('correct_agrees');
    expect(named(b.log, 'correct_agrees').detail).toBe(
      'tests[7] maxIndex([7, 3, 7, 1]): run=1 expected=0',
    );
  });

  it('mutant_agrees and booleans (TS-22)', async () => {
    const a = await verifyWith(P, { mutant_go: [0, 0, 1, 0, 2, 0, 0, 0] });
    expect(a.log.reason).toBe('mutant_agrees');
    expect(named(a.log, 'mutant_agrees').detail).toBe(
      'differs at tests[3] maxIndex([5, 1, 5]): js=2 go=0 java=2',
    );
    expect(named(a.log, 'correct_agrees').ok).toBe(true);
    const same = [0, 0, 1, 0, 2, 0, 0, 0];
    const b = await verifyWith(P, { mutant_js: same, mutant_go: same, mutant_java: same });
    expect(named(b.log, 'mutant_agrees').detail).toBe(
      'tests[3] maxIndex([5, 1, 5]): run=0 actual=2',
    );
    const fake = fakeRunnerFor(B, {
      correct_go: [true, true, false, true, true, true, false, true],
    });
    const c = await createVerify({ run: fake.run })(B, h0);
    expect(c.reason).toBe('correct_agrees');
    expect(named(c, 'correct_agrees').detail).toBe(
      'differs at tests[0] anyAbove([], 3): js=false go=true java=false',
    );
  });
});

describe('verify, pipeline properties', () => {
  it.each([
    ['equivalent_mutant', PROBE_ONLY_EQUIV, 'tests_consistent: equivalent_mutant'],
    ['not_enough_passing', PROBE_FEW_ONLY, 'tests_consistent: not_enough_passing'],
  ] as const)('20 attempts rejected for %s without running (TS-24)', async (_n, t, reason) => {
    for (let attempt = 0; attempt < 20; attempt++) {
      const p = payloadSchema.parse(
        createGenerate([t])({ date: D, seed: seedFrom('fail', attempt), history: h0 }),
      );
      const fake = fakeRunnerFor(p);
      const log = await createVerify({ run: fake.run })(p, h0);
      expect(log.ok).toBe(false);
      expect(log.reason).toBe(reason);
      expect(fake.calls).toHaveLength(0);
      for (const c of log.checks.slice(5)) expect(c).toMatchObject(SKIPPED);
    }
  });

  it('20 attempts rejected for variety without running (TS-24)', async () => {
    const h = {
      bankItems: [],
      recentChallenges: [
        rowWithKey('2027-01-15', {
          template: 'probe_variety',
          params: {},
          mutation: { operator: 'loop_start_shift', node: 'n1', from: '0', to: '1' },
        }),
        rowWithKey('2027-05-13', {
          template: 'probe_variety',
          params: {},
          mutation: {
            operator: 'bound_minus_one',
            node: 'n3',
            from: 'len(nums)',
            to: 'len(nums) - 1',
          },
        }),
      ],
    };
    for (let attempt = 0; attempt < 20; attempt++) {
      const p = payloadSchema.parse(
        createGenerate([PROBE_VARIETY])({ date: D, seed: seedFrom('fail', attempt), history: h }),
      );
      const fake = fakeRunnerFor(p);
      const log = await createVerify({ run: fake.run })(p, h);
      expect(log.reason).toBe('variety_combo');
      expect(fake.calls).toHaveLength(0);
    }
  });

  it('the row of D does not block its replacement (TS-25)', async () => {
    const { log } = await verifyWith(
      P,
      {},
      { bankItems: [], recentChallenges: [rowWithKey('2026-11-20', P)] },
    );
    expect(named(log, 'variety_combo').ok).toBe(true);
    expect(log.ok).toBe(true);
  });

  it('everything generate produces passes the checks in memory (TS-26)', async () => {
    for (let k = 1; k <= 200; k++) {
      const p = payloadSchema.parse(generate({ date: D, seed: seed(k), history: h0 }));
      const fake = fakeRunnerFor(p);
      const log = await createVerify({ run: fake.run })(p, h0);
      expect(log.checks.filter((c) => !c.ok)).toEqual([]);
    }
  });

  it('every catalog pair passes the checks (TS-26)', async () => {
    for (const t of TEMPLATES) {
      for (const b of bugTypesOf(t)) {
        const p = catalogPayload(t, b);
        const log = await createVerify({ run: fakeRunnerFor(p).run })(p, h0);
        expect(
          log.checks.filter((c) => !c.ok),
          `${t.id} ${b}`,
        ).toEqual([]);
      }
    }
  });

  it('does not mutate its inputs (TS-28)', async () => {
    const p0 = structuredClone(P);
    const h = { bankItems: [], recentChallenges: [rowWithKey('2026-10-01', B)] };
    const h1 = structuredClone(h);
    const a = await verifyWith(P, {}, h);
    const b = await verifyWith(P, {}, h);
    expect(P).toEqual(p0);
    expect(h).toEqual(h1);
    expect(a.log).toEqual(b.log);
  });
});
