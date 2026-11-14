import { BIG_O_OPTIONS, type BigOOption } from '@nerdose/core';

export const FIT_MAX_CV = 0.1;
export const FIT_MIN_SECOND_CV = 0.1;
export const FIT_MIN_SEPARATION = 2;
export const EXP_BASE_MIN = 1.55;
export const EXP_BASE_MAX = 2.05;

const TIE_EPSILON = 1e-9;
const MIN_POINTS = 3;

export type ModelFit = { option: BigOOption; cv: number };
export type FitVerdict = 'ok' | 'poor_fit' | 'ambiguous_fit';
export type FitResult = {
  models: ModelFit[];
  best: ModelFit;
  second: ModelFit;
  base: number;
  verdict: FitVerdict;
};

/** Natural log of `n!`, summed so it never overflows. */
const lnFactorial = (n: number): number => {
  let sum = 0;
  for (let i = 2; i <= n; i++) sum += Math.log(i);
  return sum;
};

/** Least-squares slope of `ln c` against `n`; `exp(slope)` is the base of an exponential fit. */
function expBase(ns: readonly number[], lnCounts: readonly number[]): number {
  const k = ns.length;
  const meanN = ns.reduce((a, b) => a + b, 0) / k;
  const meanY = lnCounts.reduce((a, b) => a + b, 0) / k;
  let num = 0;
  let den = 0;
  for (let i = 0; i < k; i++) {
    const dn = (ns[i] ?? 0) - meanN;
    num += dn * ((lnCounts[i] ?? 0) - meanY);
    den += dn * dn;
  }
  return Math.min(EXP_BASE_MAX, Math.max(EXP_BASE_MIN, Math.exp(num / den)));
}

function lnModel(option: BigOOption, n: number, base: number): number {
  switch (option) {
    case 'o_1':
      return 0;
    case 'o_log_n':
      return Math.log(Math.log2(n));
    case 'o_n':
      return Math.log(n);
    case 'o_n_log_n':
      return Math.log(n * Math.log2(n));
    case 'o_n2':
      return 2 * Math.log(n);
    case 'o_n3':
      return 3 * Math.log(n);
    case 'o_2n':
      return n * Math.log(base);
    case 'o_n_fact':
      return lnFactorial(n);
  }
}

/** Coefficient of variation of `c / g` for one model, in log space so nothing overflows. */
function coefficientOfVariation(lr: readonly number[]): number {
  const top = Math.max(...lr);
  const r = lr.map((v) => Math.exp(v - top));
  const mean = r.reduce((a, b) => a + b, 0) / r.length;
  const variance = r.reduce((a, b) => a + (b - mean) ** 2, 0) / r.length;
  return Math.sqrt(variance) / mean;
}

/**
 * Fits the counts measured at `ns` against the 8 classes. The best model is the one with the lowest
 * CV; the verdict asks it to fit well and to beat the second one by a margin.
 */
export function fitCounts(ns: readonly number[], counts: readonly number[]): FitResult {
  if (ns.length !== counts.length) throw new RangeError('big-o: fit_length_mismatch');
  if (ns.length < MIN_POINTS) throw new RangeError('big-o: fit_too_few_points');
  if (counts.some((c) => !Number.isInteger(c) || c < 1)) {
    throw new RangeError('big-o: fit_non_positive');
  }

  const lnCounts = counts.map((c) => Math.log(c));
  const base = expBase(ns, lnCounts);
  const models = BIG_O_OPTIONS.map((option, index) => ({
    option,
    index,
    cv: coefficientOfVariation(lnCounts.map((lc, i) => lc - lnModel(option, ns[i] ?? 1, base))),
  }))
    .sort((a, b) => (Math.abs(a.cv - b.cv) <= TIE_EPSILON ? a.index - b.index : a.cv - b.cv))
    .map(({ option, cv }) => ({ option, cv }));

  const best = models[0] as ModelFit;
  const second = models[1] as ModelFit;
  let verdict: FitVerdict = 'ok';
  if (best.cv > FIT_MAX_CV) verdict = 'poor_fit';
  else if (second.cv < Math.max(FIT_MIN_SEPARATION * best.cv, FIT_MIN_SECOND_CV)) {
    verdict = 'ambiguous_fit';
  }
  return { models, best, second, base, verdict };
}

/** The `cv <op>=<cv> … b=<b>` part of the `fit_quality` detail. */
export function formatFit(fit: FitResult): string {
  const cvs = fit.models.map((m) => `${m.option}=${m.cv.toFixed(4)}`).join(' ');
  return `cv ${cvs} b=${fit.base.toFixed(3)}`;
}
