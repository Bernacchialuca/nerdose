import type { Rng } from '@nerdose/core';

/** Fisher-Yates from the end; does not modify its input. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    const a = copy[i] as T;
    copy[i] = copy[j] as T;
    copy[j] = a;
  }
  return copy;
}

/** Half of the arrays are "narrow" (values in [0, 6]) to provoke ties, half "wide" ([-9, 20]). */
export function randomArray(rng: Rng, minLen: number, maxLen: number): number[] {
  const narrow = rng.int(0, 1) === 0;
  const length = rng.int(minLen, maxLen);
  const [lo, hi] = narrow ? [0, 6] : [-9, 20];
  return Array.from({ length }, () => rng.int(lo, hi));
}
