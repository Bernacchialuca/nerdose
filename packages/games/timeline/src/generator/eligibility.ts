import type { RecentChallenge } from '@nerdose/core';

import type { TimelinePayload } from '../definition';
import { addDays } from './days';
import type { TimelineFact } from './index';

export const REUSE_WINDOW_DAYS = 90;

export function sortById(items: readonly TimelineFact[]): TimelineFact[] {
  return [...items].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export function isReusable(lastUsed: string | null, date: string): boolean {
  return lastUsed === null || lastUsed <= addDays(date, -REUSE_WINDOW_DAYS);
}

/** Reutilizables y fuera de los challenges recientes (la ventana de estos incluye `D - 90`). */
export function eligibleFacts(
  bankItems: readonly TimelineFact[],
  date: string,
  recentChallenges: readonly RecentChallenge<TimelinePayload>[],
): TimelineFact[] {
  const recentIds = new Set(recentChallenges.flatMap((c) => c.payload.items.map((i) => i.fact_id)));
  return sortById(bankItems.filter((f) => isReusable(f.last_used, date) && !recentIds.has(f.id)));
}
