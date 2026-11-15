import { createTreeBuilder, evaluate } from '@nerdose/polyglot';
import { describe, expect, it } from 'vitest';

import { conditionHolds, conditionTree, type ElementCondition } from './conditions';

describe('conditionTree vs conditionHolds', () => {
  const conds: ElementCondition[] = [
    'gt',
    'lt',
    'negative',
    'nonnegative',
    'even',
    'odd',
    'multiple',
  ];
  it.each(conds)('%s agrees for values and thresholds in [-9, 20]', (cond) => {
    const b = createTreeBuilder();
    const test = conditionTree(cond, b, b.var('x'), b.var('k'), 3);
    const func = b.func(
      'f',
      [
        { name: 'x', type: 'int' },
        { name: 'k', type: 'int' },
      ],
      [b.return(b.var('x'))],
      'int',
    );
    const wrapper = b.func(
      'g',
      [
        { name: 'x', type: 'int' },
        { name: 'k', type: 'int' },
      ],
      [
        b.let('r', b.bool(false), 'bool'),
        b.if(test, [b.assign('r', b.bool(true))]),
        b.return(b.var('r')),
      ],
      'bool',
    );
    void func;
    for (let x = -9; x <= 20; x++) {
      for (const k of [-9, -1, 0, 3, 20]) {
        expect(evaluate(wrapper, [x, k])).toEqual({
          ok: true,
          value: conditionHolds(cond, x, k, 3),
        });
      }
    }
  });
});
