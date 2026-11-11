import type { Rng } from '@nerdose/core';

import { ITEMS_COUNT } from '../definition';
import { distinguishable } from '../shared/dates';
import { sortById } from './eligibility';
import type { TimelineFact } from './index';
import { shuffle } from './opaque';

function greedy(pool: readonly TimelineFact[], chosen: TimelineFact[]): void {
  for (const f of pool) {
    if (chosen.length >= ITEMS_COUNT) return;
    if (chosen.every((x) => distinguishable(x, f))) chosen.push(f);
  }
}

/**
 * Selección voraz de hechos distinguibles de todo el banco, sin importar la categoría: primero
 * los elegibles, luego los no elegibles y, si aún faltan, los sobrantes (el candidato lo rechaza
 * `verify`). Lanza si el banco no tiene 5 hechos.
 */
export function chooseFacts(
  eligible: readonly TimelineFact[],
  bankItems: readonly TimelineFact[],
  rng: Rng,
): TimelineFact[] {
  if (bankItems.length < ITEMS_COUNT) {
    throw new RangeError(`timeline generate: the bank has fewer than ${ITEMS_COUNT} facts`);
  }
  const pool = shuffle(eligible, rng);
  const chosen: TimelineFact[] = [];
  greedy(pool, chosen);
  if (chosen.length >= ITEMS_COUNT) return chosen;

  const eligibleIds = new Set(pool.map((f) => f.id));
  const rest = shuffle(sortById(bankItems.filter((f) => !eligibleIds.has(f.id))), rng);
  greedy(rest, chosen);
  for (const f of [...pool, ...rest]) {
    if (chosen.length >= ITEMS_COUNT) break;
    if (!chosen.includes(f)) chosen.push(f);
  }
  return chosen;
}
