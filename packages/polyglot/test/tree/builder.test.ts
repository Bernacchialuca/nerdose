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
    expect(() => b.num(-1)).toThrow(new RangeError('invalid_number: -1'));
    expect(() => b.num(1.5)).toThrow(new RangeError('invalid_number: 1.5'));
    expect(() => b.num(2 ** 31)).toThrow(new RangeError('invalid_number: 2147483648'));
    expect(() => b.num(2147483647)).not.toThrow();
  });
});
