import { randomArray } from '../random';
import type { BuiltTemplate, Template, TemplateParams, TestInput } from '../types';

import {
  conditionHolds,
  conditionOperators,
  conditionTree,
  PHRASES,
  type ElementCondition,
} from './conditions';
import { arrayArg, elementAt, indexLoop, intParam, loc, NUMS, scalarArg, site } from './helpers';

const NAME = {
  gt: 'lastAbove',
  lt: 'lastBelow',
  negative: 'lastNegative',
  even: 'lastEven',
} as const;
const cond = (p: TemplateParams) => p.condition as 'gt' | 'lt' | 'negative' | 'even';
const usesK = (p: TemplateParams) => p.condition === 'gt' || p.condition === 'lt';

export const lastIndexWhere: Template = {
  id: 'last_index_where',
  combos: [
    { condition: 'gt' },
    { condition: 'lt' },
    { condition: 'negative' },
    { condition: 'even' },
  ],
  functionName: (p) => NAME[cond(p)],
  build(p, b): BuiltTemplate {
    const init = b.num(-1);
    const test = conditionTree(
      cond(p) as ElementCondition,
      b,
      elementAt(b, b.var('i')),
      usesK(p) ? b.var('k') : undefined,
    );
    const comparison = conditionOperators(test).filter((o) => o !== 'negate_condition');
    const update = b.assign('found', b.var('i'));
    const loop = indexLoop(b, 0, [b.if(test, [update])]);
    const func = b.func(
      NAME[cond(p)],
      usesK(p) ? [NUMS, intParam('k')] : [NUMS],
      [b.let('found', init), loop.stmt, b.return(b.var('found'))],
      'int',
    );
    return {
      func,
      sites: [
        site(
          init.id,
          ['shift_init'],
          loc('el valor inicial de found', 'the initial value of found'),
        ),
        site(
          loop.start.id,
          ['loop_start_shift'],
          loc('el inicio del recorrido', 'the start of the loop'),
        ),
        site(loop.bound.id, ['bound_minus_one'], loc('el límite del recorrido', 'the loop bound')),
        // Negating the condition leaves at most one passing test (the empty array): not offered.
        ...(comparison.length > 0
          ? [
              site(
                test.id,
                comparison,
                loc('la condición sobre el elemento', 'the condition on the element'),
              ),
            ]
          : []),
        site(update.id, ['early_return'], loc('la actualización de found', 'the update of found'), {
          returns: ['i', 'found'],
        }),
      ],
    };
  },
  spec(p) {
    const phrase = PHRASES[cond(p)].singular;
    return {
      es: `Devuelve la posición del último elemento de nums ${phrase.es}; si no hay ninguno, -1.`,
      en: `Returns the position of the last element of nums that is ${phrase.en}; if there is none, -1.`,
    };
  },
  edgeCases(p): readonly TestInput[] {
    if (usesK(p))
      return [
        [[], 3],
        [[3], 3],
        [[1, 5, 9], 4],
        [[9, 1, 9], 4],
        [[2, 2], 5],
      ];
    if (cond(p) === 'negative') {
      return [[[]], [[0]], [[3, -1, -4]], [[-2, 5, -7]], [[1, 2]]];
    }
    return [[[]], [[1]], [[3, 4, 6]], [[2, 1, 8]], [[-3, 5]]];
  },
  randomInput(rng, p): TestInput {
    const nums = randomArray(rng, 0, 7);
    return usesK(p) ? [nums, rng.int(-9, 20)] : [nums];
  },
  reference(p, input) {
    const nums = arrayArg(input);
    const k = usesK(p) ? scalarArg(input, 1) : undefined;
    for (let i = nums.length - 1; i >= 0; i--) {
      if (conditionHolds(cond(p), nums[i] as number, k)) return i;
    }
    return -1;
  },
};
