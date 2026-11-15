import { createTreeBuilder, emit, type FuncNode } from '@nerdose/polyglot';
import { describe, expect, it } from 'vitest';

import type { BuiltTemplate } from '../types';

import { mutationsOf } from './candidates';

function maxIndex(): BuiltTemplate {
  const b = createTreeBuilder();
  const cond = b.bin(
    '>',
    b.index(b.var('nums'), b.var('i')),
    b.index(b.var('nums'), b.var('best')),
  );
  const init = b.num(0);
  const bound = b.len(b.var('nums'));
  const func: FuncNode = b.func(
    'maxIndex',
    [{ name: 'nums', type: 'int[]' }],
    [
      b.let('best', init),
      b.for(b.let('i', b.num(1)), b.bin('<', b.var('i'), bound), b.inc('i'), [
        b.if(cond, [b.assign('best', b.var('i'))]),
      ]),
      b.return(b.var('best')),
    ],
    'int',
  );
  return {
    func,
    sites: [
      { node: init.id, operators: ['shift_init'], role: { es: 'a', en: 'a' } },
      {
        node: bound.id,
        operators: ['bound_minus_one', 'bound_plus_one'],
        role: { es: 'b', en: 'b' },
      },
      {
        node: cond.id,
        operators: ['relax_comparison', 'negate_condition'],
        role: { es: 'c', en: 'c' },
      },
    ],
  };
}

describe('mutationsOf', () => {
  it('walks sites in order and filters by bug type (TS-13)', () => {
    const built = maxIndex();
    const cmp = mutationsOf(built, 'comparison');
    expect(cmp.map((c) => [c.operator, c.from, c.to])).toEqual([['relax_comparison', '>', '>=']]);
    const before = emit(built.func, 'js').code.split('\n');
    const after = emit(cmp[0]!.mutant, 'js').code.split('\n');
    expect(after[3]).toBe('    if (nums[i] >= nums[best]) {');
    expect(after.filter((l, i) => l !== before[i])).toHaveLength(1);
    expect(mutationsOf(built, 'off_by_one').map((c) => c.operator)).toEqual([
      'bound_minus_one',
      'bound_plus_one',
    ]);
    expect(mutationsOf(built, 'misplaced_return')).toEqual([]);
  });

  it('does not touch the original tree and is stable', () => {
    const built = maxIndex();
    const clone = structuredClone(built.func);
    const a = mutationsOf(built, 'inverted_condition');
    const c = mutationsOf(built, 'inverted_condition');
    expect(built.func).toEqual(clone);
    expect(a.map((x) => x.to)).toEqual(c.map((x) => x.to));
    expect(a[0]!.mutant).not.toBe(built.func);
  });

  it('discards variants replaceNode rejects', () => {
    const b = createTreeBuilder();
    const m = b.bin('%', b.var('x'), b.num(2));
    const func = b.func('f', [{ name: 'x', type: 'int' }], [b.return(m)], 'int');
    const built: BuiltTemplate = {
      func,
      sites: [{ node: m.right.id, operators: ['shift_init'], role: { es: 'a', en: 'a' } }],
    };
    expect(mutationsOf(built, 'bad_initialization')).toEqual([]);
  });

  it('fails when a site node does not exist', () => {
    const built = maxIndex();
    expect(() =>
      mutationsOf(
        {
          ...built,
          sites: [{ node: 'n999', operators: ['shift_init'], role: { es: 'a', en: 'a' } }],
        },
        'bad_initialization',
      ),
    ).toThrow('bug-hunt: site node n999 not found');
  });
});
