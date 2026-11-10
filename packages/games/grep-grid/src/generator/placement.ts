import type { Rng } from '@nerdose/core';

import {
  DIRECTIONS,
  DIRECTION_STEPS,
  GRID_SIZE,
  directionOf,
  type Cell,
  type Direction,
} from '../shared/geometry';
import { countOccurrences } from './occurrences';

export const MAX_PLACEMENT_STEPS = 2000;
export const MAX_FILL_REDRAWS = 10;

export type PlacedWord = { from: Cell; to: Cell; direction: Direction };
export type MutableGrid = (string | null)[][];

type Candidate = PlacedWord;

const emptyGrid = (): MutableGrid =>
  Array.from({ length: GRID_SIZE }, () => Array<string | null>(GRID_SIZE).fill(null));

function lineOf(word: string, from: Cell, direction: Direction): Cell[] | null {
  const { dRow, dCol } = DIRECTION_STEPS[direction];
  const to = { row: from.row + dRow * (word.length - 1), col: from.col + dCol * (word.length - 1) };
  if (directionOf(from, to) !== direction) return null;
  return Array.from({ length: word.length }, (_, i) => ({
    row: from.row + dRow * i,
    col: from.col + dCol * i,
  }));
}

function candidatesFor(word: string): Candidate[] {
  const all: Candidate[] = [];
  for (const direction of DIRECTIONS) {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cells = lineOf(word, { row, col }, direction);
        if (cells) all.push({ from: cells[0] as Cell, to: cells.at(-1) as Cell, direction });
      }
    }
  }
  return all;
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [items[i], items[j]] = [items[j] as T, items[i] as T];
  }
  return items;
}

/** Cruces permitidos con la misma letra; la palabra no puede quedar íntegramente sobre celdas ocupadas. */
export function canPlace(grid: MutableGrid, word: string, cand: Candidate): boolean {
  const cells = lineOf(word, cand.from, cand.direction);
  if (!cells) return false;
  let empty = 0;
  for (const [i, { row, col }] of cells.entries()) {
    const current = grid[row]?.[col];
    if (current === null) empty++;
    else if (current !== word[i]) return false;
  }
  return empty > 0;
}

/** Escribe la palabra y devuelve las celdas que estaban vacías (para deshacer). */
function write(grid: MutableGrid, word: string, cand: Candidate): Cell[] {
  const written: Cell[] = [];
  for (const [i, cell] of (lineOf(word, cand.from, cand.direction) as Cell[]).entries()) {
    const row = grid[cell.row] as (string | null)[];
    if (row[cell.col] === null) {
      row[cell.col] = word[i] as string;
      written.push(cell);
    }
  }
  return written;
}

/**
 * Ubica las palabras (mayor a menor largo) con backtracking acotado. `placements[i]` corresponde a
 * `words[i]`; es `null` para las que no se pudieron ubicar.
 */
export function placeWords(
  words: readonly string[],
  rng: Rng,
): { grid: MutableGrid; placements: (PlacedWord | null)[] } {
  const order = words
    .map((word, index) => ({ word, index }))
    .sort((a, b) =>
      b.word.length !== a.word.length
        ? b.word.length - a.word.length
        : a.word < b.word
          ? -1
          : a.word > b.word
            ? 1
            : 0,
    );
  const shuffled = order.map(({ word }) => shuffle(candidatesFor(word), rng));

  const grid = emptyGrid();
  const current: (Candidate | null)[] = order.map(() => null);
  let best: (Candidate | null)[] = [...current];
  let bestDepth = 0;
  let steps = 0;

  const search = (depth: number): boolean => {
    if (depth > bestDepth) {
      bestDepth = depth;
      best = [...current];
    }
    if (depth === order.length) return true;
    const { word } = order[depth] as (typeof order)[number];
    for (const cand of shuffled[depth] as Candidate[]) {
      if (steps >= MAX_PLACEMENT_STEPS) return false;
      steps++;
      if (!canPlace(grid, word, cand)) continue;
      const written = write(grid, word, cand);
      current[depth] = cand;
      if (search(depth + 1)) return true;
      current[depth] = null;
      for (const { row, col } of written) (grid[row] as (string | null)[])[col] = null;
    }
    return false;
  };

  const ok = search(0);
  const final = ok ? current : best;
  if (!ok) {
    // Se reconstruye la grilla solo con lo ubicado en el mejor intento.
    for (const row of grid) row.fill(null);
    for (const [depth, cand] of final.entries()) {
      if (cand) write(grid, (order[depth] as (typeof order)[number]).word, cand);
    }
  }

  const placements: (PlacedWord | null)[] = words.map(() => null);
  for (const [depth, cand] of final.entries()) {
    placements[(order[depth] as (typeof order)[number]).index] = cand;
  }
  return { grid, placements };
}

/** Rellena las celdas libres con A–Z; re-sortea solo el relleno si alguna palabra deja de ser única. */
export function fillGrid(grid: MutableGrid, words: readonly string[], rng: Rng): string[][] {
  const free: Cell[] = [];
  for (const [row, cells] of grid.entries()) {
    for (const [col, letter] of cells.entries()) if (letter === null) free.push({ row, col });
  }
  const out = grid.map((row) => row.map((l) => l ?? ''));
  for (let attempt = 0; attempt <= MAX_FILL_REDRAWS; attempt++) {
    for (const { row, col } of free) {
      (out[row] as string[])[col] = String.fromCharCode(65 + rng.int(0, 25));
    }
    if (words.every((w) => countOccurrences(out, w) === 1)) break;
  }
  return out;
}
