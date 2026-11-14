import { describe, expect, it } from 'vitest';

import { formatCount } from './format';

describe('formatCount (TS-13)', () => {
  it('uses the thousands separator of the language', () => {
    expect(formatCount(10240, 'es')).toBe('10.240');
    expect(formatCount(1048576, 'es')).toBe('1.048.576');
    expect(formatCount(1024, 'es')).toBe('1024');
    expect(formatCount(1024, 'en')).toBe('1,024');
    expect(formatCount(10240, 'en')).toBe('10,240');
  });
});
