import { createGameRegistry } from '@nerdose/core';
import type { CodeLanguage, Culprit } from '@nerdose/core';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import { definition, devdle, payloadSchema, resultSchema, stateSchema } from './index';
import type { DevdleMove, DevdleState } from './index';
import { ALL_VALID, NONE_VALID, NOW, PAYLOAD_MERGE, PAYLOAD_REACT } from './test-fixtures';

const S0: DevdleState = { guesses: [] };

function play(words: string[]): DevdleState {
  let s = devdle.initState(PAYLOAD_REACT, NOW);
  for (const guess of words) {
    const r = devdle.applyMove(PAYLOAD_REACT, s, { guess }, NOW, ALL_VALID);
    if ('error' in r) throw new Error(r.error);
    s = r.state;
  }
  return s;
}
const spy = (valid: boolean) => ({ isValidWord: vi.fn(() => valid), locale: 'es' as const });

describe('devdle definition', () => {
  it('registers in the core registry (TS-4)', () => {
    expect(createGameRegistry([devdle]).get('devdle')).toBe(devdle);
    expect(definition).toBe(devdle);
    expect(devdle.id).toBe('devdle');
    expect(devdle.version).toBe(1);
    expect(devdle.bankUsage).toEqual({
      bank: 'terms',
      lastUsedField: 'last_used_devdle',
      windowDays: 365,
      itemsPerChallenge: 1,
    });
    expect(createGameRegistry([devdle]).get('devdle').bankUsage).toEqual({
      bank: 'terms',
      lastUsedField: 'last_used_devdle',
      windowDays: 365,
      itemsPerChallenge: 1,
    });
    expect(createGameRegistry([devdle]).ids()).toEqual(['devdle']);
  });

  it('moveSchema accepts a valid move (TS-5)', () => {
    expect(devdle.moveSchema.safeParse({ guess: 'REACT' })).toEqual({
      success: true,
      data: { guess: 'REACT' },
    });
  });

  it('moveSchema rejects invalid shapes (TS-6)', () => {
    const bad = [
      { guess: 'react' },
      { guess: 'ABC' },
      { guess: 'ABCDEFGHIJKLM' },
      { guess: 'C++A' },
      { guess: 'RÉACT' },
      { guess: 'REA CT' },
      {},
      { guess: 5 },
      { hint: -1 },
      { hint: 12 },
      { hint: 1.5 },
      { hint: '2' },
      { guess: 'REACT', hint: 1 },
    ];
    for (const b of bad) expect(devdle.moveSchema.safeParse(b).success).toBe(false);
  });

  it('scores CACHE against REACT (TS-7)', () => {
    const marks = ['present', 'present', 'absent', 'absent', 'present'];
    expect(devdle.applyMove(PAYLOAD_REACT, S0, { guess: 'CACHE' }, NOW, ALL_VALID)).toEqual({
      state: { guesses: [{ guess: 'CACHE', marks }] },
      feedback: { guess: 'CACHE', marks },
    });
  });

  it('matches the api.yaml example (TS-8)', () => {
    const r = devdle.applyMove(PAYLOAD_REACT, S0, { guess: 'REDIS' }, NOW, ALL_VALID);
    expect('feedback' in r && r.feedback).toEqual({
      guess: 'REDIS',
      marks: ['correct', 'correct', 'absent', 'absent', 'absent'],
    });
  });

  it('rejects a malformed guess without calling ctx (TS-13)', () => {
    const ctx = spy(true);
    expect(devdle.applyMove(PAYLOAD_REACT, S0, { guess: 'react' } as DevdleMove, NOW, ctx)).toEqual(
      { error: 'invalid_move' },
    );
    expect(ctx.isValidWord).not.toHaveBeenCalled();
    expect(S0).toEqual({ guesses: [] });
  });

  it('rejects a guess of different length (TS-14)', () => {
    const ctx = spy(true);
    expect(devdle.applyMove(PAYLOAD_REACT, S0, { guess: 'REACTS' }, NOW, ctx)).toEqual({
      error: 'invalid_move',
    });
    expect(ctx.isValidWord).not.toHaveBeenCalled();
  });

  it('rejects a word outside the list without changing state (TS-15)', () => {
    const S2 = play(['CACHE', 'REDIS']);
    const before = structuredClone(S2);
    const ctx = spy(false);
    expect(devdle.applyMove(PAYLOAD_REACT, S2, { guess: 'QWERT' }, NOW, ctx)).toEqual({
      error: 'not_in_word_list',
    });
    expect(ctx.isValidWord).toHaveBeenCalledWith('QWERT');
    expect(S2).toEqual(before);
    expect(S2.guesses).toHaveLength(2);
  });

  it('accepts the answer even if ctx rejects it (TS-16)', () => {
    const r = devdle.applyMove(PAYLOAD_REACT, S0, { guess: 'REACT' }, NOW, NONE_VALID);
    expect('state' in r && r.state.guesses).toEqual([
      { guess: 'REACT', marks: Array(5).fill('correct') },
    ]);
  });

  it('rejects moves on a finished game (TS-17)', () => {
    const won = play(['CACHE', 'REACT']);
    const lost = play(['CACHE', 'REDIS', 'TRACE', 'CRATE', 'CARET', 'GRACE']);
    for (const s of [won, lost]) {
      expect(devdle.applyMove(PAYLOAD_REACT, s, { guess: 'CACHE' }, NOW, ALL_VALID)).toEqual({
        error: 'invalid_move',
      });
    }
  });

  it('does not mutate the input state (TS-18)', () => {
    const S1 = play(['CACHE']);
    const r = devdle.applyMove(PAYLOAD_REACT, S1, { guess: 'TRACE' }, NOW, ALL_VALID);
    expect(S1.guesses).toHaveLength(1);
    expect('state' in r && r.state.guesses).toHaveLength(2);
    expect('state' in r && r.state).not.toBe(S1);
  });

  it('starts empty (TS-19)', () => {
    expect(devdle.initState(PAYLOAD_REACT, NOW)).toEqual({ guesses: [] });
    expect(devdle.isFinished({ guesses: [] })).toBe(false);
  });

  it('wins on the 4th attempt (TS-20)', () => {
    const s3 = play(['CACHE', 'REDIS', 'TRACE']);
    expect(devdle.isFinished(s3)).toBe(false);
    const s4 = play(['CACHE', 'REDIS', 'TRACE', 'REACT']);
    expect(devdle.isFinished(s4)).toBe(true);
    const r = devdle.result(PAYLOAD_REACT, s4, 'es');
    expect(r).toEqual({
      win: true,
      score: 4,
      word: 'REACT',
      category: 'programming_languages',
      definition: 'biblioteca de JavaScript para construir interfaces de usuario',
      summary: 'React es una biblioteca de código abierto mantenida por Meta.',
      guesses: s4.guesses,
      hint: null,
    });
    expect(devdle.isWin(r)).toBe(true);
    expect(devdle.score(r)).toBe(4);
    expect(devdle.historyLabel(r)).toBe('✓ 4/6');
  });

  it('wins on the 1st attempt (TS-21)', () => {
    const s = play(['REACT']);
    expect(devdle.isFinished(s)).toBe(true);
    const r = devdle.result(PAYLOAD_REACT, s, 'es');
    expect(r.score).toBe(1);
    expect(devdle.historyLabel(r)).toBe('✓ 1/6');
  });

  it('loses after 6 valid attempts (TS-22)', () => {
    const words = ['CACHE', 'REDIS', 'TRACE', 'CRATE', 'CARET', 'GRACE'];
    expect(devdle.isFinished(play(words.slice(0, 5)))).toBe(false);
    const s6 = play(words);
    expect(devdle.isFinished(s6)).toBe(true);
    const r = devdle.result(PAYLOAD_REACT, s6, 'en');
    expect(r).toEqual({
      win: false,
      score: 6,
      word: 'REACT',
      category: 'programming_languages',
      definition: 'JavaScript library for building user interfaces',
      summary: 'React is a free and open-source front-end JavaScript library maintained by Meta.',
      guesses: s6.guesses,
      hint: null,
    });
    expect(devdle.isWin(r)).toBe(false);
    expect(devdle.score(r)).toBe(6);
    expect(devdle.historyLabel(r)).toBe('✗ X/6');
    expect(resultSchema.parse(devdle.result(PAYLOAD_REACT, s6, 'es'))).toBeTruthy();
    expect(stateSchema.parse(s6)).toBeTruthy();
    const g = s6.guesses[0];
    expect(stateSchema.safeParse({ guesses: Array(7).fill(g) }).success).toBe(false);
  });

  it('wins on the 6th attempt (TS-23)', () => {
    const r = devdle.result(
      PAYLOAD_REACT,
      play(['CACHE', 'REDIS', 'TRACE', 'CRATE', 'CARET', 'REACT']),
      'es',
    );
    expect(r.win).toBe(true);
    expect(r.score).toBe(6);
    expect(devdle.historyLabel(r)).toBe('✓ 6/6');
  });

  it('rejections do not consume an attempt (TS-24)', () => {
    expect(
      'error' in devdle.applyMove(PAYLOAD_REACT, S0, { guess: 'QWERT' }, NOW, NONE_VALID),
    ).toBe(true);
    const r = devdle.applyMove(PAYLOAD_REACT, S0, { guess: 'CACHE' }, NOW, ALL_VALID);
    expect('state' in r && r.state.guesses).toHaveLength(1);
  });

  it('has the initial stats shape (TS-25)', () => {
    expect(devdle.initialStats()).toEqual({
      guesses: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 },
      losses: 0,
    });
  });

  it('reduces stats without mutating (TS-26)', () => {
    const initial = devdle.initialStats();
    const win4 = devdle.result(PAYLOAD_REACT, play(['CACHE', 'REDIS', 'TRACE', 'REACT']), 'es');
    const loss = devdle.result(
      PAYLOAD_REACT,
      play(['CACHE', 'REDIS', 'TRACE', 'CRATE', 'CARET', 'GRACE']),
      'es',
    );
    const a = devdle.reduceStats(initial, win4);
    const aSnapshot = structuredClone(a);
    const b = devdle.reduceStats(a, loss);
    expect(a).toEqual({ guesses: { '1': 0, '2': 0, '3': 0, '4': 1, '5': 0, '6': 0 }, losses: 0 });
    expect(b).toEqual({ guesses: { '1': 0, '2': 0, '3': 0, '4': 1, '5': 0, '6': 0 }, losses: 1 });
    expect(initial).toEqual(devdle.initialStats());
    expect(a).toEqual(aSnapshot);
  });

  it('localizes the result (TS-27)', () => {
    const s4 = play(['CACHE', 'REDIS', 'TRACE', 'REACT']);
    const es = devdle.result(PAYLOAD_REACT, s4, 'es');
    const en = devdle.result(PAYLOAD_REACT, s4, 'en');
    expect(es.definition).toBe(PAYLOAD_REACT.definition.es);
    expect(en.definition).toBe(PAYLOAD_REACT.definition.en);
    expect(es.summary).not.toBe(en.summary);
    expect(es.word).toBe(en.word);
    expect(es.category).toBe(en.category);
    expect(es.guesses).toEqual(en.guesses);
    expect(es.win).toBe(en.win);
    expect(es.score).toBe(en.score);
    expect(Object.keys(es)).not.toContain('term_id');
    expect(Object.keys(es)).not.toContain('date');
  });

  describe('hint', () => {
    const hint = (s: DevdleState, position: number) =>
      devdle.applyMove(PAYLOAD_REACT, s, { hint: position }, NOW, ALL_VALID);

    it('moveSchema accepts a hint position', () => {
      expect(devdle.moveSchema.safeParse({ hint: 0 }).success).toBe(true);
      expect(devdle.moveSchema.safeParse({ hint: 11 }).success).toBe(true);
    });

    it('reveals the letter at the position without consuming an attempt', () => {
      const r = hint(play(['CACHE']), 4);
      if ('error' in r) throw new Error(r.error);
      expect(r.feedback).toEqual({ hint: { position: 4, letter: 'T' } });
      expect(r.state.hint).toEqual({ position: 4, letter: 'T' });
      expect(r.state.guesses).toHaveLength(1);
      expect(devdle.isFinished(r.state)).toBe(false);
    });

    it('allows only one hint per game', () => {
      const r = hint(S0, 0);
      if ('error' in r) throw new Error(r.error);
      expect(hint(r.state, 1)).toEqual({ error: 'invalid_move' });
    });

    it('rejects a position outside the word', () => {
      expect(hint(S0, 5)).toEqual({ error: 'invalid_move' });
    });

    it('rejects a hint on a finished game', () => {
      expect(hint(play(['REACT']), 0)).toEqual({ error: 'invalid_move' });
    });

    it('keeps the hint across later guesses and in the result', () => {
      const r = hint(S0, 1);
      if ('error' in r) throw new Error(r.error);
      const next = devdle.applyMove(PAYLOAD_REACT, r.state, { guess: 'REACT' }, NOW, ALL_VALID);
      if ('error' in next) throw new Error(next.error);
      expect(next.state.hint).toEqual({ position: 1, letter: 'E' });
      expect(devdle.result(PAYLOAD_REACT, next.state, 'es').hint).toEqual({
        position: 1,
        letter: 'E',
      });
      expect(devdle.result(PAYLOAD_REACT, play(['REACT']), 'es').hint).toBeNull();
    });

    it('parses states and results saved before the hint existed', () => {
      expect(stateSchema.parse({ guesses: [] })).toEqual({ guesses: [] });
      const legacy: Record<string, unknown> = devdle.result(PAYLOAD_REACT, play(['REACT']), 'es');
      delete legacy.hint;
      expect(resultSchema.safeParse(legacy).success).toBe(true);
    });
  });

  it('payloadSchema parses the fixture', () => {
    expect(() => payloadSchema.parse(PAYLOAD_REACT)).not.toThrow();
  });
});

