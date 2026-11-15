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

const cond = (p: TemplateParams) => p.condition as ElementCondition;
const divisorOf = (p: TemplateParams) => p.divisor as number | undefined;
const usesK = (p: TemplateParams) => p.condition === 'gt' || p.condition === 'lt';

const name = (p: TemplateParams): string => {
  switch (cond(p)) {
    case 'gt':
      return 'countAbove';
    case 'lt':
      return 'countBelow';
    case 'even':
      return 'countEven';
    case 'odd':
      return 'countOdd';
    default:
      return `countMultiplesOf${String(p.divisor)}`;
  }
};

export const countWhere: Template = {
  id: 'count_where',
  combos: [
    { condition: 'gt' },
    { condition: 'lt' },
    { condition: 'even' },
    { condition: 'odd' },
    { condition: 'multiple', divisor: 3 },
    { condition: 'multiple', divisor: 4 },
    { condition: 'multiple', divisor: 5 },
  ],
  functionName: name,
  build(p, b): BuiltTemplate {
    const init = b.num(0);
    const swapIdx = b.var('i');
    const test = conditionTree(
      cond(p),
      b,
      elementAt(b, swapIdx),
      usesK(p) ? b.var('k') : undefined,
      divisorOf(p),
    );
    const update = b.compound('count', '+=', b.num(1));
    const loop = indexLoop(b, 0, [b.if(test, [update])]);
    const func = b.func(
      name(p),
      usesK(p) ? [NUMS, intParam('k')] : [NUMS],
      [b.let('count', init), loop.stmt, b.return(b.var('count'))],
      'int',
    );
    return {
      func,
      sites: [
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
            'la condición que decide si count suma',
            'the condition that decides whether count goes up',
          ),
        ),
        site(
          update.id,
          ['swap_compound', 'early_return'],
          loc('la actualización de count', 'the update of count'),
          { returns: ['count'] },
        ),
        site(
          swapIdx.id,
          ['swap_variable'],
          loc('el índice del valor que se evalúa', 'the index of the value being checked'),
          { swaps: ['count'] },
        ),
      ],
    };
  },
  spec(p) {
    const phrase = PHRASES[cond(p)].plural;
    const d = String(p.divisor);
    const es = phrase.es.replace('{d}', d);
    const en = phrase.en.replace('{d}', d);
    const multiple = cond(p) === 'multiple';
    return {
      es: `Devuelve cuántos elementos de nums son ${es}.${multiple ? ' El 0 y los negativos también cuentan si son múltiplos.' : ''}`,
      en: `Returns how many elements of nums are ${en}.${multiple ? ' Zero and negative numbers count too when they are multiples.' : ''}`,
    };
  },
  edgeCases(p): readonly TestInput[] {
    if (usesK(p)) {
      return [
        [[], 3],
        [[3], 3],
        [[3, 3, 9], 3],
        [[-4, 0, 7], 0],
        [[9, 1, 9, 1], 5],
      ];
    }
    if (cond(p) === 'multiple') {
      const d = divisorOf(p) as number;
      return [[[]], [[0]], [[d, -d, 1]], [[1, 2, d + 1]], [[2 * d, 7, d]], [[d, 1]], [[1, d]]];
    }
    return [
      [[]],
      [[0]],
      [[-3, 4]],
      [[2, 2, 7]],
      [[1, 3, 5, 6]],
      cond(p) === 'even' ? [[1, 3]] : [[2, 4]],
    ];
  },
  randomInput(rng, p): TestInput {
    const nums = randomArray(rng, 0, 7);
    return usesK(p) ? [nums, rng.int(-9, 20)] : [nums];
  },
  reference(p, input) {
    const k = usesK(p) ? scalarArg(input, 1) : undefined;
    return arrayArg(input).filter((v) => conditionHolds(cond(p), v, k, divisorOf(p))).length;
  },
};
