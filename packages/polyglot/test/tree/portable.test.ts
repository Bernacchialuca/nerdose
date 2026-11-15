import { describe, expect, it } from 'vitest';
import { createTreeBuilder } from '../../src/tree/builder';
import { checkPortable } from '../../src/tree/portable';
import { allTrees } from '../fixtures/trees';

const b = () => createTreeBuilder();

describe('checkPortable', () => {
  it('accepts every fixture (S-047 TS-25)', () => {
    for (const [name, tree] of Object.entries(allTrees())) {
      expect(checkPortable(tree), name).toEqual([]);
    }
  });

  it('reports type mismatches (S-047 TS-26)', () => {
    {
      const t = b();
      const cond = t.var('n');
      const f = t.func('f', ['n'], [t.if(cond, [t.return(t.num(1))]), t.return(t.num(0))]);
      expect(checkPortable(f)).toEqual([{ kind: 'type_mismatch', nodeId: cond.id }]);
    }
    {
      const t = b();
      const value = t.bool(true);
      const f = t.func('t', [{ name: 'n', type: 'int' }], [t.return(value)], 'int');
      expect(checkPortable(f)).toEqual([{ kind: 'type_mismatch', nodeId: value.id }]);
    }
    {
      const t = b();
      const nums = t.var('nums');
      const f = t.func(
        't',
        [{ name: 'nums', type: 'int[]' }],
        [t.let('x', nums), t.return(t.var('x'))],
      );
      expect(checkPortable(f)).toEqual([{ kind: 'type_mismatch', nodeId: nums.id }]);
    }
    {
      const t = b();
      const flag = t.bool(true);
      const f = t.func('f', ['n'], [t.return(t.bin('+', flag, t.num(1)))]);
      expect(checkPortable(f)).toEqual([{ kind: 'type_mismatch', nodeId: flag.id }]);
    }
    {
      const t = b();
      const n = t.var('n');
      const f = t.func('f', ['n'], [t.return(t.len(n))]);
      expect(checkPortable(f)).toEqual([{ kind: 'type_mismatch', nodeId: n.id }]);
    }
    {
      const t = b();
      const missing = t.var('missing');
      const f = t.func('f', ['n'], [t.return(missing)]);
      expect(checkPortable(f)).toEqual([{ kind: 'type_mismatch', nodeId: missing.id }]);
    }
  });

  it('reports unused locals (S-047 TS-27)', () => {
    {
      const t = b();
      const tmp = t.let('tmp', t.num(0));
      const f = t.func('f', ['n'], [tmp, t.return(t.var('n'))]);
      expect(checkPortable(f)).toEqual([{ kind: 'unused_local', nodeId: tmp.id }]);
    }
    {
      const t = b();
      const x = t.let('x', t.num(0));
      const f = t.func('f', ['n'], [x, t.assign('x', t.num(1)), t.return(t.var('n'))]);
      expect(checkPortable(f)).toEqual([{ kind: 'unused_local', nodeId: x.id }]);
    }
    {
      const t = b();
      const f = t.func('f', ['n'], [t.let('x', t.num(0)), t.return(t.var('x'))]);
      expect(checkPortable(f)).toEqual([]);
    }
  });

  it('reports unreachable statements (S-047 TS-28)', () => {
    {
      const t = b();
      const second = t.return(t.num(1));
      const f = t.func('f', ['n'], [t.return(t.num(0)), second]);
      expect(checkPortable(f)).toEqual([{ kind: 'unreachable_statement', nodeId: second.id }]);
    }
    {
      const t = b();
      const dead = t.inc('n');
      const f = t.func(
        'f',
        ['n'],
        [t.if(t.bin('>', t.var('n'), t.num(0)), [t.return(t.num(1)), dead]), t.return(t.num(0))],
      );
      expect(checkPortable(f)).toEqual([{ kind: 'unreachable_statement', nodeId: dead.id }]);
    }
    {
      const t = b();
      const loop = t.while(t.bool(true), [t.compound('x', '+=', t.num(1))]);
      const f = t.func('f', ['n'], [t.let('x', t.num(0)), loop, t.return(t.var('x'))]);
      expect(checkPortable(f)).toEqual([{ kind: 'unreachable_statement', nodeId: loop.id }]);
    }
    {
      const t = b();
      const loop = t.for(t.let('i', t.num(0)), t.bin('<', t.num(1), t.num(2)), t.inc('i'), [
        t.compound('x', '+=', t.var('i')),
      ]);
      const f = t.func('f', ['n'], [t.let('x', t.num(0)), loop, t.return(t.var('x'))]);
      expect(checkPortable(f)).toEqual([{ kind: 'unreachable_statement', nodeId: loop.id }]);
    }
  });

  it('reports a missing return (S-047 TS-29)', () => {
    const t = b();
    const f = t.func('f', ['n'], [t.if(t.bin('>', t.var('n'), t.num(0)), [t.return(t.num(1))])]);
    expect(checkPortable(f)).toEqual([{ kind: 'missing_return', nodeId: f.id }]);
    const u = b();
    const empty = u.func('f', ['n'], []);
    expect(checkPortable(empty)).toEqual([{ kind: 'missing_return', nodeId: empty.id }]);
  });
});
