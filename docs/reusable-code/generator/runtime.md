# Runtime

## startScheduler / ScheduledJob / Scheduler
- **Location:** apps/generator/src/scheduler/scheduler.ts
- **Signature:** `startScheduler(deps: { logger: Logger }, jobs: readonly ScheduledJob[] = []): Scheduler`; `ScheduledJob = { name: string; pattern: string; run: () => Promise<void> | void }`; `Scheduler = { stop(): void }`
- **Description:** one `Cron` per job with `timezone: 'UTC'` and `protect: true` (no overlapping runs). Holds a keep-alive interval so Node does not exit with zero jobs (to be replaced by the generation-queue LISTEN connection). Logs `{ jobs }` "Scheduler started".
- **Usage:** `startScheduler({ logger }, [{ name: 'publish', pattern: '0 0 * * *', run: () => publishDay() }])`

## createShutdownHandler / ShutdownDeps
- **Location:** apps/generator/src/shared/shutdown.ts
- **Signature:** `createShutdownHandler({ logger, controller: AbortController, scheduler: Pick<Scheduler, 'stop'>, sql: { end(opts?) }, exit = process.exit }): () => Promise<void>`
- **Description:** runs once (repeated signals reuse the same promise): `controller.abort()` → `scheduler.stop()` → `sql.end({ timeout: 5 })` (errors logged, not rethrown) → logs "Shutdown complete" → `exit(0)`
- **Usage:** long-running work should listen to `controller.signal`; tests inject `exit: vi.fn()`

## verifyDbRole
- **Location:** apps/generator/src/infra/database/verify-role.ts
- **Signature:** `verifyDbRole(sql: Sql, logger: Logger, timeoutMs = 2000): Promise<string>`
- **Description:** logs `{ db_role }` "Database role verified". Rejects with the original error if the DB does not answer; the bootstrap logs `fatal` and exits 1. Differs from api, which returns `null` and keeps running.
