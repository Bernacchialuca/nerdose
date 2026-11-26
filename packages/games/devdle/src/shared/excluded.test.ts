import { describe, expect, it } from 'vitest';

import { devdle } from '../definition';
import { DEVDLE_EXCLUDED_TERMS } from './excluded';

describe('DEVDLE_EXCLUDED_TERMS', () => {
  it('holds bank-shaped terms (uppercase, 4-12 letters)', () => {
    expect(DEVDLE_EXCLUDED_TERMS.size).toBeGreaterThan(0);
    for (const t of DEVDLE_EXCLUDED_TERMS) expect(t).toMatch(/^[A-Z]{4,12}$/);
  });

  it('is exposed through the definition bankUsage, so the api sees it', () => {
    expect(devdle.bankUsage?.excludedItems).toBe(DEVDLE_EXCLUDED_TERMS);
    expect(devdle.bankUsage?.excludedItems?.has('SLITAZ')).toBe(true);
  });
});
