import type { RecentChallenge } from '@nerdose/core';

import type { DevdlePayload } from '../definition';
import { addDays } from './dates';
import type { DevdleTerm } from './index';

export const REUSE_WINDOW_DAYS = 365;
export const RECENT_DAYS = 3;

export function sortByTerm(items: readonly DevdleTerm[]): DevdleTerm[] {
  return [...items].sort((a, b) => (a.term < b.term ? -1 : a.term > b.term ? 1 : 0));
}

export function isReusable(lastUsed: string | null, date: string): boolean {
  return lastUsed === null || lastUsed <= addDays(date, -REUSE_WINDOW_DAYS);
}

export function eligibleTerms(
  bankItems: readonly DevdleTerm[],
  date: string,
  recentChallenges: readonly RecentChallenge<DevdlePayload>[],
): DevdleTerm[] {
  const recentCategories = new Set(recentChallenges.map((c) => c.payload.category));
  return sortByTerm(
    bankItems.filter(
      (t) => isReusable(t.last_used_devdle, date) && !recentCategories.has(t.category),
    ),
  );
}
