import { describe, expect, it } from 'vitest';

import { formatCount } from './format-number';

describe('format-number', () => {
  it('formatCount agrupa desde 4 dígitos (TS-1)', () => {
    expect([0, 40, 1050, 1284, 12840, 1234567].map(formatCount)).toEqual([
      '0',
      '40',
      '1.050',
      '1.284',
      '12.840',
      '1.234.567',
    ]);
  });
});
