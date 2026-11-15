import { randomArray } from '../random';
import type { BuiltTemplate, Template, TemplateParams, TestInput } from '../types';

import { conditionOperators } from './conditions';
import { arrayArg, elementAt, indexLoop, loc, NUMS, site } from './helpers';

const OP = { equal: '==', rise: '>', drop: '<' } as const;
const NAME = { equal: 'countEqualNeighbors', rise: 'countRises', drop: 'countDrops' } as const;
const PHRASE = {
  equal: { es: 'el mismo valor que', en: 'the same value as' },
  rise: { es: 'un valor mayor que', en: 'a greater value than' },
  drop: { es: 'un valor menor que', en: 'a smaller value than' },
} as const;
const relation = (p: TemplateParams) => p.relation as keyof typeof OP;

export const countEqualNeighbors: Template = {
  id: 'count_equal_neighbors',
  combos: [{ relation: 'equal' }, { relation: 'rise' }, { relation: 'drop' }],
  functionName: (p) => NAME[relation(p)],
  build(p, b): BuiltTemplate {
    const init = b.num(0);
    const swapIdx = b.var('i');
    const cond = b.bin(
      OP[relation(p)],
      elementAt(b, swapIdx),
      elementAt(b, b.bin('-', b.var('i'), b.num(1))),
    );
    const update = b.compound('count', '+=', b.num(1));
    const loop = indexLoop(b, 1, [b.if(cond, [update])]);
    const func = b.func(
      NAME[relation(p)],
      [NUMS],
      [b.let('count', init), loop.stmt, b.return(b.var('count'))],
      'int',
    );
    return {
      func,
      sites: [
        site(loop.bound.id, ['bound_minus_one'], loc('el límite del recorrido', 'the loop bound')),
        site(
          cond.id,
          conditionOperators(cond),
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
          loc('el índice del valor actual', 'the index of the current value'),
          { swaps: ['count'] },
        ),
      ],
    };
  },
  spec(p) {
    const phrase = PHRASE[relation(p)];
    return {
      es: `Devuelve cuántas posiciones de nums tienen ${phrase.es} la anterior.`,
      en: `Returns how many positions of nums hold ${phrase.en} the previous one.`,
    };
  },
  edgeCases: () => [[[]], [[2]], [[3, 3, 3]], [[1, 2, 1, 2]], [[5, 4, 4, 9]]],
  randomInput: (rng): TestInput => [randomArray(rng, 0, 7)],
  reference(p, input) {
    const nums = arrayArg(input);
    let count = 0;
    for (let i = 1; i < nums.length; i++) {
      const cur = nums[i] as number;
      const prev = nums[i - 1] as number;
      const holds =
        relation(p) === 'equal' ? cur === prev : relation(p) === 'rise' ? cur > prev : cur < prev;
      if (holds) count++;
    }
    return count;
  },
};
