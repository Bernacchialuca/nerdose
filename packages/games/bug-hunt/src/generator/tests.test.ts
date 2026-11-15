import { rngFrom } from '@nerdose/core';
import { createTreeBuilder, evaluate, type FuncNode } from '@nerdose/polyglot';
import { describe, expect, it } from 'vitest';

import { PAYLOAD } from '../definition/test-fixtures';

import { templateById } from './catalog';
import {
  buildTests,
  EVAL_STEP_LIMIT,
  MAX_TEST_DRAWS,
  selectTests,
  TEST_COUNT,
  testSize,
} from './tests';
import { seed } from './test-fixtures';
import type { Template } from './types';

function identity(): FuncNode {
  const b = createTreeBuilder();
  return b.func(
    'total',
    [{ name: 'nums', type: 'int[]' }],
    [b.return(b.len(b.var('nums')))],
    'int',
  );
}

const probe = (edge: number[][], random: () => number[]): Template => ({
  id: 'probe',
  combos: [{}],
  functionName: () => 'total',
  build: () => ({ func: identity(), sites: [] }),
  spec: () => ({ es: 'a', en: 'a' }),
  edgeCases: () => edge.map((a) => [a]),
  randomInput: () => [random()],
  reference: (_p, input) => (input[0] as number[]).length,
});

describe('testSize (TS-18)', () => {
  it('adds array lengths and scalar arguments', () => {
    expect(testSize([[5, 1, 5]])).toBe(3);
    expect(testSize([[], 3])).toBe(1);
    expect(testSize([[3, 7, 2], 4])).toBe(4);
    expect(testSize([[]])).toBe(0);
  });
});

describe('buildTests (TS-19)', () => {
  it('puts edge cases first, then distinct random inputs, up to TEST_COUNT', () => {
    let n = 0;
    const t = probe([[], [4]], () => [n++, n % 3]);
    const tests = buildTests(t, {}, identity(), rngFrom(seed(1)));
    expect(tests).toHaveLength(TEST_COUNT);
    expect(tests.slice(0, 2).map((x) => x.input)).toEqual([[[]], [[4]]]);
    expect(new Set(tests.map((x) => JSON.stringify(x.input))).size).toBe(TEST_COUNT);
    expect(tests[1]?.expected).toBe(1);
  });

  it('stops at MAX_TEST_DRAWS when few inputs exist', () => {
    let draws = 0;
    const t = probe([[1]], () => {
      draws++;
      return [1];
    });
    const tests = buildTests(t, {}, identity(), rngFrom(seed(1)));
    expect(tests).toHaveLength(1);
    expect(draws).toBe(MAX_TEST_DRAWS);
  });

  it('fails when the reference tree cannot evaluate an input', () => {
    const b = createTreeBuilder();
    const bad = b.func(
      'total',
      [{ name: 'nums', type: 'int[]' }],
      [b.return(b.index(b.var('nums'), b.num(5)))],
      'int',
    );
    const t = { ...probe([[1]], () => [1]), build: () => ({ func: bad, sites: [] }) };
    expect(() => buildTests(t, {}, bad, rngFrom(seed(1)))).toThrow(
      'bug-hunt: probe reference input fails: total([1])',
    );
  });
});

describe('buildTests with a real template (TS-19)', () => {
  it('keeps the 6 edge cases first, evaluates the correct tree and is deterministic', () => {
    const template = templateById('extreme_index');
    const params = { extreme: 'max', tie: 'first' };
    const { func } = template.build(params, createTreeBuilder());
    const a = buildTests(template, params, func, rngFrom(seed(1)));
    const b = buildTests(template, params, func, rngFrom(seed(1)));
    expect(a).toEqual(b);
    expect(a).toHaveLength(TEST_COUNT);
    expect(new Set(a.map((t) => JSON.stringify(t.input))).size).toBe(TEST_COUNT);
    expect(a.slice(0, 6).map((t) => t.input)).toEqual(template.edgeCases(params).slice(0, 6));
    for (const t of a) {
      expect(evaluate(func, t.input, { maxSteps: EVAL_STEP_LIMIT })).toEqual({
        ok: true,
        value: t.expected,
      });
    }
  });
});

describe('selectTests (TS-20, TS-21)', () => {
  it('picks the smallest failing test and the smallest passing ones', () => {
    expect(selectTests(PAYLOAD.tests)).toEqual({
      status: 'ok',
      failing: PAYLOAD.failing_test,
      visible: PAYLOAD.visible_tests,
    });
  });

  it('reports equivalent and not enough passing tests', () => {
    expect(selectTests(PAYLOAD.tests.map((t) => ({ ...t, actual: t.expected })))).toEqual({
      status: 'equivalent',
    });
    const one = [
      { input: [[1]], expected: 0, actual: 0 },
      { input: [[2, 3]], expected: 0, actual: 1 },
    ];
    const r = selectTests(one);
    expect(r.status).toBe('not_enough_passing');
    expect('visible' in r && r.visible).toHaveLength(1);
    const two = [...one, { input: [[4, 5, 6]], expected: 0, actual: 0 }];
    const r2 = selectTests(two);
    expect(r2.status).toBe('ok');
    expect('visible' in r2 && r2.visible).toHaveLength(2);
  });
});
