import type { VerificationLog } from '@nerdose/core';
import { wrapFunction, type RunOutcome } from '@nerdose/polyglot';
import { describe, expect, it } from 'vitest';

import { payloadSchema, type BigOPayload } from '../definition';
import { PAYLOAD } from '../definition/test-fixtures';

import { buildPayload } from './generate';
import { RECIPES } from './catalog/recipes';
import { addDays } from './days';
import { SCALE } from './scale';
import {
  allLanguages,
  D,
  emptyHistory,
  fakeRunner,
  noExample,
  recent,
  recipe,
  seedFrom,
  withDate,
} from './test-fixtures';
import { generate } from './generate';
import { createVerify, VERIFY_CHECKS } from './verify';

const P = withDate(PAYLOAD);
const COUNTS_NLOGN = [2048, 4608, 10240, 22528, 49152, 106496, 229376, 491520, 1048576];
const LINEAR = [256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536];
const same = allLanguages(COUNTS_NLOGN);
const SERIES_AMBIGUOUS = [588, 1233, 2572, 5344, 11067, 22854, 47084, 96802, 198668];
const SERIES_POOR = [724, 1536, 3238, 6792, 14189, 29537, 61303, 126910, 262144];

const history = (...rows: ReturnType<typeof recent>[]) => ({
  bankItems: [],
  recentChallenges: rows,
});
const byName = (log: VerificationLog, name: string) => log.checks.find((c) => c.name === name);
const skipped = (log: VerificationLog, from: number) =>
  VERIFY_CHECKS.slice(from).every((n) => {
    const c = byName(log, n);
    return c?.ok === false && c.detail === 'skipped';
  });

async function verifyWith(
  p: BigOPayload,
  outputs: Parameters<typeof fakeRunner>[0],
  h = emptyHistory,
) {
  const { run, calls } = fakeRunner(outputs);
  const log = await createVerify({ run })(p, h);
  return { log, calls };
}

describe('VERIFY_CHECKS', () => {
  it('lists the 13 checks in order (TS-3)', () => {
    expect([...VERIFY_CHECKS]).toEqual([
      'texts_bilingual',
      'code_shape',
      'variety_recipe',
      'variety_answer',
      'run_js',
      'run_go',
      'run_java',
      'counts_agree',
      'counts_in_range',
      'example_matches_run',
      'fit_quality',
      'fit_unambiguous',
      'fit_matches_answer',
    ]);
  });
});

describe('verify happy path', () => {
  it('approves the fixture with the 13 checks (TS-10)', async () => {
    const { log, calls } = await verifyWith(P, same);
    expect(log.ok).toBe(true);
    expect(log.reason).toBeUndefined();
    expect(log.checks.map((c) => c.name)).toEqual([...VERIFY_CHECKS]);
    expect(log.checks.every((c) => c.ok)).toBe(true);
    expect(calls.map((c) => c.lang)).toEqual(['js', 'go', 'java']);
    for (const c of calls) {
      const source = wrapFunction(P.code[c.lang], c.lang, {
        entry: 'f',
        calls: LINEAR.map((n) => [n]),
      });
      expect(c.source).toBe(source);
      expect(c.options).toEqual({ timeoutMs: 10000 });
    }
    expect(calls[0]?.source.endsWith('console.log(f(65536));\n')).toBe(true);
    expect(byName(log, 'run_js')).toEqual({ name: 'run_js', ok: true, detail: '120 ms' });
    expect(byName(log, 'counts_agree')?.detail).toBe(
      'n=256,512,1024,2048,4096,8192,16384,32768,65536 counts=2048,4608,10240,22528,49152,106496,229376,491520,1048576',
    );
    expect(byName(log, 'example_matches_run')?.detail).toBe('n=1024 ops=10240');
    expect(byName(log, 'fit_quality')?.detail).toMatch(
      /^cv o_n_log_n=0\.0000 o_n=0\.2152 .* b=1\.550$/,
    );
    expect(byName(log, 'fit_unambiguous')?.detail).toBe(
      'best=o_n_log_n (0.0000) second=o_n (0.2152) min=0.1000',
    );
    expect(byName(log, 'fit_matches_answer')?.detail).toBe('best=o_n_log_n answer=o_n_log_n');
  });

  it('approves nested linear loops as O(n^2) (TS-11)', async () => {
    const p = { ...buildPayload(recipe('nest(linear,linear)'), [1, 1]), date: D };
    const counts = [4096, 16384, 65536, 262144, 1048576, 4194304, 16777216];
    const { log, calls } = await verifyWith(p, allLanguages(counts));
    expect(log.ok).toBe(true);
    expect(p.answer).toBe('o_n2');
    expect(calls[0]?.source).toContain('f(64)');
    expect(calls[0]?.source.endsWith('console.log(f(4096));\n')).toBe(true);
    expect(byName(log, 'fit_unambiguous')?.detail).toBe(
      'best=o_n2 (0.0000) second=o_n_log_n (1.0406) min=0.1000',
    );
    expect(byName(log, 'example_matches_run')?.detail).toBe('n=1024 ops=1048576');
  });

  it('starts the 3 languages before any finishes (TS-12)', async () => {
    const started: string[] = [];
    const resolvers: (() => void)[] = [];
    const run = (lang: 'js' | 'go' | 'java'): Promise<RunOutcome> => {
      started.push(lang);
      return new Promise((resolve) => {
        resolvers.push(() =>
          resolve({ ok: true, stdout: `${COUNTS_NLOGN.join('\n')}\n`, durationMs: 1 }),
        );
      });
    };
    const pending = createVerify({ run })(P, emptyHistory);
    await Promise.resolve();
    expect(started).toEqual(['js', 'go', 'java']);
    resolvers.forEach((r) => r());
    expect((await pending).ok).toBe(true);
  });
});

