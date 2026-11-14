import { describe, expect, it } from 'vitest';

import { interpret } from '../test-utils';
import { classValue, COUNT_MAX, EXAMPLE_N, SCALE, SCALE_WORK_BUDGET } from '../scale';

import { buildRecipe } from './build';
import { paramCombos } from './params';
import { RECIPES } from './recipes';

const SMALL_N = {
  o_2n: Array.from({ length: 12 }, (_, i) => i + 1),
  o_n_fact: Array.from({ length: 7 }, (_, i) => i + 1),
  other: [1, 2, 3, 4, 5, 7, 8, 16],
};

const ALL = RECIPES.flatMap((recipe) =>
  paramCombos(recipe).map((params) => ({ recipe, params, built: buildRecipe(recipe, params) })),
);

describe('catalog cost', () => {
  it('cost(n) equals the interpreter on small n (TS-8)', () => {
    for (const { recipe, params, built } of ALL) {
      const ns =
        recipe.answer === 'o_2n'
          ? SMALL_N.o_2n
          : recipe.answer === 'o_n_fact'
            ? SMALL_N.o_n_fact
            : SMALL_N.other;
      const label = `${recipe.id} ${params.join(',')}`;
      for (const n of ns) expect(interpret(built.func, n).value, `${label} n=${n}`).toBe(built.cost(n));
      const example = EXAMPLE_N[recipe.answer];
      if (built.cost(example) <= 200_000) {
        expect(interpret(built.func, example).value, `${label} n=${example}`).toBe(built.cost(example));
      }
    }
  });

  it('keeps every count in range and within the work budget (TS-16)', () => {
    for (const { recipe, params, built } of ALL) {
      let total = 0;
      for (const n of SCALE[recipe.answer]) {
        const value = built.cost(n);
        expect(value, `${recipe.id} ${params.join(',')} n=${n}`).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(COUNT_MAX);
        total += value;
      }
      expect(total, `${recipe.id} ${params.join(',')}`).toBeLessThanOrEqual(SCALE_WORK_BUDGET);
    }
    const bounded = RECIPES.find((r) => r.id === 'nest(linear,nest(constant,linear))');
    expect(paramCombos(bounded!).every((p) => p.includes(10) && !p.includes(50) && !p.includes(100))).toBe(true);
  });

  it('grows like its declared class (TS-17)', () => {
    for (const { recipe, params, built } of ALL) {
      const label = `${recipe.id} ${params.join(',')}`;
      if (recipe.answer === 'o_2n') {
        const ratio = built.cost(20) / built.cost(19);
        expect(ratio, label).toBeGreaterThanOrEqual(1.55);
        expect(ratio, label).toBeLessThanOrEqual(2.05);
        continue;
      }
      const ratios = SCALE[recipe.answer].map((n) => built.cost(n) / classValue(recipe.answer, n));
      expect(Math.max(...ratios) / Math.min(...ratios), label).toBeLessThanOrEqual(1.5);
    }
  });
});
