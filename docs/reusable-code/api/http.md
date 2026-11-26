# HTTP

## buildApp
- **Location:** apps/api/src/http/app.ts
- **Signature:** `buildApp(deps: AppDeps): Hono<AppEnv>`
- **Description:** middleware order is `requestId()` → `requestContext(logger)` → `secureHeaders()`. No CORS (same origin, ADR-009). Unknown routes return 404 `not_found` with the standard error body.
- **Usage:** `const app = buildApp({ logger, health: createHealthCheck({ sql }) }); await app.request('/api/health')` (tests use `app.request` without a server)

## AppDeps / AppEnv
- **Location:** apps/api/src/http/types.ts
- **Signature:** `AppDeps = { logger; health; config: Pick<ApiEnv, 'WEB_ORIGIN' | 'ADMIN_ORIGIN' | 'TRUST_PROXY_HEADER' | 'TRUST_PROXY_HOPS'>; identity: IdentityService }`; `AppEnv = { Variables: { requestId; logger; locale: Locale; player: Player | null } }`
- **Usage:** new dependencies are added to `AppDeps` and injected in `src/index.ts`; handlers type their factory as `createFactory<AppEnv>()`

## registerRoutes
- **Location:** apps/api/src/http/routes/index.ts
- **Signature:** `registerRoutes(app: Hono<AppEnv>, deps: AppDeps): void`
- **Description:** handlers are built with `createFactory<AppEnv>().createHandlers(...)` and receive `deps` (see `healthHandler` in routes/health.ts, mounted on `/api/health` and `/api/admin/health`)
- **Usage:** `app.get('/api/foo', ...fooHandler(deps))`

## createErrorHandler
- **Location:** apps/api/src/http/middleware/error-handler.ts
- **Signature:** `createErrorHandler(baseLogger: Logger): ErrorHandler<AppEnv>`
- **Description:** `AppError` → logs `warn` with `code`, responds `err.status` + `{ error: { code, message: errorMessage(code, c.var.locale) } }` (the internal message never leaks). A Hono `HTTPException` 400 (malformed JSON) → `422 validation_error`. Other errors → logs `error` and responds 500 `internal_error`.
- **Usage:** in handlers, `throw new AppError('not_found', 'detail for logs')` from `@nerdose/core`

## requestContext
- **Location:** apps/api/src/http/middleware/request-context.ts
- **Signature:** `requestContext(logger: Logger): MiddlewareHandler<AppEnv>`
- **Usage:** in handlers log with `c.var.logger.info(...)` so every line carries `requestId`

## errorMessage
- **Location:** apps/api/src/http/error-messages.ts
- **Signature:** `errorMessage(code: ErrorCode, locale: Locale): string`
- **Description:** `Record<Locale, Record<ErrorCode, string>>` (es/en). Adding an `ErrorCode` in core requires both messages here (type-checked).

## locale (middleware)
- **Location:** apps/api/src/http/middleware/locale.ts
- **Signature:** `locale(): MiddlewareHandler<AppEnv>`
- **Description:** sets `c.var.locale` from `?lang` → `Accept-Language` → `es`; `playerSession` recomputes it with the Player's locale
- **Usage:** `app.use(locale())` right after `requestContext`

## originAndContentType
- **Location:** apps/api/src/http/middleware/security.ts
- **Signature:** `originAndContentType(allowedOrigin: string): MiddlewareHandler`
- **Description:** on POST/PATCH/PUT/DELETE requires exact `Origin` (`403 forbidden_origin`) and `Content-Type: application/json` (`415`)
- **Usage:** mounted in `buildApp` with `WEB_ORIGIN` for `/api/*` and `ADMIN_ORIGIN` for `/api/admin/*`

## limit / clientIp
- **Location:** apps/api/src/http/middleware/rate-limit.ts
- **Signature:** `limit({ windowMs, limit, key: (c) => string }): MiddlewareHandler<AppEnv>`; `clientIp(config: ClientIpConfig): (c) => string` with `ClientIpConfig = { TRUST_PROXY_HEADER?: string; TRUST_PROXY_HOPS?: number }`
- **Description:** in-memory `hono-rate-limiter`; `429 rate_limited` with `Retry-After`. `clientIp` (REQ-012/S-061): without a configured header, the connection IP (`getConnInfo`); with `X-Forwarded-For`, the entry the trusted proxy appended, counting `TRUST_PROXY_HOPS` (default 1) from the right; with any other header (`X-Real-IP`, `CF-Connecting-IP`…), its whole value; if the request lacks the header, the connection IP. `'unknown'` only when there is no socket (`app.request` in tests). Create limiters per app instance (inside route factories), not at module level.
- **Usage:** `limit({ windowMs: 600_000, limit: 20, key: clientIp(deps.config) })`

## playerSession
- **Location:** apps/api/src/http/middleware/player-session.ts
- **Signature:** `playerSession(identity: IdentityService, mode: 'required' | 'optional'): MiddlewareHandler<AppEnv>`
- **Description:** resolves cookie `nd_pid` to `c.var.player`; `required` throws `no_session`; adds `player_ref` (never the raw id) to the logger and recomputes `c.var.locale`
- **Usage:** `factory.createHandlers(playerSession(deps.identity, 'required'), handler)`

## validationHook
- **Location:** apps/api/src/http/validation-hook.ts
- **Description:** `@hono/zod-validator` hook that throws `AppError('validation_error')`
- **Usage:** `zValidator('json', schema, validationHook)`