describe('devdle culprits', () => {
  const REACT = [
    { kind: 'term', id: '0b7e6f1c-3a52-4c1e-9f0a-1d2e3f4a5b6c', label: 'REACT' },
  ] satisfies Culprit[];

  it('returns a single term culprit with the word (TS-1)', () => {
    const out = devdle.culprits(PAYLOAD_REACT);
    expect(out).toHaveLength(1);
    expect(out).toEqual(REACT);
  });

  it('follows the payload (TS-2)', () => {
    expect(devdle.culprits(PAYLOAD_MERGE)).toEqual([
      { kind: 'term', id: '7c1d2e3f-4a5b-4c6d-8e9f-0a1b2c3d4e5f', label: 'MERGE' },
    ]);
  });

  it('is pure (TS-3)', () => {
    const before = structuredClone(PAYLOAD_REACT);
    const a = devdle.culprits(PAYLOAD_REACT);
    const b = devdle.culprits(PAYLOAD_REACT);
    expect(PAYLOAD_REACT).toEqual(before);
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  it('works through the registry (TS-4)', () => {
    expect(createGameRegistry([devdle]).get('devdle').culprits(PAYLOAD_REACT)).toEqual(REACT);
  });

  it('is typed as Culprit[] (TS-21)', () => {
    expectTypeOf(devdle.culprits).returns.toEqualTypeOf<Culprit[]>();
  });
});

describe('devdle codeLanguage', () => {
  const lost = () => play(['CACHE', 'REDIS', 'TRACE', 'CRATE', 'CARET', 'GRACE']);

  it('is null for the initial state (S-042 TS-1)', () => {
    expect(devdle.codeLanguage(devdle.initState(PAYLOAD_REACT, NOW))).toBeNull();
  });

  it('is null for a closed Play, won or lost (S-042 TS-2)', () => {
    const won = devdle.applyMove(PAYLOAD_REACT, S0, { guess: 'REACT' }, NOW, ALL_VALID);
    if (!('state' in won)) throw new Error('expected a state');
    expect(devdle.isFinished(won.state)).toBe(true);
    expect(devdle.codeLanguage(won.state)).toBeNull();
    const l = lost();
    expect(devdle.isFinished(l)).toBe(true);
    expect(devdle.codeLanguage(l)).toBeNull();
  });

  it('is visible through the registry and typed (S-042 TS-3)', () => {
    expect(createGameRegistry([devdle]).get('devdle').codeLanguage({ guesses: [] })).toBeNull();
    expectTypeOf(devdle.codeLanguage).returns.toEqualTypeOf<CodeLanguage | null>();
  });

  it('is pure and does not depend on the state (S-042 TS-19)', () => {
    for (const s of [S0, lost()]) {
      const before = structuredClone(s);
      expect(devdle.codeLanguage(s)).toBeNull();
      expect(devdle.codeLanguage(s)).toBeNull();
      expect(s).toEqual(before);
    }
  });
});
