import { describe, expect, it } from 'vitest';

import { timeline } from '../definition';
import { PAYLOAD } from '../definition/test-fixtures';
import { addDays } from './days';
import { REUSE_WINDOW_DAYS, isReusable } from './eligibility';
import { ITEMS_COUNT } from '../definition/schemas';
import { generator } from './index';
import { BANK, DATE, history, seed } from './test-fixtures';

const usage = () => {
  const u = timeline.bankUsage;
  if (!u) throw new Error('timeline consumes a bank');
  return u;
};

describe('timeline bankUsage vs generator', () => {
  it('is not null (TS-17)', () => {
    expect(timeline.bankUsage).not.toBeNull();
  });

  it('bank and column match historySpec (TS-13)', () => {
    expect(usage().bank).toBe(generator.historySpec.bank);
    expect(usage().lastUsedField).toBe(generator.historySpec.lastUsedField);
  });

  it('window equals REUSE_WINDOW_DAYS and recentDays (TS-13)', () => {
    expect(usage().windowDays).toBe(REUSE_WINDOW_DAYS);
    expect(usage().windowDays).toBe(generator.historySpec.recentDays);
  });

  it('window edge matches isReusable (TS-14)', () => {
    const w = usage().windowDays;
    expect(isReusable(addDays(DATE, -w), DATE)).toBe(true);
    expect(isReusable(addDays(DATE, -w + 1), DATE)).toBe(false);
  });

  it('itemsPerChallenge matches usedBankItems (TS-15)', () => {
    expect(generator.usedBankItems(PAYLOAD).length).toBe(usage().itemsPerChallenge);
    for (let n = 1; n <= 10; n++) {
      const p = generator.generate({ date: DATE, seed: seed(n), history: history(BANK) });
      expect(generator.usedBankItems(p).length).toBe(usage().itemsPerChallenge);
    }
    expect(usage().itemsPerChallenge).toBe(ITEMS_COUNT);
  });

  it('lastUsedField is a column of the bank item (TS-16)', () => {
    expect(usage().lastUsedField in BANK[0]!).toBe(true);
  });

  it('historySpec has no aheadDays: default 0 window (S-042 TS-18)', () => {
    expect('aheadDays' in generator.historySpec).toBe(false);
    expect(generator.historySpec.aheadDays ?? 0).toBe(0);
    expect(generator.historySpec).toEqual({
      bank: 'timeline_facts',
      lastUsedField: 'last_used',
      recentDays: 90,
    });
  });
});
