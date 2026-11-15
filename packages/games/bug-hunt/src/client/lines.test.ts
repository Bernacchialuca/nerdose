import { describe, expect, it } from 'vitest';

import { codeLines } from './lines';
import { CODE } from './test-fixtures';

describe('codeLines (TS-14)', () => {
  it('splits the code by line', () => {
    const lines = codeLines(CODE.go);
    expect(lines).toHaveLength(9);
    expect(lines[3]).toBe('\t\tif nums[i] >= nums[best] {');
    expect(lines[8]).toBe('}');
  });
});
