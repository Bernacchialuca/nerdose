import { describe, expect, it } from 'vitest';

import { devdle } from '../definition';
import { PAYLOAD_REACT } from '../definition/test-fixtures';
import { addDays } from './dates';
import { RECENT_DAYS, REUSE_WINDOW_DAYS, isReusable } from './eligibility';
import { generator } from './index';
import { BANK, DATE, seed } from './test-fixtures';

const usage = () => {
  const u = devdle.bankUsage;
  if (!u) throw new Error('devdle consumes a bank');
  return u;
};

describe('devdle bankUsage vs generator', () => {
  it('is not null (TS-17)', () => {
    expect(devdle.bankUsage).not.toBeNull();
  });

  it('bank and column match historySpec (TS-2)', () => {
    expect(usage().bank).toBe(generator.historySpec.bank);
    expect(usage().lastUsedField).toBe(generator.historySpec.lastUsedField);
  });

  it('window equals REUSE_WINDOW_DAYS, not recentDays (TS-3)', () => {
    expect(usage().windowDays).toBe(REUSE_WINDOW_DAYS);
    expect(generator.historySpec.recentDays).toBe(RECENT_DAYS);
    expect(RECENT_DAYS).toBe(3);
    expect(generator.historySpec.recentDays).not.toBe(usage().windowDays);
  });

  it('window edge matches isReusable (TS-4)', () => {
    const w = usage().windowDays;
    expect(isReusable(addDays(DATE, -w), DATE)).toBe(true);
    expect(isReusable(addDays(DATE, -w + 1), DATE)).toBe(false);
  });

  it('itemsPerChallenge matches usedBankItems (TS-5)', () => {
    expect(generator.usedBankItems(PAYLOAD_REACT).length).toBe(usage().itemsPerChallenge);
    for (let n = 1; n <= 10; n++) {
      const p = generator.generate({
        date: DATE,
        seed: seed(n),
        history: { bankItems: BANK, recentChallenges: [] },
      });
      expect(generator.usedBankItems(p).length).toBe(usage().itemsPerChallenge);
    }
    expect(usage().itemsPerChallenge).toBe(1);
  });

  it('lastUsedField is a column of the bank item (TS-6)', () => {
    expect(usage().lastUsedField in BANK[0]!).toBe(true);
  });
});
