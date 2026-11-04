# HTTP

## buildApp
- **Location:** apps/api/src/http/app.ts
- **Signature:** `buildApp(deps: AppDeps): Hono<AppEnv>`
- **Description:** middleware order is `requestId()` → `requestContext(logger)` → `secureHeaders()`. No CORS (same origin, ADR-009). Unknown routes return 404 `not_found` with the standard error body.
- **Usage:** `const app = buildApp({ logger, health: createHealthCheck({ sql }) }); await app.request('/api/health')` (tests use `app.request` without a server)

## AppDeps / AppEnv
- **Location:** apps/api/src/http/types.ts
- **Signature:** `AppDeps = { logger: Logger; health: { check(log: Logger): Promise<Health> } }`; `AppEnv = { Variables: { requestId: string; logger: Logger } }`
- **Usage:** new dependencies are added to `AppDeps` and injected in `src/index.ts`; handlers type their factory as `createFactory<AppEnv>()`

## registerRoutes
- **Location:** apps/api/src/http/routes/index.ts
- **Signature:** `registerRoutes(app: Hono<AppEnv>, deps: AppDeps): void`
- **Description:** handlers are built with `createFactory<AppEnv>().createHandlers(...)` and receive `deps` (see `healthHandler` in routes/health.ts, mounted on `/api/health` and `/api/admin/health`)
- **Usage:** `app.get('/api/foo', ...fooHandler(deps))`

## createErrorHandler
- **Location:** apps/api/src/http/middleware/error-handler.ts
- **Signature:** `createErrorHandler(baseLogger: Logger): ErrorHandler<AppEnv>`
- **Description:** `AppError` → logs `warn` with `code`, responds `err.status` + `{ error: { code, message: errorMessage(code) } }` (the internal message never leaks). Other errors → logs `error` and responds 500 `internal_error`.
- **Usage:** in handlers, `throw new AppError('not_found', 'detail for logs')` from `@nerdose/core`

## requestContext
- **Location:** apps/api/src/http/middleware/request-context.ts
- **Signature:** `requestContext(logger: Logger): MiddlewareHandler<AppEnv>`
- **Usage:** in handlers log with `c.var.logger.info(...)` so every line carries `requestId`

## errorMessage
- **Location:** apps/api/src/http/error-messages.ts
- **Signature:** `errorMessage(code: ErrorCode): string`
- **Description:** `Record<ErrorCode, string>` in fixed Spanish (transitional until REQ-001 locale resolution). Adding an `ErrorCode` in core requires a message here (type-checked).
