import type { Expr, TreeBuilder } from '@nerdose/polyglot';

import type { BuiltTemplate, Template, TemplateParams, TestInput } from '../types';

import { conditionOperators } from './conditions';
import { arrayArg, elementAt, loc, NUMS, site } from './helpers';

const zeros = (p: TemplateParams) => p.trim === 'zero';
const nameOf = (p: TemplateParams) =>
  zeros(p) ? 'lengthTrimmingZeros' : 'lengthTrimmingNegatives';
const trimmed = (p: TemplateParams, v: number) => (zeros(p) ? v === 0 : v < 0);

const edgeTree = (p: TemplateParams, b: TreeBuilder, element: Expr) =>
  b.bin(zeros(p) ? '==' : '<', element, b.num(0));

/** Two pointers that close in from both ends in two `while` loops, with no `if`. */
export const trimLength: Template = {
  id: 'trim_length',
  combos: [{ trim: 'zero' }, { trim: 'negative' }],
  functionName: nameOf,
  build(p, b): BuiltTemplate {
    const init = b.num(0);
    const right = b.len(b.var('nums'));
    const leftCond = edgeTree(p, b, elementAt(b, b.var('lo')));
    const rightCond = edgeTree(p, b, elementAt(b, b.bin('-', b.var('hi'), b.num(1))));
    const swapLo = b.var('lo');
    const result = b.bin('-', b.var('hi'), swapLo);
    const func = b.func(
      nameOf(p),
      [NUMS],
      [
        b.let('lo', init),
        b.let('hi', right),
        b.while(b.bin('&&', b.bin('<', b.var('lo'), b.var('hi')), leftCond), [b.inc('lo')]),
        b.while(b.bin('&&', b.bin('>', b.var('hi'), b.var('lo')), rightCond), [
          b.compound('hi', '-=', b.num(1)),
        ]),
        b.return(result),
      ],
      'int',
    );
    return {
      func,
      sites: [
        site(init.id, ['shift_init'], loc('el valor inicial de lo', 'the initial value of lo')),
        site(
          right.id,
          ['bound_minus_one'],
          loc('el valor inicial de hi', 'the initial value of hi'),
        ),
        site(
          leftCond.id,
          conditionOperators(leftCond),
          loc(
            'la condición que decide si lo avanza',
            'the condition that decides whether lo moves forward',
          ),
        ),
        site(
          rightCond.id,
          conditionOperators(rightCond),
          loc(
            'la condición que decide si hi retrocede',
            'the condition that decides whether hi moves back',
          ),
        ),
        site(result.id, ['swap_arith'], loc('la cuenta del final', 'the final arithmetic')),
        site(
          swapLo.id,
          ['swap_variable'],
          loc('el valor que se le resta a hi', 'the value subtracted from hi'),
          { swaps: ['hi'] },
        ),
      ],
    };
  },
  spec(p) {
    return zeros(p)
      ? {
          es: 'Devuelve cuántos elementos de nums quedan después de sacar los ceros del principio y del final.',
          en: 'Returns how many elements of nums are left after removing the zeros at the start and at the end.',
        }
      : {
          es: 'Devuelve cuántos elementos de nums quedan después de sacar los negativos del principio y del final.',
          en: 'Returns how many elements of nums are left after removing the negative numbers at the start and at the end.',
        };
  },
  edgeCases(p): readonly TestInput[] {
    if (zeros(p)) {
      return [[[]], [[0]], [[0, 0]], [[5]], [[0, 3, 0]], [[0, 0, 4, 0]], [[2, 0, 7]], [[4, 0]]];
    }
    return [
      [[]],
      [[-1]],
      [[-2, -3]],
      [[5]],
      [[-1, 3, -1]],
      [[-4, 0, 6, -2]],
      [[2, -5, 7]],
      [[0, -1]],
    ];
  },
  randomInput(rng, p): TestInput {
    const edge = (): number => (zeros(p) ? 0 : rng.int(-9, -1));
    const middle = (): number => rng.int(-9, 20);
    const prefix = Array.from({ length: rng.int(0, 2) }, edge);
    const inner = Array.from({ length: rng.int(0, 3) }, middle);
    const suffix = Array.from({ length: rng.int(0, 2) }, edge);
    return [[...prefix, ...inner, ...suffix]];
  },
  reference(p, input) {
    const nums = arrayArg(input);
    let lo = 0;
    let hi = nums.length;
    while (lo < hi && trimmed(p, nums[lo] as number)) lo++;
    while (hi > lo && trimmed(p, nums[hi - 1] as number)) hi--;
    return hi - lo;
  },
};
