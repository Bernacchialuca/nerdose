import { rngFrom, type Rng } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { MAX_REDRAWS, drawInitialOrder, drawOpaqueIds, shuffle } from './opaque';
import { seed } from './test-fixtures';

const scripted = (values: number[]): Rng => {
  let k = 0;
  const int = (from: number, to: number): number => {
    const v = values[k++ % values.length] as number;
    return Math.min(to, Math.max(from, v));
  };
  return { next: () => 0, int, pick: (items) => items[int(0, items.length - 1)] as never };
};

describe('opaque ids and shuffle', () => {
  it('draws 5 unique ids of 6 [a-z0-9] whose alphabetical order differs', () => {
    for (let n = 1; n <= 200; n++) {
      const ids = drawOpaqueIds(rngFrom(seed(n)));
      expect(new Set(ids).size).toBe(5);
      expect(ids.every((id) => /^[a-z0-9]{6}$/.test(id))).toBe(true);
      expect([...ids].sort()).not.toEqual(ids);
    }
  });

  it('redraws a round whose alphabetical order matches (TS-51)', () => {
    // Ronda 1: ids ascendentes (a..e repetidos), ronda 2: el primero es el mayor.
    const asc = [0, 1, 2, 3, 4].flatMap((v) => Array(6).fill(v) as number[]);
    const desc = [4, 3, 2, 1, 0].flatMap((v) => Array(6).fill(v) as number[]);
    const ids = drawOpaqueIds(scripted([...asc, ...desc]));
    expect(ids[0]).toBe('eeeeee');
  });

  it('skips a duplicated id within a round', () => {
    const dup = [...Array(6).fill(0), ...Array(6).fill(0), ...Array(6).fill(1)] as number[];
    const rest = [2, 3, 4].flatMap((v) => Array(6).fill(v) as number[]);
    const ids = drawOpaqueIds(scripted([...dup, ...rest, ...Array(30).fill(0)]));
    expect(new Set(ids).size).toBe(5);
  });

  it('gives up after MAX_REDRAWS and returns the last round', () => {
    const asc = [0, 1, 2, 3, 4].flatMap((v) => Array(6).fill(v) as number[]);
    const ids = drawOpaqueIds(scripted(asc));
    expect(MAX_REDRAWS).toBe(10);
    expect([...ids].sort()).toEqual(ids);
  });

  it('initial order is never the identity and does not mutate (TS-51)', () => {
    for (let n = 1; n <= 200; n++) {
      expect(drawInitialOrder(rngFrom(seed(n)))).not.toEqual([0, 1, 2, 3, 4]);
    }
    const src = [1, 2, 3];
    shuffle(src, rngFrom(seed(1)));
    expect(src).toEqual([1, 2, 3]);
  });
});
