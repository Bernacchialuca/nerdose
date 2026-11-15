import { TIMELINE_CATEGORIES, type Locale, type TimelineCategory } from '@nerdose/core';

import type { TimelineStats } from '../definition/schemas';

export type CategoryRate = {
  category: TimelineCategory;
  played: number;
  correct: number;
  rate: number | null;
};

export function categoryRates(stats: TimelineStats): CategoryRate[] {
  return TIMELINE_CATEGORIES.map((category) => {
    const { played = 0, correct = 0 } = stats.by_category[category] ?? {};
    return { category, played, correct, rate: played === 0 ? null : correct / played };
  });
}

export function bestCategory(stats: TimelineStats): TimelineCategory | null {
  let best: CategoryRate | null = null;
  for (const row of categoryRates(stats)) {
    if (row.rate !== null && (best === null || row.rate > (best.rate ?? 0))) best = row;
  }
  return best?.category ?? null;
}

export function gamesCount(stats: TimelineStats): number {
  return categoryRates(stats).reduce((sum, row) => sum + row.played, 0);
}

export function formatPercent(rate: number | null, locale: Locale): string {
  if (rate === null) return '—';
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(rate);
}
