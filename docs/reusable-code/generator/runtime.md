# Runtime

## startScheduler / ScheduledJob / Scheduler
- **Location:** apps/generator/src/scheduler/scheduler.ts
- **Signature:** `startScheduler(deps: { logger: Logger }, jobs: readonly ScheduledJob[] = []): Scheduler`; `ScheduledJob = { name: string; pattern: string; run: () => Promise<void> | void }`; `Scheduler = { stop(): void }`
- **Description:** one `Cron` per job with `timezone: 'UTC'` and `protect: true` (no overlapping runs). Holds a keep-alive interval so Node does not exit with zero jobs (to be replaced by the generation-queue LISTEN connection). Logs `{ jobs }` "Scheduler started".
- **Usage:** `startScheduler({ logger }, [{ name: 'publish', pattern: '0 0 * * *', run: () => publishDay() }])`

## createShutdownHandler / ShutdownDeps
- **Location:** apps/generator/src/shared/shutdown.ts
- **Signature:** `createShutdownHandler({ logger, controller: AbortController, scheduler: Pick<Scheduler, 'stop'>, tracker?: Pick<JobTracker, 'idle'>, sql: { end(opts?) }, exit = process.exit }): () => Promise<void>`
- **Description:** runs once (repeated signals reuse the same promise): `controller.abort()` → `scheduler.stop()` → `await tracker.idle()` → `sql.end({ timeout: 5 })` (errors logged, not rethrown) → logs "Shutdown complete" → `exit(0)`
- **Usage:** long-running work should listen to `controller.signal`; tests inject `exit: vi.fn()`

## verifyDbRole
- **Location:** apps/generator/src/infra/database/verify-role.ts
- **Signature:** `verifyDbRole(sql: Sql, logger: Logger, timeoutMs = 2000): Promise<string>`
- **Description:** logs `{ db_role }` "Database role verified". Rejects with the original error if the DB does not answer; the bootstrap logs `fatal` and exits 1. Differs from api, which returns `null` and keeps running.

## runJob / LOCK_KEYS / JobBody / JobName
- **Location:** apps/generator/src/scheduler/run-job.ts
- **Signature:** `runJob(name: JobName, body: JobBody, deps: { sql, db, logger, clock, signal, jobRuns?, tracker? }): Promise<'success' | 'failed' | 'skipped'>`; `LOCK_KEYS = { fill: 7001, sync_banks: 7002 }`; `JobBody = (ctx: { log, signal, now }) => Promise<{ summary; failed?: boolean }>`
- **Description:** reserves one connection, takes `pg_try_advisory_lock` (skips if taken), records `job_runs` start/finish with the summary, and always unlocks on the same connection. Any error is logged and recorded as `failed`; it never rejects.
- **Usage:** `await runJob('fill', fillJob({ db, env, registry }), { sql, db, logger, clock: systemClock, signal, tracker })`

## JobRunsRepository
- **Location:** apps/generator/src/scheduler/job-runs.repository.ts
- **Signature:** `new JobRunsRepository(db | tx)`; `start(job): Promise<string>`; `finish(id, status: 'success' | 'failed', summary): Promise<void>`
- **Description:** inserts a `running` row and closes it with `finished_at = now()`.
- **Usage:** `const id = await repo.start('fill'); await repo.finish(id, 'success', { generated: 0 })`

## createJobTracker / JobTracker
- **Location:** apps/generator/src/scheduler/job-tracker.ts
- **Signature:** `createJobTracker(): { track<T>(p: Promise<T>): Promise<T>; idle(): Promise<void> }`
- **Description:** `idle()` resolves once every tracked promise has settled (immediately with none).
- **Usage:** pass it to `runJob` deps and to `createShutdownHandler`.

## runStartup / buildScheduledJobs / FILL_PATTERN
- **Location:** apps/generator/src/startup.ts
- **Signature:** `runStartup(deps): Promise<Scheduler | undefined>`; `buildScheduledJobs(runFill): ScheduledJob[]`; `FILL_PATTERN = '10 * * * *'`
- **Description:** runs `sync_banks`, then `fill` (even if `sync_banks` failed), then starts the scheduler unless the signal is aborted.
- **Usage:** `scheduler = await runStartup({ sql, db, logger, clock, signal, tracker, env, registry })`

## syncBanksJob / fillJob
- **Location:** apps/generator/src/scheduler/jobs/sync-banks.job.ts, fill.job.ts
- **Signature:** `syncBanksJob({ db, loadDataset? }): JobBody`; `fillJob({ db, env, registry, repo? }): JobBody`
- **Description:** thin adapters from the services to `runJob`.
- **Usage:** `runJob('sync_banks', syncBanksJob({ db }), deps)`
