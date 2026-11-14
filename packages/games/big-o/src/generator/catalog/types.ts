import type { BigOOption, RecipeCategory } from '@nerdose/core';
import type { FuncNode, NodeId } from '@nerdose/polyglot';

export type TrapKind = 'sequential_loops' | 'constant_bound' | 'doubling_inner';

export type Branch = 'left' | 'right';
export type DcWork = 'unit' | 'constant' | 'linear' | 'quadratic' | 'cubic';

/**
 * A block, or the composition of blocks. Parameters (`k`, `step`, `branch`) are absent in the
 * shapes of the recipes and filled by `bindParams` for one concrete build.
 */
export type Shape =
  | { kind: 'constant'; k?: number }
  | { kind: 'linear'; step?: 1 | 2 }
  | { kind: 'dependent' }
  | { kind: 'doubling'; bound?: 'n' | 'outer' }
  | { kind: 'halving'; bound?: 'n' | 'outer' }
  | { kind: 'binary_search'; branch?: Branch }
  | { kind: 'divide_and_conquer'; calls: 1 | 2 | 4; work: DcWork; k?: number }
  | {
      kind: 'double_recursion';
      variant: 'n-1,n-2' | 'n-1,n-1';
      work: 'none' | 'constant';
      k?: number;
    }
  | { kind: 'permutations'; work: 'none' | 'inc' | 'constant'; k?: number }
  | { kind: 'nest'; outer: Shape; inner: Shape }
  | { kind: 'seq'; parts: readonly Shape[] };

export type BlockKind = Exclude<Shape['kind'], 'nest' | 'seq'>;
export type LoopKind =
  | 'constant'
  | 'linear'
  | 'dependent'
  | 'doubling'
  | 'halving'
  | 'binary_search';

export interface Recipe {
  id: string;
  category: RecipeCategory;
  answer: BigOOption;
  trap: TrapKind | null;
  trapOption: BigOOption | null;
  shape: Shape;
  /** Narrows the domain of the constants for recipes that would not fit the work budget. */
  paramDomain?: { k?: readonly number[] };
}

/** One value per parametrizable block, in traversal order (pre-order, left to right). */
export type ParamValue = number | Branch;
export type Params = readonly ParamValue[];

export interface LoopPart {
  kind: LoopKind;
  line: number;
  k: number | null;
  step: 1 | 2 | null;
  bound: 'n' | 'outer';
  term: string;
}

export interface CompositionPart {
  kind: 'nest' | 'seq';
  terms: string[];
}

export interface BuiltRecipe {
  func: FuncNode;
  code: { js: string; go: string; java: string };
  lineOf: Record<NodeId, number>;
  /** Exact number of operations at `n`, computed in TS without running the emitted code. */
  cost(n: number): number;
  parts: {
    /** Loops in traversal order. */
    loops: LoopPart[];
    /** Lines of the statements that hold a recursive call. */
    calls: number[];
    /** Compositions, inner ones first. */
    compositions: CompositionPart[];
  };
}
