import type { GameGenerator } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import type { BigOPayload } from '../definition';
import { PAYLOAD } from '../definition/test-fixtures';

import { generator } from './index';
import { generate } from './generate';
import { emptyHistory } from './test-fixtures';

describe('generator object', () => {
  it('composes the contract (TS-26)', () => {
    const g: GameGenerator<BigOPayload> = generator;
    expect(g.historySpec).toEqual({ bank: null, lastUsedField: '', recentDays: 30, aheadDays: 30 });
    expect(g.usedBankItems(PAYLOAD)).toEqual([]);
    expect(g.generate).toBe(generate);
    const result = g.verify({ ...PAYLOAD }, emptyHistory);
    expect(result).toBeInstanceOf(Promise);
  });
});
