import type { BuiltTemplate, Template, TemplateParams, TestInput } from '../types';

import { arrayArg, elementAt, intParam, loc, NUMS, scalarArg, site } from './helpers';

const inclusive = (p: TemplateParams) => p.inclusive === true;
const nameOf = (p: TemplateParams) => (inclusive(p) ? 'itemsWithinBudget' : 'itemsBelowBudget');

/** A `while` whose condition does the work, an accumulator without `if` and a counter returned. */
export const prefixWithinBudget: Template = {
  id: 'prefix_within_budget',
  combos: [{ inclusive: true }, { inclusive: false }],
  functionName: nameOf,
  build(p, b): BuiltTemplate {
    const spentInit = b.num(0);
    const start = b.num(0);
    const bound = b.len(b.var('nums'));
    const total = b.bin('+', b.var('spent'), elementAt(b, b.var('i')));
    const fits = b.bin(inclusive(p) ? '<=' : '<', total, b.var('budget'));
    const spend = b.compound('spent', '+=', elementAt(b, b.var('i')));
    const step = b.inc('i');
    const swapResult = b.var('i');
    const func = b.func(
      nameOf(p),
      [NUMS, intParam('budget')],
      [
        b.let('spent', spentInit),
        b.let('i', start),
        b.while(b.bin('&&', b.bin('<', b.var('i'), bound), fits), [spend, step]),
        b.return(swapResult),
      ],
      'int',
    );
    return {
      func,
      sites: [
        site(
          spentInit.id,
          ['shift_init'],
          loc('el valor inicial de spent', 'the initial value of spent'),
        ),
        site(
          start.id,
          ['loop_start_shift'],
          loc('el inicio del recorrido', 'the start of the loop'),
        ),
        site(bound.id, ['bound_minus_one'], loc('el límite del recorrido', 'the loop bound')),
        // Negating it leaves a loop that only advances while over budget: almost no test passes.
        site(
          fits.id,
          [inclusive(p) ? 'tighten_comparison' : 'relax_comparison'],
          loc(
            'la condición que decide si el elemento entra',
            'the condition that decides whether the element fits',
          ),
        ),
        site(
          total.id,
          ['swap_arith'],
          loc('la suma de spent y el elemento', 'the sum of spent and the element'),
        ),
        site(spend.id, ['swap_compound'], loc('la actualización de spent', 'the update of spent')),
        site(step.id, ['early_return'], loc('el avance de i', 'the step of i'), {
          returns: ['i'],
        }),
        site(
          swapResult.id,
          ['swap_variable'],
          loc('el valor que se devuelve', 'the value that is returned'),
          { swaps: ['spent'] },
        ),
      ],
    };
  },
  spec(p) {
    return inclusive(p)
      ? {
          es: 'Suma los valores de nums desde el principio y devuelve cuántos entran sin que la suma pase de budget. Los valores de nums son mayores o iguales que 0.',
          en: 'Adds up the values of nums from the start and returns how many fit without the sum going over budget. The values of nums are zero or greater.',
        }
      : {
          es: 'Suma los valores de nums desde el principio y devuelve cuántos entran sin que la suma llegue a budget. Los valores de nums son mayores o iguales que 0.',
          en: 'Adds up the values of nums from the start and returns how many fit without the sum reaching budget. The values of nums are zero or greater.',
        };
  },
  // Sums that land exactly on the limit (budget, or budget - 1 when it is exclusive).
  edgeCases(p): readonly TestInput[] {
    const edge = inclusive(p) ? 0 : 1;
    return [
      [[], 5],
      [[3], 5],
      [[5 - edge], 5],
      [[7], 5],
      [[1, 1], 0],
      [[2, 3 - edge, 4], 5],
      [[2, 3, 4], 9 + edge],
      [[0, 4 - edge, 1], 4],
    ];
  },
  randomInput(rng): TestInput {
    const nums = Array.from({ length: rng.int(0, 7) }, () => rng.int(0, 9));
    return [nums, rng.int(0, 30)];
  },
  reference(p, input) {
    const nums = arrayArg(input);
    const budget = scalarArg(input, 1);
    let spent = 0;
    let count = 0;
    for (const v of nums) {
      const next = spent + v;
      if (inclusive(p) ? next > budget : next >= budget) break;
      spent = next;
      count++;
    }
    return count;
  },
};
