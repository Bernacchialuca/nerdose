import { TIMELINE_CATEGORIES } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { PROMPTS } from './prompts';

describe('PROMPTS', () => {
  it('fixes the programming languages prompt (TS-10)', () => {
    expect(PROMPTS.programming_languages).toEqual({
      es: 'Ordená estos lenguajes del más antiguo al más reciente',
      en: 'Order these languages from oldest to newest',
    });
  });
  it('covers every category with distinct non-empty texts (TS-10)', () => {
    expect(Object.keys(PROMPTS).sort()).toEqual([...TIMELINE_CATEGORIES].sort());
    const all = Object.values(PROMPTS).flatMap((p) => [p.es, p.en]);
    expect(all.every((t) => t.length > 0)).toBe(true);
    expect(new Set(all).size).toBe(all.length);
  });
});
