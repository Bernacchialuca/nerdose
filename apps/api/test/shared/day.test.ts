import { describe, expect, it } from 'vitest';

import { shiftDay } from '@/shared/day';

describe('shiftDay', () => {
  it('suma y resta días en UTC', () => {
    expect(shiftDay('2026-12-01', 1)).toBe('2026-12-02');
    expect(shiftDay('2026-12-01', -365)).toBe('2025-12-01');
    expect(shiftDay('2026-02-28', 1)).toBe('2026-03-01');
  });
  it('cruza el año y n = 0', () => {
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01');
    expect(shiftDay('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftDay('2026-12-01', 0)).toBe('2026-12-01');
  });
});
