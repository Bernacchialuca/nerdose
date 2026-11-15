import { BUG_TYPES } from '@nerdose/core';
import { evaluate } from '@nerdose/polyglot';
import { describe, expect, it } from 'vitest';

import { payloadSchema, type BugHuntPayload } from '../definition';
import { PAYLOAD } from '../definition/test-fixtures';

import { templateById } from './catalog';
import { createGenerate, generate } from './generate';
import { buildPayload } from './payload';
import { mutationsOf } from './mutation/candidates';
import { formatCall, formatValue } from './format';
import { addDays } from './days';
import { selectTests, EVAL_STEP_LIMIT } from './tests';
import {
  D,
  emptyHistory,
  PROBE_EQUIV,
  PROBE_FEW,
  PROBE_FEW_ONLY,
  PROBE_ONLY_EQUIV,
  PROBE_VARIETY,
  recent,
  rowWithKey,
  seed,
} from './test-fixtures';
import { allCandidates, assertValidPayload, rebuild } from './test-utils';
import { keysUsedNear, varietyKey } from './variety';
import { createTreeBuilder } from '@nerdose/polyglot';

const history5 = {
  bankItems: [],
  recentChallenges: [-3, -2, -1, 1, 2].map((d) => recent(addDays(D, d), PAYLOAD)),
};

describe('generate determinism (TS-28)', () => {
  it('gives the same payload for the same input and leaves the history alone', () => {
    const copy = structuredClone(history5);
    for (let k = 1; k <= 2000; k++) {
      const a = generate({ date: D, seed: seed(k), history: history5 });
      const b = generate({ date: D, seed: seed(k), history: structuredClone(history5) });
      expect(a).toEqual(b);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    }
    expect(history5).toEqual(copy);
  }, 60_000);
});

describe('generate distribution and validity (TS-29)', () => {
  it('draws each bug type between 8% and 22% of 2000 seeds with valid payloads', () => {
    const counts = new Map<string, number>();
    for (let k = 1; k <= 2000; k++) {
      const p = generate({ date: D, seed: seed(k), history: emptyHistory });
      assertValidPayload(p);
      counts.set(p.bug_type, (counts.get(p.bug_type) ?? 0) + 1);
    }
    for (const type of BUG_TYPES) {
      expect(counts.get(type) ?? 0, type).toBeGreaterThanOrEqual(160);
      expect(counts.get(type) ?? 0, type).toBeLessThanOrEqual(440);
    }
  }, 60_000);
});

describe('generate payload (TS-30)', () => {
  it('is complete and consistent', () => {
    const p = generate({ date: D, seed: seed(1), history: emptyHistory });
    expect(Object.keys(p)[0]).toBe('date');
    assertValidPayload(p);
    expect(p.explanation.steps).toHaveLength(3);
    expect(p.pickable_lines).toContain(p.bug_line);
    expect(p.visible_tests.map((t) => JSON.stringify(t.input))).not.toContain(
      JSON.stringify(p.failing_test.input),
    );
  });
});

describe('equivalent mutants (TS-31, TS-32)', () => {
  it('discards an equivalent mutant and tries another site', () => {
    const gen = createGenerate([PROBE_EQUIV]);
    for (let k = 1; k <= 200; k++) {
      const p = gen({ date: D, seed: seed(k), history: emptyHistory });
      expect(p.mutation.operator).toBe('bound_minus_one');
      expect(selectTests(p.tests).status).toBe('ok');
    }
  });

  it('still returns something when every mutant is equivalent', () => {
    const p = createGenerate([PROBE_ONLY_EQUIV])({ date: D, seed: seed(1), history: emptyHistory });
    expect(() => payloadSchema.parse(p)).not.toThrow();
    expect(p.tests.every((t) => t.actual === t.expected)).toBe(true);
  });
});

describe('too few passing tests (TS-33)', () => {
  it('prefers a candidate with 2 passing tests', () => {
    const gen = createGenerate([PROBE_FEW]);
    for (let k = 1; k <= 200; k++) {
      expect(gen({ date: D, seed: seed(k), history: emptyHistory }).mutation.operator).toBe(
        'loop_start_shift',
      );
    }
  });

  it('falls back to the candidate with 1 passing test', () => {
    const p = createGenerate([PROBE_FEW_ONLY])({ date: D, seed: seed(1), history: emptyHistory });
    expect(() => payloadSchema.parse(p)).not.toThrow();
    expect(p.tests.filter((t) => t.actual === t.expected)).toHaveLength(1);
    expect(p.visible_tests).toHaveLength(1);
  });
});

