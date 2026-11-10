import type { Rng } from '@nerdose/core';

import { WORDS_COUNT } from '../definition';
import { related, sortByTerm } from './eligibility';
import type { GrepGridTerm } from './index';

/**
 * Elige 8 términos sin relación de subcadena. Primero del pool de elegibles, luego de los no
 * elegibles y, por último, de los descartados: `verify` rechaza lo que no cumpla.
 */
export function chooseTerms(
  eligible: readonly GrepGridTerm[],
  bankItems: readonly GrepGridTerm[],
  rng: Rng,
): GrepGridTerm[] {
  if (bankItems.length < WORDS_COUNT) {
    throw new RangeError('grep-grid generate: bank has fewer than 8 terms');
  }
  const chosen: GrepGridTerm[] = [];
  const discarded: GrepGridTerm[] = [];

  const drain = (source: readonly GrepGridTerm[]): void => {
    const pool = [...source];
    while (chosen.length < WORDS_COUNT && pool.length > 0) {
      const [t] = pool.splice(rng.int(0, pool.length - 1), 1) as [GrepGridTerm];
      if (chosen.some((c) => related(c.term, t.term))) discarded.push(t);
      else chosen.push(t);
    }
  };

  drain(eligible);
  const eligibleIds = new Set(eligible.map((t) => t.id));
  if (chosen.length < WORDS_COUNT)
    drain(sortByTerm(bankItems.filter((t) => !eligibleIds.has(t.id))));
  for (const t of discarded) {
    if (chosen.length < WORDS_COUNT) chosen.push(t);
  }
  return chosen;
}
