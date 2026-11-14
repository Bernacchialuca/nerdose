import { describe, expect, it } from 'vitest';

import { cellKey, playCells, previewCells, resultCells, solutionKeys } from './cells';
import { GRID, PREVIEW_PAYLOAD, RESULT_GAVE_UP_5 } from './test-fixtures';

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

describe('solutionKeys', () => {
  const keys = solutionKeys(PREVIEW_PAYLOAD);

  it('collects the cells of the 8 words once, including the crossing (TS-12)', () => {
    expect(keys.size).toBe(47);
    for (const k of [
      '3:6',
      '0:0',
      '0:4',
      '9:1',
      '8:2',
      '7:3',
      '6:4',
      '5:5',
      '0:11',
      '4:11',
      '0:9',
      '9:9',
    ]) {
      expect(keys.has(k), k).toBe(true);
    }
    expect(keys.has('1:0')).toBe(false);
    expect(keys.has('10:0')).toBe(false);
  });

  it('throws when a placement references a missing term_id (TS-13)', () => {
    const [first, ...rest] = PREVIEW_PAYLOAD.placements;
    expect(() =>
      solutionKeys({
        ...PREVIEW_PAYLOAD,
        placements: [{ ...(first as (typeof rest)[number]), term_id: 'missing' }, ...rest],
      }),
    ).toThrow('placement references unknown term_id: missing');
  });

  it('previewCells marks 47 solution cells and 97 free ones', () => {
    const cells = previewCells(PREVIEW_PAYLOAD.grid, keys);
    expect(cells).toHaveLength(144);
    expect(cells.filter((c) => c.state === 'solution')).toHaveLength(47);
    expect(cells.filter((c) => c.state === 'free')).toHaveLength(97);
    expect(at(cells, 3, 6)).toMatchObject({ state: 'solution', letter: 'E' });
  });
});
