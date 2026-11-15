import { randomArray } from '../random';
import type { BuiltTemplate, Template, TemplateParams, TestInput } from '../types';

import { arrayArg, elementAt, intParam, loc, NUMS, scalarArg, site } from './helpers';

const max = (p: TemplateParams) => p.extreme === 'max';

export const maxWindowSum: Template = {
  id: 'max_window_sum',
  combos: [{ extreme: 'max' }, { extreme: 'min' }],
  functionName: (p) => (max(p) ? 'maxWindowSum' : 'minWindowSum'),
  build(p, b): BuiltTemplate {
    const init = b.num(0);
    const firstBound = b.var('k');
    const firstFor = b.for(b.let('i', b.num(0)), b.bin('<', b.var('i'), firstBound), b.inc('i'), [
      b.compound('sum', '+=', elementAt(b, b.var('i'))),
    ]);
    const secondStart = b.var('k');
    const slide = b.bin(
      '-',
      elementAt(b, b.var('i')),
      elementAt(b, b.bin('-', b.var('i'), b.var('k'))),
    );
    const accumulate = b.compound('sum', '+=', slide);
    const swapBest = b.var('best');
    const cond = b.bin(max(p) ? '>' : '<', b.var('sum'), swapBest);
    const update = b.assign('best', b.var('sum'));
    const secondFor = b.for(
      b.let('i', secondStart),
      b.bin('<', b.var('i'), b.len(b.var('nums'))),
      b.inc('i'),
      [accumulate, b.if(cond, [update])],
    );
    const func = b.func(
      max(p) ? 'maxWindowSum' : 'minWindowSum',
      [NUMS, intParam('k')],
      [
        b.let('sum', init),
        firstFor,
        b.let('best', b.var('sum')),
        secondFor,
        b.return(b.var('best')),
      ],
      'int',
    );
    return {
      func,
      sites: [
        site(
          firstBound.id,
          ['bound_minus_one'],
          loc('el límite de la primera ventana', 'the bound of the first window'),
        ),
        site(
          secondStart.id,
          ['bound_plus_one'],
          loc('el inicio del segundo recorrido', 'the start of the second loop'),
        ),
        site(accumulate.id, ['swap_compound'], loc('la actualización de sum', 'the update of sum')),
        site(
          slide.id,
          ['swap_arith'],
          loc('la cuenta que desliza la ventana', 'the arithmetic that slides the window'),
        ),
        site(
          cond.id,
          ['negate_condition'],
          loc(
            'la condición que decide si best cambia',
            'the condition that decides whether best changes',
          ),
        ),
        site(
          swapBest.id,
          ['swap_variable'],
          loc('el valor con el que se compara sum', 'the value sum is compared with'),
          { swaps: ['sum'] },
        ),
        site(update.id, ['early_return'], loc('la actualización de best', 'the update of best'), {
          returns: ['best', 'sum'],
        }),
      ],
    };
  },
  spec(p) {
    return {
      es: `Devuelve la ${max(p) ? 'mayor' : 'menor'} suma de k elementos seguidos de nums. k es al menos 1 y nums tiene al menos k elementos.`,
      en: `Returns the ${max(p) ? 'largest' : 'smallest'} sum of k consecutive elements of nums. k is at least 1 and nums has at least k elements.`,
    };
  },
  edgeCases: () => [
    [[5], 1],
    [[2, -1, 4], 1],
    [[2, -1, 4], 3],
    [[1, 2, 3, 4], 2],
    [[-3, -1, -2], 2],
    [[4, 0, 0, 4], 2],
  ],
  randomInput(rng): TestInput {
    const nums = randomArray(rng, 1, 7);
    return [nums, rng.int(1, nums.length)];
  },
  reference(p, input) {
    const nums = arrayArg(input);
    const k = scalarArg(input, 1);
    const sums: number[] = [];
    for (let start = 0; start + k <= nums.length; start++) {
      sums.push(nums.slice(start, start + k).reduce((a, v) => a + v, 0));
    }
    return max(p) ? Math.max(...sums) : Math.min(...sums);
  },
};
