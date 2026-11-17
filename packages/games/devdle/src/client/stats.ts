import type { Locale } from '@nerdose/core';

import type { DevdleStats } from '../definition/schemas';

export type DistributionRow = {
  label: '1' | '2' | '3' | '4' | '5' | '6' | 'X';
  count: number;
};

export function distributionRows(stats: DevdleStats): DistributionRow[] {
  return [
    { label: '1', count: stats.guesses['1'] },
    { label: '2', count: stats.guesses['2'] },
    { label: '3', count: stats.guesses['3'] },
    { label: '4', count: stats.guesses['4'] },
    { label: '5', count: stats.guesses['5'] },
    { label: '6', count: stats.guesses['6'] },
    { label: 'X', count: stats.losses },
  ];
}

export function gamesCount(stats: DevdleStats): number {
  return distributionRows(stats).reduce((sum, row) => sum + row.count, 0);
}

export function formatPercent(rate: number | null, locale: Locale): string {
  if (rate === null) return '—';
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(rate);
}
