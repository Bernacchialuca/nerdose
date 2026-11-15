import type { BugType } from '@nerdose/core';
import type { BinOp, CompoundOp, Expr, TreeBuilder, TreeNode } from '@nerdose/polyglot';

import type { MutationSite } from '../types';

import { neutralExpr, neutralStmt, precedenceOf } from './neutral';
import { isExpr } from './tree-utils';

export const OPERATOR_IDS = [
  'loop_cond_relax',
  'loop_cond_tighten',
  'loop_start_shift',
  'bound_minus_one',
  'bound_plus_one',
  'relax_comparison',
  'tighten_comparison',
  'swap_arith',
  'swap_compound',
  'swap_logical',
  'swap_variable',
  'shift_init',
  'flip_bool_init',
  'early_return',
  'negate_condition',
] as const;

export type OperatorId = (typeof OPERATOR_IDS)[number];

export type Variant = {
  from: string;
  to: string;
  replace(node: TreeNode, b: TreeBuilder): TreeNode;
};

export type Operator = {
  bugType: BugType;
  variants(node: TreeNode, site: MutationSite): readonly Variant[];
};

const NONE: readonly Variant[] = [];

const RELAX: Partial<Record<BinOp, BinOp>> = { '<': '<=', '>': '>=' };
const TIGHTEN: Partial<Record<BinOp, BinOp>> = { '<=': '<', '>=': '>' };
const NEGATE: Partial<Record<BinOp, BinOp>> = {
  '<': '>=',
  '<=': '>',
  '>': '<=',
  '>=': '<',
  '==': '!=',
  '!=': '==',
};
const SWAP_ARITH: Partial<Record<BinOp, BinOp>> = { '+': '-', '-': '+' };
const SWAP_LOGICAL: Partial<Record<BinOp, BinOp>> = { '&&': '||', '||': '&&' };
const SWAP_COMPOUND: Partial<Record<CompoundOp, CompoundOp>> = { '+=': '-=', '-=': '+=' };

/** Replaces the operator of a `bin` node following `table`. */
function binOperator(table: Partial<Record<BinOp, BinOp>>): Operator['variants'] {
  return (node) => {
    if (node.kind !== 'bin') return NONE;
    const to = table[node.op];
    if (to === undefined) return NONE;
    return [
      {
        from: node.op,
        to,
        replace: (n, b) => (n.kind === 'bin' ? b.bin(to, n.left, n.right) : n),
      },
    ];
  };
}

/** `x` -> `x - 1` / `x + 1`; the original node is reused, so it keeps its id. */
function boundShift(op: '+' | '-'): Operator['variants'] {
  return (node) => {
    if (!isExpr(node) || node.kind === 'bool') return NONE;
    const from = neutralExpr(node);
    const wrapped =
      node.kind === 'bin' && precedenceOf(node.op) < precedenceOf(op) ? `(${from})` : from;
    return [
      {
        from,
        to: `${wrapped} ${op} 1`,
        replace: (n, b) => (isExpr(n) ? b.bin(op, n as Expr, b.num(1)) : n),
      },
    ];
  };
}

const numShift =
  (table: Readonly<Record<number, number>>): Operator['variants'] =>
  (node) => {
    if (node.kind !== 'num') return NONE;
    const to = table[node.value];
    if (to === undefined) return NONE;
    return [{ from: String(node.value), to: String(to), replace: (_n, b) => b.num(to) }];
  };

export const OPERATORS: Record<OperatorId, Operator> = {
  loop_cond_relax: { bugType: 'off_by_one', variants: binOperator(RELAX) },
  loop_cond_tighten: { bugType: 'off_by_one', variants: binOperator(TIGHTEN) },
  loop_start_shift: { bugType: 'off_by_one', variants: numShift({ 0: 1, 1: 0 }) },
  bound_minus_one: { bugType: 'off_by_one', variants: boundShift('-') },
  bound_plus_one: { bugType: 'off_by_one', variants: boundShift('+') },
  relax_comparison: { bugType: 'comparison', variants: binOperator(RELAX) },
  tighten_comparison: { bugType: 'comparison', variants: binOperator(TIGHTEN) },
  swap_arith: { bugType: 'wrong_operator', variants: binOperator(SWAP_ARITH) },
  swap_compound: {
    bugType: 'wrong_operator',
    variants(node) {
      if (node.kind !== 'compound') return NONE;
      const to = SWAP_COMPOUND[node.op];
      if (to === undefined) return NONE;
      return [
        {
          from: node.op,
          to,
          replace: (n, b) => (n.kind === 'compound' ? b.compound(n.name, to, n.expr) : n),
        },
      ];
    },
  },
  swap_logical: { bugType: 'wrong_operator', variants: binOperator(SWAP_LOGICAL) },
  swap_variable: {
    bugType: 'wrong_variable',
    variants(node, site) {
      if (node.kind !== 'var') return NONE;
      const from = node.name;
      return (site.swaps ?? [])
        .filter((name) => name !== from)
        .map((name) => ({
          from,
          to: name,
          replace: (_n: TreeNode, b: TreeBuilder) => b.var(name),
        }));
    },
  },
  shift_init: { bugType: 'bad_initialization', variants: numShift({ 0: 1, 1: 0, [-1]: 0 }) },
  flip_bool_init: {
    bugType: 'bad_initialization',
    variants(node) {
      if (node.kind !== 'bool') return NONE;
      const to = !node.value;
      return [{ from: String(node.value), to: String(to), replace: (_n, b) => b.bool(to) }];
    },
  },
  early_return: {
    bugType: 'misplaced_return',
    variants(node, site) {
      if (node.kind !== 'assign' && node.kind !== 'compound' && node.kind !== 'inc') return NONE;
      const from = neutralStmt(node);
      return (site.returns ?? []).map((name) => ({
        from,
        to: `return ${name}`,
        replace: (_n: TreeNode, b: TreeBuilder) => b.return(b.var(name)),
      }));
    },
  },
  negate_condition: { bugType: 'inverted_condition', variants: binOperator(NEGATE) },
};
