---
id: platform-day
display_name: Dia de la plataforma, publicacion y rachas
language: node
description: UTC platform day, lazy single-flight publication, late-move detection, streaks with neutral days and transactional Play closing
applies_to: [api]
required_by: []
package: null
---

# Platform Day, Publication and Streaks (Node)

The `api` owns the platform day: `today` is always computed on the server in UTC, the first request of a new day publishes the approved challenges (ADR-008), and closing a Play updates streaks and stats in the same transaction using the single implementation in `@nerdose/core` (ADR-011).

## When to use

- Every player route that depends on "today" (`/api/today`, `/api/games/{game_id}/today/*`).
- Closing a Play, reading stats, voiding a challenge (recompute).

## Package

No package is prescribed. Logic comes from `@nerdose/core` (`today()`, `challengeNumber()`, `nextStreak()`, `liveStreak()`).

## Structure

```
apps/api/src/domain/
├── publishing/
│   ├── publishing.service.ts     # ensureToday(): single-flight publication
│   └── publishing.repository.ts  # the one UPDATE ... SET status = 'published'
├── gameplay/                     # start, move, close Play
└── progress/
    ├── progress.service.ts       # applyResult(), recomputeStats(player_id, game_id?)
    └── progress.repository.ts
```

## How to use

### Today and number

```ts
import { today, challengeNumber } from '@nerdose/core';

const day = today(clock.now());                         // 'YYYY-MM-DD', UTC
const number = challengeNumber(day, env.LAUNCH_DATE);   // day - LAUNCH_DATE + 1
```

### Lazy single-flight publication

```ts
// apps/api/src/domain/publishing/publishing.service.ts
let currentDay: string | null = null;
let inFlight: Promise<void> | null = null;

async ensureToday(): Promise<void> {
  const day = today(this.clock.now());
  if (day === currentDay) return;
  inFlight ??= this.publish(day).finally(() => { inFlight = null; });
  await inFlight;                                        // concurrent requests await the same promise
}

private async publish(day: string) {
  await this.repo.publishApproved(day);                  // UPDATE challenges SET status='published' WHERE status='approved' AND date = :day
  await this.cache.reloadToday();                        // see memory-cache
  await this.cache.reloadWordList();
  currentDay = day;
}
```

It runs on the first request of a new day (a middleware calls `ensureToday()` on player routes) and once at startup. It is idempotent and touches only today's date.

### Late move

Every mutation (`start`, `move`, `report`, `acknowledge-void`) carries `challenge_number`; if it differs from today's number the answer is `409 challenge_expired`.

### Closing a Play with streaks

```ts
await db.transaction(async (tx) => {
  const play = await gameplay.close(tx, ...);                    // status won | lost
  await progress.applyResult(tx, play);                          // player_game_stats + player_stats
});
```

`progress.applyResult` calls `nextStreak()` of `@nerdose/core` with `prev_active_day` read from `challenges` with `status IN ('published','voided')`. Reading stats applies `liveStreak()` and never writes.

### Void and recompute

Voiding a challenge (`published` only) sets `status`, `void_reason`, `voided_at`, reloads the today cache and calls `recomputeStats(player_id, game_id)` for each affected player using the same core function.

## Rules

- `today` is computed on the server with `@nerdose/core` (UTC). A date is never accepted from the client on a player route.
- `number = today - LAUNCH_DATE + 1`; `LAUNCH_DATE` comes from `env`, shared with the `generator`.
- Publication runs on the first request of the day and at startup, with in-memory single-flight (concurrent requests await the same promise).
- The publication statement is exactly `UPDATE challenges SET status='published' WHERE status='approved' AND date = :today`. Never past or future dates.
- An `approved` challenge of a day when the `api` never ran stays `approved`; that day is neutral for streaks.
- `challenge_number` is required in the body of `start`, `move`, `report` and `acknowledge-void`; mismatch answers `409 challenge_expired`.
- An `in_progress` Play of a past day stays `in_progress` forever and never counts.
- The streak function lives in `@nerdose/core` and is the only implementation, used on close, on read and on recompute.
- `prev_active_day` considers only challenges with `status IN ('published','voided')`. No job resets streaks or marks neutral days.
- Closing a Play and updating `player_game_stats` and `player_stats` happen in the same transaction. If one fails everything rolls back.
- A Play counts as completed if `status IN ('won','lost','voided')`. `played`, `wins` and `extra` exclude `voided`; `total_completed` and streaks include them.
- `extra` is computed only with `reduceStats` of the game definition.
- A streak read when not alive returns 0 without writing to the database.
- `recomputeStats(player_id, game_id?)` exists and returns the same result as the incremental application (property test).
- `GET /api/today` returns `next_reset_at` (next 00:00 UTC, ISO 8601) and `seconds_to_reset`.

## Integration with other conventions

- **game-registry**: `reduceStats`, `score`, `isWin` come from the game definition.
- **memory-cache**: reloads on day change and on void.
- **orm**: the closing transaction uses `Tx` repositories.
- **testing**: fake clocks, neutral days, voids and day change; property test for `recomputeStats`.
- **alerts-mail**: the report threshold alert is claimed inside the report transaction.
