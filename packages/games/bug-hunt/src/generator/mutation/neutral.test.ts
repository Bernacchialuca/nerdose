import { createTreeBuilder } from '@nerdose/polyglot';
import { describe, expect, it } from 'vitest';

import { neutralExpr, neutralStmt } from './neutral';

describe('neutral notation (TS-17)', () => {
  const b = createTreeBuilder();
  const nums = () => b.var('nums');

  it('prints expressions without language tokens', () => {
    expect(neutralExpr(b.len(nums()))).toBe('len(nums)');
    expect(neutralExpr(b.bin('-', b.len(nums()), b.num(1)))).toBe('len(nums) - 1');
    expect(neutralExpr(b.half(b.len(nums())))).toBe('half(len(nums))');
    expect(neutralExpr(b.index(nums(), b.var('i')))).toBe('nums[i]');
    expect(neutralExpr(b.bin('==', b.var('a'), b.var('b')))).toBe('a == b');
  });

  it('parenthesizes by precedence and negative right operands', () => {
    expect(neutralExpr(b.bin('*', b.bin('+', b.var('a'), b.var('b')), b.num(2)))).toBe(
      '(a + b) * 2',
    );
    expect(neutralExpr(b.bin('-', b.var('a'), b.bin('-', b.var('b'), b.var('c'))))).toBe(
      'a - (b - c)',
    );
    expect(neutralExpr(b.bin('<', b.var('x'), b.num(-1)))).toBe('x < (-1)');
  });

  it('prints statements', () => {
    expect(neutralStmt(b.assign('best', b.var('i')))).toBe('best = i');
    expect(neutralStmt(b.compound('count', '+=', b.num(1)))).toBe('count += 1');
    expect(neutralStmt(b.inc('lo'))).toBe('lo++');
    expect(neutralStmt(b.return(b.var('best')))).toBe('return best');
  });
});
