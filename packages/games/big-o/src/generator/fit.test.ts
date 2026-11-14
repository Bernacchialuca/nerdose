import { describe, expect, it } from 'vitest';

import { BIG_O_OPTIONS } from '@nerdose/core';

import { buildRecipe } from './catalog/build';
import { paramCombos } from './catalog/params';
import { RECIPES } from './catalog/recipes';
import {
  EXP_BASE_MAX,
  EXP_BASE_MIN,
  FIT_MAX_CV,
  FIT_MIN_SECOND_CV,
  FIT_MIN_SEPARATION,
  fitCounts,
  formatFit,
} from './fit';
import { SCALE } from './scale';

const L = SCALE.o_n;
const Q = SCALE.o_n2;
const E = SCALE.o_2n;
const COUNTS_NLOGN = [2048, 4608, 10240, 22528, 49152, 106496, 229376, 491520, 1048576];

describe('fit constants', () => {
  it('fixes the thresholds (TS-3)', () => {
    expect([FIT_MAX_CV, FIT_MIN_SECOND_CV, FIT_MIN_SEPARATION, EXP_BASE_MIN, EXP_BASE_MAX]).toEqual(
      [0.1, 0.1, 2, 1.55, 2.05],
    );
  });
});

describe('fitCounts on pure classes', () => {
  const cases = [
    [
      'a o_n',
      L,
      [256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536],
      'o_n',
      'o_n_log_n',
      0.2278,
    ],
    ['b o_n_log_n', L, COUNTS_NLOGN, 'o_n_log_n', 'o_n', 0.2152],
    [
      'c o_n2',
      Q,
      [4096, 16384, 65536, 262144, 1048576, 4194304, 16777216],
      'o_n2',
      'o_n_log_n',
      1.0406,
    ],
    ['d 2^n', E, E.map((n) => 2 ** n), 'o_2n', 'o_n3', 1.349],
    [
      'e phi^n',
      E,
      [123, 199, 322, 521, 843, 1364, 2207, 3571, 5778, 9349, 15127],
      'o_2n',
      'o_n3',
      0.8669,
    ],
  ] as const;

  it.each(cases)('%s (TS-4)', (_n, ns, counts, best, second, secondCv) => {
    const fit = fitCounts(ns, counts);
    expect(fit.verdict).toBe('ok');
    expect(fit.best.option).toBe(best);
    expect(fit.best.cv).toBeCloseTo(0, 3);
    expect(fit.second.option).toBe(second);
    expect(fit.second.cv).toBeCloseTo(secondCv, 3);
    expect(fit.models.map((m) => m.option).sort()).toEqual([...BIG_O_OPTIONS].sort());
    const cvs = fit.models.map((m) => m.cv);
    cvs.slice(1).forEach((cv, i) => expect(cv).toBeGreaterThanOrEqual((cvs[i] ?? 0) - 1e-9));
  });

  it('fits the exponential base (TS-4)', () => {
    expect(
      fitCounts(
        E,
        E.map((n) => 2 ** n),
      ).base,
    ).toBeCloseTo(2.0, 3);
    expect(
      fitCounts(E, [123, 199, 322, 521, 843, 1364, 2207, 3571, 5778, 9349, 15127]).base,
    ).toBeCloseTo(1.618, 3);
    expect(fitCounts(L, [256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536]).base).toBe(1.55);
  });
});

