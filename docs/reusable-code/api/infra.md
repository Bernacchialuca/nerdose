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
- **Signature:** `getToday(gameId, player | null, locale): Promise<GameToday>`; `start(gameId, player, challengeNumber, log): Promise<{ play }>` (idempotent); `move(gameId, player, { challenge_number, move }, locale, log): Promise<MoveResponse>`; `GameplayRepository(db | tx)`: `findPlay`, `findPlaysOfDay`, `insertPlayIfAbsent`, `lockPlay` (FOR UPDATE), `updateState`, `closePlay`, `insertRejectedGuess`, `lockChallenge` (FOR SHARE), `insertVoidedPlayIfAbsent`; `moveTransaction(db): MoveTx` builds the transactional repos (`plays`, `progress`, `identity`); `closePlay(id, { ..., codeLanguage })` persists `plays.code_language`; on close `move` calls `identity.updatePreferences(player.id, { preferredCodeLanguage })` after `applyResult` when `game.codeLanguage(state) !== null`, and `MoveResponse.play` is a `PlayView` (with `code_language`); `acknowledgeVoid(gameId, player, challengeNumber, log): Promise<AcknowledgeVoidResponse>` (idempotent "mark as completed" for a voided challenge); `GameToday` now carries `reported` and, when voided, the player's `voided` Play
- **Description:** generic over the game registry, never serializes `payload`. `start` and `move` validate in order (game, day, cache, voided), lock the challenge row with `FOR SHARE` inside the transaction (a voided challenge or Play → `challenge_voided`), then `move` runs one transaction (insert-if-absent + lock, `applyMove`, close + `applyResult`). Domain logs are emitted after COMMIT; rejected guesses are recorded best-effort outside the transaction.

## QualityService / QualityRepository
- **Location:** apps/api/src/domain/quality/
- **Signature:** `QualityService({ games, runInTx, clock, thresholds }).report(gameId, player, body, { locale, userAgent }, log): Promise<{ report_id }>`; `QualityRepository(db | tx)`: `lockReportable`, `findPlay`, `insertReportIfAbsent`, `countThresholdReports`, `countFinishedPlays`, `markAlerted`, `hasReported`; `shouldAlert({ n, f }, thresholds)` and `REPORT_THRESHOLD_REASONS` in `quality.threshold.ts`
- **Description:** challenge report with server-built context, one per player and challenge (`already_reported`), alert threshold (`alerted_at` set once, in the same transaction) and a single retry on deadlock `40P01`. Never changes `challenges.status`.

## ProgressService / ProgressRepository
- **Location:** apps/api/src/domain/progress/
- **Signature:** `gameStatsView(playerId, game, day): Promise<GameStatsView>`; `todayStreaks(playerId, day)`; `applyResult(repo: ProgressWriteRepo, { playerId, game, date, outcome }): Promise<{ streaks, gameStats }>` (outcome `won | lost | voided`); `ProgressRepository(db | tx)`: `findGameStats`, `findAllGameStats`, `findPlayerStats`, `prevActiveDays(day)`, `lockGameStats`, `lockPlayerStats`, `saveGameStats`, `savePlayerStats`, `heatmap(playerId, from, to)`, `historyPage(playerId, before, limit)`
- **Description:** live streaks via `liveStreak()` and incremental streak/counter update via `nextStreak()` from `@nerdose/core`. `voided` counts for streaks and `total_completed` but not `played`, `wins` or `extra`.

## VoidService
- **Location:** apps/api/src/domain/quality/void.service.ts
- **Signature:** `void(challengeId, body: VoidRequest, log): Promise<{ challenge_id, affected_plays }>`; `VoidTx` / `VoidTxRepos` in `quality.types.ts`
- **Description:** one transaction: `lockChallengeForUpdate` (404/409), culprit check against `game.culprits` (422), `markVoided`, `voidPlays`, `resolveOpenReports`, `rejectTerm`/`rejectTimelineFact`, `ProgressService.recompute`; after COMMIT emits the domain events and reloads `TodayCache` only when the challenge is today (a reload failure is logged, response stays 200)
- **Usage:** `await deps.voids.void(id, { void_reason: 'x', culprit: { kind: 'none' } }, log)`

## ProgressService.recompute / ProgressRepository.activeDays / completedPlays
- **Location:** apps/api/src/domain/progress/
- **Signature:** `recompute(repo: ProgressRecomputeRepo, { playerIds, game }): Promise<{ players }>`; `activeDays()`, `completedPlays(playerIds)`
- **Description:** rebuilds one game's `player_game_stats` and the global `player_stats` from `plays` with `replayStreak` / `rebuildGameStats`; locks players in ascending id order (game stats then player stats) and reads once per batch
- **Usage:** `await progress.recompute(new ProgressRepository(tx), { playerIds, game })`

## RegenerationService
- **Location:** apps/api/src/domain/publishing/regeneration.service.ts
- **Signature:** `new RegenerationService({ runInTx, clock })`; `regenerate(challengeId, log): Promise<{ request_id, status: 'pending', requested_at }>`
- **Description:** inside one transaction validates the challenge (`not_found`, `not_regenerable` if not `approved` or `date <= today`), inserts the pending request with `ON CONFLICT (challenge_id) WHERE status = 'pending' DO NOTHING` (returns the existing one if any) and runs `pg_notify('generation_requests', request_id)`. Logs `ChallengeRegenerationRequested` after COMMIT. Repository methods live in `PublishingRepository` (`findChallengeStatus`, `insertPendingRequest`, `findPendingRequest`, `notify`).
- **Usage:** `POST /api/admin/challenges/{challenge_id}/regenerate` → `deps.regeneration.regenerate(id, c.var.logger)`

## MyStatsService
- **Location:** apps/api/src/domain/progress/my-stats.service.ts, game-stats-view.ts, history.ts
- **Signature:** `new MyStatsService({ repo, games, clock })` with `currentDay(): string` and `myStats(playerId, day, locale, historyBefore): Promise<MyStats>`; pure `toGameStatsView(game, row | null, prevActiveDay, day)`, `pageByFullDays(rows, pageSize): { page, nextBefore }`, `HISTORY_PAGE_SIZE = 60`, `VOIDED_LABEL`
- **Description:** read-only. Five parallel reads (`findPlayerStats`, `findAllGameStats`, `prevActiveDays`, `heatmap`, `historyPage`), always 5 games in `GAME_IDS` order, live streaks via `liveStreak()`, history label `historyLabel(result)` or the localized voided label, cursor = `date` of the last row of the page.
- **Usage:** `await deps.myStats.myStats(player.id, deps.myStats.currentDay(), locale, historyBefore ?? null)`
