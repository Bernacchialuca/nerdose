import { describe, expect, it } from 'vitest';

import { positionMarks, squares } from './marks';
import { RESULT_0_ES, RESULT_3_ES, RESULT_5_ES } from './test-fixtures';

describe('positionMarks (TS-9)', () => {
  it('marks a 3/5 by position', () => {
    expect(positionMarks(RESULT_3_ES)).toEqual([
      { opaque_id: 'p7k2m9', label: 'Python', position: 1, correct: true, correctPosition: 1 },
      { opaque_id: 'g2n5w3', label: 'Go', position: 2, correct: false, correctPosition: 3 },
      { opaque_id: 'j4x8q1', label: 'Java', position: 3, correct: false, correctPosition: 2 },
      { opaque_id: 'd9r6t0', label: 'Docker', position: 4, correct: true, correctPosition: 4 },
      { opaque_id: 'k1v3s8', label: 'Kubernetes', position: 5, correct: true, correctPosition: 5 },
    ]);
  });
});

describe('squares', () => {
  it('draws one square per position', () => {
    expect(squares(RESULT_3_ES)).toBe('🟩🟥🟥🟩🟩');
    expect(squares(RESULT_5_ES)).toBe('🟩🟩🟩🟩🟩');
    expect(squares(RESULT_0_ES)).toBe('🟥🟥🟥🟥🟥');
  });
});
