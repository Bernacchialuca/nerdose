/* eslint-disable @typescript-eslint/no-explicit-any -- deliberate mutations of malformed payloads */
import { CODE_LANGUAGES } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { moveSchema, payloadSchema, stateSchema } from './schemas';
import { PAYLOAD, PAYLOAD_BOOL } from './test-fixtures';

const clone = () => structuredClone(PAYLOAD) as Record<string, any>;

const rejects: [string, (p: Record<string, any>) => void][] = [
  ['bug_type typo', (p) => (p.bug_type = 'typo')],
  ['missing code.go', (p) => delete p.code.go],
  ['empty code.js', (p) => (p.code.js = '')],
  ['empty fix.java', (p) => (p.fix.java = '')],
  ['missing fix.java', (p) => delete p.fix.java],
  ['bug_line 0', (p) => (p.bug_line = 0)],
  ['bug_line 2.5', (p) => (p.bug_line = 2.5)],
  ['pickable_lines empty', (p) => (p.pickable_lines = [])],
  ['pickable_lines [0]', (p) => (p.pickable_lines = [0])],
  ['pickable_lines [2.5]', (p) => (p.pickable_lines = [2.5])],
  ['tests empty', (p) => (p.tests = [])],
  ['tests[0].input empty', (p) => (p.tests[0].input = [])],
  ['tests[0].input float', (p) => (p.tests[0].input = [[1.5]])],
  ['tests[0].input string', (p) => (p.tests[0].input = ['x'])],
  ['tests[0].input beyond int32', (p) => (p.tests[0].input = [[2147483648]])],
  ['tests[0].expected string', (p) => (p.tests[0].expected = 'x')],
  ['tests[0].actual null', (p) => (p.tests[0].actual = null)],
  ['missing failing_test.actual', (p) => delete p.failing_test.actual],
  ['visible_tests[0].expected float', (p) => (p.visible_tests[0].expected = 1.5)],
  ['1 step', (p) => (p.explanation.steps = p.explanation.steps.slice(0, 1))],
  ['5 steps', (p) => (p.explanation.steps = [0, 1, 2, 3, 4].map(() => ({ es: 'a', en: 'b' })))],
  ['step without en', (p) => (p.explanation.steps[0] = { es: 'x' })],
  ['spec as string', (p) => (p.spec = 'texto')],
  ['function_name with dash', (p) => (p.function_name = 'max-index')],
  ['function_name empty', (p) => (p.function_name = '')],
  ['function_name capitalized', (p) => (p.function_name = 'MaxIndex')],
  ['template empty', (p) => (p.template = '')],
  ['mutation.operator empty', (p) => (p.mutation.operator = '')],
  ['missing mutation.node', (p) => delete p.mutation.node],
  ['params float', (p) => (p.params = { k: 1.5 })],
  ['params array', (p) => (p.params = { k: [1] })],
  ['date with time', (p) => (p.date = '2026-11-20T00:00:00Z')],
  ['missing explanation', (p) => delete p.explanation],
];

const accepts: [string, (p: Record<string, any>) => void][] = [
  ['visible_tests empty', (p) => (p.visible_tests = [])],
  ['1 visible test', (p) => (p.visible_tests = p.visible_tests.slice(0, 1))],
  ['4 visible tests', (p) => (p.visible_tests = [...p.visible_tests, p.visible_tests[0]])],
  ['unsorted pickable_lines', (p) => (p.pickable_lines = [8, 2, 3, 4, 5])],
  ['repeated pickable_lines', (p) => (p.pickable_lines = [2, 2, 3])],
  ['bug_line outside pickable_lines', (p) => (p.bug_line = 6)],
  ['missing date', (p) => delete p.date],
  ['empty spec.es', (p) => (p.spec.es = '')],
  ['empty step.en', (p) => (p.explanation.steps[0].en = '')],
];

describe('payloadSchema', () => {
  it('accepts the fixtures (TS-5)', () => {
    for (const p of [PAYLOAD, PAYLOAD_BOOL]) {
      const r = payloadSchema.safeParse(p);
      expect(r.success).toBe(true);
      expect(r.data).toEqual(p);
    }
  });

  it.each(rejects)('rejects: %s (TS-6)', (_name, mutate) => {
    const p = clone();
    mutate(p);
    expect(payloadSchema.safeParse(p).success).toBe(false);
  });

  it.each(accepts)('leaves to verify: %s (TS-7)', (_name, mutate) => {
    const p = clone();
    mutate(p);
    expect(payloadSchema.safeParse(p).success).toBe(true);
  });

  it('drops unknown keys (TS-7)', () => {
    const r = payloadSchema.safeParse({ ...PAYLOAD, tree: {} });
    expect(r.success).toBe(true);
    expect(r.data).not.toHaveProperty('tree');
  });
});

describe('moveSchema', () => {
  it('accepts every well-formed move (TS-8)', () => {
    for (const language of CODE_LANGUAGES) {
      for (const line of [1, 4, 15, 99]) {
        const r = moveSchema.safeParse({ language, line });
        expect(r.success).toBe(true);
        expect(r.data).toEqual({ language, line });
      }
    }
  });

  it.each([
    { language: 'go', line: 0 },
    { language: 'go', line: -1 },
    { language: 'go', line: 4.5 },
    { language: 'go', line: '4' },
    { language: 'go', line: NaN },
    { language: 'python', line: 4 },
    { language: 'JS', line: 4 },
    { line: 4 },
    { language: 'js' },
    { language: 'js', line: 4, extra: 1 },
    null,
    {},
  ])('rejects %j (TS-9)', (m) => {
    expect(moveSchema.safeParse(m).success).toBe(false);
  });
});

describe('stateSchema', () => {
  it.each([{}, { language: 'go', line: 5 }])('accepts %j (TS-10)', (s) => {
    expect(stateSchema.parse(s)).toEqual(s);
  });

  it.each([
    { language: 'go' },
    { line: 5 },
    { language: 'go', line: 5, x: 1 },
    { language: 'rust', line: 5 },
    { language: 'go', line: 0 },
  ])('rejects %j (TS-10)', (s) => {
    expect(stateSchema.safeParse(s).success).toBe(false);
  });
});
