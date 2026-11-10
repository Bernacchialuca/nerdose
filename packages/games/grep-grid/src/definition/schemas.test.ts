import { describe, expect, it } from 'vitest';

import { moveSchema, payloadSchema, stateSchema } from './schemas';
import { PAYLOAD, S0 } from './test-fixtures';

const select = { type: 'select', from: { row: 3, col: 2 }, to: { row: 3, col: 7 } };

describe('moveSchema', () => {
  it('accepts select and give_up (TS-12)', () => {
    for (const m of [select, { type: 'give_up' }]) {
      const r = moveSchema.safeParse(m);
      expect(r.success).toBe(true);
      expect(r.data).toEqual(m);
    }
  });
  it('rejects coordinates out of 0-11 or non-integer (TS-13)', () => {
    for (const m of [
      { ...select, from: { row: 12, col: 0 } },
      { ...select, from: { row: 0, col: -1 } },
      { ...select, to: { row: 1.5, col: 2 } },
    ]) {
      expect(moveSchema.safeParse(m).success).toBe(false);
    }
  });
  it('rejects invalid shapes (TS-14)', () => {
    for (const m of [
      { type: 'select', from: { row: 3, col: 2 } },
      { type: 'other' },
      {},
      { type: 'select', from: 'a', to: 'b' },
    ]) {
      expect(moveSchema.safeParse(m).success).toBe(false);
    }
  });
});

describe('payloadSchema (TS-15)', () => {
  it('accepts the fixture', () => {
    expect(payloadSchema.safeParse(PAYLOAD).success).toBe(true);
  });
  it.each([
    ['11 rows', { ...PAYLOAD, grid: PAYLOAD.grid.slice(0, 11) }],
    [
      'lowercase cell',
      { ...PAYLOAD, grid: [['a', ...PAYLOAD.grid[0]!.slice(1)], ...PAYLOAD.grid.slice(1)] },
    ],
    ['7 words', { ...PAYLOAD, words: PAYLOAD.words.slice(0, 7) }],
    [
      'bad direction',
      {
        ...PAYLOAD,
        placements: [
          { ...PAYLOAD.placements[0]!, direction: 'left' },
          ...PAYLOAD.placements.slice(1),
        ],
      },
    ],
    [
      'missing en',
      {
        ...PAYLOAD,
        words: [{ ...PAYLOAD.words[0]!, definition: { es: 'x' } }, ...PAYLOAD.words.slice(1)],
      },
    ],
    ['bad date', { ...PAYLOAD, date: '2026/12/02' }],
  ])('rejects %s', (_n, p) => {
    expect(payloadSchema.safeParse(p).success).toBe(false);
  });
});

describe('stateSchema (TS-16)', () => {
  it('requires gave_up', () => {
    expect(() => stateSchema.parse(S0)).not.toThrow();
    expect(stateSchema.safeParse({ found_words: [] }).success).toBe(false);
  });
});
