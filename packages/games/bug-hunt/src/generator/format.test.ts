import { describe, expect, it } from 'vitest';

import { formatCall, formatValue } from './format';

describe('format', () => {
  it('formats calls and values', () => {
    expect(formatCall('maxIndex', [[5, 1, 5]])).toBe('maxIndex([5, 1, 5])');
    expect(formatCall('anyAbove', [[], 3])).toBe('anyAbove([], 3)');
    expect(formatValue(true)).toBe('true');
    expect(formatValue(-1)).toBe('-1');
  });
});