## reportValidationHook / reportBodySchema
- **Location:** apps/api/src/domain/quality/quality.schema.ts
- **Description:** zod-validator hook that throws `AppError('invalid_report')` for any body failure of the report route; `reportBodySchema` validates `challenge_number`, `reason`, `message` (trimmed, max 1000) and `code_language`
- **Usage:** `zValidator('json', reportBodySchema, reportValidationHook)`

## IdentityService / IdentityRepository / issuePlayerCookie
- **Location:** apps/api/src/domain/identity/
- **Signature:** `startSession({ pid, acceptLanguage })`, `find(pid)`, `updatePreferences(playerId, patch)`; `issuePlayerCookie(c, playerId)`
- **Description:** idempotent anonymous session over `players` (invalid/unknown pid treated as absent); cookie `nd_pid` with exact ADR-009 attributes
- **Usage:** `const { player, created } = await deps.identity.startSession(...)`

## hashPassword / verifyPassword / signAdminToken
- **Location:** apps/api/src/domain/admin/admin-auth.ts
- **Signature:** `hashPassword(password, params?): Promise<string>`; `verifyPassword(password, stored): Promise<boolean>`; `signAdminToken(secret, nowSeconds?): Promise<{ token, expires_at }>`
- **Description:** scrypt hash in the `scrypt$<N>$<r>$<p>$<salt_b64>$<hash_b64>` format (also emitted by `pnpm --filter api admin:hash`); verification reads N/r/p/length from the stored string, uses `timingSafeEqual` and returns `false` on malformed input; the token is signed with `hono/jwt` HS256 and claims exactly `sub`, `iat`, `exp`
- **Usage:** `const { token, expires_at } = await signAdminToken(secret, Math.floor(clock.now().getTime() / 1000))`

## adminAuth / adminAuthExcept
- **Location:** apps/api/src/domain/admin/admin-auth.middleware.ts
- **Signature:** `adminAuth(secret)`; `adminAuthExcept(except: Array<{ method; path }>, secret)`
- **Description:** verifies the Bearer JWT (HS256 only, `sub === 'admin'`, `exp` required); `hono/jwt` 401s are translated to `unauthorized` by `createErrorHandler`
- **Usage:** `app.use('/api/admin/*', adminAuthExcept([{ method: 'POST', path: '/api/admin/login' }], secret))`

## AdminService / AdminRepository
- **Location:** apps/api/src/domain/admin/
- **Signature:** `login(password, log)`, `listReportGroups(status)`, `updateReport(reportId, status, log)`; `playerRef(playerId)`
- **Description:** report groups are ordered alerted first, `report_count` desc, `challenge.date` desc; `player_ref` is the first 8 hex of `sha256(player_id)` (`playerRef` lives in `apps/api/src/shared/player-ref.ts` since REQ-012 and is re-exported here; logs use the same reference); games without a registered definition yield `culprits: []`
- **Usage:** `const { groups } = await deps.admin.listReportGroups('open')`

## AdminContentService / BANK_COLUMNS / resolveBankConsumers / buildBankStock
- **Location:** apps/api/src/domain/admin/admin-content.service.ts, bank-columns.ts, bank-stock.ts
- **Signature:** `new AdminContentService({ repo, games, clock, launchDate })` with `upcoming(days)`, `generationFailures()`, `stock()`; `resolveBankConsumers(games): Array<{ bank, consumers: Array<{ gameId, usage, column }> }>`; `buildBankStock({ bank, approvedTotal, rejectedTotal, available, availableAll, consumers })`
- **Description:** admin reads that never use `TodayCache`. `BANK_COLUMNS` maps each bank (not each game) to its Drizzle table, label and `last_used_*` columns; `resolveBankConsumers` throws `Unknown bank usage: <bank>.<field>` at construction. `buildBankStock` is pure (per-consumer `days_of_stock`/`cycle_ok`, bank-level min/all).
- **Usage:** `deps.adminContent.upcoming(14)`; routes `GET /api/admin/challenges/upcoming`, `/generation-failures`, `/content/stock`

## AdminMetricsService / metricsQuerySchema
- **Location:** apps/api/src/domain/admin/admin-metrics.service.ts, admin.schema.ts
- **Signature:** `new AdminMetricsService({ repo, activeDays, clock })` with `currentDay(): string` and `metrics(from, to, today): Promise<Metrics>`; `metricsQuerySchema(currentDay: () => string)`
- **Description:** reads the `metrics_*` views through `AdminRepository` plus `ProgressRepository.prevActiveDays(today).global`. Computes `d1`/`d7` per cohort (`null` when cohort+N is not before today), always the 5 streak buckets (not-alive streaks fall into `'0'` via core `isStreakAlive`) and `summary` (`d1`/`d7` = sum of players / sum of `cohort_size` over cohorts whose day +N ended). No rounding. The Zod schema validates `YYYY-MM-DD` and `validateMetricsRange`; any failure is `422 validation_error`.
- **Usage:** `deps.adminMetrics.metrics(from, to, deps.adminMetrics.currentDay())`; route `GET /api/admin/metrics`

## progressRoutes / getMyStats / myStatsQuerySchema
- **Location:** apps/api/src/domain/progress/progress.routes.ts, progress.controller.ts, progress.schema.ts
- **Signature:** `progressRoutes(deps: AppDeps): Hono<AppEnv>`; `getMyStats(deps)`; `myStatsQuerySchema = z.object({ history_before: z.iso.date().optional() })`
- **Description:** `GET /api/me/stats` with `playerSession('required')` (401 before query validation) and `validationHook` (422). The controller only calls `deps.myStats`; not behind `ensureToday`.
- **Usage:** `app.route('/api', progressRoutes(deps))`
