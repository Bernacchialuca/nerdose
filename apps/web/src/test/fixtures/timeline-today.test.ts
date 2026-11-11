import { describe, expect, it } from 'vitest';

import {
  TL_CORRECT,
  TL_INITIAL,
  TL_ITEMS,
  TL_LABEL,
  TL_ROTATED,
  TL_SWAP,
  tlResult,
} from './timeline-today';

const moveBy = (order: string[], label: string, delta: number) => {
  const id = Object.keys(TL_LABEL).find((k) => TL_LABEL[k] === label) as string;
  const from = order.indexOf(id);
  const next = [...order];
  next.splice(from, 1);
  next.splice(from + delta, 0, id);
  return next;
};

describe('fixtures de Timeline', () => {
  it('TS-6: órdenes son permutaciones y los resultados puntúan bien', () => {
    for (const order of [TL_CORRECT, TL_SWAP, TL_ROTATED]) {
      expect([...order].sort()).toEqual([...TL_INITIAL].sort());
    }
    expect(tlResult(TL_SWAP).score).toBe(3);
    expect(tlResult(TL_CORRECT).win).toBe(true);
    expect(tlResult(TL_ROTATED).score).toBe(0);
    const dates = TL_ITEMS('es').map((i) => i.event_date);
    expect(dates).toEqual([...dates].sort());
  });

  it('TS-6: la secuencia toSwap sobre el orden inicial da TL_SWAP', () => {
    let order = TL_INITIAL;
    for (const [label, delta] of [
      ['Python', -1],
      ['Python', -1],
      ['Kubernetes', 1],
      ['Kubernetes', 1],
      ['Java', -1],
    ] as const) {
      order = moveBy(order, label, delta);
    }
    expect(order).toEqual(TL_SWAP);
  });
});
