import { describe, expect, it } from 'vitest';

import { addDays } from './days';

describe('addDays', () => {
  it('moves dates without a clock (TS-6)', () => {
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2027-03-15', -29)).toBe('2027-02-14');
    expect(addDays('2027-03-15', 29)).toBe('2027-04-13');
  });
});
