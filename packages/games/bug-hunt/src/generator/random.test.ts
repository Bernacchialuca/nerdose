import { rngFrom } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { randomArray, shuffle } from './random';
import { seed } from './test-fixtures';

describe('shuffle', () => {
  it('is deterministic, a permutation, and does not mutate its input', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const copy = [...items];
    const a = shuffle(items, rngFrom(seed(1)));
    const b = shuffle(items, rngFrom(seed(1)));
    expect(a).toEqual(b);
    expect([...a].sort((x, y) => x - y)).toEqual(items);
    expect(items).toEqual(copy);
  });
});

describe('randomArray', () => {
  it('stays inside the length and value ranges', () => {
    const rng = rngFrom(seed(2));
    let sawNarrow = false;
    let sawWide = false;
    for (let i = 0; i < 1000; i++) {
      const a = randomArray(rng, 0, 7);
      expect(a.length).toBeGreaterThanOrEqual(0);
      expect(a.length).toBeLessThanOrEqual(7);
      for (const v of a) {
        expect(v).toBeGreaterThanOrEqual(-9);
        expect(v).toBeLessThanOrEqual(20);
        if (v < 0 || v > 6) sawWide = true;
      }
      if (a.length > 0 && a.every((v) => v >= 0 && v <= 6)) sawNarrow = true;
    }
    expect(sawNarrow && sawWide).toBe(true);
  });
});
