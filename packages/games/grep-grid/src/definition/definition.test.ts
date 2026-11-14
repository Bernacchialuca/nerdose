import { createGameRegistry } from '@nerdose/core';
import type { CodeLanguage, Culprit } from '@nerdose/core';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { definition, grepGrid } from './index';
import {
  publicViewSchema,
  resultSchema,
  statsSchema,
  stateSchema,
  type GrepGridMove,
  type GrepGridPayload,
} from './schemas';
import {
  CTX_EN,
  CTX_ES,
  ID,
  NOW,
  PAYLOAD,
  S0,
  WORD_ORDER,
  cellsOf,
  playAll,
  select,
  selectWord,
} from './test-fixtures';

const apply = (s: typeof S0, m: GrepGridMove, ctx = CTX_ES) =>
  grepGrid.applyMove(PAYLOAD, s, m, NOW, ctx);
const c = (row: number, col: number) => ({ row, col });
const S1 = playAll([selectWord('DOCKER')]).state;
const S3 = playAll([selectWord('DOCKER'), selectWord('REDIS'), selectWord('MERGE')]).state;
const S7 = playAll(WORD_ORDER.filter((w) => w !== 'PYTHON').map(selectWord)).state;
const S8 = playAll(WORD_ORDER.map(selectWord)).state;

describe('grepGrid registration and schemas', () => {
  it('registers in the core registry (TS-17)', () => {
    expect(createGameRegistry([grepGrid]).get('grep-grid')).toBe(grepGrid);
    expect(definition).toBe(grepGrid);
    expect(grepGrid.id).toBe('grep-grid');
    expect(grepGrid.version).toBe(1);
    expect(grepGrid.bankUsage).toEqual({
      bank: 'terms',
      lastUsedField: 'last_used_grep',
      windowDays: 30,
      itemsPerChallenge: 8,
    });
    expect(createGameRegistry([grepGrid]).get('grep-grid').bankUsage).toEqual({
      bank: 'terms',
      lastUsedField: 'last_used_grep',
      windowDays: 30,
      itemsPerChallenge: 8,
    });
  });
  it('schemas accept the definition outputs (TS-16)', () => {
    expect(() => stateSchema.parse(S3)).not.toThrow();
    expect(() => resultSchema.parse(grepGrid.result(PAYLOAD, S0, 'es'))).not.toThrow();
    expect(() => statsSchema.parse(grepGrid.initialStats())).not.toThrow();
    expect(() => publicViewSchema.parse(grepGrid.toPublic(PAYLOAD, 'es'))).not.toThrow();
    expect(() => publicViewSchema.parse(grepGrid.toPublic(PAYLOAD, 'es', S3))).not.toThrow();
  });
  it('initState (TS-18)', () => {
    expect(grepGrid.initState(PAYLOAD, NOW)).toEqual({ found_words: [], gave_up: false });
  });
});

