export const GRID_SIZE = 12;

export const DIRECTIONS = ['right', 'down', 'down_right', 'up_right'] as const;
export type Direction = (typeof DIRECTIONS)[number];

export type Cell = { row: number; col: number };

export const DIRECTION_STEPS: Record<Direction, { dRow: number; dCol: number }> = {
  right: { dRow: 0, dCol: 1 },
  down: { dRow: 1, dCol: 0 },
  down_right: { dRow: 1, dCol: 1 },
  up_right: { dRow: -1, dCol: 1 },
};

const inRange = (n: number): boolean => Number.isInteger(n) && n >= 0 && n < GRID_SIZE;

export function inGrid(cell: Cell): boolean {
  return inRange(cell.row) && inRange(cell.col);
}

export function sameCell(a: Cell, b: Cell): boolean {
  return a.row === b.row && a.col === b.col;
}

export function directionOf(from: Cell, to: Cell): Direction | null {
  if (!inGrid(from) || !inGrid(to)) return null;
  const dRow = to.row - from.row;
  const dCol = to.col - from.col;
  if (dRow === 0 && dCol > 0) return 'right';
  if (dCol === 0 && dRow > 0) return 'down';
  if (dRow === dCol && dRow > 0) return 'down_right';
  if (dRow === -dCol && dCol > 0) return 'up_right';
  return null;
}

export function lineCells(from: Cell, to: Cell): Cell[] | null {
  const direction = directionOf(from, to);
  if (direction === null) return null;
  const { dRow, dCol } = DIRECTION_STEPS[direction];
  const length = Math.max(Math.abs(to.row - from.row), Math.abs(to.col - from.col)) + 1;
  return Array.from({ length }, (_, i) => ({ row: from.row + dRow * i, col: from.col + dCol * i }));
}
