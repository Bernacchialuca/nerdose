import { describe, expect, it } from 'vitest';

import { categoryRates, formatPercent, gamesCount } from './stats';

const NBSP = '\u00a0';
const FIXTURE = {
  by_category: { simple_loops: { played: 10, correct: 9 }, recursion: { played: 4, correct: 1 } },
};

describe('big-o stats', () => {
  it('lists every recipe category in catalog order (TS-17)', () => {
    expect(categoryRates(FIXTURE)).toEqual([
      { category: 'simple_loops', played: 10, correct: 9, rate: 0.9 },
      { category: 'nested_loops', played: 0, correct: 0, rate: null },
      { category: 'recursion', played: 4, correct: 1, rate: 0.25 },
      { category: 'divide_and_conquer', played: 0, correct: 0, rate: null },
      { category: 'binary_search', played: 0, correct: 0, rate: null },
    ]);
    expect(gamesCount(FIXTURE)).toBe(14);
  });

  it('formats percentages by locale (TS-25)', () => {
    expect(formatPercent(0.42, 'es')).toBe(`42${NBSP}%`);
    expect(formatPercent(0.42, 'en')).toBe('42%');
    expect(formatPercent(0.425, 'es')).toBe(`43${NBSP}%`);
    expect(formatPercent(0, 'es')).toBe(`0${NBSP}%`);
    expect(formatPercent(1, 'en')).toBe('100%');
    expect(formatPercent(null, 'en')).toBe('—');
  });

  it('is pure: does not mutate its input and is deterministic (TS-26)', () => {
    const input = structuredClone(FIXTURE);
    const first = categoryRates(input);
    expect(categoryRates(input)).toEqual(first);
    expect(input).toEqual(FIXTURE);
  });
});
