import { describe, expect, it } from 'vitest';

import { rngFrom } from '../src/prng';
import type { Rng } from '../src/prng';
import { nextStreak, rebuildGameStats, replayStreak } from '../src/streaks';
import type { CompletedPlay } from '../src/streaks';

type R = { won: boolean; tag: string };
type S = { seq: string[] };
const seqGame = {
  initialStats: (): S => ({ seq: [] }),
  reduceStats: (prev: S, r: R): S => ({ seq: [...prev.seq, r.tag] }),
};

const GAMES = ['devdle', 'grep-grid', 'timeline'] as const;
type Game = (typeof GAMES)[number];
type PlayStatus = 'in_progress' | 'won' | 'lost' | 'voided';
interface Cell {
  active: boolean;
  voided: boolean;
  play: { status: PlayStatus; result: R | null } | null;
}
type History = Record<Game, Cell[]>;

const SEED_A = Uint8Array.from({ length: 32 }, (_, i) => i);
const SEED_B = Uint8Array.from({ length: 32 }, (_, i) => 255 - i);
const SEED_C = Uint8Array.from({ length: 16 }, (_, i) => (i * 37) % 256);

const dateOf = (i: number): string =>
  new Date(Date.UTC(2026, 11, 1 + i)).toISOString().slice(0, 10);

function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

interface Generated {
  nDays: number;
  original: History;
  final: History;
  laterVoided: number;
  voidedInProgress: number;
}

function generate(rng: Rng): Generated {
  const nDays = rng.int(20, 60);
  const original = {} as History;
  for (const game of GAMES) {
    original[game] = [];
    for (let d = 0; d < nDays; d++) {
      const roll = rng.int(0, 9);
      const date = dateOf(d);
      if (roll <= 2) {
        original[game].push({ active: false, voided: false, play: null });
        continue;
      }
      const voided = roll === 9;
      const p = rng.int(0, 8);
      let play: Cell['play'] = null;
      if (voided) {
        if (p >= 5) play = { status: 'voided', result: null };
      } else if (p === 2) play = { status: 'in_progress', result: null };
      else if (p >= 3 && p <= 5)
        play = { status: 'won', result: { won: true, tag: `${game}:${date}` } };
      else if (p >= 6 && p <= 7)
        play = { status: 'lost', result: { won: false, tag: `${game}:${date}` } };
      else if (p === 8) play = { status: 'voided', result: null };
      original[game].push({ active: true, voided, play });
    }
  }
  const final = {} as History;
  let laterVoided = 0;
  let voidedInProgress = 0;
  for (const game of GAMES) {
    final[game] = original[game].map((cell) => {
      if (cell.active && !cell.voided && cell.play && rng.int(0, 3) === 0) {
        if (cell.play.status === 'in_progress') voidedInProgress += 1;
        else if (cell.play.status !== 'voided') laterVoided += 1;
        return { active: true, voided: true, play: { ...cell.play, status: 'voided' as const } };
      }
      return { ...cell, play: cell.play ? { ...cell.play } : null };
    });
  }
  return { nDays, original, final, laterVoided, voidedInProgress };
}

function completed(history: History, game: Game): CompletedPlay<R>[] {
  const out: CompletedPlay<R>[] = [];
  history[game].forEach((cell, i) => {
    if (cell.play && cell.play.status !== 'in_progress')
      out.push({
        date: dateOf(i),
        status: cell.play.status as 'won' | 'lost' | 'voided',
        result: cell.play.result,
      });
  });
  return out;
}

function activeDays(history: History, game: Game): string[] {
  return history[game].flatMap((c, i) => (c.active ? [dateOf(i)] : []));
}

interface Oracle {
  perGame: Record<
    Game,
    { current: number; max: number; last: string | null; played: number; wins: number; extra: S }
  >;
  global: { current: number; max: number; last: string | null; total: number };
}

