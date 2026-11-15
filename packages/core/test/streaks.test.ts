import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

import { today } from '../src/platform-day';
import { rngFrom } from '../src/prng';
import {
  isStreakAlive,
  liveStreak,
  nextStreak,
  rebuildGameStats,
  replayStreak,
} from '../src/streaks';
import type { AnyGameDefinition } from '../src/game-registry';
import { makeDefinition } from './fixtures/fake-definition';
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

describe('replayStreak', () => {
  const D = (n: number): string => `2026-12-${String(n).padStart(2, '0')}`;
  const r = (current: number, max: number, lastCompleted: string | null) => ({
    current,
    max,
    lastCompleted,
  });

  it('is empty without completed days (TS-1)', () => {
    expect(replayStreak([], [])).toEqual(r(0, 0, null));
    expect(replayStreak([], [D(1), D(2)])).toEqual(r(0, 0, null));
  });
  it('counts consecutive days (TS-2)', () => {
    expect(replayStreak([D(1), D(2), D(3)], [D(1), D(2), D(3)])).toEqual(r(3, 3, D(3)));
  });
  it('keeps the streak across a neutral day (TS-3)', () => {
    expect(replayStreak([D(1), D(3)], [D(1), D(3)])).toEqual(r(2, 2, D(3)));
  });
  it('keeps the streak across several neutral days (TS-4)', () => {
    expect(replayStreak([D(1), D(8)], [D(1), D(8)])).toEqual(r(2, 2, D(8)));
  });
  it('an active unplayed day breaks it (TS-5)', () => {
    expect(replayStreak([D(1), D(3)], [D(1), D(2), D(3)])).toEqual(r(1, 1, D(3)));
  });
  it('max keeps the record after a break (TS-6)', () => {
    expect(replayStreak([D(1), D(2), D(3), D(5)], [D(1), D(2), D(3), D(4), D(5)])).toEqual(
      r(1, 3, D(5)),
    );
  });
  it('handles unsorted input with duplicates (TS-7)', () => {
    expect(replayStreak([D(3), D(1), D(2), D(2), D(3)], [D(2), D(1), D(3), D(1)])).toEqual(
      r(3, 3, D(3)),
    );
  });
  it('first completion without prior active days (TS-8)', () => {
    expect(replayStreak([D(5)], [])).toEqual(r(1, 1, D(5)));
  });
  it('ignores active days after the last completed (TS-9)', () => {
    expect(replayStreak([D(1), D(2)], [D(1), D(2), D(3), D(4)])).toEqual(r(2, 2, D(2)));
  });
  it('crosses month and year (TS-10)', () => {
    expect(replayStreak(['2026-12-31', '2027-01-01'], ['2026-12-31', '2027-01-01'])).toEqual(
      r(2, 2, '2027-01-01'),
    );
  });
  it('a day with another game challenge is not neutral (TS-11)', () => {
    expect(replayStreak([D(1), D(3)], [D(1), D(2), D(3)])).toEqual(r(1, 1, D(3)));
  });
  it('equals chaining nextStreak by hand (TS-12)', () => {
    const c1 = nextStreak(s(0, null, null), D(1));
    const c2 = nextStreak(s(c1, D(1), D(1)), D(2));
    const c3 = nextStreak(s(c2, D(2), D(2)), D(4));
    const c4 = nextStreak(s(c3, D(4), D(5)), D(6));
    expect([c1, c2, c3, c4]).toEqual([1, 2, 3, 1]);
    expect(replayStreak([D(1), D(2), D(4), D(6)], [D(1), D(2), D(4), D(5), D(6)])).toEqual(
      r(c4, 3, D(6)),
    );
  });
  it('is pure: does not mutate and ignores the clock (TS-13)', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2030-06-15T12:00:00Z'));
      const completed = Object.freeze([D(2), D(1)]);
      const active = Object.freeze([D(1), D(2)]);
      expect(replayStreak(completed, active)).toEqual(r(2, 2, D(2)));
      expect(completed).toEqual([D(2), D(1)]);
      expect(active).toEqual([D(1), D(2)]);
    } finally {
      vi.useRealTimers();
    }
  });
});

type R = { won: boolean; tag: string };
type S = { seq: string[] };
const seqGame = {
  initialStats: (): S => ({ seq: [] }),
  reduceStats: (prev: S, r: R): S => ({ seq: [...prev.seq, r.tag] }),
};
const play = (date: string, status: 'won' | 'lost' | 'voided', tag: string | null) => ({
  date,
  status,
  result: tag === null ? null : { won: status === 'won', tag },
});

