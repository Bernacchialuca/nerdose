import { describe, expect, it } from 'vitest';

import { DIRECTIONS, GRID_SIZE, directionOf, inGrid, lineCells, sameCell } from './geometry';

const c = (row: number, col: number) => ({ row, col });

describe('lineCells', () => {
  it('horizontal (TS-5)', () => {
    expect(lineCells(c(3, 2), c(3, 7))).toEqual([
      c(3, 2),
      c(3, 3),
      c(3, 4),
      c(3, 5),
      c(3, 6),
      c(3, 7),
    ]);
  });
  it('diagonal ascending (TS-6)', () => {
    expect(lineCells(c(9, 1), c(5, 5))).toEqual([c(9, 1), c(8, 2), c(7, 3), c(6, 4), c(5, 5)]);
  });
  it('vertical and diagonal descending (TS-7)', () => {
    expect(lineCells(c(2, 6), c(7, 6))).toEqual([
      c(2, 6),
      c(3, 6),
      c(4, 6),
      c(5, 6),
      c(6, 6),
      c(7, 6),
    ]);
    expect(lineCells(c(5, 0), c(9, 4))).toEqual([c(5, 0), c(6, 1), c(7, 2), c(8, 3), c(9, 4)]);
  });
  it('reverse is null (TS-8)', () => {
    expect(lineCells(c(3, 7), c(3, 2))).toBeNull();
    expect(lineCells(c(7, 6), c(2, 6))).toBeNull();
    expect(lineCells(c(5, 5), c(9, 1))).toBeNull();
    expect(lineCells(c(9, 4), c(5, 0))).toBeNull();
  });
  it('unaligned or single cell is null (TS-9)', () => {
    expect(lineCells(c(0, 0), c(2, 5))).toBeNull();
    expect(lineCells(c(4, 4), c(4, 4))).toBeNull();
  });
  it('out of grid or non-integer is null (TS-10)', () => {
    expect(lineCells(c(0, 0), c(0, 12))).toBeNull();
    expect(lineCells(c(-1, 0), c(3, 0))).toBeNull();
    expect(lineCells(c(1.5, 0), c(1.5, 3))).toBeNull();
  });
});

describe('directionOf and constants (TS-11)', () => {
  it('names the 4 forward directions', () => {
    expect(directionOf(c(3, 2), c(3, 7))).toBe('right');
    expect(directionOf(c(0, 9), c(9, 9))).toBe('down');
    expect(directionOf(c(5, 0), c(9, 4))).toBe('down_right');
    expect(directionOf(c(9, 1), c(5, 5))).toBe('up_right');
    expect(directionOf(c(3, 7), c(3, 2))).toBeNull();
    expect(GRID_SIZE).toBe(12);
    expect([...DIRECTIONS]).toEqual(['right', 'down', 'down_right', 'up_right']);
  });
  it('inGrid and sameCell', () => {
    expect(inGrid(c(11, 0))).toBe(true);
    expect(inGrid(c(12, 0))).toBe(false);
    expect(sameCell(c(1, 2), c(1, 2))).toBe(true);
    expect(sameCell(c(1, 2), c(2, 1))).toBe(false);
  });
});
