import { randomArray } from '../random';
import type { BuiltTemplate, Template, TemplateParams, TestInput } from '../types';

import { arrayArg, elementAt, intParam, loc, NUMS, scalarArg, site } from './helpers';

const lower = (p: TemplateParams) => p.bound === 'lower';

export const binarySearch: Template = {
  id: 'binary_search',
  combos: [{ bound: 'lower' }, { bound: 'upper' }],
  functionName: (p) => (lower(p) ? 'lowerBound' : 'upperBound'),
  build(p, b): BuiltTemplate {
    const init = b.num(0);
    const bound = b.len(b.var('nums'));
    const moveIdx = b.var('mid');
    const right = b.bin(lower(p) ? '<' : '<=', elementAt(b, b.var('mid')), b.var('target'));
    const moveLo = b.assign('lo', b.bin('+', moveIdx, b.num(1)));
    const left = b.bin(lower(p) ? '>=' : '>', elementAt(b, b.var('mid')), b.var('target'));
    const moveHi = b.assign('hi', b.var('mid'));
    const func = b.func(
      lower(p) ? 'lowerBound' : 'upperBound',
      [NUMS, intParam('target')],
      [
        b.let('lo', init),
        b.let('hi', bound),
        b.while(b.bin('<', b.var('lo'), b.var('hi')), [
          b.let('mid', b.half(b.bin('+', b.var('lo'), b.var('hi')))),
          b.if(right, [moveLo]),
          b.if(left, [moveHi]),
        ]),
        b.return(b.var('lo')),
      ],
      'int',
    );
    return {
      func,
      sites: [
        site(init.id, ['shift_init'], loc('el valor inicial de lo', 'the initial value of lo')),
        site(
          bound.id,
          ['bound_minus_one'],
          loc('el extremo derecho del rango', 'the right end of the range'),
        ),
        // Only `lower` keeps a terminating loop when its comparison relaxes; negating either
        // condition leaves a case where no branch runs and the loop never ends.
        ...(lower(p)
          ? [
              site(
                right.id,
                ['relax_comparison' as const],
                loc(
                  'la condición que decide si el rango sigue por la derecha',
                  'the condition that decides whether the range moves right',
                ),
              ),
            ]
          : []),
        site(
          moveIdx.id,
          ['swap_variable'],
          loc('el punto desde el que avanza lo', 'the point lo moves past'),
          { swaps: ['hi'] },
        ),
        site(moveHi.id, ['early_return'], loc('la actualización de hi', 'the update of hi'), {
          returns: ['mid', 'lo'],
        }),
      ],
    };
  },
  spec(p) {
    return {
      es: `nums está ordenado de menor a mayor. Devuelve la primera posición cuyo valor es ${lower(p) ? 'mayor o igual que' : 'mayor que'} target; si no hay ninguna, la longitud de nums.`,
      en: `nums is sorted in ascending order. Returns the first position whose value is ${lower(p) ? 'greater than or equal to' : 'greater than'} target; if there is none, the length of nums.`,
    };
  },
  edgeCases: () => [
    [[], 5],
    [[4], 4],
    [[1, 3, 3, 7], 3],
    [[1, 3, 3, 7], 8],
    [[1, 3, 3, 7], 0],
    [[2, 4, 6, 8, 10], 7],
  ],
  randomInput: (rng): TestInput => {
    const nums = randomArray(rng, 0, 7).sort((a, b) => a - b);
    return [nums, rng.int(-10, 21)];
  },
  reference(p, input) {
    const nums = arrayArg(input);
    const target = scalarArg(input, 1);
    const at = nums.findIndex((v) => (lower(p) ? v >= target : v > target));
    return at >= 0 ? at : nums.length;
  },
};
