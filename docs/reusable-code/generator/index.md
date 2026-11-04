# Reusable Code Index - generator

App `apps/generator` (not a package; imported through the `@/` alias → `src/`). Node worker, no HTTP port.

## Runtime (3 items) - see runtime.md
- **startScheduler / ScheduledJob / Scheduler** (apps/generator/src/scheduler/scheduler.ts) - Starts croner jobs in UTC with overrun protection; keeps the process alive
- **createShutdownHandler / ShutdownDeps** (apps/generator/src/shared/shutdown.ts) - Idempotent SIGTERM/SIGINT handler: abort, stop scheduler, close DB, exit 0
- **verifyDbRole** (apps/generator/src/infra/database/verify-role.ts) - Logs `current_user` at startup; throws if the DB is down (bootstrap exits 1)

## Shared (4 items) - see shared.md
- **loadEnv / GeneratorEnv / loadLocalEnvFile** (apps/generator/src/config/env.ts) - Zod-validated env (t3-env), no `PORT`; invalid vars throw `AppError('validation_error')`
- **createLogger** (apps/generator/src/shared/logger.ts) - Pino logger with service/env base fields, ISO time, secret redaction, pretty in dev
- **withTimeout** (apps/generator/src/shared/with-timeout.ts) - Races a promise against a timer and always clears it
- **createDatabase / Sql** (apps/generator/src/infra/database/db.ts) - Wraps `createDb` from `@nerdose/db`

## Testing utils (5 items) - see testing.md
- **captureLogger** (apps/generator/test/helpers/logger.ts) - Real logger writing to memory; `lines()` returns parsed JSON entries
- **freePort** (apps/generator/test/helpers/net.ts) - Returns a free local TCP port
- **silentServer** (apps/generator/test/helpers/net.ts) - TCP server that accepts and never answers (simulates a hung DB)
- **startGenerator** (apps/generator/test/helpers/process.ts) - Spawns `src/index.ts` as a child process with `waitForLog` / `kill` / `stop`
- **global-setup (ownerUrl / generatorUrl)** (apps/generator/test/global-setup.ts) - Testcontainers Postgres with roles and migrations, provided via `inject()`
