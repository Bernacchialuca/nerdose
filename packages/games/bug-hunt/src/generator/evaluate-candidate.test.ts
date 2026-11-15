import {
  createTreeBuilder,
  replaceNode,
  type FuncNode,
  type NodeId,
  type TreeBuilder,
} from '@nerdose/polyglot';
import { describe, expect, it } from 'vitest';

import type { MutationCandidate } from './mutation/candidates';
import type { MutationSite } from './types';
import { evaluateCandidate } from './evaluate-candidate';
import { varietyKey } from './variety';

const nums = (b: TreeBuilder) => b.var('nums');
const NUMS = [{ name: 'nums', type: 'int[]' as const }];
const site = (node: NodeId): MutationSite => ({ node, operators: [], role: { es: 'a', en: 'a' } });

function maxIndex() {
  const b = createTreeBuilder();
  const start = b.num(1);
  const bound = b.len(nums(b));
  const func = b.func(
    'maxIndex',
    NUMS,
    [
      b.let('best', b.num(0)),
      b.for(b.let('i', start), b.bin('<', b.var('i'), bound), b.inc('i'), [
        b.if(b.bin('>', b.index(nums(b), b.var('i')), b.index(nums(b), b.var('best'))), [
          b.assign('best', b.var('i')),
        ]),
      ]),
      b.return(b.var('best')),
    ],
    'int',
  );
  return { func, start, bound };
}

const candidate = (
  func: FuncNode,
  node: NodeId,
  build: Parameters<typeof replaceNode>[2],
  to: string,
): MutationCandidate => ({
  site: site(node),
  operator: 'bound_minus_one',
  from: 'x',
  to,
  mutant: replaceNode(func, node, build),
});

const id = { template: 't', params: {} };
const inputs = [[], [4], [3, 7, 2], [1, 9], [9, 1]];
const expecteds = [0, 0, 1, 1, 0];
const withExpected = () => inputs.map((a, i) => ({ input: [a], expected: expecteds[i] as number }));

describe('evaluateCandidate', () => {
  const { func, start, bound } = maxIndex();
  const generated = withExpected();

  it('flags an equivalent mutant', () => {
    const c = candidate(func, start.id, (_n, b) => b.num(0), '0');
    expect(evaluateCandidate(c, generated, new Set(), id).verdict).toBe('equivalent');
  });

  it('accepts a mutant that fails some tests and passes enough', () => {
    const c = candidate(func, bound.id, (n, b) => b.bin('-', n as never, b.num(1)), 'len - 1');
    const r = evaluateCandidate(c, generated, new Set(), id);
    expect(r.verdict).toBe('ok');
    expect(r.verdict === 'ok' && r.selection.failing.input).toEqual([[1, 9]]);
  });

  it('flags too few passing tests', () => {
    const c = candidate(func, bound.id, (_n, b) => b.num(0), '0');
    const r = evaluateCandidate(c, generated, new Set(), id);
    expect(['not_enough_passing', 'ok']).toContain(r.verdict);
    const few = candidate(func, bound.id, (_n, b) => b.num(1), '1');
    const onlyOne = generated.map((t, i) => ({ ...t, expected: i === 0 ? 0 : 9 }));
    expect(evaluateCandidate(few, onlyOne, new Set(), id).verdict).toBe('not_enough_passing');
  });

  it('flags a repeated key as variety', () => {
    const c = candidate(func, bound.id, (n, b) => b.bin('-', n as never, b.num(1)), 'len - 1');
    const key = varietyKey({
      template: 't',
      params: {},
      mutation: { operator: c.operator, node: bound.id, from: c.from, to: c.to },
    });
    expect(evaluateCandidate(c, generated, new Set([key]), id).verdict).toBe('variety');
  });

  it('flags a mutant that does not evaluate or is not portable', () => {
    const oob = candidate(func, start.id, (_n, b) => b.num(1), '1');
    const b = createTreeBuilder();
    const broken = b.func('f', NUMS, [b.return(b.index(nums(b), b.num(3)))], 'int');
    const c = { ...oob, mutant: broken };
    expect(evaluateCandidate(c, [{ input: [[1]], expected: 0 }], new Set(), id).verdict).toBe(
      'invalid',
    );
    const unused = createTreeBuilder();
    const nonPortable = unused.func(
      'f',
      NUMS,
      [unused.let('x', unused.num(1)), unused.return(unused.num(0))],
      'int',
    );
    expect(
      evaluateCandidate(
        { ...oob, mutant: nonPortable },
        [{ input: [[1]], expected: 0 }],
        new Set(),
        id,
      ).verdict,
    ).toBe('invalid');
  });
});
