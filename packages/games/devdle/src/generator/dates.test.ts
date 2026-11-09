import { describe, expect, it } from 'vitest';

import { addDays } from './dates';

describe('addDays', () => {
  it('adds days across years and leap days (TS-34)', () => {
    expect(addDays('2026-12-02', -365)).toBe('2025-12-02');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});
