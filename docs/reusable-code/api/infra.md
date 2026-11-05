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
- **Signature:** `new TodayCache(repo: ChallengesReadRepository, clock: Clock)`; `reload(): Promise<void>`, `get(gameId): CachedChallenge` (throws `AppError('no_challenge_today')`), `find(gameId): CachedChallenge | undefined`
- **Description:** in-memory map of today's visible challenges. A failed `reload()` rejects and keeps the previous content.
- **Usage:** `await cache.reload(); cache.find('devdle')?.status`
