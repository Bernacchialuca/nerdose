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
  gt: 'firstAbove',
  lt: 'firstBelow',
  negative: 'firstNegative',
  even: 'firstEven',
} as const;
const cond = (p: TemplateParams) => p.condition as 'gt' | 'lt' | 'negative' | 'even';
const usesK = (p: TemplateParams) => p.condition === 'gt' || p.condition === 'lt';
const missingIsLength = (p: TemplateParams) => p.missing === 'length';

export const firstIndexWhere: Template = {
  id: 'first_index_where',
  combos: (['gt', 'lt', 'negative', 'even'] as const).flatMap((condition) => [
    { condition, missing: 'minus_one' },
    { condition, missing: 'length' },
  ]),
  functionName: (p) => NAME[cond(p)],
  build(p, b): BuiltTemplate {
    const lengthMissing = missingIsLength(p);
    const init = lengthMissing ? b.len(b.var('nums')) : b.num(-1);
    const elementCond = conditionTree(
      cond(p) as ElementCondition,
      b,
      elementAt(b, b.var('i')),
      usesK(p) ? b.var('k') : undefined,
    );
    const guard = lengthMissing
      ? b.bin('==', b.var('found'), b.len(b.var('nums')))
      : b.bin('<', b.var('found'), b.num(0));
    const both = b.bin('&&', elementCond, guard);
    const update = b.assign('found', b.var('i'));
    const loop = indexLoop(b, 0, [b.if(both, [update])]);
    const func = b.func(
      NAME[cond(p)],
      usesK(p) ? [NUMS, intParam('k')] : [NUMS],
      [b.let('found', init), loop.stmt, b.return(b.var('found'))],
      'int',
    );
    return {
      func,
      sites: [
        ...(lengthMissing
          ? []
          : [
              site(
                init.id,
                ['shift_init'],
                loc('el valor inicial de found', 'the initial value of found'),
              ),
            ]),
        site(
          loop.start.id,
          ['loop_start_shift'],
          loc('el inicio del recorrido', 'the start of the loop'),
        ),
        site(loop.bound.id, ['bound_minus_one'], loc('el límite del recorrido', 'the loop bound')),
        site(
          elementCond.id,
          conditionOperators(elementCond),
          loc('la condición sobre el elemento', 'the condition on the element'),
        ),
        site(
          both.id,
          ['swap_logical'],
          loc('la combinación de las dos condiciones', 'the combination of the two conditions'),
        ),
        site(
          guard.id,
          conditionOperators(guard),
          loc(
            'la condición que evita pisar el primero',
            'the condition that keeps the first match',
          ),
        ),
        site(update.id, ['early_return'], loc('la actualización de found', 'the update of found'), {
          returns: ['found'],
        }),
      ],
    };
  },
  spec(p) {
    const phrase = PHRASES[cond(p)].singular;
    return {
      es: `Devuelve la posición del primer elemento de nums ${phrase.es}; si no hay ninguno, ${missingIsLength(p) ? 'la longitud de nums' : '-1'}.`,
      en: `Returns the position of the first element of nums that is ${phrase.en}; if there is none, ${missingIsLength(p) ? 'the length of nums' : '-1'}.`,
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
      return [[[]], [[0]], [[3, -1, -4]], [[-2, 5, -7]], [[1, 2]], [[-3]], [[1, -2]]];
    }
    return [[[]], [[1]], [[3, 4, 6]], [[2, 1, 8]], [[-3, 5]], [[4]], [[1, 6]]];
  },
  randomInput(rng, p): TestInput {
    const nums = randomArray(rng, 0, 7);
    return usesK(p) ? [nums, rng.int(-9, 20)] : [nums];
  },
  reference(p, input) {
    const nums = arrayArg(input);
    const k = usesK(p) ? scalarArg(input, 1) : undefined;
    const at = nums.findIndex((v) => conditionHolds(cond(p), v, k));
    if (at >= 0) return at;
    return missingIsLength(p) ? nums.length : -1;
  },
};
