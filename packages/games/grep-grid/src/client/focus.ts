import { GRID_SIZE, type Cell } from '../shared/geometry';

const LAST = GRID_SIZE - 1;
const clamp = (n: number): number => Math.min(LAST, Math.max(0, n));

/** Next focus position for a navigation key, or `null` when the key is not handled. */
export function moveFocus(pos: Cell, key: string): Cell | null {
  switch (key) {
    case 'ArrowUp':
      return { row: clamp(pos.row - 1), col: pos.col };
    case 'ArrowDown':
      return { row: clamp(pos.row + 1), col: pos.col };
    case 'ArrowLeft':
      return { row: pos.row, col: clamp(pos.col - 1) };
    case 'ArrowRight':
      return { row: pos.row, col: clamp(pos.col + 1) };
    case 'Home':
      return { row: pos.row, col: 0 };
    case 'End':
      return { row: pos.row, col: LAST };
    default:
      return null;
  }
}