describe('verify in-memory checks', () => {
  const mutate = (fn: (p: BigOPayload) => void): BigOPayload => {
    const p = structuredClone(P);
    fn(p);
    return p;
  };

  it('texts_bilingual (TS-13)', async () => {
    const cases: [BigOPayload, string][] = [
      [mutate((p) => void (p.explanation.steps[1]!.en = '  ')), 'missing es/en for steps[1]'],
      [mutate((p) => void (p.explanation.tip!.es = '')), 'missing es/en for tip'],
      [
        mutate((p) => void (p.explanation.line_notes[0]!.text.en = '')),
        'missing es/en for line_notes[0]',
      ],
    ];
    for (const [p, detail] of cases) {
      const { log, calls } = await verifyWith(p, same);
      expect(log.reason).toBe('texts_bilingual');
      expect(byName(log, 'texts_bilingual')?.detail).toBe(detail);
      expect(calls).toHaveLength(0);
      expect(skipped(log, 4)).toBe(true);
    }
    const noTip = mutate((p) => void (p.explanation.tip = null));
    expect((await verifyWith(noTip, same)).log.ok).toBe(true);
  });

  it('code_shape (TS-14)', async () => {
    const cases: [BigOPayload, string][] = [
      [mutate((p) => void (p.code.java += '\n')), 'line counts differ: js=9 go=9 java=10'],
      [mutate((p) => void (p.explanation.line_notes[0]!.line = 12)), 'line_notes[0].line 12 > 9'],
      [
        mutate((p) => void (p.code.js = p.code.js.replace('      ops++;', '          ops++;'))),
        'js: nesting 4 > 3',
      ],
    ];
    for (const [p, detail] of cases) {
      const { log, calls } = await verifyWith(p, same);
      expect(log.reason).toBe('code_shape');
      expect(byName(log, 'code_shape')?.detail).toBe(detail);
      expect(calls).toHaveLength(0);
    }
  });

  it('variety_recipe window is [D-29, D+29] (TS-15)', async () => {
    const id = 'nest(linear,doubling)';
    for (const date of ['2027-02-14', '2027-04-13']) {
      const { log, calls } = await verifyWith(P, same, history(recent(date, id)));
      expect(log.reason).toBe('variety_recipe');
      expect(byName(log, 'variety_recipe')?.detail).toBe(
        `recipe ${id} used in [2027-02-14, 2027-04-13]`,
      );
      expect(calls).toHaveLength(0);
    }
    for (const date of ['2027-02-13', '2027-04-14']) {
      expect((await verifyWith(P, same, history(recent(date, id)))).log.ok).toBe(true);
    }
  });

  it('variety_answer allows 2 in a row, not 3 (TS-16)', async () => {
    const sets = [
      [recent('2027-03-13', 'nest(linear,halving)'), recent('2027-03-14', 'nest(doubling,linear)')],
      [recent('2027-03-14', 'nest(doubling,linear)'), recent('2027-03-16', 'dc(2,linear)')],
      [recent('2027-03-16', 'dc(2,linear)'), recent('2027-03-17', 'nest(linear,halving)')],
    ];
    for (const rows of sets) {
      const { log, calls } = await verifyWith(P, same, history(...rows));
      expect(log.reason).toBe('variety_answer');
      expect(byName(log, 'variety_answer')?.detail).toBe(
        'answer o_n_log_n would be 3 days in a row',
      );
      expect(calls).toHaveLength(0);
    }
    const control = history(
      recent('2027-03-13', 'nest(linear,halving)'),
      recent('2027-03-16', 'dc(2,linear)'),
    );
    expect((await verifyWith(P, same, control)).log.ok).toBe(true);
  });

  it('a payload without date is never approved (TS-17)', async () => {
    const { log, calls } = await verifyWith(PAYLOAD, same);
    expect(log.reason).toBe('variety_recipe');
    expect(byName(log, 'variety_recipe')).toEqual({
      name: 'variety_recipe',
      ok: false,
      detail: 'missing date',
    });
    expect(byName(log, 'variety_answer')?.detail).toBe('missing date');
    expect(calls).toHaveLength(0);
  });

  it('the row of D does not block its replacement (TS-18)', async () => {
    const h = history(recent('2027-03-15', 'nest(linear,doubling)'));
    const { log } = await verifyWith(P, same, h);
    expect(byName(log, 'variety_recipe')?.ok).toBe(true);
    expect(byName(log, 'variety_answer')?.ok).toBe(true);
    expect(log.ok).toBe(true);
  });
});

