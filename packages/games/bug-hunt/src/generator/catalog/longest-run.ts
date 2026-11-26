import { randomArray } from '../random';
import type { BuiltTemplate, Template, TemplateParams, TestInput } from '../types';

import {
  conditionHolds,
  conditionOperators,
  conditionTree,
  type ElementCondition,
} from './conditions';
import { arrayArg, elementAt, indexLoop, intParam, loc, NUMS, scalarArg, site } from './helpers';

/** The condition that breaks the run, not the one the run keeps. */
const breaker = (p: TemplateParams) => p.breaker as 'negative' | 'odd' | 'gt';
const usesK = (p: TemplateParams) => breaker(p) === 'gt';
const NAME = {
  negative: 'longestNonNegativeRun',
  odd: 'longestEvenRun',
  gt: 'longestRunAtMost',
} as const;
const KEPT = {
  negative: { es: 'mayores o iguales que 0', en: 'zero or greater' },
  odd: { es: 'pares', en: 'even' },
  gt: { es: 'menores o iguales que k', en: 'less than or equal to k' },
} as const;

/** A counter that grows outside the `if`, another `if` that resets it and a second accumulator. */
export const longestRun: Template = {
  id: 'longest_run',
  combos: [{ breaker: 'negative' }, { breaker: 'odd' }, { breaker: 'gt' }],
  functionName: (p) => NAME[breaker(p)],
  build(p, b): BuiltTemplate {
    const bestInit = b.num(0);
    const runInit = b.num(0);
    const grow = b.compound('run', '+=', b.num(1));
    const broken = conditionTree(
      breaker(p) as ElementCondition,
      b,
      elementAt(b, b.var('i')),
      usesK(p) ? b.var('k') : undefined,
    );
    const reset = b.assign('run', b.num(0));
    const swapBest = b.var('best');
    const better = b.bin('>', b.var('run'), swapBest);
    const loop = indexLoop(b, 0, [
      grow,
      b.if(broken, [reset]),
      b.if(better, [b.assign('best', b.var('run'))]),
    ]);
    const func = b.func(
      NAME[breaker(p)],
      usesK(p) ? [NUMS, intParam('k')] : [NUMS],
      [b.let('best', bestInit), b.let('run', runInit), loop.stmt, b.return(b.var('best'))],
      'int',
    );
    return {
      func,
      sites: [
        site(
          bestInit.id,
          ['shift_init'],
          loc('el valor inicial de best', 'the initial value of best'),
        ),
        site(
          runInit.id,
          ['shift_init'],
          loc('el valor inicial de run', 'the initial value of run'),
        ),
        site(
          loop.start.id,
          ['loop_start_shift'],
          loc('el inicio del recorrido', 'the start of the loop'),
        ),
        site(loop.bound.id, ['bound_minus_one'], loc('el límite del recorrido', 'the loop bound')),
        site(grow.id, ['swap_compound'], loc('el aumento de run', 'the increase of run')),
        site(
          broken.id,
          conditionOperators(broken),
          loc('la condición que corta la racha', 'the condition that breaks the run'),
        ),
        site(reset.id, ['early_return'], loc('el reinicio de run', 'the reset of run'), {
          returns: ['best'],
        }),
        site(
          better.id,
          ['negate_condition'],
          loc(
            'la condición que decide si best cambia',
            'the condition that decides whether best changes',
          ),
        ),
        site(
          swapBest.id,
          ['swap_variable'],
          loc('el valor con el que se compara run', 'the value run is compared with'),
          { swaps: ['run'] },
        ),
      ],
    };
  },
  spec(p) {
    const kept = KEPT[breaker(p)];
    return {
      es: `Devuelve el largo de la racha más larga de elementos seguidos de nums que son ${kept.es}. Sin ninguno, devuelve 0.`,
      en: `Returns the length of the longest run of consecutive elements of nums that are ${kept.en}. With none, it returns 0.`,
    };
  },
  edgeCases(p): readonly TestInput[] {
    if (usesK(p)) {
      return [
        [[], 3],
        [[5], 3],
        [[3], 3],
        [[1, 3, 9, 2], 3],
        [[9, 1, 2, 3], 3],
        [[4, 4], 4],
      ];
    }
    if (breaker(p) === 'odd') {
      return [[[]], [[1]], [[2]], [[2, 4, 1, 6]], [[1, 2, 4, 6]], [[2, 1, 2]], [[3, 5]]];
    }
    return [[[]], [[-1]], [[0]], [[0, 3, -1, 5]], [[-2, 1, 2, 3]], [[4, -1, 4]], [[-3, -5]]];
  },
  randomInput(rng, p): TestInput {
    const nums = randomArray(rng, 0, 7);
    return usesK(p) ? [nums, rng.int(-9, 20)] : [nums];
  },
  reference(p, input) {
    const k = usesK(p) ? scalarArg(input, 1) : undefined;
    let best = 0;
    let run = 0;
    for (const v of arrayArg(input)) {
      run = conditionHolds(breaker(p) as ElementCondition, v, k) ? 0 : run + 1;
      best = Math.max(best, run);
    }
    return best;
  },
};
