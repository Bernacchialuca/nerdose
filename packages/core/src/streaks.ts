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
