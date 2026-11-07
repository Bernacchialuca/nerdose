import { describe, expect, it } from 'vitest';

import { rngFrom } from '../src/prng';

const SEED_A = Uint8Array.from({ length: 32 }, (_, i) => i);
const SEED_B = Uint8Array.from(SEED_A);
SEED_B[0] = 0xff;
const SEED_C = Uint8Array.from(SEED_A);
SEED_C[31] = 0xff;

const nexts = (r: ReturnType<typeof rngFrom>, n: number): number[] =>
  Array.from({ length: n }, () => r.next());

describe('rngFrom', () => {
  it('gives the same sequence for the same seed (TS-41)', () => {
    expect(nexts(rngFrom(SEED_A), 100)).toEqual(nexts(rngFrom(SEED_A), 100));
    const a = rngFrom(SEED_A);
    const b = rngFrom(SEED_A);
    expect(Array.from({ length: 100 }, () => a.int(1, 6))).toEqual(
      Array.from({ length: 100 }, () => b.int(1, 6)),
    );
  });

  it('gives different sequences for different seeds (TS-42)', () => {
    const a = nexts(rngFrom(SEED_A), 10);
    const b = nexts(rngFrom(SEED_B), 10);
    const c = nexts(rngFrom(SEED_C), 10);
    expect(a).not.toEqual(b);
    expect(a).not.toEqual(c);
    expect(b).not.toEqual(c);
  });

  it('pins the first values of SEED_A (TS-43)', () => {
    expect(nexts(rngFrom(SEED_A), 3)).toEqual(PINNED);
  });

  it('keeps instances independent and does not mutate the seed (TS-44)', () => {
    const copy = SEED_A.slice();
    const a = rngFrom(SEED_A);
    const b = rngFrom(SEED_A);
    a.next();
    a.next();
    expect(b.next()).toBe(rngFrom(SEED_A).next());
    expect(SEED_A).toEqual(copy);
  });

  it('respects byteOffset of views (TS-45)', () => {
    const big = new Uint8Array(40);
    big.set(SEED_A, 8);
    expect(nexts(rngFrom(big.subarray(8, 40)), 10)).toEqual(nexts(rngFrom(SEED_A), 10));
  });

  it('int is an inclusive integer in range (TS-46)', () => {
    const r = rngFrom(SEED_A);
    const values = Array.from({ length: 1000 }, () => r.int(1, 6));
    expect(values.every((v) => Number.isInteger(v) && v >= 1 && v <= 6)).toBe(true);
    expect(new Set(values).size).toBe(6);
  });

  it('pick is deterministic and a member of the list (TS-47)', () => {
    const list = ['CACHE', 'MERGE', 'REACT'];
    const first = rngFrom(SEED_A).pick(list);
    expect(rngFrom(SEED_A).pick(list)).toBe(first);
    expect(list).toContain(first);
    expect(rngFrom(SEED_A).pick(['ONLY'])).toBe('ONLY');
  });

  it('pick throws on an empty list (TS-48)', () => {
    expect(() => rngFrom(SEED_A).pick([])).toThrow(new RangeError('Rng.pick: empty list'));
  });

  it.each([8, 18, 0])('rejects an invalid seed of %i bytes (TS-49)', (len) => {
    expect(() => rngFrom(new Uint8Array(len))).toThrow(
      new RangeError('rngFrom: seed must be at least 16 bytes and a multiple of 4'),
    );
  });

  it('does not degenerate when the seed folds to the zero state (TS-50)', () => {
    const half = SEED_A.slice(0, 16);
    const equalHalves = new Uint8Array([...half, ...half]);
    const zeros = nexts(rngFrom(new Uint8Array(32)), 10);
    const folded = nexts(rngFrom(equalHalves), 10);
    expect(new Set(zeros).size).toBeGreaterThanOrEqual(2);
    expect(new Set(folded).size).toBeGreaterThanOrEqual(2);
    expect(zeros).toEqual(folded);
  });
});

const PINNED = [538976288, 269488144, 303170050];
