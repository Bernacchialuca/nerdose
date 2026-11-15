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

## replayStreak
- **Location:** packages/core/src/streaks.ts
- **Signature:** `replayStreak(completedDays: readonly string[], activeDays: readonly string[]): ReplayedStreak` with `ReplayedStreak = { current, max, lastCompleted: string | null }`
- **Rule:** dedupes and sorts both lists, chains `nextStreak` day by day, `max` = maximum seen. Pure.
- **Usage:** per game: `replayStreak(gameCompletedDays, gameActiveDays)`; global: all completed days and any game's active days.

## rebuildGameStats
- **Location:** packages/core/src/streaks.ts
- **Signature:** `rebuildGameStats<Result, Stats>(game: { initialStats(); reduceStats(prev, r) }, plays: readonly CompletedPlay<Result>[]): { played, wins, extra }` with `CompletedPlay = { date, status: 'won' | 'lost' | 'voided', result: Result | null }`
- **Rule:** only `won`/`lost`, in `date` order; `voided` is skipped; `won`/`lost` without `result` throws.
- **Usage:** `rebuildGameStats(registry.get(id), plays)`

## nextStreak / liveStreak
- **Location:** packages/core/src/streaks.ts
- **Signature:** `nextStreak(input: StreakInput, day: string): number`; `liveStreak(input: StreakInput, today: string): number`; `StreakInput = { current, lastCompleted: string | null, prevActiveDay: string | null }`
- **Rule:** alive per `isStreakAlive`; `max_*` is computed by the caller.
- **Usage:** game: `nextStreak({ current: current_streak, lastCompleted: last_completed_date, prevActiveDay: prev_active_day }, D)`; global: same with `global_streak`, `last_active_date`, `prev_active_day_global`.

## isStreakAlive
- **Location:** packages/core/src/streaks.ts
- **Signature:** `isStreakAlive(lastCompleted: string | null, prevActiveDay: string | null, today: string): boolean`
- **Rule:** `lastCompleted !== null && (lastCompleted === today || prevActiveDay === null || lastCompleted >= prevActiveDay)`; `liveStreak` and `nextStreak` are built on it. Pure.
- **Usage:** `isStreakAlive(last_active_date, prevActiveDays(today).global, today)`

## validateMetricsRange
- **Location:** packages/core/src/platform-day.ts
- **Signature:** `validateMetricsRange(from: string, to: string, today: string): MetricsRangeResult` with `MetricsRangeResult = 'ok' | MetricsRangeReason` and `MetricsRangeReason = 'from_after_to' | 'future' | 'too_long'`
- **Rule:** checked in that order; `to - from <= 365` days (366 inclusive); inputs must be valid `YYYY-MM-DD`; pure (`today` injected).
- **Usage:** api: `validateMetricsRange(from, to, clock.today()) === 'ok'`; admin: `validateMetricsRange(from, to, todayUtc)` mapped to a message per reason.
