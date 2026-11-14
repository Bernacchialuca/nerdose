import { describe, expect, it } from 'vitest';

import { formatInstant, formatRelative, formatTime } from './format-date';

const now = new Date('2026-11-11T12:00:00Z');

describe('format-date', () => {
  it('formatRelative (TS-66)', () => {
    expect(formatRelative('2026-11-11T10:00:00Z', now)).toBe('hace 2 h');
    expect(formatRelative('2026-11-11T11:30:00Z', now)).toBe('hace 30 min');
    expect(formatRelative('2026-11-10T12:00:00Z', now)).toBe('ayer');
    expect(formatRelative('2026-11-08T12:00:00Z', now)).toBe('hace 3 d');
  });

  it('formatInstant (TS-66)', () => {
    expect(formatInstant('2026-11-08T14:32:00Z')).toBe('2026-11-08 14:32');
  });

  it('formatTime (TS-4)', () => {
    expect(formatTime('2026-12-01T14:02:00Z')).toBe('14:02');
  });
});