describe('fitCounts on synthetic series', () => {
  it('discards n vs n log n as ambiguous (TS-5)', () => {
    const fit = fitCounts(L, [588, 1233, 2572, 5344, 11067, 22854, 47084, 96802, 198668]);
    expect(fit.verdict).toBe('ambiguous_fit');
    expect(fit.best.option).toBe('o_n');
    expect(fit.best.cv).toBeCloseTo(0.0879, 3);
    expect(fit.second.option).toBe('o_n_log_n');
    expect(fit.second.cv).toBeCloseTo(0.1355, 3);
  });

  it('discards series that fit nothing (TS-6)', () => {
    const a = fitCounts(L, [724, 1536, 3238, 6792, 14189, 29537, 61303, 126910, 262144]);
    expect(a.verdict).toBe('poor_fit');
    expect([a.best.option, a.second.option]).toEqual(['o_n', 'o_n_log_n']);
    expect(a.best.cv).toBeCloseTo(0.1095, 3);
    expect(a.second.cv).toBeCloseTo(0.1127, 3);

    const b = fitCounts(
      Q,
      Q.map((n) => Math.round(n ** 2.5)),
    );
    expect(b.verdict).toBe('poor_fit');
    expect([b.best.option, b.second.option]).toEqual(['o_n2', 'o_n3']);
    expect(b.best.cv).toBeCloseTo(0.6587, 3);
    expect(b.second.cv).toBeCloseTo(0.6587, 3);

    const c = fitCounts(
      E,
      E.map((n) => Math.round(1.3 ** n)),
    );
    expect(c.verdict).toBe('poor_fit');
    expect(c.best.option).toBe('o_n3');
    expect(c.best.cv).toBeCloseTo(0.2034, 3);

    const d = fitCounts(
      E,
      E.map((n) => Math.round(2.5 ** n)),
    );
    expect(d.verdict).toBe('poor_fit');
    expect(d.best.option).toBe('o_2n');
    expect(d.best.cv).toBeCloseTo(0.6036, 3);
    expect(d.base).toBe(2.05);
  });

  it('accepts a series just past the separation (TS-7)', () => {
    const fit = fitCounts(L, [478, 990, 2043, 4205, 8632, 17684, 36162, 73838, 150562]);
    expect(fit.verdict).toBe('ok');
    expect(fit.best.option).toBe('o_n');
    expect(fit.best.cv).toBeCloseTo(0.066, 3);
    expect(fit.second.option).toBe('o_n_log_n');
    expect(fit.second.cv).toBeCloseTo(0.1587, 3);
  });
});

describe('fitCounts invariants', () => {
  it('throws RangeError (TS-8)', () => {
    expect(() => fitCounts([256, 512], [1, 2, 3])).toThrow('big-o: fit_length_mismatch');
    expect(() => fitCounts([256, 512], [1, 2])).toThrow('big-o: fit_too_few_points');
    expect(() => fitCounts(L, [0, ...COUNTS_NLOGN.slice(1)])).toThrow('big-o: fit_non_positive');
    expect(() => fitCounts(L, [0, ...COUNTS_NLOGN.slice(1)])).toThrow(RangeError);
  });

  it('does not mutate its arguments and is deterministic', () => {
    const counts = [...COUNTS_NLOGN];
    const ns = [...L];
    expect(fitCounts(ns, counts)).toEqual(fitCounts(ns, counts));
    expect(counts).toEqual(COUNTS_NLOGN);
    expect(ns).toEqual([...L]);
  });

  it('formats the fit_quality detail', () => {
    expect(formatFit(fitCounts(L, COUNTS_NLOGN))).toMatch(
      /^cv o_n_log_n=0\.0000 o_n=0\.2152 .* b=1\.550$/,
    );
  });
});

describe('the whole catalog fits without running', () => {
  it('every recipe and params combination fits its answer (TS-9)', () => {
    let combos = 0;
    let maxBest = 0;
    for (const r of RECIPES) {
      for (const p of paramCombos(r)) {
        combos++;
        const built = buildRecipe(r, p);
        const ns = SCALE[r.answer];
        const fit = fitCounts(
          ns,
          ns.map((n) => built.cost(n)),
        );
        const label = `${r.id} ${JSON.stringify(p)}`;
        expect(fit.verdict, label).toBe('ok');
        expect(fit.best.option, label).toBe(r.answer);
        expect(fit.second.cv, label).toBeGreaterThanOrEqual(
          Math.max(FIT_MIN_SEPARATION * fit.best.cv, FIT_MIN_SECOND_CV),
        );
        maxBest = Math.max(maxBest, fit.best.cv);
      }
    }
    expect(combos).toBe(139);
    expect(maxBest).toBeLessThan(FIT_MAX_CV);
  });
});
