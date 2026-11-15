import { describe, expect, it } from 'vitest';

import { payloadSchema, type BugHuntPayload } from '../definition';
import { PAYLOAD, PAYLOAD_BOOL } from '../definition/test-fixtures';

import {
  codeShape,
  linesConsistent,
  textsBilingual,
  testsConsistent,
  varietyCombo,
} from './static-checks';
import { createGenerate } from './generate';
import {
  D,
  emptyHistory,
  PROBE_FEW_ONLY,
  PROBE_ONLY_EQUIV,
  rowWithKey,
  seedFrom,
} from './test-fixtures';

const P = PAYLOAD;
const B = PAYLOAD_BOOL;
type Lang = 'js' | 'go' | 'java';

function withLine(p: BugHuntPayload, lang: Lang, line: number, text: string): BugHuntPayload {
  const c = structuredClone(p);
  const lines = c.code[lang].split('\n');
  lines[line - 1] = text;
  c.code[lang] = lines.join('\n');
  return c;
}
const over = (overrides: Partial<BugHuntPayload>): BugHuntPayload => ({
  ...structuredClone(P),
  ...overrides,
});
const detail = (c: { detail?: string }) => c.detail;

describe('textsBilingual (TS-6)', () => {
  it('passes without detail', () => {
    expect(textsBilingual(P)).toEqual({ name: 'texts_bilingual', ok: true });
  });
  it('names what is missing', () => {
    const a = over({ spec: { es: P.spec.es, en: '  ' } });
    const b = structuredClone(P);
    b.explanation.steps[1] = { es: '', en: 'x' };
    const c = structuredClone(a);
    c.explanation.steps[1] = { es: '', en: 'x' };
    expect(detail(textsBilingual(a))).toBe('missing es/en for spec');
    expect(detail(textsBilingual(b))).toBe('missing es/en for steps[1]');
    expect(detail(textsBilingual(c))).toBe('missing es/en for spec, steps[1]');
    expect(textsBilingual(a).ok).toBe(false);
  });
});

describe('codeShape (TS-7)', () => {
  it('passes the fixtures', () => {
    expect(codeShape(P).ok).toBe(true);
    expect(codeShape(B).ok).toBe(true);
  });
  it('reports each problem', () => {
    expect(detail(codeShape(over({ code: { ...P.code, java: `${P.code.java}\n` } })))).toBe(
      'line counts differ: js=9 go=9 java=10',
    );
    expect(detail(codeShape(withLine(P, 'js', 5, '          best = i;')))).toBe(
      'js: nesting 4 > 3',
    );
    const cut = (s: string) => s.split('\n').slice(0, 7).join('\n');
    expect(
      detail(
        codeShape(
          over({ code: { js: cut(P.code.js), go: cut(P.code.go), java: cut(P.code.java) } }),
        ),
      ),
    ).toBe('js: 7 lines < 8; go: 7 lines < 8; java: 7 lines < 8');
    expect(detail(codeShape(withLine(P, 'go', 8, '\treturn best // ok')))).toBe(
      'go: comment at line 8',
    );
    expect(
      detail(
        codeShape(withLine(P, 'java', 3, '    /* x */ for (int i = 1; i < nums.length; i++) {')),
      ),
    ).toBe('java: comment at line 3');
  });
});

describe('linesConsistent (TS-8)', () => {
  it('passes the fixtures', () => {
    expect(linesConsistent(P).ok).toBe(true);
    expect(linesConsistent(B).ok).toBe(true);
  });
  it.each([
    [{ pickable_lines: [2, 3, 5, 4, 8] }, 'pickable_lines not strictly ascending'],
    [{ pickable_lines: [2, 3, 4, 4, 5, 8] }, 'pickable_lines not strictly ascending'],
    [{ pickable_lines: [2, 3, 4, 5, 6, 8] }, 'pickable line 6 is brace-only in js, go, java'],
    [{ pickable_lines: [1, 2, 3, 4, 5, 8] }, 'pickable line 1 out of [2, 8]'],
    [{ bug_line: 6 }, 'bug_line 6 not in pickable_lines'],
    [{ fix: { ...P.fix, go: '\t\tif nums[i] >= nums[best] {' } }, 'go: bug line equals fix'],
    [
      { fix: { ...P.fix, java: '      if (nums[i] > nums[best]) {' } },
      'java: fix indentation differs',
    ],
    [{ bug_line: 12 }, 'bug_line 12 not in pickable_lines; bug_line 12 out of code'],
  ] as [Partial<BugHuntPayload>, string][])('%j', (overrides, expected) => {
    expect(detail(linesConsistent(over(overrides)))).toBe(expected);
  });
});

