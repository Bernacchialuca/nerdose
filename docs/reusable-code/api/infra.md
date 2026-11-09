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
- **Signature:** `getToday(gameId, player | null, locale): Promise<GameToday>`; `start(gameId, player, challengeNumber, log): Promise<{ play }>` (idempotent); `GameplayRepository(db)`: `findPlay`, `findPlaysOfDay`, `insertPlayIfAbsent`
- **Description:** generic over the game registry, never serializes `payload`.

## ProgressService / ProgressRepository
- **Location:** apps/api/src/domain/progress/
- **Signature:** `gameStatsView(playerId, game, day): Promise<GameStatsView>`; `todayStreaks(playerId, day)`; `ProgressRepository(db)`: `findGameStats`, `findAllGameStats`, `findPlayerStats`, `prevActiveDays(day)`
- **Description:** read-only; live streaks via `liveStreak()` from `@nerdose/core`.
