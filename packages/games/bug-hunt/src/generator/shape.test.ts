import { describe, expect, it } from 'vitest';

import { CODE_MAX_INDEX } from '../definition/test-fixtures';

import { MAX_LINES, MAX_NESTING, MIN_LINES, measureCode } from './shape';

describe('measureCode', () => {
  it('counts lines and nesting from the indentation', () => {
    expect(measureCode(CODE_MAX_INDEX.js, 'js')).toEqual({ lines: 9, nesting: 2 });
    expect(measureCode(CODE_MAX_INDEX.go, 'go')).toEqual({ lines: 9, nesting: 2 });
    expect(measureCode(CODE_MAX_INDEX.java, 'java')).toEqual({ lines: 9, nesting: 2 });
    expect(measureCode('function f(n) {\n  return n;\n}', 'js')).toEqual({ lines: 3, nesting: 0 });
  });

  it('declares the shape limits', () => {
    expect([MIN_LINES, MAX_LINES, MAX_NESTING]).toEqual([8, 15, 3]);
  });
});
