import type { RecentChallenge } from '@nerdose/core';

import type { GrepGridPayload } from '../definition';
import { addDays } from './dates';
import type { GrepGridTerm } from './index';

export const REUSE_WINDOW_DAYS = 30;

export function sortByTerm(items: readonly GrepGridTerm[]): GrepGridTerm[] {
  return [...items].sort((a, b) => (a.term < b.term ? -1 : a.term > b.term ? 1 : 0));
}

export function isReusable(lastUsed: string | null, date: string): boolean {
  return lastUsed === null || lastUsed <= addDays(date, -REUSE_WINDOW_DAYS);
}

/** Reutilizables y fuera de los challenges recientes (la ventana de estos incluye `D - 30`). */
export function eligibleTerms(
  bankItems: readonly GrepGridTerm[],
  date: string,
  recentChallenges: readonly RecentChallenge<GrepGridPayload>[],
): GrepGridTerm[] {
  const recentIds = new Set(recentChallenges.flatMap((c) => c.payload.words.map((w) => w.term_id)));
  return sortByTerm(
    bankItems.filter((t) => isReusable(t.last_used_grep, date) && !recentIds.has(t.id)),
  );
}

export const related = (a: string, b: string): boolean => a.includes(b) || b.includes(a);
