import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { seedFor, seedToHex } from '@/domain/challenge-publishing/seed';

const SECRET = 'test-secret-0123456789abcdef0123456789';
const seedHex = (date: string, attempt: number) =>
  createHmac('sha256', SECRET).update(`devdle:${date}:${attempt}`).digest('hex');

describe('seedFor', () => {
  it('deriva 32 bytes HMAC-SHA256 determinísticos', () => {
    const seed = seedFor(SECRET, 'devdle', '2026-12-02', 0);
    expect(seed).toBeInstanceOf(Uint8Array);
    expect(seed).toHaveLength(32);
    expect(Buffer.from(seed).toString('hex')).toBe(seedHex('2026-12-02', 0));
    expect(seedToHex(seed)).toBe(seedHex('2026-12-02', 0));
    expect(seedToHex(seedFor(SECRET, 'devdle', '2026-12-02', 1))).not.toBe(
      seedHex('2026-12-02', 0),
    );
    expect(seedFor(SECRET, 'devdle', '2026-12-02', 0)).toEqual(seed);
  });
});
