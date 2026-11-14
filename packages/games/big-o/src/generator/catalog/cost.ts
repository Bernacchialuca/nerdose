import type { Shape } from './types';

const floorLog2 = (x: number): number => 31 - Math.clz32(x);
const ceilLog2 = (x: number): number => (x <= 1 ? 0 : 32 - Math.clz32(x - 1));

const boundOf = (shape: { bound?: 'n' | 'outer' }, n: number, outer: number): number =>
  shape.bound === 'outer' ? outer : n;

function binarySearchIterations(n: number, branch: 'left' | 'right'): number {
  let lo = 0;
  let hi = n;
  let count = 0;
  while (lo < hi) {
    const mid = Math.trunc((lo + hi) / 2);
    count++;
    if (branch === 'left') hi = mid;
    else lo = mid + 1;
  }
  return count;
}

/** Iterations of a loop block at `n`, given the value of the variable of the enclosing loop. */
function iterations(shape: Shape, n: number, outer: number): number {
  switch (shape.kind) {
    case 'constant':
      return shape.k ?? 0;
    case 'linear':
      return Math.ceil(n / (shape.step ?? 1));
    case 'dependent':
      return outer;
    case 'doubling':
      return ceilLog2(boundOf(shape, n, outer));
    case 'halving': {
      const bound = boundOf(shape, n, outer);
      return bound === 0 ? 0 : floorLog2(bound) + 1;
    }
    case 'binary_search':
      return binarySearchIterations(n, shape.branch ?? 'left');
    default:
      throw new Error(`big-o: not_a_loop ${shape.kind}`);
  }
}

/** Values the loop variable takes, needed only when an inner block depends on it. */
function values(shape: Shape, n: number, outer: number): number[] {
  const out: number[] = [];
  switch (shape.kind) {
    case 'constant':
      for (let v = 0; v < (shape.k ?? 0); v++) out.push(v);
      return out;
    case 'linear':
      for (let v = 0; v < n; v += shape.step ?? 1) out.push(v);
      return out;
    case 'dependent':
      for (let v = 0; v < outer; v++) out.push(v);
      return out;
    case 'doubling': {
      const bound = boundOf(shape, n, outer);
      for (let v = 1; v < bound; v *= 2) out.push(v);
      return out;
    }
    case 'halving':
      for (let v = boundOf(shape, n, outer); v > 0; v = Math.trunc(v / 2)) out.push(v);
      return out;
    default:
      throw new Error(`big-o: no_loop_variable ${shape.kind}`);
  }
}

/** Whether the shape reads the variable of the loop that encloses it. */
function usesOuter(shape: Shape): boolean {
  switch (shape.kind) {
    case 'dependent':
      return true;
    case 'doubling':
    case 'halving':
      return shape.bound === 'outer';
    case 'nest':
      return usesOuter(shape.outer);
    case 'seq':
      return shape.parts.some(usesOuter);
    default:
      return false;
  }
}

function recursiveCost(shape: Shape): ((n: number) => number) | null {
  const memo = new Map<number, number>();
  const memoize = (f: (n: number) => number) => {
    const cost = (n: number): number => {
      const hit = memo.get(n);
      if (hit !== undefined) return hit;
      const value = f(n);
      memo.set(n, value);
      return value;
    };
    return cost;
  };
  switch (shape.kind) {
    case 'divide_and_conquer': {
      const { calls, work } = shape;
      const own = (n: number): number => {
        switch (work) {
          case 'unit':
            return 1;
          case 'constant':
            return shape.k ?? 0;
          case 'linear':
            return n;
          case 'quadratic':
            return n ** 2;
          case 'cubic':
            return n ** 3;
        }
      };
      const cost: (n: number) => number = memoize((n) =>
        n <= 1 ? 1 : own(n) + calls * cost(Math.trunc(n / 2)),
      );
      return cost;
    }
    case 'double_recursion': {
      const own = shape.work === 'constant' ? (shape.k ?? 0) : 0;
      if (shape.variant === 'n-1,n-2') {
        const cost: (n: number) => number = memoize((n) =>
          n < 2 ? 1 : own + cost(n - 1) + cost(n - 2),
        );
        return cost;
      }
      const cost: (n: number) => number = memoize((n) => (n <= 1 ? 1 : own + 2 * cost(n - 1)));
      return cost;
    }
    case 'permutations': {
      const own = shape.work === 'inc' ? 1 : shape.work === 'constant' ? (shape.k ?? 0) : 0;
      const cost: (n: number) => number = memoize((n) =>
        n <= 1 ? 1 : n * (own + cost(n - 1)),
      );
      return cost;
    }
    default:
      return null;
  }
}

/** Exact count of the operations of a bound shape at `n`, with no emitted code executed. */
export function costOf(shape: Shape, n: number, outer = 0): number {
  switch (shape.kind) {
    case 'nest': {
      if (!usesOuter(shape.inner)) {
        return iterations(shape.outer, n, outer) * costOf(shape.inner, n, 0);
      }
      return values(shape.outer, n, outer).reduce((sum, v) => sum + costOf(shape.inner, n, v), 0);
    }
    case 'seq':
      return shape.parts.reduce((sum, part) => sum + costOf(part, n, outer), 0);
    case 'divide_and_conquer':
    case 'double_recursion':
    case 'permutations': {
      const cost = recursiveCost(shape);
      return (cost as (n: number) => number)(n);
    }
    default:
      return iterations(shape, n, outer);
  }
}

export function costFn(shape: Shape): (n: number) => number {
  const recursive = recursiveCost(shape);
  return recursive ?? ((n) => costOf(shape, n));
}
