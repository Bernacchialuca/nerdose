import { describe, expect, it } from 'vitest';

import * as generatorFormat from '../generator/format';

import { formatArgs, formatCall, formatValue } from './format';

describe('shared format (TS-6)', () => {
  it('formats calls, values and arguments', () => {
    expect(formatCall('maxIndex', [[5, 1, 5]])).toBe('maxIndex([5, 1, 5])');
    expect(formatCall('anyAbove', [[], 3])).toBe('anyAbove([], 3)');
    expect(formatValue(true)).toBe('true');
    expect(formatValue(-1)).toBe('-1');
    expect(formatArgs([[3, 7, 2], 4])).toBe('[3, 7, 2], 4');
  });

  it('the generator re-exports the same functions', () => {
    expect(generatorFormat.formatCall).toBe(formatCall);
    expect(generatorFormat.formatValue).toBe(formatValue);
  });
});