describe('verify execution failures', () => {
  const ok = COUNTS_NLOGN;
  const failure = (
    kind: RunOutcome extends infer R ? (R extends { kind: infer K } ? K : never) : never,
    stderr = '',
    durationMs = 5,
  ): RunOutcome => ({
    ok: false,
    kind,
    stderr,
    durationMs,
  });

  it('classifies one failure per kind (TS-19)', async () => {
    const cases = [
      [
        { js: ok, go: failure('timeout', '', 10003), java: ok },
        'run_go: timeout',
        'timeout (10003 ms)',
      ],
      [
        {
          js: ok,
          go: ok,
          java: failure(
            'compile_error',
            "Main.java:4: error: ';' expected\nerror: compilation failed",
            812,
          ),
        },
        'run_java: compile_error',
        "compile_error (812 ms): Main.java:4: error: ';' expected",
      ],
      [
        { js: failure('toolchain_missing', 'spawn node ENOENT', 3), go: ok, java: ok },
        'run_js: toolchain_missing',
        'toolchain_missing (3 ms): spawn node ENOENT',
      ],
      [
        { js: ok, go: failure('runtime_error', 'boom'), java: ok },
        'run_go: runtime_error',
        undefined,
      ],
      [
        { js: ok, go: ok, java: failure('output_too_large') },
        'run_java: output_too_large',
        undefined,
      ],
    ] as const;
    for (const [outputs, reason, detail] of cases) {
      const { log } = await verifyWith(P, outputs);
      expect(log.ok).toBe(false);
      expect(log.reason).toBe(reason);
      const name = reason.split(':')[0] as string;
      if (detail) expect(byName(log, name)?.detail).toBe(detail);
      expect(log.checks.filter((c) => c.name.startsWith('run_') && c.ok)).toHaveLength(2);
      expect(skipped(log, 7)).toBe(true);
    }
  });

  it('reports the first failure and invalid output (TS-20)', async () => {
    const a = await verifyWith(P, {
      js: failure('compile_error'),
      go: failure('timeout'),
      java: ok,
    });
    expect(a.log.reason).toBe('run_js: compile_error');
    expect(byName(a.log, 'run_js')?.ok).toBe(false);
    expect(byName(a.log, 'run_go')?.ok).toBe(false);

    const b = await verifyWith(P, { js: '2048\n4608\n', go: ok, java: ok });
    expect(b.log.reason).toBe('run_js: invalid_output');
    expect(byName(b.log, 'run_js')?.detail).toBe('invalid_output: expected 9 integers, got 2');

    const lines = COUNTS_NLOGN.map(String);
    lines[1] = 'abc';
    const c = await verifyWith(P, { js: ok, go: `${lines.join('\n')}\n`, java: ok });
    expect(c.log.reason).toBe('run_go: invalid_output');
    expect(byName(c.log, 'run_go')?.detail).toBe('invalid_output: line 2 is not an integer');
  });

  it('skips the go build header in the stderr detail', async () => {
    const stderr = '# command-line-arguments\n./prog.go:5:2: declared and not used: x';
    const { log } = await verifyWith(P, {
      js: ok,
      go: failure('compile_error', stderr, 80),
      java: ok,
    });
    expect(byName(log, 'run_go')?.detail).toBe(
      'compile_error (80 ms): ./prog.go:5:2: declared and not used: x',
    );
  });

  it('counts_agree (TS-21)', async () => {
    const java = [...COUNTS_NLOGN.slice(0, 8), 1048577];
    const { log } = await verifyWith(P, { js: ok, go: ok, java });
    expect(log.reason).toBe('counts_agree');
    expect(byName(log, 'counts_agree')?.detail).toBe(
      'differs at n=65536: js=1048576 go=1048576 java=1048577',
    );
    expect(skipped(log, 8)).toBe(true);
  });

  it('counts_in_range (TS-22)', async () => {
    const cases: [number[], string][] = [
      [[0, ...COUNTS_NLOGN.slice(1)], 'out of range at n=256: 0'],
      [[-5, ...COUNTS_NLOGN.slice(1)], 'out of range at n=256: -5'],
      [[...COUNTS_NLOGN.slice(0, 8), 2147483648], 'out of range at n=65536: 2147483648'],
    ];
    for (const [counts, detail] of cases) {
      const { log } = await verifyWith(P, allLanguages(counts));
      expect(log.reason).toBe('counts_in_range');
      expect(byName(log, 'counts_in_range')?.detail).toBe(detail);
      expect(skipped(log, 10)).toBe(true);
    }
  });
});

