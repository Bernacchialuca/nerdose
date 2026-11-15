import { describe, expect, it } from 'vitest';

import type { BugHuntPayload } from '../definition';

import { addDays } from './days';
import { generate } from './generate';
import { recent, seedFrom } from './test-fixtures';
import { assertValidPayload } from './test-utils';
import { keysUsedNear, varietyKey } from './variety';

describe('180 consecutive days (TS-37)', () => {
  it.each(['sim-a', 'sim-b', 'sim-c'])(
    '%s never repeats a key within 59 days',
    (family) => {
      const start = '2027-01-01';
      const published = new Map<string, BugHuntPayload>();
      for (let day = 0; day < 180; day++) {
        const date = addDays(start, day);
        const rows = [...published.entries()]
          .filter(([d]) => d >= addDays(date, -60) && d < date)
          .map(([d, payload]) => recent(d, payload));
        const p = generate({
          date,
          seed: seedFrom(family, day),
          history: { bankItems: [], recentChallenges: rows },
        });
        assertValidPayload(p);
        expect(keysUsedNear(date, rows).has(varietyKey(p)), `${family} ${date}`).toBe(false);
        published.set(date, p);
      }
    },
    60_000,
  );
});
