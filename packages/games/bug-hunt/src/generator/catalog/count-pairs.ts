import type { Rng } from '@nerdose/core';

import { randomArray } from '../random';
import type { BuiltTemplate, Template, TemplateParams, TestInput } from '../types';

import { conditionOperators } from './conditions';
import { arrayArg, elementAt, intParam, loc, NUMS, scalarArg, site } from './helpers';

type Relation = 'equal' | 'inversion' | 'sum';

const relation = (p: TemplateParams) => p.relation as Relation;
const usesTarget = (p: TemplateParams) => relation(p) === 'sum';
const NAME = {
  equal: 'countEqualPairs',
  inversion: 'countInversions',
  sum: 'countPairsWithSum',
} as const;

const holds = (p: TemplateParams, a: number, b: number, target: number): boolean => {
  switch (relation(p)) {
    case 'equal':
      return a === b;
    case 'inversion':
      return a > b;
    case 'sum':
      return a + b === target;
  }
};

/** Half of the targets are the sum of two elements of `nums`, so some pair matches. */
function randomTarget(rng: Rng, nums: readonly number[]): number {
  if (nums.length < 2 || rng.int(0, 2) === 0) return rng.int(-9, 20);
  const a = rng.int(0, nums.length - 1);
  const b = rng.int(0, nums.length - 1);
  return (nums[a] as number) + (nums[b] as number);
}

/** Two nested loops over the pairs `i < j`. */
export const countPairs: Template = {
  id: 'count_pairs',
  combos: [{ relation: 'equal' }, { relation: 'inversion' }, { relation: 'sum' }],
  functionName: (p) => NAME[relation(p)],
  build(p, b): BuiltTemplate {
    const outerStart = b.num(0);
    const innerStart = b.bin('+', b.var('i'), b.num(1));
    const innerBound = b.len(b.var('nums'));
    const swapJ = b.var('j');
    const first = elementAt(b, b.var('i'));
    const second = elementAt(b, swapJ);
    const pairSum = usesTarget(p) ? b.bin('+', first, second) : undefined;
    const cond =
      pairSum !== undefined
        ? b.bin('==', pairSum, b.var('target'))
        : b.bin(relation(p) === 'equal' ? '==' : '>', first, second);
    const update = b.compound('count', '+=', b.num(1));
    const inner = b.for(b.let('j', innerStart), b.bin('<', b.var('j'), innerBound), b.inc('j'), [
      b.if(cond, [update]),
    ]);
    const outer = b.for(
      b.let('i', outerStart),
      b.bin('<', b.var('i'), b.len(b.var('nums'))),
      b.inc('i'),
      [inner],
    );
    const func = b.func(
      NAME[relation(p)],
      usesTarget(p) ? [NUMS, intParam('target')] : [NUMS],
      [b.let('count', b.num(0)), outer, b.return(b.var('count'))],
      'int',
    );
    return {
      func,
      sites: [
        site(
          outerStart.id,
          ['loop_start_shift'],
          loc('el inicio del recorrido externo', 'the start of the outer loop'),
        ),
        site(
          innerStart.id,
          ['bound_plus_one'],
          loc('el inicio del recorrido interno', 'the start of the inner loop'),
        ),
        site(
          innerBound.id,
          ['bound_minus_one'],
          loc('el límite del recorrido interno', 'the bound of the inner loop'),
        ),
        site(
          cond.id,
          conditionOperators(cond),
          loc(
            'la condición que decide si el par cuenta',
            'the condition that decides whether the pair counts',
          ),
        ),
        ...(pairSum !== undefined
          ? [site(pairSum.id, ['swap_arith'], loc('la suma del par', 'the sum of the pair'))]
          : []),
        site(
          swapJ.id,
          ['swap_variable'],
          loc('el índice del segundo valor del par', 'the index of the second value of the pair'),
          { swaps: ['i'] },
        ),
        site(
          update.id,
          ['swap_compound', 'early_return'],
          loc('la actualización de count', 'the update of count'),
          { returns: ['count'] },
        ),
      ],
    };
  },
  spec(p) {
    switch (relation(p)) {
      case 'equal':
        return {
          es: 'Devuelve cuántos pares de posiciones i < j de nums tienen el mismo valor.',
          en: 'Returns how many pairs of positions i < j of nums hold the same value.',
        };
      case 'inversion':
        return {
          es: 'Devuelve cuántos pares de posiciones i < j de nums tienen un valor en i mayor que el valor en j.',
          en: 'Returns how many pairs of positions i < j of nums hold a greater value at i than at j.',
        };
      case 'sum':
        return {
          es: 'Devuelve cuántos pares de posiciones i < j de nums tienen valores que suman target.',
          en: 'Returns how many pairs of positions i < j of nums hold values that add up to target.',
        };
    }
  },
  edgeCases(p): readonly TestInput[] {
    if (usesTarget(p)) {
      return [
        [[], 4],
        [[2], 4],
        [[2, 2], 4],
        [[1, 3, 2, 2], 4],
        [[5, -1, 0], 4],
        [[1, 1], 5],
      ];
    }
    if (relation(p) === 'equal') {
      return [[[]], [[4]], [[2, 2]], [[1, 2, 1]], [[3, 3, 3]], [[1, 2, 3]]];
    }
    return [[[]], [[4]], [[1, 2]], [[2, 1]], [[3, 1, 2]], [[2, 2]], [[5, 4, 3]]];
  },
  randomInput(rng, p): TestInput {
    const nums = randomArray(rng, 0, 7);
    return usesTarget(p) ? [nums, randomTarget(rng, nums)] : [nums];
  },
  reference(p, input) {
    const nums = arrayArg(input);
    const target = usesTarget(p) ? scalarArg(input, 1) : 0;
    let count = 0;
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        if (holds(p, nums[i] as number, nums[j] as number, target)) count++;
      }
    }
    return count;
  },
};
