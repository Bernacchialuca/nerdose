/* eslint-disable @typescript-eslint/no-explicit-any -- mutaciones deliberadas de payloads malformados */
import { BIG_O_OPTIONS, CODE_LANGUAGES } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { moveSchema, payloadSchema, stateSchema } from './schemas';
import { PAYLOAD, PAYLOAD_RECURSION } from './test-fixtures';

const clone = () => structuredClone(PAYLOAD) as Record<string, any>;

const mutations: [string, (p: Record<string, any>) => void][] = [
  ['answer fuera de las 8', (p) => (p.answer = 'o_n4')],
  ['recipe_category desconocida', (p) => (p.recipe_category = 'sorting')],
  ['falta code.java', (p) => delete p.code.java],
  ['code.js vacío', (p) => (p.code.js = '')],
  ['recipe vacío', (p) => (p.recipe = '')],
  ['1 step', (p) => (p.explanation.steps = p.explanation.steps.slice(0, 1))],
  ['7 steps', (p) => (p.explanation.steps = Array(7).fill(p.explanation.steps[0]))],
  ['step sin en', (p) => (p.explanation.steps[0] = { es: 'x' })],
  ['line 0', (p) => (p.explanation.line_notes[0].line = 0)],
  ['line 1.5', (p) => (p.explanation.line_notes[0].line = 1.5)],
  ['tip string', (p) => (p.explanation.tip = 'texto')],
  ['example.ops 0', (p) => (p.explanation.example.ops = 0)],
  ['example.n 0', (p) => (p.explanation.example.n = 0)],
  ['trap_option igual a answer', (p) => (p.trap_option = 'o_n_log_n')],
  ['trap_option fuera de las 8', (p) => (p.trap_option = 'o_n4')],
  ['trap_option null con trap_ops', (p) => (p.trap_option = null)],
  ['falta explanation', (p) => delete p.explanation],
];

describe('payloadSchema', () => {
  it('accepts the fixtures (TS-5)', () => {
    for (const p of [PAYLOAD, PAYLOAD_RECURSION]) {
      const r = payloadSchema.safeParse(p);
      expect(r.success).toBe(true);
      expect(r.data).toEqual(p);
    }
  });

  it.each(mutations)('rejects: %s (TS-6)', (_name, mutate) => {
    const p = clone();
    mutate(p);
    expect(payloadSchema.safeParse(p).success).toBe(false);
  });
});

describe('payloadSchema date', () => {
  it('is optional and kept when present (TS-1)', () => {
    expect('date' in payloadSchema.parse(PAYLOAD)).toBe(false);
    expect(payloadSchema.parse({ ...PAYLOAD, date: '2027-03-15' }).date).toBe('2027-03-15');
    for (const date of ['2027-3-15', 20270315]) {
      const r = payloadSchema.safeParse({ ...PAYLOAD, date });
      expect(r.success).toBe(false);
      expect(r.error?.issues[0]?.path).toEqual(['date']);
    }
  });
});

describe('moveSchema', () => {
  it('accepts every valid move (TS-7)', () => {
    for (const language of CODE_LANGUAGES) {
      for (const option of BIG_O_OPTIONS) {
        const r = moveSchema.safeParse({ language, option });
        expect(r.success).toBe(true);
        expect(r.data).toEqual({ language, option });
      }
    }
  });

  it.each([
    { language: 'go', option: 'o_n4' },
    { language: 'python', option: 'o_n' },
    { option: 'o_n' },
    { language: 'js' },
    { language: 'js', option: 'o_n', extra: 1 },
    { language: 'JS', option: 'o_n' },
    { language: 'js', option: 'O_N' },
    { language: 'js', option: 3 },
    null,
    {},
  ])('rejects %j (TS-8)', (input) => {
    expect(moveSchema.safeParse(input).success).toBe(false);
  });
});

describe('stateSchema', () => {
  it.each([{}, { language: 'go', option: 'o_n2' }])('accepts %j (TS-9)', (s) => {
    expect(stateSchema.parse(s)).toEqual(s);
  });

  it.each([
    { language: 'go' },
    { option: 'o_n2' },
    { language: 'go', option: 'o_n2', x: 1 },
    { language: 'rust', option: 'o_n2' },
  ])('rejects %j (TS-9)', (s) => {
    expect(stateSchema.safeParse(s).success).toBe(false);
  });
});
