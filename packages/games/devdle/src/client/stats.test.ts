import { describe, expect, it } from 'vitest';

import { distributionRows, formatPercent, gamesCount } from './stats';

const NBSP = '\u00a0';
const FIXTURE = { guesses: { '1': 1, '2': 3, '3': 5, '4': 4, '5': 2, '6': 1 }, losses: 5 };

describe('devdle stats', () => {
  it('lists rows in order 1..6 then X (TS-1)', () => {
    expect(distributionRows(FIXTURE)).toEqual([
      { label: '1', count: 1 },
      { label: '2', count: 3 },
      { label: '3', count: 5 },
      { label: '4', count: 4 },
      { label: '5', count: 2 },
      { label: '6', count: 1 },
      { label: 'X', count: 5 },
    ]);
    expect(gamesCount(FIXTURE)).toBe(21);
  });

  it('formats percentages by locale and shows a dash without games (TS-25)', () => {
    expect(formatPercent(0.42, 'es')).toBe(`42${NBSP}%`);
    expect(formatPercent(0.42, 'en')).toBe('42%');
    expect(formatPercent(0.425, 'es')).toBe(`43${NBSP}%`);
    expect(formatPercent(0, 'es')).toBe(`0${NBSP}%`);
    expect(formatPercent(1, 'en')).toBe('100%');
    expect(formatPercent(null, 'en')).toBe('—');
  });

  it('is pure: does not mutate its input and is deterministic (TS-26)', () => {
    const input = structuredClone(FIXTURE);
    const first = distributionRows(input);
    expect(distributionRows(input)).toEqual(first);
    expect(input).toEqual(FIXTURE);
  });
});
