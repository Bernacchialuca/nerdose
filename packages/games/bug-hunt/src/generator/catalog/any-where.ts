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

const NAME = { gt: 'anyAbove', lt: 'anyBelow', negative: 'anyNegative', odd: 'anyOdd' } as const;
const cond = (p: TemplateParams) => p.condition as 'gt' | 'lt' | 'negative' | 'odd';
const usesK = (p: TemplateParams) => p.condition === 'gt' || p.condition === 'lt';

export const anyWhere: Template = {
  id: 'any_where',
  combos: [
    { condition: 'gt' },
    { condition: 'lt' },
    { condition: 'negative' },
    { condition: 'odd' },
  ],
  functionName: (p) => NAME[cond(p)],
  build(p, b): BuiltTemplate {
    const init = b.bool(false);
    const test = conditionTree(
      cond(p) as ElementCondition,
      b,
      elementAt(b, b.var('i')),
      usesK(p) ? b.var('k') : undefined,
    );
    const update = b.assign('found', b.bool(true));
    const loop = indexLoop(b, 0, [b.if(test, [update])]);
    const func = b.func(
      NAME[cond(p)],
      usesK(p) ? [NUMS, intParam('k')] : [NUMS],
      [b.let('found', init, 'bool'), loop.stmt, b.return(b.var('found'))],
      'bool',
    );
    return {
      func,
      sites: [
        site(
          init.id,
          ['flip_bool_init'],
          loc('el valor inicial de found', 'the initial value of found'),
        ),
        site(
          loop.start.id,
          ['loop_start_shift'],
          loc('el inicio del recorrido', 'the start of the loop'),
        ),
        site(loop.bound.id, ['bound_minus_one'], loc('el límite del recorrido', 'the loop bound')),
        site(
          test.id,
          conditionOperators(test),
          loc(
            'la condición que decide si encontró uno',
            'the condition that decides whether one was found',
          ),
        ),
        site(update.id, ['early_return'], loc('la actualización de found', 'the update of found'), {
          returns: ['found'],
        }),
      ],
    };
  },
  spec(p) {
    const phrase = PHRASES[cond(p) as ElementCondition].singular;
    return {
      es: `Devuelve true si algún elemento de nums es ${phrase.es}; si no, false.`,
      en: `Returns true if some element of nums is ${phrase.en}; otherwise false.`,
    };
  },
  edgeCases(p): readonly TestInput[] {
    if (usesK(p))
      return [
        [[], 3],
        [[3], 3],
        [[1, 2], 3],
        [[4, 9], 3],
        [[1, 7, 2], 5],
        [[9, 1], 3],
        [[1, 9], 3],
      ];
    if (cond(p) === 'negative') return [[[]], [[0]], [[3, -1]], [[-2, 4]], [[1, 2]]];
    return [[[]], [[0]], [[-3, 4]], [[2, 5]], [[2, 4, 6]]];
  },
  randomInput(rng, p): TestInput {
    const nums = randomArray(rng, 0, 7);
    return usesK(p) ? [nums, rng.int(-9, 20)] : [nums];
  },
  reference(p, input) {
    const k = usesK(p) ? scalarArg(input, 1) : undefined;
    return arrayArg(input).some((v) => conditionHolds(cond(p), v, k));
  },
};
