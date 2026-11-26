import type { RecentChallenge } from '@nerdose/core';

import type { DevdlePayload } from '../definition';
import { addDays } from './dates';
import { DEVDLE_EXCLUDED_TERMS } from './excluded';
import type { DevdleTerm } from './index';

export const REUSE_WINDOW_DAYS = 365;
export const RECENT_DAYS = 3;

export function sortByTerm(items: readonly DevdleTerm[]): DevdleTerm[] {
  return [...items].sort((a, b) => (a.term < b.term ? -1 : a.term > b.term ? 1 : 0));
}

export function isReusable(lastUsed: string | null, date: string): boolean {
  return lastUsed === null || lastUsed <= addDays(date, -REUSE_WINDOW_DAYS);
}

export const isExcluded = (term: string): boolean => DEVDLE_EXCLUDED_TERMS.has(term);

type Recent = readonly RecentChallenge<DevdlePayload>[];

/**
 * Categorías bloqueadas para D, de la regla más estricta a la más laxa: las de los últimos
 * `RECENT_DAYS` días, solo la de ayer, ninguna. La rotación es una preferencia: con una regla
 * estricta las categorías chicas se agotan primero y, al quedar tres con stock, todas estarían
 * bloqueadas y Devdle se quedaría sin palabra antes de cumplir el año (simulado: día ~330).
 */
function rotationTiers(date: string, recent: Recent): ReadonlySet<string>[] {
  const yesterday = addDays(date, -1);
  return [
    new Set(recent.map((c) => c.payload.category)),
    new Set(recent.filter((c) => c.date === yesterday).map((c) => c.payload.category)),
    new Set(),
  ];
}

const reusableTerms = (bankItems: readonly DevdleTerm[], date: string): DevdleTerm[] =>
  bankItems.filter((t) => isReusable(t.last_used_devdle, date) && !isExcluded(t.term));

/** Las categorías que la regla de rotación aplicable a D bloquea (la más estricta con candidatos). */
export function blockedCategories(
  bankItems: readonly DevdleTerm[],
  date: string,
  recentChallenges: Recent,
): ReadonlySet<string> {
  const reusable = reusableTerms(bankItems, date);
  for (const blocked of rotationTiers(date, recentChallenges)) {
    if (reusable.some((t) => !blocked.has(t.category))) return blocked;
  }
  return new Set();
}

export function eligibleTerms(
  bankItems: readonly DevdleTerm[],
  date: string,
  recentChallenges: Recent,
): DevdleTerm[] {
  const blocked = blockedCategories(bankItems, date, recentChallenges);
  return sortByTerm(reusableTerms(bankItems, date).filter((t) => !blocked.has(t.category)));
}
