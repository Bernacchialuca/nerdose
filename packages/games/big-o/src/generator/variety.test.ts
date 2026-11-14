import { describe, expect, it } from 'vitest';

import { D, recent as r } from './test-fixtures';
import { answerWouldRepeat, eligibleRecipes, recipesUsedNear } from './variety';

describe('recipesUsedNear', () => {
  it('covers [D - 29, D + 29] without the row of D (TS-23)', () => {
    const rec = [
      r('2027-02-14', 'linear'),
      r('2027-02-13', 'halving'),
      r('2027-04-13', 'doubling'),
      r('2027-04-14', 'constant'),
      r('2027-03-15', 'binary_search'),
    ];
    expect(recipesUsedNear(D, rec)).toEqual(new Set(['linear', 'doubling']));
  });
});

describe('answerWouldRepeat', () => {
  const on = (...dates: string[]) => dates.map((d) => r(d, 'linear'));
  it('detects the three runs around D (TS-23)', () => {
    expect(answerWouldRepeat('o_n', D, on('2027-03-14', '2027-03-13'))).toBe(true);
    expect(answerWouldRepeat('o_n', D, on('2027-03-14', '2027-03-16'))).toBe(true);
    expect(answerWouldRepeat('o_n', D, on('2027-03-16', '2027-03-17'))).toBe(true);
    expect(answerWouldRepeat('o_n', D, on('2027-03-14'))).toBe(false);
    expect(answerWouldRepeat('o_n', D, on('2027-03-13', '2027-03-16'))).toBe(false);
    expect(answerWouldRepeat('o_n2', D, on('2027-03-14', '2027-03-13'))).toBe(false);
  });

  it('ignores the row of D', () => {
    expect(answerWouldRepeat('o_n', D, on('2027-03-15', '2027-03-14'))).toBe(false);
  });
});

describe('eligibleRecipes', () => {
  it('is ordered by id and drops used recipes and repeated answers', () => {
    const all = eligibleRecipes(D, []);
    expect(all.map((x) => x.id)).toEqual([...all.map((x) => x.id)].sort());
    const some = eligibleRecipes(D, [
      r('2027-03-14', 'linear'),
      r('2027-03-13', 'seq(linear,linear)'),
    ]);
    expect(some.some((x) => x.id === 'linear')).toBe(false);
    expect(some.some((x) => x.answer === 'o_n')).toBe(false);
  });
});
