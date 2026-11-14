import type { RecentChallenge } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import type { BigOPayload } from '../definition';

import { addDays } from './days';
import { generate } from './generate';
import { seedFrom } from './test-fixtures';
import { eligibleRecipes } from './variety';

describe('120 days with accumulated history', () => {
  it.each(['sim-a', 'sim-b', 'sim-c'])('has no variety failures (TS-29, %s)', (family) => {
    const start = '2027-01-01';
    const days: RecentChallenge<BigOPayload>[] = [];
    for (let d = 0; d < 120; d++) {
      const date = addDays(start, d);
      const from = addDays(date, -30);
      const rc = days.filter((x) => x.date >= from && x.date < date);
      const payload = generate({
        date,
        seed: seedFrom(family, d),
        history: { bankItems: [], recentChallenges: rc },
      });
      expect(
        eligibleRecipes(date, rc).map((r) => r.id),
        `${family} ${date}`,
      ).toContain(payload.recipe);
      days.push({ date, payload });
    }
    days.forEach((day, i) => {
      for (let back = 1; back <= 29; back++) {
        expect(days[i - back]?.payload.recipe).not.toBe(day.payload.recipe);
      }
      const a = days[i - 1]?.payload.answer;
      expect(a === day.payload.answer && a === days[i - 2]?.payload.answer).toBe(false);
    });
  });
});
