import type { BigOOption, RecentChallenge } from '@nerdose/core';

import type { BigOPayload } from '../definition';

import { RECIPES } from './catalog/recipes';
import type { Recipe } from './catalog/types';
import { addDays } from './days';

export const RECIPE_REPEAT_DAYS = 30;
export const MAX_SAME_ANSWER_STREAK = 2;

type Recent = readonly RecentChallenge<BigOPayload>[];

/** Recipes used in `[D - 29, D + 29]`, without the row of `D` itself. */
export function recipesUsedNear(date: string, recent: Recent): Set<string> {
  const from = addDays(date, -(RECIPE_REPEAT_DAYS - 1));
  const to = addDays(date, RECIPE_REPEAT_DAYS - 1);
  const used = new Set<string>();
  for (const row of recent) {
    if (row.date !== date && row.date >= from && row.date <= to) used.add(row.payload.recipe);
  }
  return used;
}

/** Whether `answer` on `D` would make a run of 3 days with the same answer. */
export function answerWouldRepeat(answer: BigOOption, date: string, recent: Recent): boolean {
  const has = (offset: number): boolean => {
    const day = addDays(date, offset);
    return recent.some(
      (row) => row.date === day && row.date !== date && row.payload.answer === answer,
    );
  };
  return (has(-2) && has(-1)) || (has(-1) && has(1)) || (has(1) && has(2));
}

/** Recipes allowed on `D`, ordered by `id`. */
export function eligibleRecipes(date: string, recent: Recent): Recipe[] {
  const used = recipesUsedNear(date, recent);
  const blocked = new Map<BigOOption, boolean>();
  const repeats = (answer: BigOOption): boolean => {
    let value = blocked.get(answer);
    if (value === undefined) {
      value = answerWouldRepeat(answer, date, recent);
      blocked.set(answer, value);
    }
    return value;
  };
  return RECIPES.filter((r) => !used.has(r.id) && !repeats(r.answer));
}
