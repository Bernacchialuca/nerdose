import { describe, expect, it } from 'vitest';

import { moveLine, moveRadio } from './radio';

describe('radio navigation (TS-13)', () => {
  it('moveLine handles only vertical keys, Home and End', () => {
    expect(moveLine(0, 'ArrowDown', 5)).toBe(1);
    expect(moveLine(4, 'ArrowDown', 5)).toBe(0);
    expect(moveLine(0, 'ArrowUp', 5)).toBe(4);
    expect(moveLine(2, 'Home', 5)).toBe(0);
    expect(moveLine(2, 'End', 5)).toBe(4);
    expect(moveLine(2, 'ArrowRight', 5)).toBeNull();
    expect(moveLine(2, 'ArrowLeft', 5)).toBeNull();
    expect(moveLine(2, 'a', 5)).toBeNull();
  });

  it('moveRadio also handles horizontal keys', () => {
    expect(moveRadio(2, 'ArrowRight', 3)).toBe(0);
  });
});
