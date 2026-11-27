import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { DEVDLE_LAUNCH_TERMS, LAUNCH_DAYS } from '../src/generator/launch-terms';
import { WORD_PATTERN } from '../src/definition';
import { DEVDLE_EXCLUDED_TERMS } from '../src/shared/excluded';

type DatasetTerm = { term: string; category: string; status: string };

// Dataset versionado de @nerdose/content (ADR-016), leído como archivo: devdle no depende del paquete.
const dataset: DatasetTerm[] = JSON.parse(
  readFileSync(new URL('../../../content/data/terms.json', import.meta.url), 'utf8'),
);
const approved = new Map(dataset.filter((t) => t.status === 'approved').map((t) => [t.term, t]));

describe('DEVDLE_LAUNCH_TERMS', () => {
  it('has more terms than launch days, so the order stays unpredictable', () => {
    expect(DEVDLE_LAUNCH_TERMS.size).toBeGreaterThanOrEqual(Math.ceil(LAUNCH_DAYS * 1.4));
  });

  it('only lists approved, valid and non-excluded terms of the dataset', () => {
    for (const term of DEVDLE_LAUNCH_TERMS) {
      expect(approved.has(term), term).toBe(true);
      expect(WORD_PATTERN.test(term), term).toBe(true);
      expect(DEVDLE_EXCLUDED_TERMS.has(term), term).toBe(false);
    }
  });

  it('spreads over every category so the rotation has room', () => {
    const categories = new Set([...DEVDLE_LAUNCH_TERMS].map((t) => approved.get(t)?.category));
    expect(categories).toEqual(new Set([...approved.values()].map((t) => t.category)));
  });
});
