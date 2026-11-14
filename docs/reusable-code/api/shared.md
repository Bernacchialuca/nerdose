# Shared

## loadEnv / ApiEnv / loadLocalEnvFile
- **Location:** apps/api/src/config/env.ts
- **Signature:** `loadEnv(runtimeEnv = process.env): ApiEnv`; `loadLocalEnvFile(): void`
- **Description:** vars `NODE_ENV` (default development), `PORT` (default 3000), `LOG_LEVEL` (default info), `SERVICE_NAME` (default api), `DATABASE_URL` (required URL). Empty strings count as missing. On error throws `AppError('validation_error', 'Variables de entorno inválidas: A, B')` without values. `loadLocalEnvFile` loads `apps/api/.env.local` only when `NODE_ENV` is not test/production.
- **Usage:** add new vars to the `server` schema and to `.env.example` (a test checks they match); only `config/env.ts` reads `process.env`; in tests call `loadEnv({ DATABASE_URL: '...' })` instead of touching it

## pickLocale / resolveLocale / isLocale
- **Location:** apps/api/src/shared/locale.ts
- **Signature:** `pickLocale(acceptLanguage?: string): Locale`; `resolveLocale({ lang?, playerLocale?, acceptLanguage? }): Locale`; `isLocale(v): v is Locale`
- **Description:** `pickLocale` orders tags by `q` and returns the first `es`/`en`, else `es`; never throws
- **Usage:** `resolveLocale({ lang: c.req.query('lang'), playerLocale: player.locale })`

## createLogger
- **Location:** apps/api/src/shared/logger.ts
- **Signature:** `createLogger(env: Pick<ApiEnv, 'LOG_LEVEL' | 'SERVICE_NAME' | 'NODE_ENV'>, destination?: pino.DestinationStream): Logger`
- **Description:** JSON lines with `level` as label, `time` ISO, base `{ service, env }`; redacts authorization/cookie headers and `password`, `token`, `refreshToken`, `apiKey` as `[REDACTED]`. `pino-pretty` only in development without a destination.
- **Usage:** log errors as `logger.error({ err }, 'Message')`

## withTimeout
- **Location:** apps/api/src/shared/with-timeout.ts
- **Signature:** `withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T>`
- **Description:** rejects with `Error('Timed out after {ms} ms')`; the underlying promise is not cancelled
- **Usage:** `await withTimeout(sql\`SELECT 1\`, 2000)`

## games
- **Location:** apps/api/src/games/registry.ts
- **Signature:** `games = createGameRegistry([devdle, grepGrid, timeline, bigO])` (see core `game-registry.md`)
- **Usage:** register a new game module by adding it to the array

## Clock / systemClock
- **Location:** apps/api/src/shared/clock.ts
- **Signature:** `type Clock = { now(): Date }`; `systemClock: Clock`
- **Description:** injectable clock; domain code never calls `new Date()` directly.
- **Usage:** `const day = today(clock.now())`

## shiftDay
- **Location:** apps/api/src/shared/day.ts
- **Signature:** `shiftDay(day: string, n: number): string`
- **Description:** adds `n` days (negative allowed) to a `YYYY-MM-DD` day in UTC; does not read the clock
- **Usage:** `shiftDay(today(clock.now()), -365)`
