import type { Rng } from '@nerdose/core';

import { ITEMS_COUNT } from '../definition';

export const OPAQUE_ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
export const OPAQUE_ID_LENGTH = 6;
export const MAX_REDRAWS = 10;

/** Fisher-Yates sobre una copia. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i >= 1; i--) {
    const j = rng.int(0, i);
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

export const sameOrder = (a: readonly unknown[], b: readonly unknown[]): boolean =>
  a.length === b.length && a.every((x, i) => x === b[i]);

function drawRound(rng: Rng): string[] {
  const ids: string[] = [];
  while (ids.length < ITEMS_COUNT) {
    let id = '';
    for (let c = 0; c < OPAQUE_ID_LENGTH; c++) {
      id += OPAQUE_ID_ALPHABET[rng.int(0, OPAQUE_ID_ALPHABET.length - 1)];
    }
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

/**
 * Sortea 5 ids únicos, asignados en orden cronológico. Si su orden alfabético coincide con el
 * cronológico se repite la ronda (hasta `MAX_REDRAWS`; si no, `verify` rechaza).
 */
export function drawOpaqueIds(rng: Rng): string[] {
  let ids = drawRound(rng);
  for (let n = 1; n < MAX_REDRAWS && sameOrder([...ids].sort(), ids); n++) ids = drawRound(rng);
  return ids;
}

/** Permutación inicial de los índices cronológicos; no puede ser la identidad (hasta `MAX_REDRAWS`). */
export function drawInitialOrder(rng: Rng): number[] {
  const base = Array.from({ length: ITEMS_COUNT }, (_, i) => i);
  let order = shuffle(base, rng);
  for (let n = 1; n < MAX_REDRAWS && sameOrder(order, base); n++) order = shuffle(base, rng);
  return order;
}
