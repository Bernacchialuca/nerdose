import { randomArray } from '../random';
import type { BuiltTemplate, Template, TemplateParams, TestInput } from '../types';

import { conditionOperators } from './conditions';
import { arrayArg, elementAt, indexLoop, loc, NUMS, site } from './helpers';

const COMPARISON = {
  'max/first': '>',
  'max/last': '>=',
  'min/first': '<',
  'min/last': '<=',
} as const;
const NAMES = {
  'max/first': 'maxIndex',
  'max/last': 'lastMaxIndex',
  'min/first': 'minIndex',
  'min/last': 'lastMinIndex',
} as const;

const keyOf = (p: TemplateParams) => `${String(p.extreme)}/${String(p.tie)}` as keyof typeof NAMES;

export const extremeIndex: Template = {
  id: 'extreme_index',
  combos: [
    { extreme: 'max', tie: 'first' },
    { extreme: 'max', tie: 'last' },
    { extreme: 'min', tie: 'first' },
    { extreme: 'min', tie: 'last' },
  ],
  functionName: (p) => NAMES[keyOf(p)],
  build(p, b): BuiltTemplate {
    const init = b.num(0);
    const swapIdx = b.var('i');
    const cond = b.bin(COMPARISON[keyOf(p)], elementAt(b, swapIdx), elementAt(b, b.var('best')));
    const update = b.assign('best', b.var('i'));
    const loop = indexLoop(b, 1, [b.if(cond, [update])]);
    const func = b.func(
      NAMES[keyOf(p)],
      [NUMS],
      [b.let('best', init), loop.stmt, b.return(b.var('best'))],
      'int',
    );
    return {
      func,
      sites: [
        site(init.id, ['shift_init'], loc('el valor inicial de best', 'the initial value of best')),
        site(loop.bound.id, ['bound_minus_one'], loc('el límite del recorrido', 'the loop bound')),
        site(
          cond.id,
          conditionOperators(cond),
          loc(
            'la condición que decide si best cambia',
            'the condition that decides whether best changes',
          ),
        ),
        site(
          swapIdx.id,
          ['swap_variable'],
          loc('el índice del valor que se compara', 'the index of the value being compared'),
          { swaps: ['best'] },
        ),
        site(update.id, ['early_return'], loc('la actualización de best', 'the update of best'), {
          returns: ['i', 'best'],
        }),
      ],
    };
  },
  spec(p) {
    const max = p.extreme === 'max';
    const first = p.tie === 'first';
    return {
      es: `Devuelve el índice del ${max ? 'mayor' : 'menor'} valor de nums; si ${max ? 'el máximo' : 'el mínimo'} se repite, el del ${first ? 'primero' : 'último'}. Con nums vacío devuelve 0.`,
      en: `Returns the index of the ${max ? 'largest' : 'smallest'} value in nums; if the ${max ? 'maximum' : 'minimum'} repeats, the ${first ? 'first' : 'last'} one. With an empty nums it returns 0.`,
    };
  },
  edgeCases: () => [
    [[]],
    [[4]],
    [[3, 3, 3]],
    [[5, 1, 5]],
    [[1, 2, 9]],
    [[-2, -9, -2]],
    [[9, 4, 2]],
  ],
  randomInput: (rng): TestInput => [randomArray(rng, 0, 7)],
  reference(p, input) {
    const nums = arrayArg(input);
    const max = p.extreme === 'max';
    const first = p.tie === 'first';
    let best = 0;
    nums.forEach((value, i) => {
      const current = nums[best] as number;
      const better = max ? value > current : value < current;
      const tie = value === current;
      if (i > 0 && (better || (tie && !first))) best = i;
    });
    return best;
  },
};
