import { afterEach, describe, expect, it } from 'vitest';

import { formatDayLabel } from './format-day';

describe('formatDayLabel', () => {
  const originalTz = process.env.TZ;
  afterEach(() => {
    process.env.TZ = originalTz;
  });

  it('TS-9: formato ES y EN sin coma ni punto final', () => {
    expect(formatDayLabel('2026-11-03', 'es')).toBe('martes 3 nov');
    expect(formatDayLabel('2026-11-03', 'en')).toBe('Tuesday Nov 3');
    expect(formatDayLabel('2026-10-30', 'es')).toBe('viernes 30 oct');
  });

  it('TS-9: no depende de la zona horaria', () => {
    process.env.TZ = 'America/Los_Angeles';
    expect(formatDayLabel('2026-11-03', 'es')).toBe('martes 3 nov');
  });
});