describe('variety (TS-34, TS-35, TS-36)', () => {
  const built = PROBE_VARIETY.build({}, createTreeBuilder());
  const identity = (operator: string) => {
    const c = mutationsOf(built, 'off_by_one').find((x) => x.operator === operator);
    if (c === undefined) throw new Error('no candidate');
    return {
      template: PROBE_VARIETY.id,
      params: {},
      mutation: { operator: c.operator, node: c.site.node, from: c.from, to: c.to },
    };
  };
  const A = identity('loop_start_shift');
  const B = identity('bound_minus_one');
  const gen = createGenerate([PROBE_VARIETY]);
  const operators = (rows: ReturnType<typeof rowWithKey>[]) => {
    const seen = new Set<string>();
    for (let k = 1; k <= 200; k++) {
      seen.add(
        gen({ date: D, seed: seed(k), history: { bankItems: [], recentChallenges: rows } }).mutation
          .operator,
      );
    }
    return seen;
  };

  it('avoids a key inside the window and accepts it outside', () => {
    expect(operators([rowWithKey(addDays(D, -59), A)])).toEqual(new Set(['bound_minus_one']));
    expect(operators([rowWithKey(addDays(D, 59), A)])).toEqual(new Set(['bound_minus_one']));
    expect(operators([rowWithKey(addDays(D, -60), A)])).toEqual(
      new Set(['loop_start_shift', 'bound_minus_one']),
    );
    expect(operators([rowWithKey(addDays(D, 60), A)])).toEqual(
      new Set(['loop_start_shift', 'bound_minus_one']),
    );
  });

  it('does not throw when both candidates are used', () => {
    const rows = [rowWithKey(addDays(D, -1), A), rowWithKey(addDays(D, -1), B)];
    const history = { bankItems: [], recentChallenges: rows };
    const p = gen({ date: D, seed: seed(1), history });
    expect(keysUsedNear(D, rows).has(varietyKey(p))).toBe(true);
  });

  it('never repeats a key of the window with the real catalog', () => {
    const first = generate({ date: D, seed: seed(1), history: emptyHistory });
    const history = { bankItems: [], recentChallenges: [recent(addDays(D, -30), first)] };
    const key = varietyKey(first);
    for (let k = 1; k <= 300; k++) {
      expect(varietyKey(generate({ date: D, seed: seed(k), history }))).not.toBe(key);
    }
  });

  it('survives a history with every possible key', () => {
    const rows = allCandidates().map((id) => rowWithKey(addDays(D, -1), id));
    const history = { bankItems: [], recentChallenges: rows };
    const used = keysUsedNear(D, rows);
    for (let k = 1; k <= 20; k++) {
      const p = generate({ date: D, seed: seed(k), history });
      expect(() => payloadSchema.parse(p)).not.toThrow();
      expect(used.has(varietyKey(p))).toBe(true);
    }
  }, 60_000);
});

describe('rebuilding a payload (TS-38, TS-39)', () => {
  const payloads: BugHuntPayload[] = Array.from({ length: 300 }, (_, i) =>
    generate({ date: D, seed: seed(i + 1), history: emptyHistory }),
  );

  it('reproduces code, tests and lines from template, params and mutation', () => {
    for (const p of payloads) {
      const { correct, mutant, candidate } = rebuild(p);
      const rebuilt = buildPayload({
        date: D,
        template: templateById(p.template),
        params: p.params,
        built: { func: correct, sites: [candidate.site] },
        candidate,
        tests: p.tests,
        selection: { status: 'ok', failing: p.failing_test, visible: p.visible_tests },
      });
      expect(rebuilt.code).toEqual(p.code);
      expect(rebuilt.fix).toEqual(p.fix);
      expect(rebuilt.bug_line).toBe(p.bug_line);
      expect(rebuilt.pickable_lines).toEqual(p.pickable_lines);
      for (const t of p.tests) {
        expect(evaluate(correct, t.input, { maxSteps: EVAL_STEP_LIMIT })).toEqual({
          ok: true,
          value: t.expected,
        });
        expect(evaluate(mutant, t.input, { maxSteps: EVAL_STEP_LIMIT })).toEqual({
          ok: true,
          value: t.actual,
        });
      }
    }
  });

  it('cites the hidden test in the second step', () => {
    for (const p of payloads) {
      const call = formatCall(p.function_name, p.failing_test.input);
      for (const lang of ['es', 'en'] as const) {
        const step = p.explanation.steps[1]?.[lang] ?? '';
        expect(step).toContain(call);
        expect(step).toContain(formatValue(p.failing_test.actual));
        expect(step).toContain(formatValue(p.failing_test.expected));
      }
    }
  });
});
