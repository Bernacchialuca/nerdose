# Shared

Same shape as the api equivalents (`docs/reusable-code/api/shared.md`), copied per app, not shared.

## loadEnv / GeneratorEnv / loadLocalEnvFile
- **Location:** apps/generator/src/config/env.ts
- **Signature:** `loadEnv(runtimeEnv = process.env): GeneratorEnv`; `loadLocalEnvFile(): void`
- **Description:** vars `NODE_ENV`, `LOG_LEVEL`, `SERVICE_NAME` (default generator), `DATABASE_URL` (required URL); no `PORT` (worker without HTTP). Error: `AppError('validation_error', 'Variables de entorno inválidas: ...')` with names only. `loadLocalEnvFile` loads `apps/generator/.env.local` except in test/production.
- **Usage:** `loadEnv()` in bootstrap (only `config/env.ts` reads `process.env`); in tests pass an explicit object; keep `.env.example` in sync (tested)

## createLogger
- **Location:** apps/generator/src/shared/logger.ts
- **Signature:** `createLogger(env: Pick<GeneratorEnv, 'LOG_LEVEL' | 'SERVICE_NAME' | 'NODE_ENV'>, destination?: pino.DestinationStream): Logger`
- **Description:** identical config to api: JSON lines, label levels, ISO time, base `{ service, env }`, redaction of auth headers/password/token/refreshToken/apiKey

## withTimeout
- **Location:** apps/generator/src/shared/with-timeout.ts
- **Signature:** `withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T>`
- **Description:** rejects with `Error('Timed out after {ms} ms')`; does not cancel the underlying promise

## createDatabase / Sql
- **Location:** apps/generator/src/infra/database/db.ts
- **Signature:** `createDatabase(url: string): { db, sql }`; `type Sql`
- **Usage:** `const { sql } = createDatabase(env.DATABASE_URL)`; closed by the shutdown handler

## Clock / systemClock
- **Location:** apps/generator/src/shared/clock.ts
- **Signature:** `type Clock = { now(): Date }`; `systemClock: Clock`
- **Description:** injectable time source; tests pass a fixed clock.
- **Usage:** `const now = clock.now()`

## addDays / maxDate
- **Location:** apps/generator/src/shared/dates.ts
- **Signature:** `addDays(date: string, days: number): string`; `maxDate(a: string, b: string): string`
- **Description:** UTC day arithmetic on `YYYY-MM-DD` strings, no clock.
- **Usage:** `addDays('2026-12-31', 1) // '2027-01-01'`
