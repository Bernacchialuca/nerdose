import { describe, expect, it } from 'vitest';

import { cellKey, playCells, resultCells } from './cells';
import { GRID, RESULT_GAVE_UP_5 } from './test-fixtures';

const at = (cells: ReturnType<typeof playCells>, row: number, col: number) =>
  cells.find((c) => c.row === row && c.col === col);

describe('playCells', () => {
  it('builds 144 cells with start > found > free (TS-11)', () => {
    const cells = playCells(GRID, new Set([cellKey({ row: 3, col: 6 })]), { row: 3, col: 2 });
    expect(cells).toHaveLength(144);
    expect(at(cells, 3, 2)).toMatchObject({ state: 'start', letter: 'D' });
    expect(at(cells, 3, 6)?.state).toBe('found');
    expect(cells.filter((c) => c.state === 'free')).toHaveLength(142);
  });

  it('start wins over found', () => {
    const cells = playCells(GRID, new Set(['3:2']), { row: 3, col: 2 });
    expect(at(cells, 3, 2)?.state).toBe('start');
  });
});

describe('resultCells', () => {
  const cells = resultCells(GRID, RESULT_GAVE_UP_5.words);

  it('marks found and revealed words (TS-12)', () => {
    expect(at(cells, 5, 0)?.state).toBe('revealed'); // OAUTH
    expect(at(cells, 5, 5)?.state).toBe('revealed'); // REDIS
    expect(at(cells, 3, 2)?.state).toBe('found'); // DOCKER
    expect(at(cells, 3, 6)?.state).toBe('found'); // DOCKER x KERNEL
    expect(at(cells, 9, 1)?.state).toBe('revealed'); // REDIS start
    expect(at(cells, 11, 11)?.state).toBe('free');
  });
});