describe('applyMove select', () => {
  it('finds a horizontal word (TS-19)', () => {
    const before = structuredClone(S0);
    const r = apply(S0, selectWord('DOCKER'));
    expect(r).toEqual({
      state: { found_words: [{ term_id: ID.DOCKER, cells: cellsOf('DOCKER') }], gave_up: false },
      feedback: {
        found: true,
        term_id: ID.DOCKER,
        word: 'DOCKER',
        definition: 'definición de DOCKER',
        cells: cellsOf('DOCKER'),
      },
    });
    expect(S0).toEqual(before);
  });
  it('appends a diagonal word at the end (TS-20)', () => {
    const r = apply(S1, select(c(9, 1), c(5, 5)));
    expect(r).toEqual({
      state: {
        found_words: [
          { term_id: ID.DOCKER, cells: cellsOf('DOCKER') },
          { term_id: ID.REDIS, cells: cellsOf('REDIS') },
        ],
        gave_up: false,
      },
      feedback: {
        found: true,
        term_id: ID.REDIS,
        word: 'REDIS',
        definition: 'definición de REDIS',
        cells: cellsOf('REDIS'),
      },
    });
  });
  it('feedback uses ctx.locale (TS-21)', () => {
    const r = apply(S0, selectWord('DOCKER'), CTX_EN);
    const es = apply(S0, selectWord('DOCKER'));
    if ('error' in r || 'error' in es) throw new Error('unexpected');
    expect(r.feedback).toMatchObject({ definition: 'definition of DOCKER', word: 'DOCKER' });
    expect(r.state).toEqual(es.state);
  });
  it('partial stretch is not_a_word (TS-22)', () => {
    for (const m of [select(c(0, 0), c(0, 3)), select(c(3, 3), c(3, 7))]) {
      expect(apply(S0, m)).toEqual({ state: S0, feedback: { found: false, reason: 'not_a_word' } });
    }
  });
  it('valid line without word is not_a_word and keeps the state (TS-23)', () => {
    expect(apply(S1, select(c(10, 0), c(10, 5)))).toEqual({
      state: S1,
      feedback: { found: false, reason: 'not_a_word' },
    });
  });
  it('already found keeps the state (TS-24)', () => {
    const r = apply(S1, selectWord('DOCKER'));
    expect(r).toEqual({ state: S1, feedback: { found: false, reason: 'already_found' } });
    if ('error' in r) throw new Error('unexpected');
    expect(r.state.found_words).toHaveLength(1);
  });
  it('reverse selection is invalid_move (TS-25)', () => {
    expect(apply(S0, select(c(3, 7), c(3, 2)))).toEqual({ error: 'invalid_move' });
    expect(apply(S0, select(c(5, 5), c(9, 1)))).toEqual({ error: 'invalid_move' });
    expect(S0).toEqual({ found_words: [], gave_up: false });
  });
  it('unaligned or single cell is invalid_move (TS-26)', () => {
    expect(apply(S0, select(c(0, 0), c(2, 5)))).toEqual({ error: 'invalid_move' });
    expect(apply(S0, select(c(4, 4), c(4, 4)))).toEqual({ error: 'invalid_move' });
  });
  it('out of range bypassing moveSchema is invalid_move (TS-27)', () => {
    expect(apply(S0, select(c(0, 0), c(0, 12)))).toEqual({ error: 'invalid_move' });
  });
  it('finished by give_up is invalid_move (TS-28)', () => {
    const done = { found_words: [], gave_up: true };
    expect(apply(done, selectWord('DOCKER'))).toEqual({ error: 'invalid_move' });
    expect(apply(done, { type: 'give_up' })).toEqual({ error: 'invalid_move' });
  });
  it('finished by 8/8 is invalid_move (TS-29)', () => {
    expect(apply(S8, { type: 'give_up' })).toEqual({ error: 'invalid_move' });
    expect(apply(S8, selectWord('DOCKER'))).toEqual({ error: 'invalid_move' });
  });
  it('the eighth word closes (TS-30)', () => {
    expect(grepGrid.isFinished(S7)).toBe(false);
    expect(S8.found_words).toHaveLength(8);
    expect(S8.gave_up).toBe(false);
    expect(grepGrid.isFinished(S8)).toBe(true);
    expect(playAll(WORD_ORDER.map(selectWord)).feedback).toMatchObject({ found: true });
  });
});

