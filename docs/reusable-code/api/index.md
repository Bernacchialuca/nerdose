# Reusable Code Index - api

App `apps/api` (not a package; imported through the `@/` alias → `src/`). Hono on Node.

## HTTP (14 items) - see http.md
- **buildApp** (apps/api/src/http/app.ts) - Builds the Hono app: requestId, request logger, secure headers, error handler, JSON 404, routes
- **AppDeps / AppEnv** (apps/api/src/http/types.ts) - Injected dependencies and Hono context variables (`requestId`, `logger`, `locale`, `player`) plus `config` and `identity` deps
- **registerRoutes** (apps/api/src/http/routes/index.ts) - Single place where routes are mounted on the app
- **createErrorHandler** (apps/api/src/http/middleware/error-handler.ts) - Maps `AppError` to `{ error: { code, message } }` with its status; anything else → 500 `internal_error`
- **requestContext** (apps/api/src/http/middleware/request-context.ts) - Middleware that sets `c.var.logger` as a child logger with `requestId`
- **errorMessage** (apps/api/src/http/error-messages.ts) - Public message (es/en) for every `ErrorCode`
- **locale** (apps/api/src/http/middleware/locale.ts) - Sets `c.var.locale` (`?lang` → `Accept-Language` → `es`)
- **originAndContentType** (apps/api/src/http/middleware/security.ts) - Origin and JSON content-type check on mutations
- **limit / clientIp** (apps/api/src/http/middleware/rate-limit.ts) - In-memory rate limiter factory and trusted-proxy client IP
- **playerSession** (apps/api/src/http/middleware/player-session.ts) - Resolves `nd_pid` to `c.var.player` (`required` | `optional`)
- **ensureToday** (apps/api/src/http/middleware/ensure-today.ts) - Middleware that awaits `publishing.ensureToday()` before "today" routes
- **validationHook** (apps/api/src/http/validation-hook.ts) - zod-validator hook throwing `validation_error`
- **reportValidationHook / reportBodySchema** (apps/api/src/domain/quality/quality.schema.ts) - zod-validator hook throwing `invalid_report` and the report body schema
- **IdentityService / IdentityRepository / issuePlayerCookie** (apps/api/src/domain/identity/) - Anonymous session, preferences and `nd_pid` cookie

## Infra (9 items) - see infra.md
- **createDatabase / Sql** (apps/api/src/infra/database/db.ts) - Wraps `createDb` from `@nerdose/db`; `Sql` is the postgres.js client type
- **createHealthCheck / Health** (apps/api/src/infra/database/health.ts) - `SELECT 1` with timeout → `ok` or `degraded`, never throws
- **verifyDbRole** (apps/api/src/infra/database/verify-role.ts) - Logs `current_user` at startup; returns `null` (no throw) if the DB is down
- **TodayCache** (apps/api/src/infra/cache/today-cache.ts) - In-memory cache of today's visible challenges (`reload(day)`, `get`, `find`)
- **WordList / resolveWordlistPath** (apps/api/src/infra/cache/word-list.ts) - Valid Devdle words: `words.txt` ∪ approved terms (`load`, `reload`, `has`)
- **PublishingService / PublishingRepository** (apps/api/src/domain/publishing/) - Lazy single-flight `ensureToday()` and real `getToday`
- **GameplayService / GameplayRepository / moveTransaction** (apps/api/src/domain/gameplay/) - Open today's game, idempotent `start` and `move` (serialized transaction with `FOR SHARE` on the challenge, close, rejected guesses), `acknowledgeVoid`, `lockChallenge`, `insertVoidedPlayIfAbsent`
- **QualityService / QualityRepository / shouldAlert / REPORT_THRESHOLD_REASONS** (apps/api/src/domain/quality/) - Challenge reports, alert threshold (`alerted_at` once) and `hasReported`
- **ProgressService / ProgressRepository** (apps/api/src/domain/progress/) - Live streaks, `GameStatsView` and `applyResult` (ADR-011 streaks and counters on completion)

## Shared (6 items) - see shared.md
- **loadEnv / ApiEnv / loadLocalEnvFile** (apps/api/src/config/env.ts) - Zod-validated env (t3-env); invalid vars throw `AppError('validation_error')` listing only names
- **pickLocale / resolveLocale / isLocale** (apps/api/src/shared/locale.ts) - Pure locale helpers: `Accept-Language` parsing and `?lang` → player → header → `es`
- **createLogger** (apps/api/src/shared/logger.ts) - Pino logger with service/env base fields, ISO time, secret redaction, pretty in dev
- **withTimeout** (apps/api/src/shared/with-timeout.ts) - Races a promise against a timer and always clears it
- **Clock / systemClock** (apps/api/src/shared/clock.ts) - Injectable clock (`now(): Date`)
- **games** (apps/api/src/games/registry.ts) - The api's `GameRegistry` instance (registers `devdle`, `grepGrid` and `timeline`)

## Testing utils (8 items) - see testing.md
- **captureLogger** (apps/api/test/helpers/logger.ts) - Real logger writing to memory; `lines()` returns parsed JSON entries
- **freePort** (apps/api/test/helpers/net.ts) - Returns a free local TCP port
- **silentServer** (apps/api/test/helpers/net.ts) - TCP server that accepts and never answers (simulates a hung DB)
- **startApi** (apps/api/test/helpers/process.ts) - Spawns `src/index.ts` as a child process with `waitForLog` / `stop`
- **global-setup (ownerUrl / apiUrl)** (apps/api/test/global-setup.ts) - Testcontainers Postgres with roles and migrations, provided via `inject()`
- **buildDbApp / buildDbServices / buildMemoryServices / tempWordList** (apps/api/test/helpers/app.ts) - App with real api-role services or in-memory fakes; `buildDbServices` accepts `wrapTxRepos` to inject failures inside the move transaction
- **buildTestApp / TEST_CONFIG / MUTATION_HEADERS / TEST_ENV / stubIdentity** (apps/api/test/helpers/app.ts) - Builds the app with default deps and valid mutation headers
- **useDatabases / parseSetCookie / COOKIE_ATTRS** (apps/api/test/helpers/db.ts) - Owner and api connections, fixtures (`insertChallenge/Play/GameStats/PlayerStats/Term/Report`, `PAYLOAD`, `CATS`) and `Set-Cookie` parsing
- **TL_PAYLOAD / TL_ID / TL_OID / CORRECT / SWAP / REVERSED / ROTATED / TL_PUBLIC_ES / TL_PUBLIC_EN / tlChrono / tlResult / TL_FORBIDDEN / seedTimeline / seedTimelinePlay / tlGet / tlPost / tlMove** (apps/api/test/helpers/timeline.ts) - Fixed Tech Timeline payload (validated with `payloadSchema` on import), ordering fixtures and helpers to seed challenges/plays and call the generic routes
- **GG_PAYLOAD / GG_ID / cellsOf / selectWord / found / SEVEN / INITIAL_EXTRA / seedGrepGrid / seedGrepGridPlay / ggGet / ggPost / ggMove** (apps/api/test/helpers/grep-grid.ts) - Fixed Grep Grid payload (validated with `payloadSchema` on import) and helpers to seed challenges/plays and call the generic routes
