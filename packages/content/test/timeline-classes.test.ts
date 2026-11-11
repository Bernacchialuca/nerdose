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
        expect(cls.fallbackProperty).toBe(cls.dateProperty === 'P577' ? 'P571' : 'P577');
      }
    }
    expect(new Set(TIMELINE_CLASSES.map((cls) => cls.category)).size).toBeGreaterThanOrEqual(3);
  });

  it('maps every timeline category, hardware included (no per-category minimum)', () => {
    const mapped = new Set(TIMELINE_CLASSES.map((cls) => cls.category));
    expect([...mapped].sort()).toEqual([...TIMELINE_CATEGORIES].sort());
  });

  it('maps databases and software_tools to creation date with release-date fallback', () => {
    const byCategory = (category: string) =>
      TIMELINE_CLASSES.filter((cls) => cls.category === category);
    expect(byCategory('databases').map((cls) => cls.wikidataClass)).toEqual([
      'Q176165',
      'Q3932296',
      'Q82231',
    ]);
    expect(byCategory('software_tools').map((cls) => cls.wikidataClass)).toContain('Q6368');
    for (const cls of [...byCategory('databases'), ...byCategory('software_tools')]) {
      expect(cls).toMatchObject({ dateProperty: 'P571', fallbackProperty: 'P577' });
    }
  });
});
