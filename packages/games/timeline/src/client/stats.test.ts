import { describe, expect, it } from 'vitest';

import { bestCategory, categoryRates, formatPercent, gamesCount } from './stats';

const NBSP = '\u00a0';
const FIXTURE = {
  by_category: {
    programming_languages: { played: 5, correct: 4 },
    companies: { played: 5, correct: 2 },
    hardware: { played: 5, correct: 4 },
  },
};

describe('timeline stats', () => {
  it('lists every category in catalog order with its rate (TS-10)', () => {
    const rows = categoryRates(FIXTURE);
    expect(rows.map((r) => r.category)).toEqual([
      'programming_languages',
      'frameworks',
      'companies',
      'operating_systems',
      'hardware',
      'video_games',
      'databases',
      'software_tools',
    ]);
    expect(rows.map((r) => r.rate)).toEqual([0.8, null, 0.4, null, 0.8, null, null, null]);
    expect(rows[0]).toEqual({
      category: 'programming_languages',
      played: 5,
      correct: 4,
      rate: 0.8,
    });
    expect(rows[1]).toEqual({ category: 'frameworks', played: 0, correct: 0, rate: null });
    expect(gamesCount(FIXTURE)).toBe(15);
  });

  it('breaks a tie with the first category of the catalog (TS-11)', () => {
    expect(bestCategory(FIXTURE)).toBe('programming_languages');
  });

  it('picks the single best category (TS-12)', () => {
    expect(
      bestCategory({
        by_category: {
          frameworks: { played: 2, correct: 1 },
          databases: { played: 3, correct: 3 },
        },
      }),
    ).toBe('databases');
  });

  it('has no best category and null rates without milestones (TS-13)', () => {
    expect(bestCategory({ by_category: {} })).toBeNull();
    const rows = categoryRates({ by_category: {} });
    expect(rows).toHaveLength(8);
    expect(rows.every((r) => r.played === 0 && r.rate === null)).toBe(true);
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
    const first = [categoryRates(input), bestCategory(input)];
    expect([categoryRates(input), bestCategory(input)]).toEqual(first);
    expect(input).toEqual(FIXTURE);
  });
});
