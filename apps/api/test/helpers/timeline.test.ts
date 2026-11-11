import { timeline } from '@nerdose/game-timeline/definition';
import { describe, expect, it } from 'vitest';

import { CORRECT, REVERSED, ROTATED, SWAP, TL_PAYLOAD, TL_PUBLIC_ES, tlResult } from './timeline';

describe('fixture de Timeline', () => {
  it('coincide con la definición real', () => {
    expect(timeline.toPublic(TL_PAYLOAD, 'es')).toEqual(TL_PUBLIC_ES);
    const result = timeline.result(TL_PAYLOAD, { order: SWAP }, 'es');
    expect(result).toEqual(tlResult(SWAP, 'es'));
    expect(result.score).toBe(3);
    for (const [order, score] of [
      [CORRECT, 5],
      [REVERSED, 1],
      [ROTATED, 0],
    ] as const) {
      expect(timeline.result(TL_PAYLOAD, { order: [...order] }, 'es').score).toBe(score);
    }
  });
});
