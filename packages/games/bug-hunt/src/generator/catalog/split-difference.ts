import { randomArray } from '../random';
import type { BuiltTemplate, Template, TemplateParams, TestInput } from '../types';

import { arrayArg, elementAt, intParam, loc, NUMS, scalarArg, site } from './helpers';

const leftFirst = (p: TemplateParams) => p.first === 'left';
const nameOf = (p: TemplateParams) => (leftFirst(p) ? 'prefixMinusRest' : 'restMinusPrefix');

/** Two loops one after the other, each with its accumulator, and the difference at the end. */
export const splitDifference: Template = {
  id: 'split_difference',
  combos: [{ first: 'left' }, { first: 'right' }],
  functionName: nameOf,
  build(p, b): BuiltTemplate {
    const firstBound = b.var('k');
    const addLeft = b.compound('left', '+=', elementAt(b, b.var('i')));
    const firstFor = b.for(b.let('i', b.num(0)), b.bin('<', b.var('i'), firstBound), b.inc('i'), [
      addLeft,
    ]);
    const secondStart = b.var('k');
    const swapIdx = b.var('i');
    const addRight = b.compound('right', '+=', elementAt(b, swapIdx));
    const secondFor = b.for(
      b.let('i', secondStart),
      b.bin('<', b.var('i'), b.len(b.var('nums'))),
      b.inc('i'),
      [addRight],
    );
    const result = leftFirst(p)
      ? b.bin('-', b.var('left'), b.var('right'))
      : b.bin('-', b.var('right'), b.var('left'));
    const func = b.func(
      nameOf(p),
      [NUMS, intParam('k')],
      [b.let('left', b.num(0)), firstFor, b.let('right', b.num(0)), secondFor, b.return(result)],
      'int',
    );
    return {
      func,
      sites: [
        site(
          firstBound.id,
          ['bound_minus_one'],
          loc('el límite del primer recorrido', 'the bound of the first loop'),
        ),
        site(addLeft.id, ['swap_compound'], loc('la actualización de left', 'the update of left')),
        site(
          secondStart.id,
          ['bound_plus_one'],
          loc('el inicio del segundo recorrido', 'the start of the second loop'),
        ),
        site(
          addRight.id,
          ['swap_compound', 'early_return'],
          loc('la actualización de right', 'the update of right'),
          { returns: ['left', 'right'] },
        ),
        site(
          swapIdx.id,
          ['swap_variable'],
          loc('el índice del valor que se suma a right', 'the index of the value added to right'),
          { swaps: ['k'] },
        ),
        site(result.id, ['swap_arith'], loc('la cuenta del final', 'the final arithmetic')),
      ],
    };
  },
  spec(p) {
    return leftFirst(p)
      ? {
          es: 'Devuelve la suma de los primeros k elementos de nums menos la suma del resto. k va de 0 a la longitud de nums.',
          en: 'Returns the sum of the first k elements of nums minus the sum of the rest. k goes from 0 to the length of nums.',
        }
      : {
          es: 'Devuelve la suma de los elementos de nums desde la posición k menos la suma de los primeros k. k va de 0 a la longitud de nums.',
          en: 'Returns the sum of the elements of nums from position k on minus the sum of the first k. k goes from 0 to the length of nums.',
        };
  },
  edgeCases: () => [
    [[], 0],
    [[5], 0],
    [[5], 1],
    [[1, 2, 3], 1],
    [[1, 2, 3], 3],
    [[4, -2, 7, 1], 2],
    [[0, 6], 1],
  ],
  randomInput(rng): TestInput {
    const nums = randomArray(rng, 0, 7);
    return [nums, rng.int(0, nums.length)];
  },
  reference(p, input) {
    const nums = arrayArg(input);
    const k = scalarArg(input, 1);
    const sum = (part: readonly number[]) => part.reduce((a, v) => a + v, 0);
    const left = sum(nums.slice(0, k));
    const right = sum(nums.slice(k));
    return leftFirst(p) ? left - right : right - left;
  },
};
