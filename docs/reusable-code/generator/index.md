# Reusable Code Index - generator

App `apps/generator` (not a package; imported through the `@/` alias → `src/`). Node worker, no HTTP port.

## Runtime (8 items) - see runtime.md
- **runJob / LOCK_KEYS / JobBody / JobName** (apps/generator/src/scheduler/run-job.ts) - Wraps a job: advisory lock on a reserved connection, `job_runs` record, never rejects (`success | failed | skipped`)
- **JobRunsRepository** (apps/generator/src/scheduler/job-runs.repository.ts) - `start(job)` / `finish(id, status, summary)` over `job_runs`
- **createJobTracker / JobTracker** (apps/generator/src/scheduler/job-tracker.ts) - Tracks running jobs so shutdown can wait for them (`idle()`)
- **runStartup / buildScheduledJobs / FILL_PATTERN** (apps/generator/src/startup.ts) - Startup sequence `sync_banks` -> `fill` -> scheduler -> queue listener with `fill` at `10 * * * *` UTC
- **syncBanksJob / fillJob** (apps/generator/src/scheduler/jobs/) - `JobBody` factories for the two jobs
- **startScheduler / ScheduledJob / Scheduler** (apps/generator/src/scheduler/scheduler.ts) - Starts croner jobs in UTC with overrun protection; keeps the process alive
- **createShutdownHandler / ShutdownDeps** (apps/generator/src/shared/shutdown.ts) - Idempotent SIGTERM/SIGINT handler: abort, stop scheduler and queue listener, close DB, exit 0
- **verifyDbRole** (apps/generator/src/infra/database/verify-role.ts) - Logs `current_user` at startup; throws if the DB is down (bootstrap exits 1)

## Shared (6 items) - see shared.md
- **Clock / systemClock** (apps/generator/src/shared/clock.ts) - Injectable time source; jobs never call `new Date()`
- **addDays / maxDate** (apps/generator/src/shared/dates.ts) - UTC `YYYY-MM-DD` arithmetic without a clock
- **loadEnv / GeneratorEnv / loadLocalEnvFile** (apps/generator/src/config/env.ts) - Zod-validated env (t3-env) incl. `LAUNCH_DATE`, `GENERATOR_SECRET`, `GENERATION_MAX_ATTEMPTS`, no `PORT`; invalid vars throw `AppError('validation_error')`
- **createLogger** (apps/generator/src/shared/logger.ts) - Pino logger with service/env base fields, ISO time, secret redaction, pretty in dev
- **withTimeout** (apps/generator/src/shared/with-timeout.ts) - Races a promise against a timer and always clears it
- **createDatabase / Sql** (apps/generator/src/infra/database/db.ts) - Wraps `createDb` from `@nerdose/db`

## Domain (9 items) - see domain.md
- **generatorRegistry / createGeneratorRegistry / GeneratorEntry** (apps/generator/src/games/registry.ts) - `game_id` -> `{ generator, payloadSchema, version }`; one entry per game (Devdle, Grep Grid, Timeline)
- **seedFor / seedToHex** (apps/generator/src/domain/challenge-publishing/seed.ts) - HMAC-SHA256 seed per `{game_id}:{date}:{attempt}`
- **generateForDate** (apps/generator/src/domain/challenge-publishing/generate.ts) - Draft -> verify -> approved/rejected pipeline for one game and date; `firstAttempt` and `'regenerate'` mode (returns the verified draft)
- **fillRange / runFill** (apps/generator/src/domain/challenge-publishing/fill.service.ts) - Computes `[max(today+1, LAUNCH_DATE), today+14]` and fills the gaps
- **ChallengePublishingRepository** (apps/generator/src/domain/challenge-publishing/challenge-publishing.repository.ts) - Multi-bank (`BANKS`: `terms`, `timeline_facts`) covered dates, history, queue/failure/replacement methods, draft/approve (`last_used_* = GREATEST`)/reject with `duplicate_active` handling
- **processNextRequest** (apps/generator/src/domain/challenge-publishing/queue/process-request.ts) - Takes a regeneration request (`SKIP LOCKED`), generates candidates and replaces the old challenge atomically, or marks `failed` / `cancelled`
- **startQueueListener / QueueListener** (apps/generator/src/domain/challenge-publishing/queue/queue-listener.ts) - `LISTEN generation_requests` + 60 s poll + startup drain, single-flight
- **syncBanks** (apps/generator/src/domain/content-banks/sync-banks.service.ts) - Loads `terms` and `timeline_facts` from the dataset in one transaction with the ADR-016 UPSERT rules; summary with totals and `by_bank`; exports `sameFactContent` and `isStorableDate`
- **ContentBanksRepository** (apps/generator/src/domain/content-banks/content-banks.repository.ts) - `listTerms`/`upsertTerm` and `listTimelineFacts`/`upsertTimelineFact` (never touches `rejected` rows or `last_used_*`)

## Testing utils (11 items) - see testing.md
- **setupTestDb** (apps/generator/test/helpers/db.ts) - Owner and generator-role connections plus `reset()` / `cleanup()`
- **insertTerms / BANK16** (apps/generator/test/helpers/bank.ts) - Inserts `terms` fixtures; `BANK16` is 16 approved terms, 2 per category; `TermSpec.lastUsedGrep`
- **devdleOnlyRegistry** (apps/generator/test/helpers/registry.ts) - Registry with only Devdle for Devdle-specific tests
- **makeFact / makeFacts / withFacts / insertFacts** (apps/generator/test/helpers/facts.ts) - Build valid `timeline_facts` items, override a fixture dataset's facts and version, and insert fact rows; `FACT_ID / CHRONO5 / AMBIGUOUS5 / EXTRA_PL5` are fixed-id fact fixtures
- **dataset fixtures** (apps/generator/test/fixtures/datasets/) - `v1`, `v2`, `invalid`, `invalid-facts`, `dup-rejected`, `conflict` datasets for `sync_banks` tests
- **approveOld / requestFor / D / ENV / NOW / SECRET** (apps/generator/test/helpers/regeneration.ts) - Regeneration fixtures: approve an old devdle challenge with the real pipeline and insert a `generation_requests` row
- **captureLogger** (apps/generator/test/helpers/logger.ts) - Real logger writing to memory; `lines()` returns parsed JSON entries
- **freePort** (apps/generator/test/helpers/net.ts) - Returns a free local TCP port
- **silentServer** (apps/generator/test/helpers/net.ts) - TCP server that accepts and never answers (simulates a hung DB)
- **startGenerator** (apps/generator/test/helpers/process.ts) - Spawns `src/index.ts` as a child process with `waitForLog` / `kill` / `stop`
- **global-setup (ownerUrl / generatorUrl)** (apps/generator/test/global-setup.ts) - Testcontainers Postgres with roles and migrations, provided via `inject()`
