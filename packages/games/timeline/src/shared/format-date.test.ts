import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatEventDate } from './format-date';

afterEach(() => vi.unstubAllEnvs());

describe('formatEventDate', () => {
  it('formats by precision in es (TS-11)', () => {
    expect(formatEventDate('2009-01-01', 'year', 'es')).toBe('2009');
    expect(formatEventDate('2014-06-01', 'month', 'es')).toBe('junio de 2014');
    expect(formatEventDate('1995-06-08', 'day', 'es')).toBe('8 de junio de 1995');
  });
  it('formats by precision in en (TS-12)', () => {
    expect(formatEventDate('2009-01-01', 'year', 'en')).toBe('2009');
    expect(formatEventDate('2014-06-01', 'month', 'en')).toBe('June 2014');
    expect(formatEventDate('1995-06-08', 'day', 'en')).toBe('June 8, 1995');
  });
  it('does not depend on the process time zone (TS-13)', () => {
    vi.stubEnv('TZ', 'America/Los_Angeles');
    expect(formatEventDate('2014-06-01', 'month', 'en')).toBe('June 2014');
    expect(formatEventDate('2000-01-01', 'year', 'en')).toBe('2000');
  });
});
