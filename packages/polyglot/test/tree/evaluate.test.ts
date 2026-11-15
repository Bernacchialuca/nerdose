import { describe, expect, it, vi } from 'vitest';
import { createTreeBuilder } from '../../src/tree/builder';
import { evaluate } from '../../src/tree/evaluate';
import type { FuncNode } from '../../src/tree/nodes';
import { replaceNode } from '../../src/tree/replace';
import { drains, maxIndex, rem, safe, treeA, treeB, treeC, treeD, treeE } from '../fixtures/trees';

const ok = (value: number | boolean) => ({ ok: true, value });
const fail = (error: string) => ({ ok: false, error });

const typed = (name: string, params: [string, 'int' | 'int[]'][], returns: 'int' | 'bool') => ({
  name,
  params: params.map(([n, type]) => ({ name: n, type })),
  returns,
});

describe('evaluate', () => {
  it('runs untyped fixtures (S-047 TS-13)', () => {
    expect(evaluate(treeA().tree, [10])).toEqual(ok(81));
    expect(evaluate(treeA().tree, [0])).toEqual(ok(0));
    expect(evaluate(treeB(), [10])).toEqual(ok(89));
    expect(evaluate(treeC().tree, [1024])).toEqual(ok(10240));
    expect(evaluate(treeD(), [8])).toEqual(ok(32));
    expect(evaluate(treeE(), [3, 9])).toEqual(ok(6));
  });

  it('runs arrays and booleans (S-047 TS-14)', () => {
    const m = maxIndex().tree;
    expect([[[5, 1, 5]], [[3, 7, 2]], [[]], [[-2, -9, -2]]].map((a) => evaluate(m, a))).toEqual([
      ok(0),
      ok(1),
      ok(0),
      ok(0),
    ]);
    const d = drains().tree;
    expect(
      [
        [[9], 3],
        [[3, 4, -5], 2],
        [[], 0],
        [[1, 1, 1], 2],
        [[-4, 2], 1],
      ].map((a) => evaluate(d, a)),
    ).toEqual([ok(true), ok(false), ok(false), ok(true), ok(false)]);
  });

  it('reports int overflow (S-047 TS-15)', () => {
    expect(evaluate(treeE(), [2147483647, 1])).toEqual(fail('int_overflow'));
    const b = createTreeBuilder();
    const sq = b.func('sq', ['n'], [b.return(b.bin('*', b.var('n'), b.var('n')))]);
    expect(evaluate(sq, [65536])).toEqual(fail('int_overflow'));
    expect(evaluate(sq, [46340])).toEqual(ok(2147395600));
    const c = createTreeBuilder();
    const dec = c.func('dec', ['n'], [c.return(c.bin('-', c.var('n'), c.num(1)))]);
    expect(evaluate(dec, [-2147483648])).toEqual(fail('int_overflow'));
  });

  it('truncates toward zero and never returns -0 (S-047 TS-16)', () => {
    const r = rem();
    const zero = evaluate(r, [-4]);
    expect(zero).toEqual(ok(0));
    expect(zero.ok && Object.is(zero.value, 0)).toBe(true);
    expect(evaluate(r, [-3])).toEqual(ok(-1));
    expect(evaluate(r, [7])).toEqual(ok(1));
    expect(evaluate(treeE(), [-3, 0])).toEqual(ok(-1));
    const negZero = evaluate(treeE(), [-1, 0]);
    expect(negZero.ok && Object.is(negZero.value, 0)).toBe(true);
  });

  it('short-circuits && and || (S-047 TS-17)', () => {
    expect(evaluate(safe(), [[]])).toEqual(ok(false));
    expect(evaluate(safe(), [[3]])).toEqual(ok(true));
    expect(evaluate(safe(), [[-3]])).toEqual(ok(false));
    const b = createTreeBuilder();
    const either = b.func(
      'either',
      [{ name: 'nums', type: 'int[]' }],
      [
        b.return(
          b.bin(
            '||',
            b.bin('==', b.len(b.var('nums')), b.num(0)),
            b.bin('>', b.index(b.var('nums'), b.num(0)), b.num(0)),
          ),
        ),
      ],
      'bool',
    );
    expect(evaluate(either, [[]])).toEqual(ok(true));
  });

  it('reports index_out_of_range (S-047 TS-18)', () => {
    const b = createTreeBuilder();
    const spec = typed(
      'at',
      [
        ['nums', 'int[]'],
        ['i', 'int'],
      ],
      'int',
    );
    const at = b.func(
      spec.name,
      spec.params,
      [b.return(b.index(b.var('nums'), b.var('i')))],
      'int',
    );
    expect(evaluate(at, [[1, 2], 2])).toEqual(fail('index_out_of_range'));
    expect(evaluate(at, [[1, 2], -1])).toEqual(fail('index_out_of_range'));
    expect(evaluate(at, [[1, 2], 1])).toEqual(ok(2));
    const mutant = replaceNode(maxIndex().tree, 'n8', (n, nb) =>
      n.kind === 'bin' ? nb.bin('<=', n.left, n.right) : n,
    );
    expect(evaluate(mutant, [[5, 1, 5]])).toEqual(fail('index_out_of_range'));
  });

  it('reports step_limit by steps and by depth (S-047 TS-19)', () => {
    const b = createTreeBuilder();
    const spin = b.func(
      'spin',
      ['n'],
      [b.let('x', b.num(0)), b.while(b.bin('<', b.var('x'), b.num(1)), []), b.return(b.var('x'))],
    );
    expect(evaluate(spin, [0])).toEqual(fail('step_limit'));
    expect(evaluate(treeA().tree, [10], { maxSteps: 10 })).toEqual(fail('step_limit'));
    expect(evaluate(treeA().tree, [10])).toEqual(ok(81));
    const c = createTreeBuilder();
    const deep = c.func('deep', ['n'], [c.return(c.call('deep', [c.var('n')]))]);
    expect(evaluate(deep, [1])).toEqual(fail('step_limit'));
  });

  it('validates the arguments (S-047 TS-20)', () => {
    const m = maxIndex().tree;
    expect(() => evaluate(m, [5])).toThrow(new RangeError('invalid_argument: 5'));
    expect(() => evaluate(m, [[1.5]])).toThrow(new RangeError('invalid_argument: [1.5]'));
    expect(() => evaluate(m, [[1], [2]])).toThrow(
      new RangeError('arity_mismatch: expected 1, got 2'),
    );
    expect(() => evaluate(treeA().tree, [[1]])).toThrow(new RangeError('invalid_argument: [1]'));
    expect(() => evaluate(rem(), [2147483648])).toThrow(
      new RangeError('invalid_argument: 2147483648'),
    );
  });

  it('is pure and does not modify its inputs (S-047 TS-21)', () => {
    const random = vi.spyOn(Math, 'random');
    const now = vi.spyOn(Date, 'now');
    const input = Object.freeze([5, 1, 5]);
    const m = maxIndex().tree;
    expect(evaluate(m, [input])).toEqual(ok(0));
    expect(evaluate(m, [input])).toEqual(ok(0));
    expect(random).not.toHaveBeenCalled();
    expect(now).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('throws on malformed trees', () => {
    const b = createTreeBuilder();
    const unbound = b.func('f', ['n'], [b.return(b.var('x'))]);
    expect(() => evaluate(unbound, [1])).toThrow(new Error('evaluate: unbound x'));
    const c = createTreeBuilder();
    const other = c.func('f', ['n'], [c.return(c.call('g', []))]);
    expect(() => evaluate(other, [1])).toThrow(new Error('evaluate: unknown function g'));
    const d = createTreeBuilder();
    const none: FuncNode = d.func('f', ['n'], []);
    expect(() => evaluate(none, [1])).toThrow(new Error('evaluate: missing return'));
  });
});
