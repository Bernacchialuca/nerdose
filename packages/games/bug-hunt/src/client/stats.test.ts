import { describe, expect, it } from 'vitest';

import { bugTypeRates, formatPercent, gamesCount, languageRates } from './stats';

const NBSP = '\u00a0';
const FIXTURE = {
  by_language: { js: { played: 10, correct: 8 }, java: { played: 8, correct: 5 } },
  by_bug_type: {
    off_by_one: { played: 6, correct: 5 },
    comparison: { played: 4, correct: 2 },
    inverted_condition: { played: 8, correct: 6 },
  },
};

describe('bug-hunt stats', () => {
  it('lists languages and bug types in catalog order (TS-21)', () => {
    const languages = languageRates(FIXTURE);
    expect(languages.map((r) => r.language)).toEqual(['js', 'go', 'java']);
    expect(languages.map((r) => r.rate)).toEqual([0.8, null, 0.625]);
    const types = bugTypeRates(FIXTURE);
    expect(types.map((r) => r.bugType)).toEqual([
      'off_by_one',
      'comparison',
      'wrong_operator',
      'wrong_variable',
      'bad_initialization',
      'misplaced_return',
      'inverted_condition',
    ]);
    expect(types.map((r) => r.rate)).toEqual([5 / 6, 0.5, null, null, null, null, 0.75]);
    expect(gamesCount(FIXTURE)).toBe(18);
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
    const first = [languageRates(input), bugTypeRates(input)];
    expect([languageRates(input), bugTypeRates(input)]).toEqual(first);
    expect(input).toEqual(FIXTURE);
  });
});
