import { describe, expect, it } from 'vitest';

import { formatCountdown } from './format-countdown';

describe('formatCountdown', () => {
  it('TS-4: formatea HH:MM:SS', () => {
    expect(formatCountdown(41000)).toBe('11:23:20');
    expect(formatCountdown(10)).toBe('00:00:10');
    expect(formatCountdown(0)).toBe('00:00:00');
    expect(formatCountdown(86400)).toBe('24:00:00');
    expect(formatCountdown(-5)).toBe('00:00:00');
  });
});
