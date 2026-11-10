---
id: http-server
display_name: Servidor HTTP (Hono)
language: node
description: HTTP server, routing and middlewares with Hono and @hono/node-server
applies_to: [api]
required_by: []
package: hono
---

# HTTP Server (Node, Hono)

HTTP server for the `api`, built with [Hono](https://hono.dev) and `@hono/node-server`. Service-local replacement of the catalog default (Fastify): ADR-002 fixes Hono and forbids Express, Fastify and NestJS. The `api` is the only HTTP interface of the backend; the `generator` opens no port.

## When to use

- The `api` service, which serves `/api/*` (players) and `/api/admin/*` (owner).
- Not used by the `generator`, which has no network interface.

## Package

```
hono                  # framework, includes secure-headers, request-id, cookie and jwt helpers
@hono/node-server     # Node adapter
```

## Structure

```
apps/api/src/
├── index.ts                      # bootstrap: env, migrations check, cache warm-up, serve()
├── http/
│   ├── app.ts                    # buildApp(deps): creates and configures the Hono instance
│   ├── middleware/
│   │   ├── request-context.ts    # requestId + child logger
│   │   ├── security.ts           # Origin / Content-Type / headers (see security)
│   │   ├── player-session.ts     # resolves nd_pid (see player-identity)
│   │   ├── locale.ts             # resolves the response locale
│   │   └── error-handler.ts      # global handler (app.onError)
│   ├── validation-hook.ts
│   └── routes/
│       └── index.ts              # mounts the routes of every module
└── domain/
    └── {module}/
        ├── {module}.routes.ts        # module endpoints
        ├── {module}.controller.ts    # handlers
        ├── {module}.schema.ts        # validation (see validation)
        ├── {module}.service.ts       # logic
        └── {module}.repository.ts    # DB access (see orm)
```

Each domain module exposes its `*.routes.ts`. `http/routes/index.ts` mounts all of them.

## Base configuration

```ts
// apps/api/src/http/app.ts
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { requestId } from 'hono/request-id';
import { requestContext } from './middleware/request-context';
import { errorHandler } from './middleware/error-handler';
import { registerRoutes } from './routes';
import type { AppDeps, AppEnv } from './types';

export function buildApp(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.use(requestId());
  app.use(requestContext(deps.logger));
  app.use(secureHeaders());
  // No CORS middleware: same origin only (ADR-009). See security for Origin / Content-Type checks.

  app.onError(errorHandler);
  app.notFound((c) => c.json({ error: { code: 'not_found', message: 'Not found' } }, 404));

  registerRoutes(app, deps);
  return app;
}
```

```ts
// apps/api/src/index.ts
import { serve } from '@hono/node-server';
import { env } from '@/config/env';
import { buildApp } from '@/http/app';

const app = buildApp(await buildDeps(env));
const server = serve({ fetch: app.fetch, port: env.PORT });
process.on('SIGTERM', () => server.close());
```

## Routing

One `*.routes.ts` per module, exporting a Hono sub-app:

```ts
// apps/api/src/domain/identity/identity.routes.ts
import { Hono } from 'hono';
import type { AppEnv } from '@/http/types';
import { identityController } from './identity.controller';

export const identityRoutes = new Hono<AppEnv>()
  .post('/session', identityController.createSession)
  .patch('/me/preferences', identityController.updatePreferences);
```

```ts
// apps/api/src/http/routes/index.ts
import type { Hono } from 'hono';
import { identityRoutes } from '@/domain/identity/identity.routes';
import { gameplayRoutes } from '@/domain/gameplay/gameplay.routes';

export function registerRoutes(app: Hono<AppEnv>, deps: AppDeps) {
  app.get('/api/health', healthHandler(deps));
  app.route('/api', identityRoutes);
  app.route('/api', gameplayRoutes);
  // quality, progress, publishing; admin routes under /api/admin
}
```

## Controllers

One controller per module. Its only job: **read validated input, call the service, format output**. No business logic, no DB access.

```ts
// apps/api/src/domain/quality/quality.controller.ts
import type { Context } from 'hono';

export const qualityController = {
  async report(c: Context<AppEnv>) {
    const { game_id } = c.req.valid('param');
    const body = c.req.valid('json');
    const report = await c.var.deps.quality.report(c.var.player.id, game_id, body);
    return c.json(report, 201);
  },
};
```

## REST conventions

| Operation | Method | Path | Success status |
|---|---|---|---|
| Read | GET | `/api/today`, `/api/games/{game_id}/today`, `/api/me/stats` | 200 |
| Create | POST | `/api/session`, `/api/games/{game_id}/today/report` | 200 / 201 |
| Action on a resource | POST | `/api/games/{game_id}/today/start`, `/move`, `/api/admin/challenges/{challenge_id}/void` | 200 / 202 |
| Partial update | PATCH | `/api/me/preferences`, `/api/admin/reports/{report_id}` | 200 |

- Paths and JSON properties follow `docs/apis/api.yaml`; no verbs in paths except the actions on a resource listed above.
- No path versioning: the routes are `/api/*` and `/api/admin/*` (ADR-015).
- Path segments are kebab-case; query parameters and JSON properties are `snake_case` (`?from=2026-12-01&to=2026-12-07`).
- Player routes never accept a date from the client; mutations carry `challenge_number` (ADR-008).
- Long operations are never run in a request: regeneration answers `202` after inserting a `generation_requests` row (ADR-005).

## Request context (logger + requestId)

```ts
// apps/api/src/http/middleware/request-context.ts
import { createMiddleware } from 'hono/factory';
import type { Logger } from 'pino';

export const requestContext = (logger: Logger) =>
  createMiddleware<AppEnv>(async (c, next) => {
    c.set('logger', logger.child({ requestId: c.get('requestId') }));
    await next();
  });
```

Any log inside a handler uses `c.var.logger` (not the global logger) to keep the `requestId`. `player_id` is added to the child logger by `player-session` when the cookie resolves.

## Global error handler

Implements `error-handling`:

```ts
// apps/api/src/http/middleware/error-handler.ts
import type { ErrorHandler } from 'hono';
import { AppError } from '@nerdose/core';

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  const log = c.var.logger;
  if (err instanceof AppError) {
    log.warn({ code: err.code }, 'Application error');
    return c.json({ error: { code: err.code, message: c.var.i18n.error(err.code) } }, err.status);
  }
  log.error({ err }, 'Unexpected error');
  return c.json({ error: { code: 'internal_error', message: c.var.i18n.error('internal_error') } }, 500);
};
```

## Health check

`GET /api/health` (players) and `GET /api/admin/health` (owner) require no authentication. They answer `200 { status: 'ok', db: 'ok' }` after a cheap `SELECT 1`, or `503 { status: 'degraded', db: 'error' }` when the database is unreachable (see `docs/apis/api.yaml`).

## Rules

- **One route = one controller handler**. No nested logic.
- Controllers **do not access the DB** or external systems. They call the module's `service`.
- Every endpoint that receives external input validates it with `@hono/zod-validator` (see `validation`). No route is open without validation.
- Status codes per the table above and `docs/apis/api.yaml`. Never answer `200` with an error inside.
- Responses have **no generic envelope**: the resource is returned directly. Errors use `{ "error": { "code", "message" } }` per `error-handling`.
- Responses to players never contain `{ es, en }` objects or `challenges.payload`; text arrives resolved to the request locale (ADR-015, ADR-006).
- No CORS headers are emitted. Security headers come from `hono/secure-headers`; any relaxation is documented in `overview.md`.
- No handler may take longer than `30s`. Anything longer is not done in the `api`: it becomes a `generation_requests` row for the `generator`.
- Handlers never run code (`child_process`, `vm`, `eval`) nor call external services (ADR-001).
- Game routes are generic over the registry. No `if (game_id === ...)` or `switch` by game in `apps/api` (ADR-006).
- Route handlers read `today` from `@nerdose/core` through the platform-day service, never `new Date()` directly.
- The `app` is built by `buildApp(deps)` so tests can instantiate it with their own dependencies.

## Framework variants

Hono is the only allowed HTTP framework (ADR-002). Express, Fastify and NestJS MUST NOT be introduced; the routing, status, validation and error rules above apply to the Hono implementation.

## Integration with other conventions

- **validation**: `zValidator` per route, shared hook.
- **error-handling**: `app.onError` implements the translation.
- **security**: Origin / Content-Type middleware, rate limiters.
- **player-identity**: `player-session` middleware for player routes.
- **auth-jwt**: JWT middleware mounted on `/api/admin/*`.
- **logging**: child logger per request.
