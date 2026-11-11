import { TIMELINE_CATEGORIES } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { TIMELINE_CLASSES } from '../scripts/import-banks/classes';

describe('TIMELINE_CLASSES', () => {
  it('is well formed (TS-3)', () => {
    const ids = TIMELINE_CLASSES.map((cls) => cls.wikidataClass);
    expect(new Set(ids).size).toBe(ids.length);
    for (const cls of TIMELINE_CLASSES) {
      expect(cls.wikidataClass).toMatch(/^Q[1-9]\d*$/);
      expect(TIMELINE_CATEGORIES).toContain(cls.category);
      const publication = cls.category === 'video_games' || cls.category === 'hardware';
      expect(cls.dateProperty).toBe(publication ? 'P577' : 'P571');
      if (cls.fallbackProperty !== undefined) {
        expect(cls.fallbackProperty).toBe('P571');
        expect(cls.dateProperty).toBe('P577');
      }
    }
    expect(new Set(TIMELINE_CLASSES.map((cls) => cls.category)).size).toBeGreaterThanOrEqual(3);
  });
});