describe('result, give_up and stats', () => {
  it('result with 8/8 (TS-31)', () => {
    const r = grepGrid.result(PAYLOAD, S8, 'es');
    expect(r.win).toBe(true);
    expect(r.score).toBe(8);
    expect(r.gave_up).toBe(false);
    expect(r.words.map((w) => w.word)).toEqual(PAYLOAD.words.map((w) => w.word));
    expect(r.words.every((w) => w.found)).toBe(true);
    expect(r.words[1]).toEqual({
      term_id: ID.DOCKER,
      word: 'DOCKER',
      definition: 'definición de DOCKER',
      found: true,
      cells: cellsOf('DOCKER'),
    });
    expect(grepGrid.isWin(r)).toBe(true);
    expect(grepGrid.score(r)).toBe(8);
    expect(grepGrid.historyLabel(r)).toBe('8/8');
  });
  it('give_up with 0 found (TS-32)', () => {
    const r = apply(S0, { type: 'give_up' });
    if ('error' in r) throw new Error('unexpected');
    expect(r.feedback).toBeNull();
    expect(r.state).toEqual({ found_words: [], gave_up: true });
    expect(grepGrid.isFinished(r.state)).toBe(true);
    const res = grepGrid.result(PAYLOAD, r.state, 'es');
    expect(res).toMatchObject({ win: false, score: 0, gave_up: true });
    expect(res.words.every((w) => !w.found && w.cells.length > 0)).toBe(true);
    expect(grepGrid.historyLabel(res)).toBe('0/8');
  });
  it('give_up with 3 found (TS-33)', () => {
    const r = apply(S3, { type: 'give_up' });
    if ('error' in r) throw new Error('unexpected');
    expect(r.feedback).toBeNull();
    const res = grepGrid.result(PAYLOAD, r.state, 'es');
    expect(res).toMatchObject({ win: false, score: 3, gave_up: true });
    expect(res.words.map((w) => w.found)).toEqual([
      false,
      true,
      false,
      false,
      true,
      false,
      false,
      true,
    ]);
    expect(res.words[0]?.cells).toEqual([c(0, 11), c(1, 11), c(2, 11), c(3, 11), c(4, 11)]);
    expect(grepGrid.isWin(res)).toBe(false);
    expect(grepGrid.score(res)).toBe(3);
    expect(grepGrid.historyLabel(res)).toBe('3/8');
  });
  it('give_up with 7 found (TS-34)', () => {
    const r = apply(S7, { type: 'give_up' });
    if ('error' in r) throw new Error('unexpected');
    const res = grepGrid.result(PAYLOAD, r.state, 'es');
    expect(res).toMatchObject({ win: false, score: 7, gave_up: true });
    expect(grepGrid.historyLabel(res)).toBe('7/8');
  });
  it('result is localized (TS-35)', () => {
    const es = grepGrid.result(PAYLOAD, S3, 'es');
    const en = grepGrid.result(PAYLOAD, S3, 'en');
    expect(es.words.map((w) => w.definition)).toEqual(
      PAYLOAD.words.map((w) => `definición de ${w.word}`),
    );
    expect(en.words.map((w) => w.definition)).toEqual(
      PAYLOAD.words.map((w) => `definition of ${w.word}`),
    );
    const strip = (r: typeof es) => ({
      ...r,
      words: r.words.map((w) => ({ ...w, definition: '' })),
    });
    expect(strip(es)).toEqual(strip(en));
  });
  it('initialStats (TS-36)', () => {
    expect(grepGrid.initialStats()).toEqual({
      words_found: { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0 },
    });
  });
  it('reduceStats adds to String(score) (TS-37)', () => {
    const r = (score: number) => ({ ...grepGrid.result(PAYLOAD, S0, 'es'), score });
    const p0 = grepGrid.initialStats();
    const p1 = grepGrid.reduceStats(p0, r(3));
    expect(p1.words_found['3']).toBe(1);
    const p2 = grepGrid.reduceStats(p1, r(8));
    expect(p2.words_found['8']).toBe(1);
    const p3 = grepGrid.reduceStats(p2, r(0));
    expect(p3.words_found).toEqual({ ...p0.words_found, '3': 1, '8': 1, '0': 1 });
    expect(p0).toEqual(grepGrid.initialStats());
    expect(p3).not.toBe(p2);
  });
});

