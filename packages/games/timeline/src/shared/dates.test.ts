import { describe, expect, it } from 'vitest';

import { allDistinguishable, compareChronological, distinguishable } from './dates';
import type { DatedFact } from './dates';

const f = (event_date: string, date_precision: DatedFact['date_precision']): DatedFact => ({
  event_date,
  date_precision,
});
const named = (id: string, label: string, d: DatedFact) => ({ id, label, ...d });

const FIXTURE = [
  named('1', 'Python', f('1991-02-20', 'day')),
  named('2', 'Java', f('1995-05-23', 'day')),
  named('3', 'Go', f('2009-01-01', 'year')),
  named('4', 'Docker', f('2013-03-20', 'day')),
  named('5', 'Kubernetes', f('2014-06-01', 'month')),
];
const TIGHT = [
  named('1', 'Python', f('1991-02-20', 'day')),
  named('2', 'Java', f('1995-05-23', 'day')),
  named('3', 'Go', f('2009-01-01', 'year')),
  named('4', 'Node.js', f('2009-05-01', 'month')),
  named('5', 'Docker', f('2013-03-20', 'day')),
];

describe('distinguishable', () => {
  it('different years are distinguishable (TS-4)', () => {
    expect(distinguishable(f('2009-01-01', 'year'), f('2010-01-01', 'year'))).toBe(true);
  });
  it('same year with year precision is not (TS-5)', () => {
    const a = f('2009-01-01', 'year');
    const b = f('2009-05-01', 'month');
    expect(distinguishable(a, b)).toBe(false);
    expect(distinguishable(b, a)).toBe(false);
  });
  it('same year with different months is (TS-6)', () => {
    expect(distinguishable(f('2009-05-01', 'month'), f('2009-09-01', 'month'))).toBe(true);
    expect(distinguishable(f('2009-05-01', 'month'), f('2009-09-14', 'day'))).toBe(true);
  });
  it('same month needs two days that differ (TS-7)', () => {
    expect(distinguishable(f('2009-05-01', 'month'), f('2009-05-20', 'day'))).toBe(false);
    expect(distinguishable(f('2009-05-10', 'day'), f('2009-05-20', 'day'))).toBe(true);
  });
  it('an identical date never is (TS-8)', () => {
    expect(distinguishable(f('2009-05-01', 'month'), f('2009-05-01', 'month'))).toBe(false);
    expect(distinguishable(f('1995-05-23', 'day'), f('1995-05-23', 'day'))).toBe(false);
    expect(distinguishable(f('2009-01-01', 'year'), f('2009-01-01', 'day'))).toBe(false);
  });
});

describe('allDistinguishable and compareChronological', () => {
  it('checks every pair and sorts by date (TS-9)', () => {
    expect(allDistinguishable(FIXTURE)).toBe(true);
    expect(allDistinguishable(TIGHT)).toBe(false);
    expect(
      [...FIXTURE]
        .reverse()
        .sort(compareChronological)
        .map((x) => x.label),
    ).toEqual(['Python', 'Java', 'Go', 'Docker', 'Kubernetes']);
  });
  it('breaks date ties by id', () => {
    const a = named('b', 'B', f('2000-01-01', 'year'));
    const b = named('a', 'A', f('2000-01-01', 'year'));
    expect([a, b].sort(compareChronological).map((x) => x.id)).toEqual(['a', 'b']);
  });
});
