import { describe, expect, it } from 'vitest';

import { averageWords, formatAverage, formatPercent, gamesCount, perfectRate } from './stats';

const NBSP = '\u00a0';
const FIXTURE = {
  words_found: { '0': 0, '1': 0, '2': 0, '3': 1, '4': 1, '5': 2, '6': 1, '7': 2, '8': 5 },
};
const EMPTY = {
  words_found: { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0 },
};

describe('grep-grid stats', () => {
  it('derives average, 8/8 rate and games count (TS-5)', () => {
    expect(averageWords(FIXTURE)).toBeCloseTo(77 / 12);
    expect(perfectRate(FIXTURE)).toBeCloseTo(5 / 12);
    expect(gamesCount(FIXTURE)).toBe(12);
  });

  it('returns null without games (TS-6)', () => {
    expect(averageWords(EMPTY)).toBeNull();
    expect(perfectRate(EMPTY)).toBeNull();
    expect(formatPercent(null, 'es')).toBe('—');
    expect(formatAverage(null, 'es')).toBe('—');
  });

  it('formats percentages and averages by locale (TS-25)', () => {
    expect(formatPercent(0.42, 'es')).toBe(`42${NBSP}%`);
    expect(formatPercent(0.42, 'en')).toBe('42%');
    expect(formatPercent(0.425, 'es')).toBe(`43${NBSP}%`);
    expect(formatPercent(0, 'es')).toBe(`0${NBSP}%`);
    expect(formatPercent(1, 'en')).toBe('100%');
    expect(formatPercent(null, 'en')).toBe('—');
    expect(formatAverage(77 / 12, 'es')).toBe('6,4');
    expect(formatAverage(77 / 12, 'en')).toBe('6.4');
    expect(formatAverage(8, 'es')).toBe('8,0');
  });

  it('is pure: does not mutate its input and is deterministic (TS-26)', () => {
    const input = structuredClone(FIXTURE);
    const first = [averageWords(input), perfectRate(input), gamesCount(input)];
    expect([averageWords(input), perfectRate(input), gamesCount(input)]).toEqual(first);
    expect(input).toEqual(FIXTURE);
  });
});
