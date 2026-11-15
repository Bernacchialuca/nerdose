import type { Locale } from '@nerdose/core';

import type { GrepGridStats } from '../definition/schemas';

const entries = (stats: GrepGridStats): [number, number][] =>
  Object.entries(stats.words_found).map(([found, games]) => [Number(found), games]);

export function gamesCount(stats: GrepGridStats): number {
  return entries(stats).reduce((sum, [, games]) => sum + games, 0);
}

export function averageWords(stats: GrepGridStats): number | null {
  const total = gamesCount(stats);
  if (total === 0) return null;
  return entries(stats).reduce((sum, [found, games]) => sum + found * games, 0) / total;
}

export function perfectRate(stats: GrepGridStats): number | null {
  const total = gamesCount(stats);
  return total === 0 ? null : stats.words_found['8'] / total;
}

export function formatPercent(rate: number | null, locale: Locale): string {
  if (rate === null) return '—';
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(rate);
}

export function formatAverage(value: number | null, locale: Locale): string {
  if (value === null) return '—';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}
