import { describe, expect, it } from 'vitest';
import { createTreeBuilder } from '../../src/tree/builder';
import { treeA } from '../fixtures/trees';

describe('createTreeBuilder', () => {
  it('assigns ids in construction order, children first (TS-3)', () => {
    const b = createTreeBuilder();
    const v = b.var('n');
    const r = b.return(v);
    const f = b.func('f', ['n'], [r]);
    expect([v.id, r.id, f.id]).toEqual(['n1', 'n2', 'n3']);
  });

  it('builds identical trees with two builders (TS-4)', () => {
    const one = treeA();
    const two = treeA();
    expect(one.tree).toEqual(two.tree);
    expect(one.tree.body[0]).toMatchObject({ kind: 'let', expr: { id: 'n1' } });
  });

  it('is serializable plain data', () => {
    const { tree } = treeA();
    expect(JSON.parse(JSON.stringify(tree))).toEqual(tree);
  });

  it('rejects invalid identifiers (TS-5)', () => {
    const b = createTreeBuilder();
    expect(() => b.var('Main')).toThrow(new Error('invalid_identifier: Main'));
    expect(() => b.let('int', b.num(0))).toThrow(new Error('invalid_identifier: int'));
    expect(() => b.var('2x')).toThrow(new Error('invalid_identifier: 2x'));
    expect(() => b.func('main', ['n'], [])).toThrow(new Error('invalid_identifier: main'));
    expect(() => b.var('args')).toThrow(new Error('invalid_identifier: args'));
  });

  it('rejects numbers outside the portable subset (TS-6)', () => {
    const b = createTreeBuilder();
    expect(b.num(-1)).toMatchObject({ kind: 'num', value: -1 });
    expect(b.num(-2147483648)).toMatchObject({ value: -2147483648 });
    expect(b.num(2147483647)).toMatchObject({ value: 2147483647 });
    expect(() => b.num(-2147483649)).toThrow(new RangeError('invalid_number: -2147483649'));
    expect(() => b.num(1.5)).toThrow(new RangeError('invalid_number: 1.5'));
    expect(() => b.num(2 ** 31)).toThrow(new RangeError('invalid_number: 2147483648'));
  });

  it('keeps the untyped func node as before (S-047 TS-1)', () => {
    const b = createTreeBuilder();
    const f = b.func('f', ['n'], [b.return(b.var('n'))]);
    expect(f).toEqual({
      kind: 'func',
      id: 'n3',
      name: 'f',
      params: ['n'],
      body: [{ kind: 'return', id: 'n2', expr: { kind: 'var', id: 'n1', name: 'n' } }],
    });
    expect(Object.keys(f)).toEqual(['kind', 'id', 'name', 'params', 'body']);
    const json = JSON.stringify(treeA().tree);
    for (const key of ['"paramTypes"', '"returns"', '"type"']) expect(json).not.toContain(key);
  });

  it('builds typed signatures (S-047 TS-2)', () => {
    const b = createTreeBuilder();
    expect(
      b.func('maxIndex', [{ name: 'nums', type: 'int[]' }], [b.return(b.num(0))], 'int'),
    ).toMatchObject({
      params: ['nums'],
      paramTypes: ['int[]'],
      returns: 'int',
    });
    expect(b.func('g', [{ name: 'k', type: 'int' }], [b.return(b.var('k'))])).toMatchObject({
      paramTypes: ['int'],
      returns: 'int',
    });
    expect(b.func('h', ['n'], [], 'bool')).toMatchObject({ params: ['n'], returns: 'bool' });
    expect(() => b.func('h', [{ name: 'len', type: 'int' }], [])).toThrow(
      new Error('invalid_identifier: len'),
    );
  });

  it('types a let only when it is not int (S-047 TS-3)', () => {
    const b = createTreeBuilder();
    expect(b.let('found', b.bool(false), 'bool')).toMatchObject({
      kind: 'let',
      name: 'found',
      type: 'bool',
      expr: { kind: 'bool', value: false },
    });
    expect('type' in b.let('x', b.num(0))).toBe(false);
    expect('type' in b.let('y', b.num(0), 'int')).toBe(false);
  });

  it('creates the new nodes and operators (S-047 TS-4)', () => {
    const b = createTreeBuilder();
    expect(b.bool(true)).toMatchObject({ kind: 'bool', value: true });
    expect(b.index(b.var('nums'), b.var('i'))).toMatchObject({
      kind: 'index',
      array: { kind: 'var', name: 'nums' },
      index: { kind: 'var', name: 'i' },
    });
    expect(b.len(b.var('nums'))).toMatchObject({ kind: 'len', array: { name: 'nums' } });
    expect(b.compound('sum', '-=', b.num(1))).toMatchObject({ kind: 'compound', op: '-=' });
    for (const op of ['!=', '&&', '||'] as const) {
      expect(b.bin(op, b.var('a'), b.var('b'))).toMatchObject({ kind: 'bin', op });
    }
  });

  it('only accepts a positive literal as the divisor of % (S-047 TS-6)', () => {
    const b = createTreeBuilder();
    expect(b.bin('%', b.var('x'), b.num(2))).toMatchObject({ op: '%' });
    for (const divisor of [b.num(0), b.num(-2), b.var('k')]) {
      expect(() => b.bin('%', b.var('x'), divisor)).toThrow(
        new RangeError('invalid_modulo_divisor'),
      );
    }
  });
});
