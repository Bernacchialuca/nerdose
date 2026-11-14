import type { BigOOption } from '@nerdose/core';

const powersOfTwo = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => 2 ** (from + i));
const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const LINEAR_SCALE = powersOfTwo(8, 16);

export const SCALE: Readonly<Record<BigOOption, readonly number[]>> = {
  o_1: LINEAR_SCALE,
  o_log_n: LINEAR_SCALE,
  o_n: LINEAR_SCALE,
  o_n_log_n: LINEAR_SCALE,
  o_n2: powersOfTwo(6, 12),
  o_n3: powersOfTwo(4, 9),
  o_2n: range(10, 20),
  o_n_fact: range(4, 10),
};

export const EXAMPLE_N: Readonly<Record<BigOOption, number>> = {
  o_1: 1024,
  o_log_n: 1024,
  o_n: 1024,
  o_n_log_n: 1024,
  o_n2: 1024,
  o_n3: 256,
  o_2n: 20,
  o_n_fact: 8,
};

export const COUNT_MAX = 2 ** 31 - 1;
export const SCALE_WORK_BUDGET = 300_000_000;

const log2Exact = (n: number): number => {
  if (!Number.isInteger(n) || n < 1 || (n & (n - 1)) !== 0) {
    throw new RangeError('big-o: classValue log of non power of two');
  }
  return Math.log2(n);
};

const factorial = (n: number): number => {
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
};

/** Exact value of the class at `n`, in integers: `log₂` only for powers of two. */
export function classValue(option: BigOOption, n: number): number {
  switch (option) {
    case 'o_1':
      return 1;
    case 'o_log_n':
      return log2Exact(n);
    case 'o_n':
      return n;
    case 'o_n_log_n':
      return n * log2Exact(n);
    case 'o_n2':
      return n ** 2;
    case 'o_n3':
      return n ** 3;
    case 'o_2n':
      return 2 ** n;
    case 'o_n_fact':
      return factorial(n);
  }
}
