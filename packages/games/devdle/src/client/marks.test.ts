import { describe, expect, it } from 'vitest';

import { isFinished, keyStates } from './marks';
import { GUESS_BRANCH, GUESS_PARSER, GUESS_SERVER } from './test-fixtures';

describe('keyStates', () => {
  it('keeps the best state per letter (TS-11)', () => {
    expect(keyStates([GUESS_BRANCH, GUESS_SERVER])).toEqual({
      B: 'absent',
      R: 'correct',
      A: 'present',
      N: 'absent',
      C: 'absent',
      H: 'absent',
      S: 'present',
      E: 'correct',
      V: 'absent',
    });
  });
});

describe('isFinished', () => {
  it('is true on a full-correct last guess or at 6 guesses', () => {
    expect(isFinished({ guesses: [GUESS_BRANCH, GUESS_PARSER] })).toBe(true);
    expect(isFinished({ guesses: Array.from({ length: 6 }, () => GUESS_BRANCH) })).toBe(true);
    expect(isFinished({ guesses: [GUESS_BRANCH] })).toBe(false);
    expect(isFinished({ guesses: [] })).toBe(false);
  });
});
