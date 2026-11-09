import { TERM_CATEGORIES } from '@nerdose/core';
import type { Locale } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { devdle } from './index';
import type { DevdlePayload } from './index';
import { ALL_VALID, NOW, PAYLOAD_MERGE, PAYLOAD_REACT } from './test-fixtures';

const LOCALES: Locale[] = ['es', 'en'];
const WRONG = ['CACHE', 'REDIS', 'TRACE', 'CRATE', 'CARET'];

function preResultResponses(): unknown[] {
  const out: unknown[] = [devdle.initState(PAYLOAD_REACT, NOW)];
  for (const l of LOCALES) out.push(devdle.toPublic(PAYLOAD_REACT, l));
  let s = devdle.initState(PAYLOAD_REACT, NOW);
  for (const guess of WRONG) {
    const r = devdle.applyMove(PAYLOAD_REACT, s, { guess }, NOW, ALL_VALID);
    if ('error' in r) throw new Error(r.error);
    out.push(r);
    s = r.state;
  }
  expect(devdle.isFinished(s)).toBe(false);
  return out;
}

describe('devdle anti-spoiler contract (NFR-S01)', () => {
  it('toPublic has the exact shape (TS-29)', () => {
    const expected = { length: 5, possible_categories: [...TERM_CATEGORIES] };
    for (const l of LOCALES) {
      const v = devdle.toPublic(PAYLOAD_REACT, l);
      expect(v).toEqual(expected);
      expect(Object.keys(v).sort()).toEqual(['length', 'possible_categories']);
    }
  });

  it('toPublic does not depend on the solution (TS-30)', () => {
    expect(devdle.toPublic(PAYLOAD_REACT, 'es')).toEqual(devdle.toPublic(PAYLOAD_MERGE, 'en'));
    for (const category of TERM_CATEGORIES) {
      const p: DevdlePayload = { ...PAYLOAD_REACT, category };
      expect(devdle.toPublic(p, 'es').possible_categories).toEqual([...TERM_CATEGORIES]);
    }
  });

  it('no pre-result response contains a solution value (TS-31)', () => {
    const p = PAYLOAD_REACT;
    const forbidden = [
      p.word,
      p.term_id,
      p.definition.es,
      p.definition.en,
      p.summary.es,
      p.summary.en,
    ];
    for (const response of preResultResponses()) {
      const json = JSON.stringify(response);
      for (const value of forbidden) expect(json).not.toContain(value);
    }
    const noCategories = JSON.stringify({
      ...devdle.toPublic(p, 'es'),
      possible_categories: undefined,
    });
    expect(noCategories).not.toContain(p.category);
    expect(
      JSON.stringify([devdle.initState(p, NOW), ...preResultResponses().slice(3)]),
    ).not.toContain(p.category);
  });

  it('feedback only carries guess and marks (TS-32)', () => {
    const r = devdle.applyMove(PAYLOAD_REACT, { guesses: [] }, { guess: 'CACHE' }, NOW, ALL_VALID);
    if ('error' in r) throw new Error(r.error);
    expect(Object.keys(r.feedback).sort()).toEqual(['guess', 'marks']);
    expect(r.feedback.marks).toHaveLength(5);
    for (const m of r.feedback.marks) expect(['correct', 'present', 'absent']).toContain(m);
  });
});
