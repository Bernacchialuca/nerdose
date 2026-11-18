import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatCount, formatShortDate, formatWinRate } from './format';

afterEach(() => vi.unstubAllEnvs());

describe('format', () => {
  it('TS-17: % de victorias', () => {
    expect(formatWinRate(0.7619, 'es').replace(/\s/g, ' ')).toBe('76 %');
    expect(formatWinRate(0.7619, 'en')).toBe('76%');
    expect(formatWinRate(null, 'es')).toBe('—');
  });

  it('TS-18: fecha corta en UTC', () => {
    vi.stubEnv('TZ', 'America/Argentina/Buenos_Aires');
    expect(formatShortDate('2026-11-03', 'es')).toBe('mar 03/11');
    expect(formatShortDate('2026-11-03', 'en')).toBe('Tue 11/03');
  });

  it('formatCount agrupa según el idioma', () => {
    expect(formatCount(31, 'es')).toBe('31');
    expect(formatCount(1234, 'en')).toBe('1,234');
  });
});
