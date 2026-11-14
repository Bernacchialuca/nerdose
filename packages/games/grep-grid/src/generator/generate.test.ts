import { describe, expect, it } from 'vitest';

import { payloadSchema, type GrepGridPayload } from '../definition';
import { ID, PAYLOAD } from '../definition/test-fixtures';
import { directionOf, lineCells } from '../shared/geometry';
import { BANK, BANK_FIXTURE, DATE, history, seed } from './test-fixtures';
import { generator } from './index';

const gen = (n: number, bank = BANK, recent: { date: string; payload: GrepGridPayload }[] = []) =>
  generator.generate({ date: DATE, seed: seed(n), history: history(bank, recent) });
const fifty = Array.from({ length: 50 }, (_, i) => gen(i + 1));
const wordsOf = (p: GrepGridPayload) => p.words.map((w) => w.word);

describe('generator metadata (TS-45)', () => {
  it('historySpec and usedBankItems', () => {
    expect(generator.historySpec).toEqual({
      bank: 'terms',
      lastUsedField: 'last_used_grep',
      recentDays: 30,
    });
    expect(generator.usedBankItems(PAYLOAD)).toEqual(Object.values(ID));
  });
});

describe('generate', () => {
  it('returns a valid payload copying bank data (TS-46)', () => {
    const p = payloadSchema.parse(gen(1));
    expect(p.date).toBe(DATE);
    expect(new Set(p.words.map((w) => w.term_id)).size).toBe(8);
    expect(wordsOf(p)).toEqual([...wordsOf(p)].sort());
    expect(p.placements.map((x) => x.term_id)).toEqual(p.words.map((w) => w.term_id));
    for (const w of p.words) {
      const item = BANK.find((t) => t.id === w.term_id)!;
      expect(w.definition).toEqual(item.definition);
      expect(w.definition).not.toBe(item.definition);
    }
  });

  it('uses only eligible terms (TS-47)', () => {
    const all = fifty.flatMap(wordsOf);
    expect(all).not.toContain('SWIFT');
    expect(all).not.toContain('NGINX');
    expect(all).toContain('DOCKER');
    expect(new Set(fifty.map((p) => wordsOf(p).join()))).not.toHaveProperty('size', 1);
  });

  it('never mixes substrings (TS-48)', () => {
    for (const p of fifty) {
      for (const a of wordsOf(p)) {
        for (const b of wordsOf(p)) if (a !== b) expect(a.includes(b), `${a}/${b}`).toBe(false);
      }
    }
  });

  it('excludes terms of recent challenges (TS-49)', async () => {
    const h = history(BANK, [{ date: '2026-11-02', payload: PAYLOAD }]);
    const p = gen(1, BANK, [{ date: '2026-11-02', payload: PAYLOAD }]);
    expect(wordsOf(p)).toEqual(expect.arrayContaining(['ROUTER', 'LINUX']));
    const v = await generator.verify(p, h);
    expect(v.ok).toBe(false);
    expect(v.reason).toBe('not_used_30');
  });

  it('chooses anyway without 8 eligible terms and verify rejects (TS-50)', async () => {
    const bank = BANK_FIXTURE.map((t) =>
      t.term === 'MERGE' ? { ...t, last_used_grep: '2026-12-01' } : t,
    );
    const p = gen(1, bank);
    expect(() => payloadSchema.parse(p)).not.toThrow();
    expect(wordsOf(p)).toContain('MERGE');
    const v = await generator.verify(p, history(bank));
    expect(v.ok).toBe(false);
    expect(v.reason).toBe('not_used_30');
  });

  it('throws with fewer than 8 bank items (TS-51)', () => {
    expect(() => gen(1, BANK_FIXTURE.slice(0, 7))).toThrow(
      new RangeError('grep-grid generate: bank has fewer than 8 terms'),
    );
  });

  it('is deterministic and does not mutate history (TS-52)', () => {
    const copy = structuredClone(BANK);
    const input = { date: DATE, seed: seed(7), history: history(BANK) };
    expect(generator.generate(input)).toEqual(generator.generate(input));
    expect(input.history.bankItems).toEqual(copy);
  });

  it('does not depend on bank order (TS-53)', () => {
    expect(gen(7, [...BANK].reverse())).toEqual(gen(7));
  });

  it('different seeds give different grids (TS-54)', () => {
    expect(gen(1).grid).not.toEqual(gen(2).grid);
  });

  it('places consistently (TS-55)', () => {
    for (const p of fifty) {
      for (const pl of p.placements) {
        const word = p.words.find((w) => w.term_id === pl.term_id)!.word;
        const cells = lineCells(pl.from, pl.to)!;
        expect(cells).not.toBeNull();
        expect(directionOf(pl.from, pl.to)).toBe(pl.direction);
        expect(cells.map((c) => p.grid[c.row]?.[c.col]).join('')).toBe(word);
      }
      expect(p.grid.flat().every((c) => /^[A-Z]$/.test(c))).toBe(true);
      const covered = (w: string) => {
        const pl = p.placements.find(
          (x) => x.term_id === p.words.find((y) => y.word === w)!.term_id,
        )!;
        return lineCells(pl.from, pl.to)!.map((c) => `${c.row},${c.col}`);
      };
      for (const a of wordsOf(p)) {
        const others = new Set(
          wordsOf(p)
            .filter((b) => b !== a)
            .flatMap(covered),
        );
        expect(
          covered(a).every((k) => others.has(k)),
          `${a} contained`,
        ).toBe(false);
      }
    }
  });

  it('uses the 4 directions (TS-56)', () => {
    const used = new Set(fifty.flatMap((p) => p.placements.map((x) => x.direction)));
    expect([...used].sort()).toEqual(['down', 'down_right', 'right', 'up_right']);
  });

  it('generate then verify is ok (TS-57)', async () => {
    for (const p of fifty) {
      const v = await generator.verify(p, history(BANK));
      expect(v.ok, JSON.stringify(v)).toBe(true);
      expect(v.reason).toBeUndefined();
      expect(v.checks.map((c) => c.name)).toEqual([
        'grid_shape',
        'words_count',
        'words_in_bank',
        'word_shape',
        'texts_bilingual',
        'no_substrings',
        'placements_consistent',
        'exactly_once',
        'not_used_30',
      ]);
    }
  });
});
