import { describe, expect, it } from 'vitest';

import { BS, C, D, DBL, H, L, nest, seq } from './dsl';
import { deriveAnswer } from './complexity';
import { RECIPES } from './recipes';

describe('deriveAnswer', () => {
  it('nests multiply and sequences keep the largest (TS-9)', () => {
    expect(deriveAnswer(nest(L, DBL))).toBe('o_n_log_n');
    expect(deriveAnswer(seq(L, L))).toBe('o_n');
    expect(deriveAnswer(nest(L, C))).toBe('o_n');
    expect(deriveAnswer(nest(L, D))).toBe('o_n2');
    expect(deriveAnswer(seq(L, nest(L, L)))).toBe('o_n2');
    expect(deriveAnswer(seq(C, C))).toBe('o_1');
    expect(deriveAnswer(seq(L, H))).toBe('o_n');
    expect(deriveAnswer(nest(C, BS))).toBe('o_log_n');
    expect(() => deriveAnswer(nest(DBL, DBL))).toThrow('big-o: unsupported_class');
  });

  it('matches the declared answer of every recipe (TS-9)', () => {
    for (const r of RECIPES) expect(deriveAnswer(r.shape), r.id).toBe(r.answer);
  });
});
