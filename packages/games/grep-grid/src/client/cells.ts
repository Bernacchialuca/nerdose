import type { GrepGridResult } from '../definition/schemas';
import { GRID_SIZE, sameCell, type Cell } from '../shared/geometry';

export type CellState = 'free' | 'start' | 'found' | 'revealed';
export type BoardCell = { row: number; col: number; letter: string; state: CellState };

export const cellKey = (c: Cell): string => `${c.row}:${c.col}`;

/** Glyph that backs the color of a state (never color alone). */
export const CELL_GLYPH: Partial<Record<CellState, string>> = { found: '✓', revealed: '○' };

function layout(grid: string[][], stateOf: (cell: Cell) => CellState): BoardCell[] {
  const cells: BoardCell[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      cells.push({ row, col, letter: grid[row]?.[col] ?? '', state: stateOf({ row, col }) });
    }
  }
  return cells;
}

/** Playing board: start > found > free. `found` holds `cellKey`s. */
export function playCells(grid: string[][], found: ReadonlySet<string>, start: Cell | null) {
  return layout(grid, (cell) => {
    if (start && sameCell(cell, start)) return 'start';
    return found.has(cellKey(cell)) ? 'found' : 'free';
  });
}

/** Result board: found wins over revealed where two words cross. */
export function resultCells(grid: string[][], words: GrepGridResult['words']): BoardCell[] {
  const found = new Set<string>();
  const revealed = new Set<string>();
  for (const w of words) for (const c of w.cells) (w.found ? found : revealed).add(cellKey(c));
  return layout(grid, (cell) => {
    const key = cellKey(cell);
    if (found.has(key)) return 'found';
    return revealed.has(key) ? 'revealed' : 'free';
  });
}
