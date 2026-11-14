import { rngFrom, type GameGenerator, type HistorySpec } from '@nerdose/core';

import type { BigOPayload } from '../definition';

import { buildRecipe } from './catalog/build';
import { buildExplanation } from './catalog/explain';
import { drawParams } from './catalog/params';
import { RECIPES } from './catalog/recipes';
import type { Params, Recipe } from './catalog/types';
import { eligibleRecipes } from './variety';

/** The payload of a recipe with concrete parameters; the keys follow the order of the schema. */
export function buildPayload(recipe: Recipe, params: Params): BigOPayload {
  const built = buildRecipe(recipe, params);
  return {
    recipe: recipe.id,
    recipe_category: recipe.category,
    code: built.code,
    answer: recipe.answer,
    trap_option: recipe.trapOption,
    explanation: buildExplanation(recipe, built),
  };
}

export const TRAP_PERCENT = 35;
export const TRAP_RATE = TRAP_PERCENT / 100;

export const historySpec: HistorySpec = {
  bank: null,
  lastUsedField: '',
  recentDays: 30,
  aheadDays: 30,
};

export const usedBankItems = (): string[] => [];

/**
 * The payload carries its `date` (first key) because `verify` has no date argument and the variety
 * checks need it. Deterministic: the rng is consumed in a fixed order (trap draw, recipe, then the parameters in
 * traversal order of the shape). With nothing eligible it still picks a recipe; `verify` rejects it
 * for variety and the rule is not relaxed.
 */
export const generate: GameGenerator<BigOPayload>['generate'] = ({ date, seed, history }) => {
  const rng = rngFrom(seed);
  const wantTrap = rng.int(1, 100) <= TRAP_PERCENT;
  const eligible = eligibleRecipes(date, history.recentChallenges);
  const pool = eligible.length > 0 ? eligible : RECIPES;
  const withTrap = pool.filter((r) => r.trap !== null);
  const without = pool.filter((r) => r.trap === null);
  const preferred = wantTrap ? withTrap : without;
  const group = preferred.length > 0 ? preferred : wantTrap ? without : withTrap;
  const chosen = rng.pick(group);
  return { date, ...buildPayload(chosen, drawParams(chosen, rng)) };
};
