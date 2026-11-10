---
id: scheduler-jobs
display_name: Scheduler y jobs (croner + advisory locks)
language: node
description: Long-running worker with croner (UTC), pg_try_advisory_lock per job, job_runs records, idempotent jobs and graceful shutdown
applies_to: [worker]
required_by: []
package: croner
---

# Scheduler and Jobs (Node, croner)

The `generator` is a long-running worker with an internal scheduler (ADR-007). Jobs are scheduled with [croner](https://croner.56k.guru) in UTC, protected by PostgreSQL advisory locks, recorded in `job_runs` and idempotent. There is no system cron, no external scheduler and no Redis/BullMQ (ADR-001). Replaces the catalog `queue` convention, which is not used.

## When to use

- The `generator` entry point and its two jobs: `fill` and `sync_banks`.
- Any future periodic job of the `generator`.

## Package

```
croner       # scheduler, UTC cron expressions
```

## Structure

```
apps/generator/src/
├── index.ts                    # bootstrap: env, db, sync_banks -> fill, scheduler, queue listener
├── scheduler/
│   ├── scheduler.ts            # registers jobs with croner, shutdown
│   ├── run-job.ts              # lock + job_runs wrapper
│   └── jobs/
│       ├── fill.job.ts
│       └── sync-banks.job.ts
└── domain/
    ├── challenge-publishing/
    └── content-banks/
```

## Configuration

```ts
// apps/generator/src/scheduler/run-job.ts
import { sql } from 'drizzle-orm';

const LOCK_KEYS = { fill: 7001, sync_banks: 7002 } as const;   // stable bigint keys per job
export type JobName = keyof typeof LOCK_KEYS;

export async function runJob(name: JobName, fn: (ctx: JobContext) => Promise<Record<string, unknown>>, deps: Deps) {
  const log = deps.logger.child({ job: name });
  const [{ locked }] = await deps.db.execute(sql`SELECT pg_try_advisory_lock(${LOCK_KEYS[name]}) AS locked`);
  if (!locked) { log.info('Job already running elsewhere, skipping'); return; }
  const runId = await deps.jobRuns.start(name);
  try {
    const summary = await fn({ log, signal: deps.shutdown.signal, now: deps.clock.now() });
    await deps.jobRuns.finish(runId, 'success', summary);
  } catch (err) {
    log.error({ err }, 'Job failed');
    await deps.jobRuns.finish(runId, 'failed', { error: String(err) });
  } finally {
    await deps.db.execute(sql`SELECT pg_advisory_unlock(${LOCK_KEYS[name]})`);
  }
}
```

```ts
// apps/generator/src/scheduler/scheduler.ts
import { Cron } from 'croner';

export function startScheduler(deps: Deps) {
  const fill = new Cron('10 * * * *', { timezone: 'UTC', protect: true }, () => runJob('fill', fillJob, deps));
  return { stop: () => fill.stop() };
}
```

## How to use

### Startup order

```ts
await runJob('sync_banks', syncBanksJob, deps);   // once, before enabling fill
await runJob('fill', fillJob, deps);              // once, after sync_banks
const scheduler = startScheduler(deps);           // then "10 * * * *" UTC
await startQueueListener(deps);                   // see generation-queue
```

### Graceful shutdown

```ts
process.on('SIGTERM', async () => {
  shutdown.abort();               // the running candidate finishes; no new one starts
  scheduler.stop();
  await queueListener.stop();
  await running;                  // wait for in-flight job; locks are released in `finally`
  await sql.end();
  process.exit(0);
});
```

### Job registry

| Job | Schedule (UTC) | Lock | Does |
|---|---|---|---|
| `fill` | `10 * * * *` and once at startup after `sync_banks` | `fill` | For each game and each date in `[today+1, today+14]` without an `approved`/`published`/`voided` challenge: generate, verify, approve (see `challenge-generation`) |
| `sync_banks` | once at startup, before `fill` | `sync_banks` | Load `@nerdose/content` dataset into the banks (see `content-sync`) |

## Rules

- The `generator` runs as a long-running process. It never depends on system cron or an external scheduler.
- `fill` is defined with croner and the UTC expression `"10 * * * *"`. `sync_banks` runs once at startup before the first `fill`; `fill` also runs once at startup after `sync_banks`.
- Every job takes `pg_try_advisory_lock` with its own key (`fill`, `sync_banks`); if it does not get it, it exits without doing anything.
- Every run is recorded in `job_runs` (`job`, `status`, `started_at`, `finished_at`, `summary`), including failed runs.
- Jobs are idempotent: running one twice in a row does not change the result.
- A job error is logged and recorded; it never crashes the process. The next scheduled run proceeds normally.
- `fill` only generates for dates in `[today+1, today+14]`. Never for today or past dates.
- Overlapping runs of the same job inside one process are prevented (`protect: true`) in addition to the advisory lock.
- On `SIGTERM` the current candidate finishes, no new work starts and the locks are released.
- The `generator` opens no port and exposes no endpoint. Its only network output is the database.
- Time comes from an injectable `clock`; jobs never call `new Date()` directly.
- Use child loggers per job (`{ job }`) and per candidate (`{ game_id, date, attempt }`).

## Integration with other conventions

- **orm**: advisory locks and `job_runs` use raw SQL and the owner-granted tables for `nerdose_generator`.
- **logging**: child logger per job.
- **error-handling**: errors are caught per job and per candidate.
- **generation-queue**: shares the connection lifecycle and shutdown.
- **content-sync**, **challenge-generation**: the job bodies.
- **testing**: job run functions are tested with a fake clock; the cron expression is tested separately.
