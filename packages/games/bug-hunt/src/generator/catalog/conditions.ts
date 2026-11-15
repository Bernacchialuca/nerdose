import type { Expr, TreeBuilder } from '@nerdose/polyglot';

import type { OperatorId } from '../mutation/operators';
import type { Localized } from '../types';

type BinExpr = ReturnType<TreeBuilder['bin']>;

export type ElementCondition =
  | 'gt'
  | 'lt'
  | 'negative'
  | 'nonnegative'
  | 'even'
  | 'odd'
  | 'multiple';

/** The tree of a condition over `element` (`nums[i]`); `k` is the threshold for `gt` / `lt`. */
export function conditionTree(
  cond: ElementCondition,
  b: TreeBuilder,
  element: Expr,
  k?: Expr,
  divisor?: number,
): BinExpr {
  const need = <T>(value: T | undefined, what: string): T => {
    if (value === undefined) throw new Error(`bug-hunt: condition ${cond} needs ${what}`);
    return value;
  };
  switch (cond) {
    case 'gt':
      return b.bin('>', element, need(k, 'k'));
    case 'lt':
      return b.bin('<', element, need(k, 'k'));
    case 'negative':
      return b.bin('<', element, b.num(0));
    case 'nonnegative':
      return b.bin('>=', element, b.num(0));
    case 'even':
      return b.bin('==', b.bin('%', element, b.num(2)), b.num(0));
    case 'odd':
      return b.bin('!=', b.bin('%', element, b.num(2)), b.num(0));
    case 'multiple':
      return b.bin('==', b.bin('%', element, b.num(need(divisor, 'divisor'))), b.num(0));
  }
}

/** The reference of `conditionTree`, written apart from the tree. */
export function conditionHolds(
  cond: ElementCondition,
  value: number,
  k?: number,
  divisor?: number,
): boolean {
  switch (cond) {
    case 'gt':
      return value > (k ?? 0);
    case 'lt':
      return value < (k ?? 0);
    case 'negative':
      return value < 0;
    case 'nonnegative':
      return value >= 0;
    case 'even':
      return value % 2 === 0;
    case 'odd':
      return value % 2 !== 0;
    case 'multiple':
      return value % (divisor ?? 1) === 0;
  }
}

/** Phrases of each condition as the complement of "elements that are ...". */
export const PHRASES: Record<
  ElementCondition,
  { plural: Localized; singular: Localized; allOf?: Localized }
> = {
  gt: {
    plural: { es: 'mayores que k', en: 'greater than k' },
    singular: { es: 'mayor que k', en: 'greater than k' },
  },
  lt: {
    plural: { es: 'menores que k', en: 'less than k' },
    singular: { es: 'menor que k', en: 'less than k' },
  },
  negative: {
    plural: { es: 'negativos', en: 'negative' },
    singular: { es: 'negativo', en: 'negative' },
  },
  nonnegative: {
    plural: { es: 'mayores o iguales que 0', en: 'zero or greater' },
    singular: { es: 'mayor o igual que 0', en: 'zero or greater' },
  },
  even: { plural: { es: 'pares', en: 'even' }, singular: { es: 'par', en: 'even' } },
  odd: { plural: { es: 'impares', en: 'odd' }, singular: { es: 'impar', en: 'odd' } },
  multiple: {
    plural: { es: 'múltiplos de {d}', en: 'multiples of {d}' },
    singular: { es: 'múltiplo de {d}', en: 'multiple of {d}' },
  },
};

/** Operators a comparison node admits (plus the negation), by its current operator. */
export function conditionOperators(node: BinExpr): OperatorId[] {
  if (node.op === '<' || node.op === '>') return ['relax_comparison', 'negate_condition'];
  if (node.op === '<=' || node.op === '>=') return ['tighten_comparison', 'negate_condition'];
  return ['negate_condition'];
}
