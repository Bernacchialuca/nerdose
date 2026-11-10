import { describe, expect, it } from 'vitest';

import { moveFocus } from './focus';

describe('moveFocus (TS-13)', () => {
  it.each([
    [{ row: 0, col: 0 }, 'ArrowLeft', { row: 0, col: 0 }],
    [{ row: 0, col: 0 }, 'ArrowUp', { row: 0, col: 0 }],
    [{ row: 0, col: 0 }, 'ArrowRight', { row: 0, col: 1 }],
    [{ row: 0, col: 0 }, 'ArrowDown', { row: 1, col: 0 }],
    [{ row: 11, col: 11 }, 'ArrowRight', { row: 11, col: 11 }],
    [{ row: 4, col: 7 }, 'Home', { row: 4, col: 0 }],
    [{ row: 4, col: 7 }, 'End', { row: 4, col: 11 }],
    [{ row: 4, col: 7 }, 'Tab', null],
  ])('%j + %s', (pos, key, expected) => {
    expect(moveFocus(pos, key)).toEqual(expected);
  });
});
