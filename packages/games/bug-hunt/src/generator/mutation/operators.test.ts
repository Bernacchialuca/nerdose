import { createTreeBuilder, type TreeBuilder, type TreeNode } from '@nerdose/polyglot';
import { describe, expect, it } from 'vitest';

import type { MutationSite } from '../types';

import { OPERATOR_IDS, OPERATORS, type OperatorId } from './operators';

const b = createTreeBuilder();
const site = (extra: Partial<MutationSite> = {}): MutationSite => ({
  node: 'n1',
  operators: [],
  role: { es: 'x', en: 'x' },
  ...extra,
});
const tos = (id: OperatorId, node: TreeNode, s: MutationSite = site()) =>
  OPERATORS[id].variants(node, s).map((v) => v.to);
const run = (id: OperatorId, node: TreeNode, s: MutationSite = site()) => {
  const builder: TreeBuilder = createTreeBuilder();
  return OPERATORS[id].variants(node, s).map((v) => v.replace(node, builder));
};

describe('OPERATORS (TS-14)', () => {
  it('declares the 15 ids in order', () => {
    expect(OPERATOR_IDS).toHaveLength(15);
    expect(OPERATOR_IDS[0]).toBe('loop_cond_relax');
    expect(OPERATOR_IDS[14]).toBe('negate_condition');
    for (const id of OPERATOR_IDS) expect(OPERATORS[id].bugType).toBeTruthy();
  });

  it('maps every variant of the table', () => {
    const nums = b.var('nums');
    expect(tos('loop_cond_relax', b.bin('<', b.var('i'), b.len(nums)))).toEqual(['<=']);
    expect(tos('loop_cond_tighten', b.bin('<=', b.var('i'), b.len(nums)))).toEqual(['<']);
    expect(tos('loop_start_shift', b.num(0))).toEqual(['1']);
    expect(tos('loop_start_shift', b.num(1))).toEqual(['0']);
    expect(tos('loop_start_shift', b.num(2))).toEqual([]);
    expect(tos('bound_minus_one', b.len(nums))).toEqual(['len(nums) - 1']);
    expect(tos('bound_plus_one', b.len(nums))).toEqual(['len(nums) + 1']);
    expect(tos('relax_comparison', b.bin('>', b.var('a'), b.var('c')))).toEqual(['>=']);
    expect(tos('tighten_comparison', b.bin('>=', b.var('a'), b.var('c')))).toEqual(['>']);
    expect(tos('swap_arith', b.bin('+', b.var('a'), b.var('c')))).toEqual(['-']);
    expect(tos('swap_compound', b.compound('s', '+=', b.num(1)))).toEqual(['-=']);
    expect(tos('swap_logical', b.bin('&&', b.var('a'), b.var('c')))).toEqual(['||']);
    expect(tos('swap_variable', b.var('i'), site({ swaps: ['best', 'i'] }))).toEqual(['best']);
    expect(tos('shift_init', b.num(-1))).toEqual(['0']);
    expect(tos('shift_init', b.num(5))).toEqual([]);
    expect(tos('flip_bool_init', b.bool(true))).toEqual(['false']);
    expect(tos('negate_condition', b.bin('==', b.var('a'), b.var('c')))).toEqual(['!=']);
    expect(tos('negate_condition', b.bin('<', b.var('a'), b.var('c')))).toEqual(['>=']);
  });

  it('early_return replaces the statement by a return of each candidate', () => {
    const stmt = b.assign('best', b.var('i'));
    const s = site({ returns: ['i', 'best'] });
    expect(OPERATORS.early_return.variants(stmt, s).map((v) => [v.from, v.to])).toEqual([
      ['best = i', 'return i'],
      ['best = i', 'return best'],
    ]);
    const replaced = run('early_return', stmt, s);
    expect(replaced.map((n) => n.kind)).toEqual(['return', 'return']);
  });

  it('bound_minus_one reuses the node', () => {
    const len = b.len(b.var('nums'));
    const [mutated] = run('bound_minus_one', len);
    expect(mutated).toMatchObject({ kind: 'bin', op: '-', left: { id: len.id } });
  });

  it('returns no variants for a node that does not fit (TS-15)', () => {
    const i = b.var('i');
    expect(tos('relax_comparison', i)).toEqual([]);
    expect(tos('swap_compound', b.bin('+', b.var('a'), b.var('c')))).toEqual([]);
    expect(tos('early_return', b.if(b.bool(true), []), site({ returns: ['i'] }))).toEqual([]);
  });
});
