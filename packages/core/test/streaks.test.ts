import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { today } from '../src/platform-day';
import { rngFrom } from '../src/prng';
import { liveStreak, nextStreak } from '../src/streaks';
import type { StreakInput } from '../src/streaks';

const SEED_A = Uint8Array.from({ length: 32 }, (_, i) => i);
const s = (
  current: number,
  lastCompleted: string | null,
  prevActiveDay: string | null,
): StreakInput => ({
  current,
  lastCompleted,
  prevActiveDay,
});

describe('nextStreak', () => {
  it('starts at 1 on the first completion (TS-18)', () => {
    expect(nextStreak(s(0, null, null), '2026-12-01')).toBe(1);
  });

  it('starts at 1 with previous active days never played (TS-19)', () => {
    expect(nextStreak(s(0, null, '2026-11-30'), '2026-12-01')).toBe(1);
  });

  it('adds on consecutive days (TS-20)', () => {
    expect(nextStreak(s(5, '2026-12-01', '2026-12-01'), '2026-12-02')).toBe(6);
  });

  it('keeps the streak across a neutral day (TS-21)', () => {
    expect(nextStreak(s(3, '2026-12-01', '2026-12-01'), '2026-12-03')).toBe(4);
  });

  it('keeps the streak across several neutral days (TS-22)', () => {
    expect(nextStreak(s(5, '2026-12-01', '2026-12-01'), '2026-12-08')).toBe(6);
  });

  it('resets to 1 when a playable day was missed (TS-23)', () => {
    expect(nextStreak(s(5, '2026-12-01', '2026-12-02'), '2026-12-03')).toBe(1);
  });

  it('does not change when completing again the same day (TS-24)', () => {
    expect(nextStreak(s(4, '2026-12-03', '2026-12-02'), '2026-12-03')).toBe(4);
  });

  it('counts a voided play of the previous day as completed (TS-25)', () => {
    expect(nextStreak(s(2, '2026-12-02', '2026-12-02'), '2026-12-03')).toBe(3);
  });

  it('treats an unplayed voided challenge as an active day (TS-26)', () => {
    expect(nextStreak(s(2, '2026-12-01', '2026-12-02'), '2026-12-03')).toBe(1);
  });

  it('does not treat a day with another game challenge as neutral for global (TS-27)', () => {
    expect(nextStreak(s(3, '2026-12-01', '2026-12-01'), '2026-12-03')).toBe(4);
    expect(nextStreak(s(3, '2026-12-01', '2026-12-02'), '2026-12-03')).toBe(1);
  });

  it('is neutral for global only when no game had a challenge (TS-28)', () => {
    expect(nextStreak(s(3, '2026-12-01', '2026-12-01'), '2026-12-03')).toBe(4);
  });

  it('does not add for a second game completed the same day (TS-29)', () => {
    expect(nextStreak(s(7, '2026-12-03', '2026-12-02'), '2026-12-03')).toBe(7);
  });

  it('adds when there is no previous active day but a previous completion (TS-30)', () => {
    expect(nextStreak(s(2, '2026-11-20', null), '2026-12-03')).toBe(3);
  });

  it('crosses month and year boundaries (TS-31)', () => {
    expect(nextStreak(s(9, '2026-12-31', '2026-12-31'), '2027-01-01')).toBe(10);
  });
});

describe('liveStreak', () => {
  it('is alive when completed today (TS-32)', () => {
    expect(liveStreak(s(6, '2026-12-03', '2026-12-02'), '2026-12-03')).toBe(6);
  });

  it('is alive when completed the previous active day (TS-33)', () => {
    expect(liveStreak(s(6, '2026-12-02', '2026-12-02'), '2026-12-03')).toBe(6);
  });

  it('is alive through neutral days (TS-34)', () => {
    expect(liveStreak(s(6, '2026-12-01', '2026-12-01'), '2026-12-04')).toBe(6);
  });

  it('is dead when a playable day was missed (TS-35)', () => {
    expect(liveStreak(s(6, '2026-12-01', '2026-12-02'), '2026-12-03')).toBe(0);
  });

  it('is 0 when never completed (TS-36)', () => {
    expect(liveStreak(s(0, null, '2026-12-02'), '2026-12-03')).toBe(0);
    expect(liveStreak(s(0, null, null), '2026-12-03')).toBe(0);
  });

  it('is alive without a previous active day but with a completion (TS-37)', () => {
    expect(liveStreak(s(2, '2026-11-20', null), '2026-12-03')).toBe(2);
  });
});

describe('streaks with a fake clock', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('handles the day change (TS-38)', () => {
    const state = s(4, '2026-12-02', '2026-12-02');
    vi.setSystemTime(new Date('2026-12-02T23:59:59.000Z'));
    expect(liveStreak(state, today(new Date()))).toBe(4);
    vi.setSystemTime(new Date('2026-12-03T00:00:05.000Z'));
    expect(liveStreak(state, today(new Date()))).toBe(4);
    vi.setSystemTime(new Date('2026-12-04T00:00:05.000Z'));
    expect(liveStreak({ ...state, prevActiveDay: '2026-12-03' }, today(new Date()))).toBe(0);
  });

  it('is pure: ignores the system clock and does not mutate input (TS-39)', () => {
    vi.setSystemTime(new Date('2030-06-15T12:00:00Z'));
    const input = Object.freeze(s(3, '2026-12-01', '2026-12-01'));
    expect(nextStreak(input, '2026-12-03')).toBe(4);
    expect(liveStreak(input, '2026-12-03')).toBe(3);
    expect(input).toEqual(s(3, '2026-12-01', '2026-12-01'));
  });
});

describe('closing and reading coherence', () => {
  it('never diverges over 500 generated states (TS-40)', () => {
    const rng = rngFrom(SEED_A);
    const dayOf = (n: number): string => `2026-12-${String(n).padStart(2, '0')}`;
    for (let i = 0; i < 500; i++) {
      const dayNum = rng.int(10, 28);
      const day = dayOf(dayNum);
      const prevActiveDay = rng.int(0, 1) === 0 ? null : dayOf(rng.int(1, dayNum - 1));
      const lastCompleted = rng.int(0, 1) === 0 ? null : dayOf(rng.int(1, dayNum));
      const current = lastCompleted === null ? 0 : rng.int(0, 50);
      const state = s(current, lastCompleted, prevActiveDay);
      const alive =
        lastCompleted !== null && (prevActiveDay === null || lastCompleted >= prevActiveDay);
      if (lastCompleted === day) {
        expect(nextStreak(state, day)).toBe(current);
        expect(liveStreak(state, day)).toBe(current);
      } else {
        expect(nextStreak(state, day)).toBe(alive ? current + 1 : 1);
        expect(liveStreak(state, day)).toBe(alive ? current : 0);
      }
    }
  });
});
