import { describe, expect, it } from 'vitest';

import { historyWindow } from '@/domain/challenge-publishing/generate';

const base = { bank: null, lastUsedField: '' } as const;
const devdle = { bank: 'terms', lastUsedField: 'last_used_devdle', recentDays: 3 } as const;

describe('historyWindow', () => {
  it('recentDays 30 y aheadDays 30 (S-042 TS-1)', () => {
    expect(historyWindow('2027-01-10', { ...base, recentDays: 30, aheadDays: 30 })).toEqual({
      from: '2026-12-11',
      to: '2027-02-09',
      exclude: '2027-01-10',
    });
  });

  it('sin aheadDays equivale a [D-3, D-1] (S-042 TS-2)', () => {
    expect(historyWindow('2026-12-02', devdle)).toEqual({
      from: '2026-11-29',
      to: '2026-12-02',
      exclude: '2026-12-02',
    });
  });

  it('aheadDays 0 explícito es igual que ausente (S-042 TS-3)', () => {
    expect(historyWindow('2026-12-02', { ...devdle, aheadDays: 0 })).toEqual(
      historyWindow('2026-12-02', devdle),
    );
  });

  it('cruza el año (S-042 TS-4)', () => {
    expect(historyWindow('2026-12-31', { ...base, recentDays: 30, aheadDays: 30 })).toEqual({
      from: '2026-12-01',
      to: '2027-01-30',
      exclude: '2026-12-31',
    });
  });
});
