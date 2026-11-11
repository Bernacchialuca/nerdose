# Infra

## createDatabase / Sql
- **Location:** apps/api/src/infra/database/db.ts
- **Signature:** `createDatabase(url: string): { sql, db }` (same as `createDb` from `@nerdose/db`); `type Sql`
- **Usage:** `const { sql } = createDatabase(env.DATABASE_URL)`; close with `sql.end({ timeout: 5 })` on shutdown

## createHealthCheck / Health
- **Location:** apps/api/src/infra/database/health.ts
- **Signature:** `createHealthCheck({ sql, timeoutMs = 2000 }): { check(log: Logger): Promise<Health> }`; `Health = { status: 'ok'; db: 'ok' } | { status: 'degraded'; db: 'error' }`
- **Description:** pings with `SELECT 1` under `withTimeout`; on failure logs `warn` and returns `degraded` (the route maps it to 503)

## verifyDbRole
- **Location:** apps/api/src/infra/database/verify-role.ts
- **Signature:** `verifyDbRole(sql: Sql, logger: Logger, timeoutMs = 2000): Promise<string | null>`
- **Description:** logs `{ db_role }` "Database role verified"; if the DB does not answer logs `warn` "Database unavailable at startup" and returns `null` — the api starts anyway (health reports degraded). Differs from generator, which throws.

## TodayCache
- **Location:** apps/api/src/infra/cache/today-cache.ts
- **Signature:** `new TodayCache(repo: ChallengesReadRepository)`; `reload(day: string): Promise<void>`, `get(gameId): CachedChallenge` (throws `AppError('no_challenge_today')`), `find(gameId): CachedChallenge | undefined`
- **Description:** in-memory map of today's visible challenges. A failed `reload()` rejects and keeps the previous content.
- **Usage:** `await cache.reload('2026-12-01'); cache.find('devdle')?.status`

## WordList / resolveWordlistPath
- **Location:** apps/api/src/infra/cache/word-list.ts
- **Signature:** `WordList.load(path: string): Promise<WordList>`; `reload(repo: TermsReadRepository): Promise<void>`; `has(word: string): boolean`; `resolveWordlistPath(): string`
- **Description:** valid Devdle word set = base `words.txt` ∪ approved `terms`. A failed `reload` rejects and keeps the previous set. The set is never exposed.
- **Usage:** `const wl = await WordList.load(resolveWordlistPath()); await wl.reload(repo); wl.has('react')`

## PublishingService / PublishingRepository
- **Location:** apps/api/src/domain/publishing/
- **Signature:** `ensureToday(): Promise<void>` (single-flight per instance, publishes `approved` of today, reloads caches); `getToday({ player, locale }): Promise<Today>`; `PublishingRepository(db)` implements `ChallengesReadRepository`, `ChallengesPublishRepository`, `TermsReadRepository`
- **Usage:** `app.use('/api/today', ensureToday(publishing))`

## GameplayService / GameplayRepository
- **Location:** apps/api/src/domain/gameplay/
- **Signature:** `getToday(gameId, player | null, locale): Promise<GameToday>`; `start(gameId, player, challengeNumber, log): Promise<{ play }>` (idempotent); `move(gameId, player, { challenge_number, move }, locale, log): Promise<MoveResponse>`; `GameplayRepository(db | tx)`: `findPlay`, `findPlaysOfDay`, `insertPlayIfAbsent`, `lockPlay` (FOR UPDATE), `updateState`, `closePlay`, `insertRejectedGuess`, `lockChallenge` (FOR SHARE), `insertVoidedPlayIfAbsent`; `moveTransaction(db): MoveTx` builds the transactional repos; `acknowledgeVoid(gameId, player, challengeNumber, log): Promise<AcknowledgeVoidResponse>` (idempotent "mark as completed" for a voided challenge); `GameToday` now carries `reported` and, when voided, the player's `voided` Play
- **Description:** generic over the game registry, never serializes `payload`. `start` and `move` validate in order (game, day, cache, voided), lock the challenge row with `FOR SHARE` inside the transaction (a voided challenge or Play → `challenge_voided`), then `move` runs one transaction (insert-if-absent + lock, `applyMove`, close + `applyResult`). Domain logs are emitted after COMMIT; rejected guesses are recorded best-effort outside the transaction.

## QualityService / QualityRepository
- **Location:** apps/api/src/domain/quality/
- **Signature:** `QualityService({ games, runInTx, clock, thresholds }).report(gameId, player, body, { locale, userAgent }, log): Promise<{ report_id }>`; `QualityRepository(db | tx)`: `lockReportable`, `findPlay`, `insertReportIfAbsent`, `countThresholdReports`, `countFinishedPlays`, `markAlerted`, `hasReported`; `shouldAlert({ n, f }, thresholds)` and `REPORT_THRESHOLD_REASONS` in `quality.threshold.ts`
- **Description:** challenge report with server-built context, one per player and challenge (`already_reported`), alert threshold (`alerted_at` set once, in the same transaction) and a single retry on deadlock `40P01`. Never changes `challenges.status`.

## ProgressService / ProgressRepository
- **Location:** apps/api/src/domain/progress/
- **Signature:** `gameStatsView(playerId, game, day): Promise<GameStatsView>`; `todayStreaks(playerId, day)`; `applyResult(repo: ProgressWriteRepo, { playerId, game, date, outcome }): Promise<{ streaks, gameStats }>` (outcome `won | lost | voided`); `ProgressRepository(db | tx)`: `findGameStats`, `findAllGameStats`, `findPlayerStats`, `prevActiveDays(day)`, `lockGameStats`, `lockPlayerStats`, `saveGameStats`, `savePlayerStats`
- **Description:** live streaks via `liveStreak()` and incremental streak/counter update via `nextStreak()` from `@nerdose/core`. `voided` counts for streaks and `total_completed` but not `played`, `wins` or `extra`.
