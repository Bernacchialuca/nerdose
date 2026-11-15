import { randomArray } from '../random';
import type { BuiltTemplate, Template, TemplateParams, TestInput } from '../types';

import { conditionHolds, conditionOperators, PHRASES, type ElementCondition } from './conditions';
import { arrayArg, elementAt, indexLoop, intParam, loc, NUMS, scalarArg, site } from './helpers';

const NAME = {
  gt: 'allAbove',
  lt: 'allBelow',
  nonnegative: 'allNonNegative',
  even: 'allEven',
} as const;
const cond = (p: TemplateParams) => p.condition as 'gt' | 'lt' | 'nonnegative' | 'even';
const usesK = (p: TemplateParams) => p.condition === 'gt' || p.condition === 'lt';

export const allWhere: Template = {
  id: 'all_where',
  combos: [
    { condition: 'gt' },
    { condition: 'lt' },
    { condition: 'nonnegative' },
    { condition: 'even' },
  ],
  functionName: (p) => NAME[cond(p)],
  build(p, b): BuiltTemplate {
    const init = b.bool(true);
    const element = elementAt(b, b.var('i'));
    // The condition that spots an element that fails.
    const failure = (() => {
      switch (cond(p)) {
        case 'gt':
          return b.bin('<=', element, b.var('k'));
        case 'lt':
          return b.bin('>=', element, b.var('k'));
        case 'nonnegative':
          return b.bin('<', element, b.num(0));
        case 'even':
          return b.bin('!=', b.bin('%', element, b.num(2)), b.num(0));
      }
    })();
    const update = b.assign('ok', b.bool(false));
    const loop = indexLoop(b, 0, [b.if(failure, [update])]);
    const func = b.func(
      NAME[cond(p)],
      usesK(p) ? [NUMS, intParam('k')] : [NUMS],
      [b.let('ok', init, 'bool'), loop.stmt, b.return(b.var('ok'))],
      'bool',
    );
    return {
      func,
      sites: [
        site(init.id, ['flip_bool_init'], loc('el valor inicial de ok', 'the initial value of ok')),
        site(
          loop.start.id,
          ['loop_start_shift'],
          loc('el inicio del recorrido', 'the start of the loop'),
        ),
        site(loop.bound.id, ['bound_minus_one'], loc('el límite del recorrido', 'the loop bound')),
        site(
          failure.id,
          conditionOperators(failure),
          loc(
            'la condición que detecta un elemento que no cumple',
            'the condition that spots an element that fails',
          ),
        ),
        site(update.id, ['early_return'], loc('la actualización de ok', 'the update of ok'), {
          returns: ['ok'],
        }),
      ],
    };
  },
  spec(p) {
    const phrase = PHRASES[cond(p) as ElementCondition].plural;
    return {
      es: `Devuelve true si todos los elementos de nums son ${phrase.es}; si alguno no lo es, false. Con nums vacío devuelve true.`,
      en: `Returns true if every element of nums is ${phrase.en}; if any is not, false. With an empty nums it returns true.`,
    };
  },
  edgeCases(p): readonly TestInput[] {
    if (usesK(p))
      return [
        [[], 3],
        [[3], 3],
        [[4, 9], 3],
        [[5, 2, 8], 3],
        [[9, 9, 1], 3],
      ];
    if (cond(p) === 'nonnegative') return [[[]], [[0]], [[3, -1]], [[-2, 4, 5]], [[1, 2, 3]]];
    return [[[]], [[0]], [[2, 4, 7]], [[3, 2]], [[-4, 6]]];
  },
  randomInput(rng, p): TestInput {
    const nums = randomArray(rng, 0, 7);
    return usesK(p) ? [nums, rng.int(-9, 20)] : [nums];
  },
  reference(p, input) {
    const k = usesK(p) ? scalarArg(input, 1) : undefined;
    return arrayArg(input).every((v) => conditionHolds(cond(p), v, k));
  },
};
