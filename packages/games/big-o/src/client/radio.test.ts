import { describe, expect, it } from 'vitest';

import { moveRadio } from './radio';

describe('moveRadio (TS-14)', () => {
  it('moves with wrap, Home and End', () => {
    expect(moveRadio(7, 'ArrowRight', 8)).toBe(0);
    expect(moveRadio(7, 'ArrowDown', 8)).toBe(0);
    expect(moveRadio(0, 'ArrowLeft', 8)).toBe(7);
    expect(moveRadio(0, 'ArrowUp', 8)).toBe(7);
    expect(moveRadio(3, 'Home', 8)).toBe(0);
    expect(moveRadio(3, 'End', 8)).toBe(7);
    expect(moveRadio(2, 'a', 8)).toBeNull();
  });
});
