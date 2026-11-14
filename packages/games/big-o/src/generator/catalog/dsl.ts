import type { DcWork, Shape } from './types';

export const C: Shape = { kind: 'constant' };
export const L: Shape = { kind: 'linear' };
export const D: Shape = { kind: 'dependent' };
export const DBL: Shape = { kind: 'doubling' };
export const DBL_OUTER: Shape = { kind: 'doubling', bound: 'outer' };
export const H: Shape = { kind: 'halving' };
export const H_OUTER: Shape = { kind: 'halving', bound: 'outer' };
export const BS: Shape = { kind: 'binary_search' };

/** `nest(a, b, c)` is `nest(a, nest(b, c))`. */
export function nest(first: Shape, ...rest: [Shape, ...Shape[]]): Shape {
  const [second, ...others] = rest;
  return {
    kind: 'nest',
    outer: first,
    inner: others.length === 0 ? second : nest(second, ...(others as [Shape, ...Shape[]])),
  };
}

export const seq = (...parts: [Shape, Shape, ...Shape[]]): Shape => ({ kind: 'seq', parts });

export const dc = (calls: 1 | 2 | 4, work: DcWork): Shape => ({
  kind: 'divide_and_conquer',
  calls,
  work,
});

export const doubleRecursion = (
  variant: 'n-1,n-2' | 'n-1,n-1',
  work: 'none' | 'constant' = 'none',
): Shape => ({ kind: 'double_recursion', variant, work });

export const permutations = (work: 'none' | 'inc' | 'constant' = 'none'): Shape => ({
  kind: 'permutations',
  work,
});
