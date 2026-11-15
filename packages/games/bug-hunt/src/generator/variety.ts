import type { RecentChallenge } from '@nerdose/core';

import type { BugHuntPayload } from '../definition';

import { addDays } from './days';

export const VARIETY_DAYS = 60;

type Recent = readonly RecentChallenge<BugHuntPayload>[];

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0,
    );
    return Object.fromEntries(entries.map(([k, v]) => [k, sortKeys(v)]));
  }
  return value;
}

/** `JSON.stringify` with the keys of every object sorted. */
export const canonicalJson = (value: unknown): string => JSON.stringify(sortKeys(value));

export function varietyKey(p: Pick<BugHuntPayload, 'template' | 'params' | 'mutation'>): string {
  return `${p.template}:${canonicalJson(p.params)}:${p.mutation.operator}@${p.mutation.node}:${p.mutation.to}`;
}

/** Keys used in `[D - 59, D + 59]`, without the row of `D` itself. */
export function keysUsedNear(date: string, recent: Recent): Set<string> {
  const from = addDays(date, -(VARIETY_DAYS - 1));
  const to = addDays(date, VARIETY_DAYS - 1);
  const used = new Set<string>();
  for (const row of recent) {
    if (row.date !== date && row.date >= from && row.date <= to) used.add(varietyKey(row.payload));
  }
  return used;
}