describe('testsConsistent', () => {
  it('passes the fixtures', () => {
    expect(testsConsistent(P)).toEqual({
      check: { name: 'tests_consistent', ok: true },
      motive: null,
    });
    expect(testsConsistent(B).check.ok).toBe(true);
  });

  it('rejects an equivalent mutant (TS-9)', () => {
    const a = over({
      tests: P.tests.map((t) => ({ ...t, actual: t.expected })),
      failing_test: { input: [[5, 1, 5]], expected: 0, actual: 0 },
    });
    const b = payloadSchema.parse(
      createGenerate([PROBE_ONLY_EQUIV])({
        date: D,
        seed: seedFrom('fail', 0),
        history: emptyHistory,
      }),
    );
    for (const p of [a, b]) {
      const r = testsConsistent(p);
      expect(detail(r.check)).toBe('equivalent_mutant: no failing test');
      expect(r.motive).toBe('equivalent_mutant');
    }
  });

  it('rejects too few passing tests (TS-10)', () => {
    const a = payloadSchema.parse(
      createGenerate([PROBE_FEW_ONLY])({
        date: D,
        seed: seedFrom('fail', 0),
        history: emptyHistory,
      }),
    );
    const b = over({
      visible_tests: [P.visible_tests[0] as BugHuntPayload['visible_tests'][number]],
    });
    const c = over({
      visible_tests: [
        P.visible_tests[0],
        P.visible_tests[1],
        { input: [[-2, -9, -2]], expected: 0 },
      ] as BugHuntPayload['visible_tests'],
    });
    expect(detail(testsConsistent(a).check)).toBe('not_enough_passing: 1 passing, 1 visible');
    expect(detail(testsConsistent(b).check)).toBe('not_enough_passing: 5 passing, 1 visible');
    expect(detail(testsConsistent(c).check)).toBe(
      'not_enough_passing: visible_tests[2] does not pass',
    );
    expect(testsConsistent(c).motive).toBe('not_enough_passing');
  });

  it('checks the hidden test and membership (TS-11)', () => {
    const smallest = 'failing_test is not the smallest failing test (expected maxIndex([5, 1, 5]))';
    const visible = P.visible_tests as BugHuntPayload['visible_tests'];
    const at = (i: number) => P.tests[i] as BugHuntPayload['tests'][number];
    expect(detail(testsConsistent(over({ failing_test: at(7) })).check)).toBe(smallest);
    expect(detail(testsConsistent(over({ failing_test: at(5) })).check)).toBe(smallest);
    expect(testsConsistent(over({ failing_test: at(7) })).motive).toBeNull();
    expect(
      detail(
        testsConsistent(
          over({
            visible_tests: [visible[0], visible[1], { input: [[5, 1, 5]], expected: 0 }] as never,
          }),
        ).check,
      ),
    ).toBe(
      'not_enough_passing: visible_tests[2] does not pass; failing_test is among visible_tests',
    );
    expect(
      detail(
        testsConsistent(over({ failing_test: { input: [[5, 1, 5]], expected: 0, actual: 3 } }))
          .check,
      ),
    ).toBe(`failing_test not in tests; ${smallest}`);
    expect(
      detail(
        testsConsistent(
          over({ visible_tests: [{ input: [[0]], expected: 0 }, visible[1], visible[2]] as never }),
        ).check,
      ),
    ).toBe('visible_tests[0] not in tests');
    const tests = structuredClone(P.tests);
    tests[6] = { input: [[9, 8, 7, 6], 1], expected: 0, actual: 0 };
    expect(detail(testsConsistent(over({ tests })).check)).toBe('inconsistent types at tests[6]');
  });
});

describe('varietyCombo (TS-12, TS-13)', () => {
  const near = (d: string) =>
    varietyCombo(P, { bankItems: [], recentChallenges: [rowWithKey(d, P)] });
  const KEY = 'extreme_index:{"extreme":"max","tie":"first"}:relax_comparison@n16:>=';
  it.each(['2026-09-22', '2027-01-18'])('rejects a use on %s', (d) => {
    expect(detail(near(d))).toBe(`combo ${KEY} used in [2026-09-22, 2027-01-18]`);
  });
  it.each(['2026-09-21', '2027-01-19', '2026-11-20'])('allows a use on %s', (d) => {
    expect(near(d)).toEqual({ name: 'variety_combo', ok: true });
  });
  it('fails without date', () => {
    const noDate: Partial<BugHuntPayload> = { ...P };
    delete noDate.date;
    expect(varietyCombo(noDate as BugHuntPayload, emptyHistory)).toEqual({
      name: 'variety_combo',
      ok: false,
      detail: 'missing date',
    });
  });
});
