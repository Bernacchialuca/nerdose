# Platform day

All functions are pure and isomorphic; the clock is injected via `now`.

## today
- **Location:** packages/core/src/platform-day.ts
- **Signature:** `today(now: Date): string` - UTC `YYYY-MM-DD`
- **Usage:** `const day = today(clock.now())`

## challengeNumber
- **Signature:** `challengeNumber(day: string, launchDate: string): number | null` - `day - launchDate + 1`, `null` before launch
- **Usage:** `challengeNumber(day, env.LAUNCH_DATE)`

## nextResetAt
- **Signature:** `nextResetAt(now: Date): Date` - next 00:00 UTC strictly after `now`
- **Usage:** `nextResetAt(now).toISOString()`

## secondsToReset
- **Signature:** `secondsToReset(now: Date): number` - integer in 1..86400 (ceil)
- **Usage:** `secondsToReset(now)`

## nextStreak / liveStreak
- **Location:** packages/core/src/streaks.ts
- **Signature:** `nextStreak(input: StreakInput, day: string): number`; `liveStreak(input: StreakInput, today: string): number`; `StreakInput = { current, lastCompleted: string | null, prevActiveDay: string | null }`
- **Rule:** alive if `lastCompleted !== null && (prevActiveDay === null || lastCompleted >= prevActiveDay)`; `max_*` is computed by the caller.
- **Usage:** game: `nextStreak({ current: current_streak, lastCompleted: last_completed_date, prevActiveDay: prev_active_day }, D)`; global: same with `global_streak`, `last_active_date`, `prev_active_day_global`.
