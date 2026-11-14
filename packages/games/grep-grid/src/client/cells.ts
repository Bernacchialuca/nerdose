import type { GrepGridPayload, GrepGridResult } from '../definition/schemas';
import { DIRECTION_STEPS, GRID_SIZE, sameCell, type Cell } from '../shared/geometry';

export type CellState = 'free' | 'start' | 'found' | 'revealed' | 'solution';
export type BoardCell = { row: number; col: number; letter: string; state: CellState };

export const cellKey = (c: Cell): string => `${c.row}:${c.col}`;

/** Glyph that backs the color of a state (never color alone). */
export const CELL_GLYPH: Partial<Record<CellState, string>> = {
  found: '✓',
  revealed: '○',
  solution: '✓',
};

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

/**
 * Cells of the 8 words, walked from `placements`. The preview paints the solution
 * from the admin payload; it does not validate moves (the server decides, NFR-S02).
 */
export function solutionKeys(p: GrepGridPayload): Set<string> {
  const keys = new Set<string>();
  for (const placement of p.placements) {
    const word = p.words.find((w) => w.term_id === placement.term_id);
    if (!word) throw new Error(`placement references unknown term_id: ${placement.term_id}`);
    const { dRow, dCol } = DIRECTION_STEPS[placement.direction];
    for (let i = 0; i < word.word.length; i++) {
      keys.add(cellKey({ row: placement.from.row + dRow * i, col: placement.from.col + dCol * i }));
    }
  }
  return keys;
}

/** Preview board: `solution` for the keys given, `free` for the rest. */
export function previewCells(grid: string[][], keys: ReadonlySet<string>): BoardCell[] {
  return layout(grid, (cell) => (keys.has(cellKey(cell)) ? 'solution' : 'free'));
}
