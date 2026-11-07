import { describe, expect, it } from 'vitest';

import { nextDatasetVersion } from '../scripts/import-banks/manifest';

describe('nextDatasetVersion', () => {
  it('adds a suffix when the same day already has a version (TS-32)', () => {
    const now = new Date('2026-11-06T22:00:00Z');
    expect(nextDatasetVersion(now, undefined)).toBe('2026.11.06');
    expect(nextDatasetVersion(now, '2026.11.05')).toBe('2026.11.06');
    expect(nextDatasetVersion(now, '2026.11.06')).toBe('2026.11.06-2');
    expect(nextDatasetVersion(now, '2026.11.06-2')).toBe('2026.11.06-3');
  });
});
