export interface StreakInput {
  current: number;
  lastCompleted: string | null;
  prevActiveDay: string | null;
}

function continues(s: StreakInput): boolean {
  return (
    s.lastCompleted !== null && (s.prevActiveDay === null || s.lastCompleted >= s.prevActiveDay)
  );
}

/** Streak after completing `day`. `max_*` is computed by the caller with Math.max. */
export function nextStreak(input: StreakInput, day: string): number {
  if (input.lastCompleted === day) return input.current;
  return continues(input) ? input.current + 1 : 1;
}

/** Streak to display on read: 0 when it is no longer alive. Never writes. */
export function liveStreak(input: StreakInput, today: string): number {
  if (input.lastCompleted === null) return 0;
  return input.lastCompleted === today || continues(input) ? input.current : 0;
}

export interface ReplayedStreak {
  current: number;
  max: number;
  lastCompleted: string | null;
}

/** Rebuilds a streak from history by chaining `nextStreak` day by day (ADR-011 recompute). */
export function replayStreak(
  completedDays: readonly string[],
  activeDays: readonly string[],
): ReplayedStreak {
  const days = [...new Set(completedDays)].sort();
  const active = [...new Set(activeDays)].sort();
  let current = 0;
  let max = 0;
  let lastCompleted: string | null = null;
  let pointer = 0; // number of active days strictly before the current day
  for (const day of days) {
    while (pointer < active.length && (active[pointer] as string) < day) pointer += 1;
    const prevActiveDay = pointer > 0 ? (active[pointer - 1] ?? null) : null;
    current = nextStreak({ current, lastCompleted, prevActiveDay }, day);
    max = Math.max(max, current);
    lastCompleted = day;
  }
  return { current, max, lastCompleted };
}

export type CompletedPlayStatus = 'won' | 'lost' | 'voided';

export interface CompletedPlay<Result> {
  date: string;
  status: CompletedPlayStatus;
  result: Result | null;
}

export interface RebuiltGameStats<Stats> {
  played: number;
  wins: number;
  extra: Stats;
}

/** Rebuilds played/wins/extra from completed plays; voided plays count for streaks only (ADR-011). */
export function rebuildGameStats<Result, Stats>(
  game: { initialStats(): Stats; reduceStats(prev: Stats, r: Result): Stats },
  plays: readonly CompletedPlay<Result>[],
): RebuiltGameStats<Stats> {
  const ordered = [...plays].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  let extra = game.initialStats();
  let played = 0;
  let wins = 0;
  for (const play of ordered) {
    if (play.status === 'voided') continue;
    if (play.result === null) throw new Error('rebuildGameStats: won/lost play without result');
    played += 1;
    if (play.status === 'won') wins += 1;
    extra = game.reduceStats(extra, play.result);
  }
  return { played, wins, extra };
}
