import { createTreeBuilder } from '@nerdose/polyglot';
import { describe, expect, it } from 'vitest';

import { CODE_NLOGN } from '../../definition/test-fixtures';
import { interpret } from '../test-utils';
import { recipe } from '../test-fixtures';
import { treeNesting } from '../shape';

import { buildRecipe } from './build';
import { paramCombos } from './params';

describe('buildRecipe', () => {
  it('emits nest(linear,doubling) exactly as the golden code (TS-7)', () => {
    const built = buildRecipe(recipe('nest(linear,doubling)'), [1]);
    expect(built.code).toEqual(CODE_NLOGN);
    const loops = built.parts.loops.map((l) => l.line);
    expect(loops).toEqual([3, 4]);
    expect(built.cost(1024)).toBe(10240);
    expect(built.cost(256)).toBe(2048);
    expect(treeNesting(built.func)).toBe(2);
  });

  it('emits binary_search with a deterministic worst case (TS-30)', () => {
    const left = buildRecipe(recipe('binary_search'), ['left']);
    expect(left.code.js).toBe(
      [
        'function f(n) {',
        '  let ops = 0;',
        '  let lo = 0;',
        '  let hi = n;',
        '  while (lo < hi) {',
        '    let mid = Math.trunc((lo + hi) / 2);',
        '    ops++;',
        '    hi = mid;',
        '  }',
        '  return ops;',
        '}',
      ].join('\n'),
    );
    expect(left.cost(1024)).toBe(11);
    expect(left.cost(1)).toBe(1);
    const right = buildRecipe(recipe('binary_search'), ['right']);
    expect(right.code.js).toContain('lo = mid + 1;');
    expect(right.cost(8)).toBe(3);
    expect(interpret(right.func, 8).value).toBe(3);
  });

  it('uses assign when a block repeats a function-level declaration', () => {
    const built = buildRecipe(
      { ...recipe('binary_search'), shape: { kind: 'seq', parts: [{ kind: 'binary_search' }, { kind: 'binary_search' }] } },
      ['left', 'right'],
    );
    expect(built.code.js).toContain('  lo = 0;');
    expect(interpret(built.func, 8).value).toBe(built.cost(8));
  });

  it('rejects a parameter list that does not fit the shape', () => {
    expect(() => buildRecipe(recipe('nest(linear,doubling)'), [])).toThrow('big-o: missing_param');
    expect(() => buildRecipe(recipe('nest(linear,doubling)'), [1, 1])).toThrow(
      'big-o: too_many_params',
    );
    expect(() => buildRecipe(recipe('nest(linear,doubling)'), [3])).toThrow('big-o: invalid_param');
  });

  it('enumerates the whole domain of the parameters', () => {
    expect(paramCombos(recipe('nest(linear,doubling)'))).toEqual([[1], [2]]);
    expect(paramCombos(recipe('nest(linear,nest(constant,linear))'))).toHaveLength(4);
    expect(paramCombos(recipe('permutations_constant'))).toEqual([[10]]);
    expect(paramCombos(recipe('halving'))).toEqual([[]]);
  });
});

describe('interpret', () => {
  it('computes fib with the base case n < 2 (fib(10) = 89)', () => {
    const b = createTreeBuilder();
    const n = () => b.var('n');
    const func = b.func('f', ['n'], [
      b.if(b.bin('<', n(), b.num(2)), [b.return(b.num(1))]),
      b.return(
        b.bin(
          '+',
          b.call('f', [b.bin('-', n(), b.num(1))]),
          b.call('f', [b.bin('-', n(), b.num(2))]),
        ),
      ),
    ]);
    const { value, maxDepth } = interpret(func, 10);
    expect(value).toBe(89);
    expect(maxDepth).toBe(10);
  });

  it('throws on overflow', () => {
    const b = createTreeBuilder();
    const func = b.func('f', ['n'], [
      b.let('x', b.bin('*', b.var('n'), b.num(2))),
      b.return(b.var('x')),
    ]);
    expect(() => interpret(func, 2 ** 31 - 1)).toThrow('interpret: overflow');
  });

  it('throws when the step limit is exceeded', () => {
    const b = createTreeBuilder();
    const func = b.func('f', ['n'], [
      b.while(b.bin('<', b.num(0), b.num(1)), [b.inc('n')]),
      b.return(b.num(1)),
    ]);
    expect(() => interpret(func, 0)).toThrow(/interpret: (step limit|overflow)/);
  });
});
