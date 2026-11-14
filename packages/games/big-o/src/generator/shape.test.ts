import { describe, expect, it } from 'vitest';

import { CODE_NLOGN } from '../definition/test-fixtures';

import { MAX_LINES, MAX_NESTING, MAX_RECURSION_DEPTH, measureCode } from './shape';

describe('measureCode', () => {
  it('counts lines and nesting from the indentation (TS-5)', () => {
    expect(measureCode(CODE_NLOGN.js, 'js')).toEqual({ lines: 9, nesting: 2 });
    expect(measureCode(CODE_NLOGN.go, 'go')).toEqual({ lines: 9, nesting: 2 });
    expect(measureCode(CODE_NLOGN.java, 'java')).toEqual({ lines: 9, nesting: 2 });
    expect(measureCode('function f(n) {\n  return n;\n}', 'js')).toEqual({ lines: 3, nesting: 0 });
  });

  it('declares the shape limits (TS-5)', () => {
    expect([MAX_LINES, MAX_NESTING, MAX_RECURSION_DEPTH]).toEqual([15, 3, 20]);
  });
});
