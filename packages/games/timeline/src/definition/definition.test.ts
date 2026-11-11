import { createGameRegistry } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { definition, timeline } from './index';
import { feedbackSchema, publicViewSchema, resultSchema, statsSchema } from './schemas';
import {
  CHRONO_ITEMS,
  CORRECT,
  CTX_EN,
  CTX_ES,
  NOW,
  PAYLOAD,
  REVERSED,
  ROTATED,
  S0,
  SWAP,
  move,
} from './test-fixtures';

const PUBLIC_ITEMS = [
  { opaque_id: 'g2n5w3', label: 'Go' },
  { opaque_id: 'k1v3s8', label: 'Kubernetes' },
  { opaque_id: 'p7k2m9', label: 'Python' },
  { opaque_id: 'd9r6t0', label: 'Docker' },
  { opaque_id: 'j4x8q1', label: 'Java' },
];

describe('timeline definition', () => {
  it('registers in core (TS-18)', () => {
    expect(createGameRegistry([timeline]).get('timeline')).toBe(timeline);
    expect(definition).toBe(timeline);
    expect(timeline.id).toBe('timeline');
    expect(timeline.version).toBe(1);
  });

  it('toPublic in es (TS-19)', () => {
    expect(timeline.toPublic(PAYLOAD, 'es')).toEqual({
      category: 'programming_languages',
      prompt: 'Ordená estos lenguajes del más antiguo al más reciente',
      items: PUBLIC_ITEMS,
    });
  });

  it('toPublic in en ignores state (TS-20)', () => {
    const expected = {
      category: 'programming_languages',
      prompt: 'Order these languages from oldest to newest',
      items: PUBLIC_ITEMS,
    };
    expect(timeline.toPublic(PAYLOAD, 'en')).toEqual(expected);
    expect(timeline.toPublic(PAYLOAD, 'en', {})).toEqual(expected);
    expect(timeline.toPublic(PAYLOAD, 'en', { order: CORRECT })).toEqual(expected);
  });

  it('initState and isFinished (TS-21)', () => {
    expect(timeline.initState(PAYLOAD, NOW)).toEqual({});
    expect(timeline.isFinished({})).toBe(false);
    expect(timeline.isFinished({ order: CORRECT })).toBe(true);
  });

  it('a valid confirmation closes the play (TS-22)', () => {
    const order = [...SWAP];
    const r = timeline.applyMove(PAYLOAD, S0, move(order), NOW, CTX_ES);
    expect(r).toEqual({ state: { order: SWAP }, feedback: null });
    if ('state' in r) expect(r.state.order).not.toBe(order);
    expect(S0).toEqual({});
    expect(order).toEqual(SWAP);
  });

  it('rejects 4 ids (TS-23)', () => {
    expect(timeline.applyMove(PAYLOAD, S0, move(CORRECT.slice(0, 4)), NOW, CTX_ES)).toEqual({
      error: 'invalid_move',
    });
    expect(S0).toEqual({});
  });

  it('rejects a repeated id (TS-24)', () => {
    const m = move(['p7k2m9', 'p7k2m9', 'g2n5w3', 'd9r6t0', 'k1v3s8']);
    expect(timeline.applyMove(PAYLOAD, S0, m, NOW, CTX_ES)).toEqual({ error: 'invalid_move' });
  });

  it('rejects unknown ids (TS-25)', () => {
    for (const order of [
      ['p7k2m9', 'j4x8q1', 'g2n5w3', 'd9r6t0', 'zzzzzz'],
      ['P7K2M9', 'j4x8q1', 'g2n5w3', 'd9r6t0', 'k1v3s8'],
    ]) {
      expect(timeline.applyMove(PAYLOAD, S0, move(order), NOW, CTX_ES)).toEqual({
        error: 'invalid_move',
      });
    }
  });

  it('rejects a move on a finished state (TS-26)', () => {
    const s = { order: SWAP };
    expect(timeline.applyMove(PAYLOAD, s, move(CORRECT), NOW, CTX_ES)).toEqual({
      error: 'invalid_move',
    });
    expect(s).toEqual({ order: SWAP });
  });

  it('result 3/5 (TS-27)', () => {
    const r = timeline.result(PAYLOAD, { order: SWAP }, 'es');
    expect(r).toEqual({
      win: false,
      score: 3,
      category: 'programming_languages',
      correct_order: CORRECT,
      submitted_order: SWAP,
      items: CHRONO_ITEMS('es'),
    });
    expect(r.items[4]).toEqual({
      opaque_id: 'k1v3s8',
      label: 'Kubernetes',
      event_date: '2014-06-01',
      date_precision: 'month',
      note: 'nota de Kubernetes',
    });
  });

  it('result 5/5 (TS-28)', () => {
    const r = timeline.result(PAYLOAD, { order: CORRECT }, 'es');
    expect(r.win).toBe(true);
    expect(r.score).toBe(5);
    expect(timeline.isWin(r)).toBe(true);
    expect(timeline.score(r)).toBe(5);
    expect(timeline.historyLabel(r)).toBe('5/5');
  });

  it('reversed order scores 1: the middle item stays in place (TS-29)', () => {
    const r = timeline.result(PAYLOAD, { order: REVERSED }, 'es');
    expect(r.win).toBe(false);
    expect(r.score).toBe(1);
    expect(r.submitted_order).toEqual(REVERSED);
  });

  it('no correct position scores 0/5 (TS-30)', () => {
    const r = timeline.result(PAYLOAD, { order: ROTATED }, 'es');
    expect(r.score).toBe(0);
    expect(r.win).toBe(false);
    expect(timeline.isWin(r)).toBe(false);
    expect(timeline.historyLabel(r)).toBe('0/5');
  });

  it('historyLabel and score for 3/5 (TS-31)', () => {
    const r = timeline.result(PAYLOAD, { order: SWAP }, 'es');
    expect(timeline.historyLabel(r)).toBe('3/5');
    expect(timeline.score(r)).toBe(3);
    expect(timeline.isWin(r)).toBe(false);
  });

  it('result localizes only the notes (TS-32)', () => {
    const es = timeline.result(PAYLOAD, { order: SWAP }, 'es');
    const en = timeline.result(PAYLOAD, { order: SWAP }, 'en');
    expect(en.items.map((i) => i.note)).toEqual(
      ['Python', 'Java', 'Go', 'Docker', 'Kubernetes'].map((l) => `note on ${l}`),
    );
    expect({ ...en, items: en.items.map((i) => ({ ...i, note: '' })) }).toEqual({
      ...es,
      items: es.items.map((i) => ({ ...i, note: '' })),
    });
  });

  it('result with an unfinished state does not throw (TS-33)', () => {
    expect(timeline.result(PAYLOAD, {}, 'es')).toEqual({
      win: false,
      score: 0,
      submitted_order: [],
      correct_order: CORRECT,
      category: 'programming_languages',
      items: CHRONO_ITEMS('es'),
    });
  });

  it('initialStats (TS-34)', () => {
    expect(timeline.initialStats()).toEqual({ by_category: {} });
  });

  it('reduceStats creates the category (TS-35)', () => {
    const prev = { by_category: {} };
    const next = timeline.reduceStats(prev, timeline.result(PAYLOAD, { order: SWAP }, 'es'));
    expect(next).toEqual({ by_category: { programming_languages: { played: 1, correct: 3 } } });
    expect(prev).toEqual({ by_category: {} });
  });

  it('reduceStats accumulates without touching other categories (TS-36)', () => {
    const prev = {
      by_category: {
        programming_languages: { played: 2, correct: 7 },
        companies: { played: 1, correct: 5 },
      },
    };
    const a = timeline.reduceStats(prev, timeline.result(PAYLOAD, { order: CORRECT }, 'es'));
    expect(a).toEqual({
      by_category: {
        programming_languages: { played: 3, correct: 12 },
        companies: { played: 1, correct: 5 },
      },
    });
    expect(timeline.reduceStats(a, timeline.result(PAYLOAD, { order: ROTATED }, 'es'))).toEqual({
      by_category: {
        programming_languages: { played: 4, correct: 12 },
        companies: { played: 1, correct: 5 },
      },
    });
  });

  it('outputs satisfy their schemas (TS-17)', () => {
    expect(() => publicViewSchema.parse(timeline.toPublic(PAYLOAD, 'es'))).not.toThrow();
    expect(() => resultSchema.parse(timeline.result(PAYLOAD, { order: SWAP }, 'es'))).not.toThrow();
    expect(() => statsSchema.parse(timeline.initialStats())).not.toThrow();
    expect(
      statsSchema.safeParse({ by_category: { internet: { played: 1, correct: 1 } } }).success,
    ).toBe(false);
    expect(() => feedbackSchema.parse(null)).not.toThrow();
    expect(timeline.applyMove(PAYLOAD, S0, move(SWAP), NOW, CTX_EN)).toHaveProperty(
      'feedback',
      null,
    );
  });
});