function oracle(rng: Rng, history: History, nDays: number): Oracle {
  const perGame = {} as Oracle['perGame'];
  for (const g of GAMES)
    perGame[g] = {
      current: 0,
      max: 0,
      last: null,
      played: 0,
      wins: 0,
      extra: seqGame.initialStats(),
    };
  const global = { current: 0, max: 0, last: null as string | null, total: 0 };
  const prevActive = (games: readonly Game[], day: number): string | null => {
    for (let d = day - 1; d >= 0; d--) {
      if (games.some((g) => history[g][d]?.active)) return dateOf(d);
    }
    return null;
  };
  for (let d = 0; d < nDays; d++) {
    const D = dateOf(d);
    for (const g of shuffle(rng, GAMES)) {
      const play = history[g][d]?.play;
      if (!play || play.status === 'in_progress') continue;
      const st = perGame[g];
      st.current = nextStreak(
        { current: st.current, lastCompleted: st.last, prevActiveDay: prevActive([g], d) },
        D,
      );
      st.max = Math.max(st.max, st.current);
      st.last = D;
      global.current = nextStreak(
        {
          current: global.current,
          lastCompleted: global.last,
          prevActiveDay: prevActive(GAMES, d),
        },
        D,
      );
      global.max = Math.max(global.max, global.current);
      global.last = D;
      global.total += 1;
      if (play.status !== 'voided') {
        st.played += 1;
        if (play.status === 'won') st.wins += 1;
        st.extra = seqGame.reduceStats(st.extra, play.result as R);
      }
    }
  }
  return { perGame, global };
}

describe('recompute equals incremental application (property)', () => {
  const counters = {
    neutralBetween: 0,
    skippedActive: 0,
    laterVoided: 0,
    voidedInProgress: 0,
    sameDayTwo: 0,
    crossYear: 0,
  };

  const runs: [string, Uint8Array][] = [
    ['A', SEED_A],
    ['B', SEED_B],
    ['C', SEED_C],
  ];

  it.each(runs)('seed %s: 200 histories (TS-24 to TS-27)', (name, seed) => {
    const rng = rngFrom(seed);
    for (let h = 0; h < 200; h++) {
      const gen = generate(rng);
      const { final, original, nDays } = gen;
      counters.laterVoided += gen.laterVoided;
      counters.voidedInProgress += gen.voidedInProgress;
      if (nDays > 31) counters.crossYear += 1;
      const expected = oracle(rng, final, nDays);

      const allCompleted: string[] = [];
      for (const game of GAMES) {
        const label = `seed=${name} history=${h} game=${game}`;
        const plays = completed(final, game);
        const voidedDates = new Set(plays.filter((p) => p.status === 'voided').map((p) => p.date));
        const days = plays.map((p) => p.date);
        allCompleted.push(...days);
        const act = activeDays(final, game);
        const o = expected.perGame[game];

        const streak = replayStreak(days, act);
        expect(streak, label).toEqual({ current: o.current, max: o.max, lastCompleted: o.last });
        const stats = rebuildGameStats(seqGame, plays);
        expect(stats, label).toEqual({ played: o.played, wins: o.wins, extra: o.extra });

        // TS-25: voided plays subtract from the original history
        const originalPlays = completed(original, game).filter((p) => !voidedDates.has(p.date));
        expect(rebuildGameStats(seqGame, originalPlays), label).toEqual(stats);

        // TS-26
        expect(
          rebuildGameStats(
            seqGame,
            plays.filter((p) => p.status !== 'voided'),
          ),
          label,
        ).toEqual(stats);

        // TS-27
        const dup = days.length > 0 ? [rng.pick(days)] : [];
        expect(replayStreak(shuffle(rng, [...days, ...dup]), shuffle(rng, act)), label).toEqual(
          streak,
        );
        expect(rebuildGameStats(seqGame, shuffle(rng, plays)), label).toEqual(stats);

        // coverage counters
        const set = new Set(days);
        for (let d = 1; d < nDays - 1; d++) {
          const cell = final[game][d];
          if (!cell?.active && set.has(dateOf(d - 1)) && set.has(dateOf(d + 1)))
            counters.neutralBetween += 1;
          if (
            cell?.active &&
            !set.has(dateOf(d)) &&
            set.has(dateOf(d - 1)) &&
            set.has(dateOf(d + 1))
          )
            counters.skippedActive += 1;
        }
      }
      for (let d = 0; d < nDays; d++) {
        const n = GAMES.filter((g) => {
          const st = final[g][d]?.play?.status;
          return st !== undefined && st !== 'in_progress';
        }).length;
        if (n >= 2) counters.sameDayTwo += 1;
      }

      const global = replayStreak(
        allCompleted,
        GAMES.flatMap((g) => activeDays(final, g)),
      );
      expect(global, `seed=${name} history=${h} global`).toEqual({
        current: expected.global.current,
        max: expected.global.max,
        lastCompleted: expected.global.last,
      });
      expect(allCompleted.length, `seed=${name} history=${h} total`).toBe(expected.global.total);
    }
  });

  it('covers the relevant cases (TS-28)', () => {
    for (const [key, value] of Object.entries(counters)) {
      expect(value, key).toBeGreaterThan(0);
    }
  });
});
