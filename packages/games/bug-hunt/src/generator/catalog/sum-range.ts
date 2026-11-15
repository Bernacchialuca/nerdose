import { randomArray } from '../random';
import type { BuiltTemplate, Template, TemplateParams, TestInput } from '../types';

import { conditionOperators } from './conditions';
import { arrayArg, elementAt, indexLoop, intParam, loc, NUMS, scalarArg, site } from './helpers';

const OP = {
  'until/false': '<',
  'until/true': '<=',
  'from/true': '>=',
  'from/false': '>',
} as const;
const NAME = {
  'until/false': 'sumBefore',
  'until/true': 'sumUpTo',
  'from/true': 'sumFrom',
  'from/false': 'sumAfter',
} as const;
const PHRASE = {
  'until/false': { es: 'menores que end', en: 'less than end' },
  'until/true': { es: 'menores o iguales que end', en: 'less than or equal to end' },
  'from/true': { es: 'mayores o iguales que start', en: 'greater than or equal to start' },
  'from/false': { es: 'mayores que start', en: 'greater than start' },
} as const;

const keyOf = (p: TemplateParams) => `${String(p.side)}/${String(p.inclusive)}` as keyof typeof OP;
const limitName = (p: TemplateParams) => (p.side === 'until' ? 'end' : 'start');

export const sumRange: Template = {
  id: 'sum_range',
  combos: [
    { side: 'until', inclusive: false },
    { side: 'until', inclusive: true },
    { side: 'from', inclusive: true },
    { side: 'from', inclusive: false },
  ],
  functionName: (p) => NAME[keyOf(p)],
  build(p, b): BuiltTemplate {
    const init = b.num(0);
    const swapIdx = b.var('i');
    const cond = b.bin(OP[keyOf(p)], swapIdx, b.var(limitName(p)));
    const update = b.compound('sum', '+=', elementAt(b, b.var('i')));
    const loop = indexLoop(b, 0, [b.if(cond, [update])]);
    const func = b.func(
      NAME[keyOf(p)],
      [NUMS, intParam(limitName(p))],
      [b.let('sum', init), loop.stmt, b.return(b.var('sum'))],
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
          cond.id,
          conditionOperators(cond),
          loc(
            'la condición que decide qué posiciones se suman',
            'the condition that decides which positions are added',
          ),
        ),
        site(
          update.id,
          ['swap_compound', 'early_return'],
          loc('la actualización de sum', 'the update of sum'),
          { returns: ['sum'] },
        ),
        site(
          swapIdx.id,
          ['swap_variable'],
          loc(
            `la posición que se compara con ${limitName(p)}`,
            `the position compared with ${limitName(p)}`,
          ),
          { swaps: ['sum'] },
        ),
      ],
    };
  },
  spec(p) {
    const phrase = PHRASE[keyOf(p)];
    return {
      es: `Devuelve la suma de los elementos de nums en las posiciones ${phrase.es}; la primera posición es 0. Si no hay ninguna, devuelve 0.`,
      en: `Returns the sum of the elements of nums at positions ${phrase.en}; the first position is 0. If there are none, it returns 0.`,
    };
  },
  edgeCases: () => [
    [[], 0],
    [[5], 0],
    [[2, 4, 6], 1],
    [[2, 4, 6], -1],
    [[2, 4, 6], 3],
    [[1, -1, 8, 3], 2],
    [[0, 0], 1],
    [[3, 3], 1],
  ],
  randomInput: (rng): TestInput => {
    const nums = randomArray(rng, 0, 7);
    return [nums, rng.int(-1, 8)];
  },
  reference(p, input) {
    const x = scalarArg(input, 1);
    const holds = (i: number): boolean => {
      switch (keyOf(p)) {
        case 'until/false':
          return i < x;
        case 'until/true':
          return i <= x;
        case 'from/true':
          return i >= x;
        case 'from/false':
          return i > x;
      }
    };
    return arrayArg(input).reduce((sum, v, i) => (holds(i) ? sum + v : sum), 0);
  },
};
