import type { GameGenerator } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import type { BugHuntPayload } from '../definition';
import { PAYLOAD } from '../definition/test-fixtures';

import { generator, VERIFY_CHECKS } from './index';
import { generate } from './generate';
import { emptyHistory } from './test-fixtures';

describe('generator object (TS-27)', () => {
  it('composes the pieces of the contract', async () => {
    const g: GameGenerator<BugHuntPayload> = generator;
    expect(g.historySpec).toEqual({ bank: null, lastUsedField: '', recentDays: 60, aheadDays: 60 });
    expect(g.usedBankItems(PAYLOAD)).toEqual([]);
    expect(g.generate).toBe(generate);
    // Without a date `variety_combo` fails in memory: nothing is executed.
    const noDate: Partial<BugHuntPayload> = { ...PAYLOAD };
    delete noDate.date;
    const pending = g.verify(noDate as BugHuntPayload, emptyHistory);
    expect(pending).toBeInstanceOf(Promise);
    expect((await pending).ok).toBe(false);
  });

  it('names the 13 checks in order', () => {
    expect([...VERIFY_CHECKS]).toEqual([
      'texts_bilingual',
      'code_shape',
      'lines_consistent',
      'tests_consistent',
      'variety_combo',
      'run_correct_js',
      'run_correct_go',
      'run_correct_java',
      'run_mutant_js',
      'run_mutant_go',
      'run_mutant_java',
      'correct_agrees',
      'mutant_agrees',
    ]);
  });
});