describe('toPublic', () => {
  const base = {
    grid: PAYLOAD.grid,
    words: PAYLOAD.words.map((w) => ({ term_id: w.term_id, word: w.word })),
  };
  it('without state (TS-38)', () => {
    const es = grepGrid.toPublic(PAYLOAD, 'es');
    expect(es).toEqual(base);
    expect(es.grid).not.toBe(PAYLOAD.grid);
    expect(Object.keys(es).sort()).toEqual(['grid', 'words']);
    for (const w of es.words) expect(Object.keys(w).sort()).toEqual(['term_id', 'word']);
    expect(grepGrid.toPublic(PAYLOAD, 'en')).toEqual(es);
  });
  it('with 0 found (TS-39)', () => {
    const v = grepGrid.toPublic(PAYLOAD, 'es', S0);
    expect(v).toEqual(base);
    expect(v.words.every((w) => !('definition' in w))).toBe(true);
  });
  it('with k found (TS-40)', () => {
    const v = grepGrid.toPublic(PAYLOAD, 'es', S3);
    const withDef = v.words.filter((w) => 'definition' in w);
    expect(withDef.map((w) => w.term_id).sort()).toEqual([ID.DOCKER, ID.MERGE, ID.REDIS].sort());
    expect(v.words.find((w) => w.term_id === ID.DOCKER)?.definition).toBe('definición de DOCKER');
    expect(v.grid).toEqual(PAYLOAD.grid);
    expect(v.words.map((w) => w.term_id)).toEqual(PAYLOAD.words.map((w) => w.term_id));
  });
  it('localized (TS-41)', () => {
    const en = grepGrid.toPublic(PAYLOAD, 'en', S3);
    expect(en.words.find((w) => w.term_id === ID.DOCKER)?.definition).toBe('definition of DOCKER');
    expect(en.grid).toEqual(PAYLOAD.grid);
  });
  it('does not depend on placements (TS-42)', () => {
    const p = { ...PAYLOAD, placements: [] } as unknown as GrepGridPayload;
    expect(grepGrid.toPublic(p, 'es', S3)).toEqual(grepGrid.toPublic(PAYLOAD, 'es', S3));
  });
});

describe('grepGrid culprits', () => {
  const EXPECTED = (
    ['CACHE', 'DOCKER', 'KERNEL', 'KUBERNETES', 'MERGE', 'OAUTH', 'PYTHON', 'REDIS'] as const
  ).map((w) => ({ kind: 'term', id: ID[w], label: w }));

  it('returns eight term culprits in words order (TS-7)', () => {
    const out = grepGrid.culprits(PAYLOAD);
    expect(out).toHaveLength(8);
    expect(out).toEqual(EXPECTED);
  });

  it('exposes only kind, id and label (TS-8)', () => {
    for (const k of grepGrid.culprits(PAYLOAD).map((x) => Object.keys(x).sort())) {
      expect(k).toEqual(['id', 'kind', 'label']);
    }
  });

  it('follows p.words, not p.placements (TS-9)', () => {
    const p = { ...PAYLOAD, words: [...PAYLOAD.words].reverse() };
    expect(grepGrid.culprits(p).map((x) => x.label)).toEqual([
      'REDIS',
      'PYTHON',
      'OAUTH',
      'MERGE',
      'KUBERNETES',
      'KERNEL',
      'DOCKER',
      'CACHE',
    ]);
  });

  it('is pure (TS-10)', () => {
    const before = structuredClone(PAYLOAD);
    const a = grepGrid.culprits(PAYLOAD);
    const b = grepGrid.culprits(PAYLOAD);
    expect(PAYLOAD).toEqual(before);
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  it('works through the registry (TS-11)', () => {
    expect(createGameRegistry([grepGrid]).get('grep-grid').culprits(PAYLOAD)).toEqual(EXPECTED);
  });

  it('is typed as Culprit[] (TS-21)', () => {
    expectTypeOf(grepGrid.culprits).returns.toEqualTypeOf<Culprit[]>();
  });
});

describe('grepGrid codeLanguage', () => {
  const GAVE_UP = { found_words: [], gave_up: true };

  it('is null for the initial state and after give_up (S-042 TS-7)', () => {
    expect(grepGrid.codeLanguage(S0)).toBeNull();
    expect(grepGrid.codeLanguage(GAVE_UP)).toBeNull();
  });

  it('is null for a Play closed 8/8 (S-042 TS-8)', () => {
    expect(grepGrid.isFinished(S8)).toBe(true);
    expect(grepGrid.codeLanguage(S8)).toBeNull();
  });

  it('is visible through the registry and typed (S-042 TS-9)', () => {
    expect(createGameRegistry([grepGrid]).get('grep-grid').codeLanguage(S0)).toBeNull();
    expectTypeOf(grepGrid.codeLanguage).returns.toEqualTypeOf<CodeLanguage | null>();
  });

  it('is pure and does not depend on the state (S-042 TS-19)', () => {
    for (const s of [S0, S8]) {
      const before = structuredClone(s);
      expect(grepGrid.codeLanguage(s)).toBeNull();
      expect(grepGrid.codeLanguage(s)).toBeNull();
      expect(s).toEqual(before);
    }
  });
});
