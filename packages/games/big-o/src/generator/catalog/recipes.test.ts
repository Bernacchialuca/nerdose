import { BIG_O_OPTIONS, RECIPE_CATEGORIES } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { classValue, EXAMPLE_N } from '../scale';

import { paramCombos } from './params';
import { RECIPES } from './recipes';
import type { TrapKind } from './types';

describe('RECIPES', () => {
  it('meets the minimums of the catalog (TS-10)', () => {
    expect(RECIPES.length).toBeGreaterThanOrEqual(40);
    for (const o of BIG_O_OPTIONS) {
      expect(RECIPES.filter((r) => r.answer === o).length, o).toBeGreaterThanOrEqual(3);
    }
    for (const c of RECIPE_CATEGORIES) {
      expect(RECIPES.filter((r) => r.category === c).length, c).toBeGreaterThanOrEqual(4);
    }
    expect(RECIPES.filter((r) => r.trap !== null).length).toBeGreaterThanOrEqual(12);
    for (const t of ['sequential_loops', 'constant_bound', 'doubling_inner'] as TrapKind[]) {
      expect(RECIPES.some((r) => r.trap === t), t).toBe(true);
    }
    const ids = RECIPES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([...ids].sort());
  });

  it('declares coherent traps (TS-11)', () => {
    for (const r of RECIPES) {
      expect(r.trap === null, r.id).toBe(r.trapOption === null);
      expect(r.trapOption, r.id).not.toBe(r.answer);
      if (r.trapOption !== null) {
        expect(Number.isSafeInteger(classValue(r.trapOption, EXAMPLE_N[r.answer])), r.id).toBe(true);
      }
    }
  });

  it('never leaves a recipe with an empty domain', () => {
    for (const r of RECIPES) expect(paramCombos(r).length, r.id).toBeGreaterThan(0);
  });
});
