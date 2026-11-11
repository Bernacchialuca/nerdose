import { describe, expect, it } from 'vitest';

import { moveBy, reorder, sameIdSet } from './order';
import { INITIAL_ORDER, PUBLIC_VIEW_OTHER } from './test-fixtures';

describe('reorder (TS-6)', () => {
  it('moves like arrayMove without mutating the input', () => {
    const copy = [...INITIAL_ORDER];
    expect(reorder(INITIAL_ORDER, 2, 0)).toEqual([
      'p7k2m9',
      'g2n5w3',
      'k1v3s8',
      'd9r6t0',
      'j4x8q1',
    ]);
    expect(INITIAL_ORDER).toEqual(copy);
  });
});

describe('moveBy (TS-7)', () => {
  it('moves one position', () => {
    expect(moveBy(INITIAL_ORDER, 'k1v3s8', -1)).toEqual([
      'k1v3s8',
      'g2n5w3',
      'p7k2m9',
      'd9r6t0',
      'j4x8q1',
    ]);
  });
  it('returns the same array at the extremes', () => {
    expect(moveBy(INITIAL_ORDER, 'g2n5w3', -1)).toBe(INITIAL_ORDER);
    expect(moveBy(INITIAL_ORDER, 'j4x8q1', 1)).toBe(INITIAL_ORDER);
  });
});

describe('sameIdSet (TS-8)', () => {
  it('ignores the order', () => {
    expect(sameIdSet(INITIAL_ORDER, [...INITIAL_ORDER].reverse())).toBe(true);
  });
  it('detects a different set', () => {
    expect(
      sameIdSet(
        INITIAL_ORDER,
        PUBLIC_VIEW_OTHER.items.map((i) => i.opaque_id),
      ),
    ).toBe(false);
  });
});