describe('rebuildGameStats', () => {
  it('handles no plays (TS-14)', () => {
    expect(rebuildGameStats(seqGame, [])).toEqual({ played: 0, wins: 0, extra: { seq: [] } });
  });
  it('applies won and lost in order (TS-15)', () => {
    expect(
      rebuildGameStats(seqGame, [
        play('2026-12-01', 'won', 'a'),
        play('2026-12-02', 'lost', 'b'),
        play('2026-12-03', 'won', 'c'),
      ]),
    ).toEqual({ played: 3, wins: 2, extra: { seq: ['a', 'b', 'c'] } });
  });
  it('skips voided plays even with result (TS-16)', () => {
    expect(
      rebuildGameStats(seqGame, [
        play('2026-12-01', 'won', 'a'),
        play('2026-12-02', 'voided', 'b'),
        play('2026-12-03', 'lost', 'c'),
      ]),
    ).toEqual({ played: 2, wins: 1, extra: { seq: ['a', 'c'] } });
  });
  it('a won play later voided counts nothing (TS-17)', () => {
    expect(
      rebuildGameStats(seqGame, [
        { date: '2026-12-01', status: 'voided', result: { won: true, tag: 'a' } },
      ]),
    ).toEqual({ played: 0, wins: 0, extra: { seq: [] } });
  });
  it('sorts by date without mutating the input (TS-18)', () => {
    const input = Object.freeze([
      play('2026-12-03', 'won', 'c'),
      play('2026-12-01', 'won', 'a'),
      play('2026-12-02', 'lost', 'b'),
    ]);
    expect(rebuildGameStats(seqGame, input)).toEqual({
      played: 3,
      wins: 2,
      extra: { seq: ['a', 'b', 'c'] },
    });
    expect(input[0]?.date).toBe('2026-12-03');
  });
  it('wins follow status, not result content (TS-19)', () => {
    expect(
      rebuildGameStats(seqGame, [
        { date: '2026-12-01', status: 'lost', result: { won: true, tag: 'x' } },
      ]),
    ).toEqual({ played: 1, wins: 0, extra: { seq: ['x'] } });
  });
  it('won/lost without result is a broken invariant (TS-20)', () => {
    expect(() =>
      rebuildGameStats(seqGame, [{ date: '2026-12-01', status: 'won', result: null }]),
    ).toThrow('rebuildGameStats: won/lost play without result');
  });
  it('voided without result is valid (TS-21)', () => {
    expect(
      rebuildGameStats(seqGame, [{ date: '2026-12-01', status: 'voided', result: null }]),
    ).toEqual({ played: 0, wins: 0, extra: { seq: [] } });
  });
  it('calls initialStats once (TS-22)', () => {
    const initialStats = vi.fn((): S => ({ seq: ['init'] }));
    const out = rebuildGameStats({ ...seqGame, initialStats }, [play('2026-12-01', 'won', 'a')]);
    expect(out.extra.seq).toEqual(['init', 'a']);
    expect(initialStats).toHaveBeenCalledTimes(1);
  });
  it('accepts a real GameDefinition (TS-23)', () => {
    expect(
      rebuildGameStats(makeDefinition('devdle'), [
        { date: '2026-12-01', status: 'won', result: { won: true } },
        { date: '2026-12-02', status: 'voided', result: null },
      ]),
    ).toEqual({ played: 1, wins: 1, extra: { played: 1 } });
    expectTypeOf<AnyGameDefinition>().toExtend<Parameters<typeof rebuildGameStats>[0]>();
  });
});

describe('isStreakAlive (S-052)', () => {
  it.each([
    ['completed today (TS-1)', '2026-12-03', '2026-12-02', '2026-12-03', true],
    ['completed today without previous active day (TS-2)', '2026-12-03', null, '2026-12-03', true],
    ['completed the previous active day (TS-3)', '2026-12-02', '2026-12-02', '2026-12-03', true],
    ['alive across neutral days (TS-4)', '2026-12-01', '2026-12-01', '2026-12-04', true],
    ['dead after a missed playable day (TS-5)', '2026-12-01', '2026-12-02', '2026-12-03', false],
    ['never completed with previous day (TS-6)', null, '2026-12-02', '2026-12-03', false],
    ['never completed without previous day (TS-6)', null, null, '2026-12-03', false],
    ['completed once and no previous active day (TS-7)', '2026-11-20', null, '2026-12-03', true],
    ['crosses month and year, alive (TS-8)', '2026-12-31', '2026-12-31', '2027-01-01', true],
    ['crosses month and year, dead (TS-8)', '2026-12-30', '2026-12-31', '2027-01-01', false],
  ] as const)('%s', (_name, last, prev, day, expected) => {
    expect(isStreakAlive(last, prev, day)).toBe(expected);
  });

  describe('purity', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2030-06-15T12:00:00Z'));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('ignores the system clock (TS-9)', () => {
      expect(isStreakAlive('2026-12-01', '2026-12-01', '2026-12-03')).toBe(true);
      expect(isStreakAlive('2026-12-01', '2026-12-02', '2026-12-03')).toBe(false);
    });
  });

  it('matches liveStreak and nextStreak over 500 generated states (TS-10)', () => {
    const rng = rngFrom(SEED_A);
    const dayOf = (n: number): string => `2026-12-${String(n).padStart(2, '0')}`;
    for (let i = 0; i < 500; i++) {
      const dayNum = rng.int(10, 28);
      const day = dayOf(dayNum);
      const prevActiveDay = rng.int(0, 1) === 0 ? null : dayOf(rng.int(1, dayNum - 1));
      const lastCompleted = rng.int(0, 1) === 0 ? null : dayOf(rng.int(1, dayNum));
      const current = lastCompleted === null ? 0 : rng.int(0, 50);
      const state = s(current, lastCompleted, prevActiveDay);
      const alive = isStreakAlive(state.lastCompleted, state.prevActiveDay, day);
      expect(liveStreak(state, day)).toBe(alive ? state.current : 0);
      if (state.lastCompleted !== day) {
        expect(nextStreak(state, day)).toBe(alive ? state.current + 1 : 1);
      }
    }
  });
});
