/* eslint-disable @typescript-eslint/no-explicit-any -- mutaciones deliberadas de payloads malformados */
import { describe, expect, it } from 'vitest';

import { moveSchema, payloadSchema, stateSchema } from './schemas';
import { CORRECT, PAYLOAD } from './test-fixtures';

const clone = () => structuredClone(PAYLOAD) as Record<string, any>;

describe('payloadSchema', () => {
  it('accepts the fixture (TS-14)', () => {
    expect(payloadSchema.safeParse(PAYLOAD).success).toBe(true);
  });

  const mutations: [string, (p: Record<string, any>) => void][] = [
    ['4 items', (p) => p.items.pop()],
    ['6 correct_order', (p) => p.correct_order.push('x00000')],
    ['uppercase opaque_id', (p) => (p.items[0].opaque_id = 'G2N5W3')],
    ['unknown precision', (p) => (p.items[0].date_precision = 'week')],
    ['partial note', (p) => (p.items[0].note = { es: 'x' })],
    ['string prompt', (p) => (p.prompt = 'x')],
    ['unknown item category', (p) => (p.items[0].category = 'internet')],
    ['item without category', (p) => delete p.items[0].category],
    ['bad date', (p) => (p.date = '2026/12/02')],
    ['bad event_date', (p) => (p.items[0].event_date = '2009')],
  ];
  it.each(mutations)('rejects %s (TS-14)', (_n, mutate) => {
    const p = clone();
    mutate(p);
    expect(payloadSchema.safeParse(p).success).toBe(false);
  });
});

describe('moveSchema', () => {
  it('accepts a permutation of 5 (TS-15)', () => {
    for (const order of [CORRECT, ['a', 'b', 'c', 'd', 'e']]) {
      const r = moveSchema.safeParse({ order });
      expect(r.success).toBe(true);
      expect(r.data).toEqual({ order });
    }
  });
  it.each([
    ['4 ids', { order: CORRECT.slice(0, 4) }],
    ['6 ids', { order: [...CORRECT, 'x00000'] }],
    ['repeated', { order: ['p7k2m9', 'p7k2m9', 'g2n5w3', 'd9r6t0', 'k1v3s8'] }],
    ['numbers', { order: [1, 2, 3, 4, 5] }],
    ['missing order', {}],
    ['extra key', { order: CORRECT, extra: 1 }],
  ])('rejects %s (TS-16)', (_n, input) => {
    expect(moveSchema.safeParse(input).success).toBe(false);
  });
});

describe('stateSchema', () => {
  it('accepts empty and confirmed states, rejects the rest (TS-17)', () => {
    expect(stateSchema.parse({})).toEqual({});
    expect(stateSchema.parse({ order: CORRECT })).toEqual({ order: CORRECT });
    expect(stateSchema.safeParse({ order: CORRECT.slice(0, 4) }).success).toBe(false);
    expect(stateSchema.safeParse({ order: CORRECT, x: 1 }).success).toBe(false);
  });
});
