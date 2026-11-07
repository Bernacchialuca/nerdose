import { uniformInt } from 'pure-rand/distribution/uniformInt';
import { xoroshiro128plus, xoroshiro128plusFromState } from 'pure-rand/generator/xoroshiro128plus';

export interface Rng {
  next(): number;
  int(from: number, to: number): number;
  pick<T>(items: readonly T[]): T;
}

export function rngFrom(seed: Uint8Array): Rng {
  if (seed.length < 16 || seed.length % 4 !== 0) {
    throw new RangeError('rngFrom: seed must be at least 16 bytes and a multiple of 4');
  }
  const view = new DataView(seed.buffer, seed.byteOffset, seed.byteLength);
  // Fold every seed word into 4 lanes so all bytes of the HMAC count, not just the first 4.
  const lanes = [0, 0, 0, 0];
  for (let j = 0; j < seed.length / 4; j++) {
    lanes[j % 4] = (lanes[j % 4] as number) ^ view.getInt32(4 * j);
  }
  // An all-zero xoroshiro state would emit 0 forever.
  const generator = lanes.every((lane) => lane === 0)
    ? xoroshiro128plus(0)
    : xoroshiro128plusFromState(lanes);

  const int = (from: number, to: number): number => uniformInt(generator, from, to);
  return {
    next: () => generator.next(),
    int,
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new RangeError('Rng.pick: empty list');
      return items[int(0, items.length - 1)] as T;
    },
  };
}
