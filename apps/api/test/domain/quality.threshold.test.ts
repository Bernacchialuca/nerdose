import { describe, expect, it } from 'vitest';

import { REPORT_THRESHOLD_REASONS, shouldAlert } from '@/domain/quality/quality.threshold';

describe('shouldAlert', () => {
  // TS-45
  it('evalúa cantidad y proporción', () => {
    const t = { count: 3, ratio: 0.05, ratioMinCount: 2 };
    const cases: Array<[number, number, boolean]> = [
      [3, 200, true],
      [2, 40, false],
      [2, 20, true],
      [2, 0, false],
      [1, 1, false],
      [5, 0, true],
    ];
    for (const [n, f, expected] of cases) expect(shouldAlert({ n, f }, t)).toBe(expected);
    const u = { count: 10, ratio: 0.5, ratioMinCount: 4 };
    expect(shouldAlert({ n: 4, f: 7 }, u)).toBe(true);
    expect(shouldAlert({ n: 4, f: 8 }, u)).toBe(false);
  });

  it('solo wrong_answer y ambiguous cuentan', () => {
    expect(REPORT_THRESHOLD_REASONS).toEqual(['wrong_answer', 'ambiguous']);
  });
});
