import type { Expr, Param, Stmt, TreeBuilder } from '@nerdose/polyglot';

import type { Localized, MutationSite, TestInput } from '../types';

import type { OperatorId } from '../mutation/operators';

type ForStmt = ReturnType<TreeBuilder['for']>;
type LenExpr = ReturnType<TreeBuilder['len']>;
type NumExpr = ReturnType<TreeBuilder['num']>;

export const NUMS: Param = { name: 'nums', type: 'int[]' };
export const intParam = (name: string): Param => ({ name, type: 'int' });

export const loc = (es: string, en: string): Localized => ({ es, en });

export const site = (
  node: MutationSite['node'],
  operators: readonly OperatorId[],
  role: Localized,
  extra: Pick<MutationSite, 'swaps' | 'returns'> = {},
): MutationSite => ({ node, operators, role, ...extra });

/** `for (let i = start; i < nums.length; i++) body` with the nodes the sites point at. */
export function indexLoop(
  b: TreeBuilder,
  start: number,
  body: readonly Stmt[],
): { stmt: ForStmt; start: NumExpr; bound: LenExpr } {
  const startNode = b.num(start);
  const bound = b.len(b.var('nums'));
  const stmt = b.for(b.let('i', startNode), b.bin('<', b.var('i'), bound), b.inc('i'), body);
  return { stmt, start: startNode, bound };
}

export const elementAt = (b: TreeBuilder, index: Expr): Expr => b.index(b.var('nums'), index);

export const arrayArg = (input: TestInput, at = 0): readonly number[] =>
  input[at] as readonly number[];
export const scalarArg = (input: TestInput, at: number): number => input[at] as number;
