import { TIMELINE_CATEGORIES } from '@nerdose/core';
import type { Rng, TimelineCategory } from '@nerdose/core';

import { ITEMS_COUNT } from '../definition';
import { distinguishable } from '../shared/dates';
import { sortById } from './eligibility';
import type { TimelineFact } from './index';
import { shuffle } from './opaque';

const countIn = (items: readonly TimelineFact[], c: TimelineCategory): number =>
  items.filter((f) => f.category === c).length;

/** Categoría con ≥ 5 elegibles; si no hay, la que tenga ≥ 5 en el banco; si no, lanza. */
export function chooseCategory(
  eligible: readonly TimelineFact[],
  bankItems: readonly TimelineFact[],
  rng: Rng,
): TimelineCategory {
  const sorted = [...TIMELINE_CATEGORIES].sort();
  let candidates = sorted.filter((c) => countIn(eligible, c) >= ITEMS_COUNT);
  if (candidates.length === 0)
    candidates = sorted.filter((c) => countIn(bankItems, c) >= ITEMS_COUNT);
  if (candidates.length === 0) throw new RangeError('timeline generate: no category has 5 facts');
  return rng.pick(candidates);
}

function greedy(pool: readonly TimelineFact[], chosen: TimelineFact[]): void {
  for (const f of pool) {
    if (chosen.length >= ITEMS_COUNT) return;
    if (chosen.every((x) => distinguishable(x, f))) chosen.push(f);
  }
}

/**
 * Selección voraz de hechos distinguibles: primero los elegibles, luego los no elegibles y,
 * si aún faltan, los sobrantes (el candidato lo rechaza `verify`).
 */
export function chooseFacts(
  category: TimelineCategory,
  eligible: readonly TimelineFact[],
  bankItems: readonly TimelineFact[],
  rng: Rng,
): TimelineFact[] {
  const pool = shuffle(
    eligible.filter((f) => f.category === category),
    rng,
  );
  const chosen: TimelineFact[] = [];
  greedy(pool, chosen);
  if (chosen.length >= ITEMS_COUNT) return chosen;

  const eligibleIds = new Set(pool.map((f) => f.id));
  const rest = shuffle(
    sortById(bankItems.filter((f) => f.category === category && !eligibleIds.has(f.id))),
    rng,
  );
  greedy(rest, chosen);
  for (const f of [...pool, ...rest]) {
    if (chosen.length >= ITEMS_COUNT) break;
    if (!chosen.includes(f)) chosen.push(f);
  }
  return chosen;
}
