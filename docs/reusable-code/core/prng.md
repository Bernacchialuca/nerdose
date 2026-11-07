# PRNG

## rngFrom / Rng
- **Location:** packages/core/src/prng.ts
- **Description:** Deterministic xoroshiro128+ (pure-rand) seeded from a `Uint8Array` (>= 16 bytes, multiple of 4). Seed words are read big-endian and folded into 4 lanes so every byte counts; an all-zero state falls back to `xoroshiro128plus(0)`.
- **Signature:** `rngFrom(seed: Uint8Array): Rng`; `Rng { next(): number; int(from, to): number; pick<T>(items: readonly T[]): T }`
- **Usage:** `const chosen = rngFrom(seed).pick(sortedCandidates)` (throws `RangeError` on an empty list)
