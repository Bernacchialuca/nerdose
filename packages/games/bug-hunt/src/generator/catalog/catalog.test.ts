import { BUG_TYPES, rngFrom, type BugType } from '@nerdose/core';
import { checkPortable, createTreeBuilder, emit, evaluate, type FuncNode } from '@nerdose/polyglot';
import { describe, expect, it } from 'vitest';

import { SPEC_MAX_INDEX } from '../../definition/test-fixtures';
import { evaluateCandidate } from '../evaluate-candidate';
import { mutationsOf } from '../mutation/candidates';
import { OPERATORS } from '../mutation/operators';
import { findNode } from '../mutation/tree-utils';
import { measureCode, MAX_LINES, MAX_NESTING, MIN_LINES } from '../shape';
import { seedFrom } from '../test-fixtures';
import { buildTests, EVAL_STEP_LIMIT, TEST_COUNT } from '../tests';
import type { Template, TemplateParams } from '../types';

import { bugTypesOf, combosFor, TEMPLATES, templateById } from './index';

const LANGS = ['js', 'go', 'java'] as const;
const build = (t: Template, p: TemplateParams) => t.build(p, createTreeBuilder());
const all = TEMPLATES.flatMap((t) =>
  t.combos.map((p) => ({ t, p, name: `${t.id} ${JSON.stringify(p)}` })),
);

describe('catalog shape (TS-4)', () => {
  it('has 18 templates ordered by id and 62 combinations', () => {
    expect(TEMPLATES.map((t) => [t.id, t.combos.length])).toEqual([
      ['all_where', 4],
      ['any_where', 4],
      ['binary_search', 2],
      ['count_equal_neighbors', 3],
      ['count_pairs', 3],
      ['count_where', 7],
      ['extreme_index', 4],
      ['first_index_where', 8],
      ['is_palindrome', 2],
      ['is_sorted', 4],
      ['last_index_where', 4],
      ['longest_run', 3],
      ['max_window_sum', 2],
      ['prefix_within_budget', 2],
      ['split_difference', 2],
      ['sum_range', 4],
      ['trim_length', 2],
      ['value_range', 2],
    ]);
    expect(all).toHaveLength(62);
    expect(() => templateById('nope')).toThrow('bug-hunt: unknown template nope');
  });
});

describe('reference vs tree (TS-5)', () => {
  it.each(all)('$name', ({ t, p }) => {
    const { func } = build(t, p);
    const inputs = [...t.edgeCases(p)];
    for (let i = 0; i < 500; i++) {
      const input = t.randomInput(rngFrom(seedFrom(`ref-${t.id}`, i)), p);
      const nums = input[0] as number[];
      expect(nums.length).toBeLessThanOrEqual(7);
      for (const v of nums) {
        expect(v).toBeGreaterThanOrEqual(-9);
        expect(v).toBeLessThanOrEqual(20);
      }
      if (t.id === 'binary_search') expect(nums).toEqual([...nums].sort((a, b) => a - b));
      if (t.id === 'max_window_sum') {
        expect(input[1] as number).toBeGreaterThanOrEqual(1);
        expect(input[1] as number).toBeLessThanOrEqual(nums.length);
      }
      if (t.id === 'split_difference') {
        expect(input[1] as number).toBeGreaterThanOrEqual(0);
        expect(input[1] as number).toBeLessThanOrEqual(nums.length);
      }
      if (t.id === 'value_range') expect(nums.length).toBeGreaterThanOrEqual(1);
      if (t.id === 'prefix_within_budget') expect(nums.every((v) => v >= 0)).toBe(true);
      inputs.push(input);
    }
    for (const input of inputs) {
      expect(evaluate(func, input, { maxSteps: EVAL_STEP_LIMIT })).toEqual({
        ok: true,
        value: t.reference(p, input),
      });
    }
  });
});

describe('emitted shape and portability (TS-6, TS-7)', () => {
  it.each(all)('$name', ({ t, p }) => {
    const { func } = build(t, p);
    const emitted = LANGS.map((l) => emit(func, l));
    for (const [i, lang] of LANGS.entries()) {
      const m = measureCode((emitted[i] as (typeof emitted)[number]).code, lang);
      expect(m.lines).toBeGreaterThanOrEqual(MIN_LINES);
      expect(m.lines).toBeLessThanOrEqual(MAX_LINES);
      expect(m.nesting).toBeLessThanOrEqual(MAX_NESTING);
      expect((emitted[i] as (typeof emitted)[number]).code).not.toContain('//');
    }
    const lines = emitted.map((e) => e.code.split('\n').length);
    expect(new Set(lines).size).toBe(1);
    expect(emitted[1]?.statementLines).toEqual(emitted[0]?.statementLines);
    expect(emitted[2]?.statementLines).toEqual(emitted[0]?.statementLines);
    expect(checkPortable(func)).toEqual([]);
  });
});

