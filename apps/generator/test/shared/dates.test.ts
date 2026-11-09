import { describe, expect, it } from 'vitest';

import { addDays, maxDate } from '@/shared/dates';

describe('addDays', () => {
  it('cruza fin de año', () => expect(addDays('2026-12-31', 1)).toBe('2027-01-01'));
  it('resta días', () => expect(addDays('2026-03-01', -1)).toBe('2026-02-28'));
});

describe('maxDate', () => {
  it('devuelve la mayor', () => {
    expect(maxDate('2026-12-02', '2026-11-20')).toBe('2026-12-02');
    expect(maxDate('2026-11-20', '2026-12-02')).toBe('2026-12-02');
  });
});
