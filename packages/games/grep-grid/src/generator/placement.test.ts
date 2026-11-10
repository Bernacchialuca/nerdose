import type { Rng } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { PAYLOAD } from '../definition/test-fixtures';
import { countOccurrences } from './occurrences';
import { MAX_FILL_REDRAWS, canPlace, fillGrid, type MutableGrid } from './placement';

const empty = (): MutableGrid =>
  Array.from({ length: 12 }, () => Array<string | null>(12).fill(null));
const at = (row: number, col: number) => ({ row, col });

describe('canPlace', () => {
  const grid = empty();
  (grid[0] as (string | null)[])[0] = 'M';
  (grid[0] as (string | null)[])[1] = 'E';

  it('accepts a crossing with the same letter', () => {
    expect(canPlace(grid, 'MAP', { from: at(0, 0), to: at(2, 0), direction: 'down' })).toBe(true);
  });
  it('rejects a different letter', () => {
    expect(canPlace(grid, 'XAP', { from: at(0, 0), to: at(2, 0), direction: 'down' })).toBe(false);
  });
  it('rejects a word entirely over occupied cells', () => {
    expect(canPlace(grid, 'ME', { from: at(0, 0), to: at(0, 1), direction: 'right' })).toBe(false);
  });
  it('rejects a line that leaves the grid', () => {
    expect(canPlace(grid, 'ABCD', { from: at(0, 10), to: at(0, 13), direction: 'right' })).toBe(
      false,
    );
  });
});

describe('fillGrid', () => {
  it('re-draws only the filler cells until every word is unique (TS-72)', () => {
    const grid: MutableGrid = PAYLOAD.grid.map((row) => [...row]);
    const wordCells = new Set<string>();
    for (const p of PAYLOAD.placements) {
      const w = PAYLOAD.words.find((x) => x.term_id === p.term_id)!.word;
      for (let i = 0; i < w.length; i++) {
        const dRow = Math.sign(p.to.row - p.from.row);
        const dCol = Math.sign(p.to.col - p.from.col);
        wordCells.add(`${p.from.row + dRow * i},${p.from.col + dCol * i}`);
      }
    }
    for (const [r, row] of grid.entries()) {
      for (const c of row.keys())
        if (!wordCells.has(`${r},${c}`)) (grid[r] as (string | null)[])[c] = null;
    }
    const free: string[] = [];
    for (const [r, row] of grid.entries())
      for (const [c, l] of row.entries()) if (l === null) free.push(`${r},${c}`);

    const forced = new Map([
      ['8,5', 'M'],
      ['8,6', 'E'],
      ['8,7', 'R'],
      ['8,8', 'G'],
    ]);
    const queue: number[] = [
      ...free.map((k) => (forced.get(k) ?? 'Z').charCodeAt(0) - 65),
      ...free.map(() => 25),
    ];
    let calls = 0;
    const rng: Rng = {
      next: () => 0,
      pick: (items) => items[0] as never,
      int: () => {
        calls++;
        return queue.shift() as number;
      },
    };
    const words = PAYLOAD.words.map((w) => w.word);
    const out = fillGrid(grid, words, rng);

    expect(countOccurrences(out, 'MERGE')).toBe(1);
    expect(out[8]?.slice(5, 9).join('')).toBe('ZZZZ');
    expect(calls).toBe(free.length * 2);
    expect(calls / free.length - 1).toBeLessThanOrEqual(MAX_FILL_REDRAWS);
    for (const k of wordCells) {
      const [r, c] = k.split(',').map(Number) as [number, number];
      expect(out[r]?.[c]).toBe(PAYLOAD.grid[r]?.[c]);
    }
  });
});
