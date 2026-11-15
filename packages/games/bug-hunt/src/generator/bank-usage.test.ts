import { describe, expect, it } from 'vitest';

import { bugHunt } from '../definition';

import { historySpec, usedBankItems } from './generate';

describe('historySpec and bankUsage (TS-3)', () => {
  it('declares a 60-day window both ways and no bank', () => {
    expect(historySpec).toEqual({ bank: null, lastUsedField: '', recentDays: 60, aheadDays: 60 });
    expect(usedBankItems()).toEqual([]);
    expect(bugHunt.bankUsage).toBeNull();
    expect(historySpec.bank).toBe(bugHunt.bankUsage);
    expect(usedBankItems.length).toBe(0);
  });
});
