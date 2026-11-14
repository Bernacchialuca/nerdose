import { BIG_O_OPTIONS } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { classValue, EXAMPLE_N, SCALE } from './scale';

describe('SCALE and EXAMPLE_N', () => {
  it('match the sizes of the scale table (TS-3)', () => {
    const linear = [256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536];
    expect(SCALE.o_1).toEqual(linear);
    expect(SCALE.o_log_n).toEqual(linear);
    expect(SCALE.o_n).toEqual(linear);
    expect(SCALE.o_n_log_n).toEqual(linear);
    expect(SCALE.o_n2).toEqual([64, 128, 256, 512, 1024, 2048, 4096]);
    expect(SCALE.o_n3).toEqual([16, 32, 64, 128, 256, 512]);
    expect(SCALE.o_2n).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(SCALE.o_n_fact).toEqual([4, 5, 6, 7, 8, 9, 10]);
    expect(EXAMPLE_N).toEqual({
      o_1: 1024,
      o_log_n: 1024,
      o_n: 1024,
      o_n_log_n: 1024,
      o_n2: 1024,
      o_n3: 256,
      o_2n: 20,
      o_n_fact: 8,
    });
    for (const a of BIG_O_OPTIONS) expect(SCALE[a].includes(EXAMPLE_N[a])).toBe(true);
  });
});

describe('classValue', () => {
  it('is exact in integers (TS-4)', () => {
    expect(classValue('o_1', 1024)).toBe(1);
    expect(classValue('o_log_n', 1024)).toBe(10);
    expect(classValue('o_n', 1024)).toBe(1024);
    expect(classValue('o_n_log_n', 1024)).toBe(10240);
    expect(classValue('o_n2', 1024)).toBe(1048576);
    expect(classValue('o_n3', 256)).toBe(16777216);
    expect(classValue('o_2n', 20)).toBe(1048576);
    expect(classValue('o_n_fact', 8)).toBe(40320);
    expect(classValue('o_n3', 1024)).toBe(1073741824);
  });

  it('rejects the log of a non power of two', () => {
    expect(() => classValue('o_log_n', 1000)).toThrow('big-o: classValue log of non power of two');
    expect(() => classValue('o_n_log_n', 0)).toThrow(RangeError);
  });
});