describe('bug type coverage (TS-8)', () => {
  const EXPECTED: Record<BugType, string[]> = {
    off_by_one: TEMPLATES.map((t) => t.id),
    comparison: [
      'extreme_index',
      'count_where',
      'sum_range',
      'first_index_where',
      'last_index_where',
      'all_where',
      'any_where',
      'binary_search',
      'is_sorted',
      'count_equal_neighbors',
      'count_pairs',
      'longest_run',
      'prefix_within_budget',
      'trim_length',
    ],
    wrong_operator: [
      'count_where',
      'sum_range',
      'first_index_where',
      'max_window_sum',
      'count_equal_neighbors',
      'count_pairs',
      'longest_run',
      'prefix_within_budget',
      'split_difference',
      'trim_length',
      'value_range',
    ],
    wrong_variable: [
      'extreme_index',
      'count_where',
      'sum_range',
      'binary_search',
      'is_palindrome',
      'max_window_sum',
      'count_equal_neighbors',
      'count_pairs',
      'longest_run',
      'prefix_within_budget',
      'split_difference',
      'trim_length',
      'value_range',
    ],
    bad_initialization: [
      'extreme_index',
      'first_index_where',
      'last_index_where',
      'all_where',
      'any_where',
      'binary_search',
      'is_palindrome',
      'longest_run',
      'prefix_within_budget',
      'trim_length',
    ],
    misplaced_return: TEMPLATES.map((t) => t.id).filter(
      (id) => !['is_sorted', 'trim_length', 'value_range'].includes(id),
    ),
    inverted_condition: TEMPLATES.map((t) => t.id).filter(
      (id) =>
        !['binary_search', 'last_index_where', 'prefix_within_budget', 'split_difference'].includes(
          id,
        ),
    ),
  };

  it.each(BUG_TYPES)('%s', (type) => {
    const ids = TEMPLATES.filter((t) => bugTypesOf(t).includes(type)).map((t) => t.id);
    expect([...ids].sort()).toEqual([...EXPECTED[type]].sort());
    expect(ids.length).toBeGreaterThanOrEqual(4);
  });

  it('combosFor keeps the order of the combinations', () => {
    const t = templateById('first_index_where');
    expect(combosFor(t, 'bad_initialization').every((p) => p.missing === 'minus_one')).toBe(true);
    expect(combosFor(t, 'off_by_one')).toEqual(t.combos);
  });
});

describe('texts (TS-9)', () => {
  it.each(all)('$name', ({ t, p }) => {
    const spec = t.spec(p);
    expect(spec.es.length).toBeGreaterThan(0);
    expect(spec.en.length).toBeGreaterThan(0);
    expect(spec.es).not.toBe(spec.en);
    expect(t.functionName(p)).toMatch(/^[a-z][A-Za-z0-9]*$/);
    for (const s of build(t, p).sites) {
      expect(s.role.es.length).toBeGreaterThan(0);
      expect(s.role.en.length).toBeGreaterThan(0);
      if (s.operators.includes('negate_condition')) {
        expect(s.role.es.startsWith('la condición')).toBe(true);
        expect(s.role.en.startsWith('the condition')).toBe(true);
      }
    }
  });
});

describe('golden maxIndex (TS-12)', () => {
  it('emits the 9 lines of the template', () => {
    const t = templateById('extreme_index');
    const p = { extreme: 'max', tie: 'first' };
    const built = build(t, p);
    expect(emit(built.func, 'js').code).toBe(
      [
        'function maxIndex(nums) {',
        '  let best = 0;',
        '  for (let i = 1; i < nums.length; i++) {',
        '    if (nums[i] > nums[best]) {',
        '      best = i;',
        '    }',
        '  }',
        '  return best;',
        '}',
      ].join('\n'),
    );
    expect(emit(built.func, 'js').statementLines).toEqual([2, 3, 4, 5, 8]);
    expect(t.reference(p, [[5, 1, 5]])).toBe(0);
    expect(evaluate(built.func, [[5, 1, 5]])).toEqual({ ok: true, value: 0 });
    expect(t.spec(p)).toEqual(SPEC_MAX_INDEX);
  });
});

describe('every declared site serves (TS-10)', () => {
  it('has a variant per (site, operator) and a valid candidate somewhere in the template', () => {
    for (const t of TEMPLATES) {
      const served = new Map<string, boolean>();
      for (const p of t.combos) {
        const built = build(t, p);
        for (const site of built.sites) {
          const node = findNode(built.func, site.node);
          expect(node, `${t.id} ${site.node}`).toBeDefined();
          for (const op of site.operators) {
            const variants = OPERATORS[op].variants(node as never, site);
            expect(
              variants.length,
              `${t.id} ${JSON.stringify(p)} ${site.role.en} ${op}`,
            ).toBeGreaterThan(0);
            const key = `${site.role.en}|${op}`;
            if (!served.has(key)) served.set(key, false);
          }
        }
        for (let s = 0; s < 20; s++) {
          const tests = buildTests(t, p, built.func, rngFrom(seedFrom(`serve-${t.id}`, s)));
          for (const type of BUG_TYPES) {
            for (const c of mutationsOf(built, type)) {
              const v = evaluateCandidate(c, tests, new Set(), { template: t.id, params: p });
              if (v.verdict === 'ok') served.set(`${c.site.role.en}|${c.operator}`, true);
            }
          }
        }
      }
      for (const [key, ok] of served) expect(ok, `${t.id} ${key}`).toBe(true);
    }
  }, 120_000);
});

describe('robustness per combination and type (TS-11)', () => {
  it('finds a valid candidate in at least 80% of 50 test sets', () => {
    const weak: string[] = [];
    for (const t of TEMPLATES) {
      for (const p of t.combos) {
        const built = build(t, p);
        for (const type of BUG_TYPES.filter((ty) => combosFor(t, ty).includes(p))) {
          let withCandidate = 0;
          for (let i = 0; i < 50; i++) {
            const tests = buildTests(t, p, built.func as FuncNode, rngFrom(seedFrom('robust', i)));
            expect(tests).toHaveLength(TEST_COUNT);
            const ok = mutationsOf(built, type).some(
              (c) =>
                evaluateCandidate(c, tests, new Set(), { template: t.id, params: p }).verdict ===
                'ok',
            );
            if (ok) withCandidate++;
          }
          if (withCandidate < 40)
            weak.push(`${t.id} ${JSON.stringify(p)} ${type}: ${withCandidate}/50`);
        }
      }
    }
    expect(weak).toEqual([]);
  }, 120_000);
});
