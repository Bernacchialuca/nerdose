import { describe, expect, it } from 'vitest';

import type { GrepGridPayload } from '../definition';
import { GRID_DUPLICATE, ID, PAYLOAD } from '../definition/test-fixtures';
import { BANK_FIXTURE, history, mk } from './test-fixtures';
import { generator } from './index';
import { verifyPayload } from './verify';

const verify = (
  p: unknown,
  bank = BANK_FIXTURE,
  recent: { date: string; payload: GrepGridPayload }[] = [],
) => verifyPayload(p as GrepGridPayload, history(bank, recent));
const reason = (p: unknown, bank = BANK_FIXTURE) => {
  const v = verify(p, bank);
  expect(v.ok).toBe(false);
  return v.reason;
};
const NAMES = [
  'grid_shape',
  'words_count',
  'words_in_bank',
  'word_shape',
  'texts_bilingual',
  'no_substrings',
  'placements_consistent',
  'exactly_once',
  'not_used_30',
];
const withWord = (i: number, patch: object) => ({
  ...PAYLOAD,
  words: PAYLOAD.words.map((w, j) => (j === i ? { ...w, ...patch } : w)),
});
const withPlacement = (i: number, patch: object) => ({
  ...PAYLOAD,
  placements: PAYLOAD.placements.map((x, j) => (j === i ? { ...x, ...patch } : x)),
});

describe('verifyPayload', () => {
  it('accepts the fixture with the 9 checks in order (TS-58)', () => {
    const v = verify(PAYLOAD);
    expect(v.ok).toBe(true);
    expect(v.checks.map((c) => c.name)).toEqual(NAMES);
    expect(v.checks.every((c) => c.ok)).toBe(true);
  });

  it('grid_shape (TS-59)', () => {
    const short = { ...PAYLOAD, grid: PAYLOAD.grid.slice(0, 11) };
    const row = { ...PAYLOAD, grid: PAYLOAD.grid.map((r, i) => (i === 0 ? r.slice(0, 11) : r)) };
    const cell = {
      ...PAYLOAD,
      grid: PAYLOAD.grid.map((r, i) => (i === 0 ? ['a', ...r.slice(1)] : r)),
    };
    for (const p of [short, row, cell]) expect(reason(p)).toBe('grid_shape');
  });

  it('words_count (TS-60)', () => {
    expect(reason({ ...PAYLOAD, words: PAYLOAD.words.slice(0, 7) })).toBe('words_count');
    expect(reason(withWord(1, { term_id: ID.CACHE }))).toBe('words_count');
  });

  it('words_in_bank (TS-61)', () => {
    expect(
      reason(
        PAYLOAD,
        BANK_FIXTURE.filter((t) => t.id !== ID.DOCKER),
      ),
    ).toBe('words_in_bank');
    expect(
      reason(
        PAYLOAD,
        BANK_FIXTURE.map((t) => (t.id === ID.DOCKER ? { ...t, term: 'PODMAN' } : t)),
      ),
    ).toBe('words_in_bank');
  });

  it('word_shape (TS-62)', () => {
    const bank = BANK_FIXTURE.map((t) => (t.id === ID.DOCKER ? { ...t, term: 'docker' } : t));
    expect(reason(withWord(1, { word: 'docker' }), bank)).toBe('word_shape');
  });

  it('texts_bilingual (TS-63)', () => {
    expect(reason(withWord(0, { definition: { es: 'x', en: '' } }))).toBe('texts_bilingual');
    expect(reason(withWord(0, { definition: { es: '   ', en: 'x' } }))).toBe('texts_bilingual');
  });

  it('no_substrings (TS-64)', () => {
    const grid = PAYLOAD.grid.map((r, i) => (i === 0 ? [...'KERNXJXJXKXC'] : r));
    const p = {
      ...PAYLOAD,
      grid,
      words: PAYLOAD.words.map((w) => (w.term_id === ID.MERGE ? { ...w, word: 'KERN' } : w)),
      placements: PAYLOAD.placements.map((x) =>
        x.term_id === ID.MERGE ? { ...x, to: { row: 0, col: 3 } } : x,
      ),
    };
    const bank = BANK_FIXTURE.map((t) => (t.id === ID.MERGE ? mk(ID.MERGE, 'KERN') : t));
    expect(reason(p, bank)).toBe('no_substrings');
  });

  it('placements_consistent (TS-65)', () => {
    const d = 1;
    expect(reason(withPlacement(d, { from: { row: 3, col: 7 }, to: { row: 3, col: 2 } }))).toBe(
      'placements_consistent',
    );
    expect(reason(withPlacement(d, { to: { row: 3, col: 6 } }))).toBe('placements_consistent');
    expect(reason(withPlacement(d, { direction: 'down' }))).toBe('placements_consistent');
  });

  it('exactly_once: duplicate by filler (TS-66)', () => {
    const v = verify({ ...PAYLOAD, grid: GRID_DUPLICATE });
    expect(v.reason).toBe('exactly_once');
    expect(v.checks.slice(0, 7).every((c) => c.ok)).toBe(true);
    expect(v.checks[7]?.detail).toContain('MERGE');
  });

  it('exactly_once: reverse does not count (TS-67)', () => {
    const grid = PAYLOAD.grid.map((r, i) => (i === 10 ? [...'EGREMWQWQWQW'] : r));
    expect(verify({ ...PAYLOAD, grid }).ok).toBe(true);
  });

  it('not_used_30 by date (TS-68)', () => {
    const bank = (last: string) =>
      BANK_FIXTURE.map((t) => (t.id === ID.DOCKER ? { ...t, last_used_grep: last } : t));
    expect(reason(PAYLOAD, bank('2026-11-03'))).toBe('not_used_30');
    expect(verify(PAYLOAD, bank('2026-11-02')).ok).toBe(true);
    expect(reason(PAYLOAD, bank('2026-12-10'))).toBe('not_used_30');
  });

  it('not_used_30 by recent challenge (TS-69)', () => {
    const v = verify(PAYLOAD, BANK_FIXTURE, [{ date: '2026-11-20', payload: PAYLOAD }]);
    expect(v.ok).toBe(false);
    expect(v.reason).toBe('not_used_30');
  });

  it('reports the first failed check (TS-70)', () => {
    const p = { ...withWord(0, { definition: { es: 'x', en: '' } }), grid: GRID_DUPLICATE };
    const v = verify(p);
    expect(v.reason).toBe('texts_bilingual');
    expect(v.checks.filter((c) => !c.ok).map((c) => c.name)).toEqual([
      'texts_bilingual',
      'exactly_once',
    ]);
  });

  it('never throws and flags dependent checks on a broken grid', () => {
    const v = verify({ ...PAYLOAD, grid: [] });
    expect(v.checks.find((c) => c.name === 'placements_consistent')?.detail).toBe(
      'grid_shape failed',
    );
    expect(v.checks.find((c) => c.name === 'exactly_once')?.detail).toBe('grid_shape failed');
    expect(() => verify({ date: 'x' })).not.toThrow();
  });

  it('generator.verify is verifyPayload and works under await (S-042 TS-10)', async () => {
    expect(generator.verify).toBe(verifyPayload);
    const v = await generator.verify(PAYLOAD, history(BANK_FIXTURE));
    expect(v.ok).toBe(true);
    expect(v.reason).toBeUndefined();
  });
});
