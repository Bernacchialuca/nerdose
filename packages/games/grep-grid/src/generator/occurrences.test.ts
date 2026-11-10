import { describe, expect, it } from 'vitest';

import { GRID_DUPLICATE, PAYLOAD } from '../definition/test-fixtures';
import { countOccurrences } from './occurrences';

describe('countOccurrences (TS-71)', () => {
  it('counts forward occurrences', () => {
    expect(countOccurrences(PAYLOAD.grid, 'MERGE')).toBe(1);
    expect(countOccurrences(GRID_DUPLICATE, 'MERGE')).toBe(2);
    expect(countOccurrences(PAYLOAD.grid, 'REDIS')).toBe(1);
    expect(countOccurrences(PAYLOAD.grid, 'SIDER')).toBe(0);
  });
  it('every fixture word appears exactly once', () => {
    for (const w of PAYLOAD.words) expect(countOccurrences(PAYLOAD.grid, w.word)).toBe(1);
  });
});
