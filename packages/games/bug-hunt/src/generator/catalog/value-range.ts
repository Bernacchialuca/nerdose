import { randomArray } from '../random';
import type { BuiltTemplate, Template, TemplateParams, TestInput } from '../types';

import { arrayArg, elementAt, indexLoop, loc, NUMS, site } from './helpers';

const isRange = (p: TemplateParams) => p.result === 'range';
const nameOf = (p: TemplateParams) => (isRange(p) ? 'valueRange' : 'minPlusMax');

/** Two accumulators (`lo`, `hi`) in the same loop and the answer computed after it. */
export const valueRange: Template = {
  id: 'value_range',
  combos: [{ result: 'range' }, { result: 'sum' }],
  functionName: nameOf,
  build(p, b): BuiltTemplate {
    const swapHi = b.var('hi');
    const hiCond = b.bin('>', elementAt(b, b.var('i')), swapHi);
    const loop = indexLoop(b, 1, [
      b.if(b.bin('<', elementAt(b, b.var('i')), b.var('lo')), [
        b.assign('lo', elementAt(b, b.var('i'))),
      ]),
      b.if(hiCond, [b.assign('hi', elementAt(b, b.var('i')))]),
    ]);
    const swapLo = b.var('lo');
    const result = b.bin(isRange(p) ? '-' : '+', b.var('hi'), swapLo);
    const func = b.func(
      nameOf(p),
      [NUMS],
      [
        b.let('lo', elementAt(b, b.num(0))),
        b.let('hi', elementAt(b, b.num(0))),
        loop.stmt,
        b.return(result),
      ],
      'int',
    );
    return {
      func,
      sites: [
        site(loop.bound.id, ['bound_minus_one'], loc('el límite del recorrido', 'the loop bound')),
        site(
          hiCond.id,
          ['negate_condition'],
          loc(
            'la condición que decide si hi cambia',
            'the condition that decides whether hi changes',
          ),
        ),
        site(
          swapHi.id,
          ['swap_variable'],
          loc('el valor contra el que se compara para hi', 'the value compared against for hi'),
          { swaps: ['lo'] },
        ),
        site(result.id, ['swap_arith'], loc('la cuenta del final', 'the final arithmetic')),
        site(
          swapLo.id,
          ['swap_variable'],
          isRange(p)
            ? loc('el valor que se le resta a hi', 'the value subtracted from hi')
            : loc('el valor que se le suma a hi', 'the value added to hi'),
          { swaps: ['hi'] },
        ),
      ],
    };
  },
  spec(p) {
    return isRange(p)
      ? {
          es: 'Devuelve el mayor valor de nums menos el menor. nums tiene al menos un elemento.',
          en: 'Returns the largest value of nums minus the smallest. nums has at least one element.',
        }
      : {
          es: 'Devuelve la suma del mayor y el menor valor de nums. nums tiene al menos un elemento.',
          en: 'Returns the sum of the largest and the smallest value of nums. nums has at least one element.',
        };
  },
  // With 0 as the smallest value `hi - lo` and `hi + lo` agree: a few cases where they do.
  edgeCases: () => [
    [[5]],
    [[0]],
    [[3, 3]],
    [[0, 9]],
    [[9, 2]],
    [[4, -1, 7, 0]],
    [[6, 0, 6]],
    [[1, 6, 6, 1]],
  ],
  randomInput: (rng): TestInput => [randomArray(rng, 1, 7)],
  reference(p, input) {
    const nums = arrayArg(input);
    const hi = Math.max(...nums);
    const lo = Math.min(...nums);
    return isRange(p) ? hi - lo : hi + lo;
  },
};
