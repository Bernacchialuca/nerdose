import { describe, expect, it } from 'vitest';

import { scoreGuess } from './feedback';

describe('scoreGuess', () => {
  it('correct has priority over an earlier present (TS-9)', () => {
    expect(scoreGuess('CRANE', 'EERIE')).toEqual([
      'absent',
      'absent',
      'present',
      'absent',
      'correct',
    ]);
  });
  it('mixes repeated letters (TS-10)', () => {
    expect(scoreGuess('ARRAY', 'RADAR')).toEqual([
      'present',
      'present',
      'absent',
      'correct',
      'present',
    ]);
  });
  it('marks a full match (TS-11)', () => {
    expect(scoreGuess('REACT', 'REACT')).toEqual(Array(5).fill('correct'));
  });
  it('does not give present for a letter consumed by a correct (TS-12)', () => {
    expect(scoreGuess('JAVASCRIPT', 'TYPESCRIPT')).toEqual([
      'absent',
      'absent',
      'absent',
      'absent',
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
  });
  it('handles repeated C in CACHE vs REACT (TS-7)', () => {
    expect(scoreGuess('REACT', 'CACHE')).toEqual([
      'present',
      'present',
      'absent',
      'absent',
      'present',
    ]);
  });
});
