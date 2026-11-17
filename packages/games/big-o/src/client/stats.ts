import { RECIPE_CATEGORIES, type Locale, type RecipeCategory } from '@nerdose/core';

import type { BigOStats } from '../definition/schemas';

export type CategoryRate = {
  category: RecipeCategory;
  played: number;
  correct: number;
  rate: number | null;
};

export function categoryRates(stats: BigOStats): CategoryRate[] {
  return RECIPE_CATEGORIES.map((category) => {
    const { played = 0, correct = 0 } = stats.by_category[category] ?? {};
    return { category, played, correct, rate: played === 0 ? null : correct / played };
  });
}

export function gamesCount(stats: BigOStats): number {
  return categoryRates(stats).reduce((sum, row) => sum + row.played, 0);
}

export function formatPercent(rate: number | null, locale: Locale): string {
  if (rate === null) return '—';
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(rate);
}