describe('verify example and fit', () => {
  it('example_matches_run (TS-23)', async () => {
    const wrongOps = structuredClone(P);
    wrongOps.explanation.example = { n: 1024, ops: 10241, trap_ops: 1048576 };
    const a = await verifyWith(wrongOps, same);
    expect(a.log.reason).toBe('example_matches_run');
    expect(byName(a.log, 'example_matches_run')?.detail).toBe(
      'example ops 10241 != measured 10240 at n=1024',
    );
    expect(byName(a.log, 'fit_matches_answer')?.ok).toBe(true);

    const wrongN = structuredClone(P);
    wrongN.explanation.example = { n: 1000, ops: 10240, trap_ops: 1048576 };
    const b = await verifyWith(wrongN, same);
    expect(byName(b.log, 'example_matches_run')?.detail).toBe('example n 1000 not in scale');
    expect(byName(b.log, 'fit_quality')?.ok).toBe(true);

    const c = await verifyWith(withDate(noExample(PAYLOAD, 'o_n_log_n')), same);
    expect(byName(c.log, 'example_matches_run')).toEqual({
      name: 'example_matches_run',
      ok: true,
      detail: 'no example',
    });
    expect(c.log.ok).toBe(true);
  });

  it('judges the fit inside verify (TS-24)', async () => {
    const q = withDate(noExample(PAYLOAD, 'o_n'));
    const a = await verifyWith(q, allLanguages(SERIES_AMBIGUOUS));
    expect(a.log.reason).toBe('fit_unambiguous');
    expect(byName(a.log, 'fit_unambiguous')?.detail).toBe(
      'ambiguous_fit: best=o_n (0.0879) second=o_n_log_n (0.1355) min=0.1759',
    );
    expect(byName(a.log, 'fit_quality')?.ok).toBe(true);

    const b = await verifyWith(q, allLanguages(SERIES_POOR));
    expect(b.log.reason).toBe('fit_quality');
    expect(byName(b.log, 'fit_quality')?.detail).toMatch(
      /^poor_fit: cv o_n=0\.1095 o_n_log_n=0\.1127 /,
    );

    const m = withDate(noExample(PAYLOAD, 'o_n_log_n'));
    const c = await verifyWith(m, allLanguages(LINEAR));
    expect(c.log.reason).toBe('fit_matches_answer');
    expect(byName(c.log, 'fit_matches_answer')?.detail).toBe(
      'fit_mismatch: best=o_n answer=o_n_log_n',
    );
    expect(byName(c.log, 'fit_quality')?.ok).toBe(true);
    expect(byName(c.log, 'fit_unambiguous')?.ok).toBe(true);
  });
});

describe('verify with nothing eligible', () => {
  it('rejects 20 attempts without running anything (TS-25)', async () => {
    const rows = RECIPES.map((r, i) => {
      const offset = (i % 58) - 29 + ((i % 58) - 29 >= 0 ? 1 : 0);
      return recent(addDays(D, offset), r.id);
    });
    const h = { bankItems: [], recentChallenges: rows };
    const { run, calls } = fakeRunner({});
    for (let attempt = 0; attempt < 20; attempt++) {
      const p = generate({ date: D, seed: seedFrom('fail', attempt), history: h });
      const log = await createVerify({ run })(payloadSchema.parse(p), h);
      expect(log.ok).toBe(false);
      expect(['variety_recipe', 'variety_answer']).toContain(log.reason);
      expect(skipped(log, 4)).toBe(true);
    }
    expect(calls).toHaveLength(0);
  });
});

describe('verify purity', () => {
  it('does not mutate its inputs (TS-27)', async () => {
    const h = history(recent('2027-03-20', 'dc(2,linear)'));
    const p0 = structuredClone(P);
    const h0 = structuredClone(h);
    const verify = createVerify({ run: fakeRunner(same).run });
    const first = await verify(P, h);
    const second = await verify(P, h);
    expect(P).toEqual(p0);
    expect(h).toEqual(h0);
    expect(first).toEqual(second);
  });

  it('uses the scale of the answer', () => {
    expect(SCALE[P.answer]).toHaveLength(9);
  });
});
