---
id: security
display_name: Seguridad HTTP (Origin, Content-Type, rate limit en memoria)
language: node
description: Same-origin API hardening without CORS - Origin and Content-Type checks, secure headers and in-memory rate limiting with hono-rate-limiter
applies_to: [api]
required_by: []
package: hono-rate-limiter
---

# Security HTTP (Node, hono-rate-limiter)

HTTP hardening of the `api` (ADR-009, ADR-012). There is **no CORS**: `web` and `admin` call the `api` on their own origin. CSRF is handled with `SameSite=Lax` plus an `Origin` check and a mandatory JSON `Content-Type` on mutations. Rate limiting uses [hono-rate-limiter](https://github.com/rhinobase/hono-rate-limiter) with the in-memory store. Service-local replacement of the catalog default (helmet, express-rate-limit and a CORS allowlist).

## When to use

- The `api`, on every route. Single instance only: in-memory counters assume it (ADR-001).

## Package

```
hono-rate-limiter     # rate limiting, in-memory store
hono                  # secure-headers middleware (built in)
```

## Configuration

```ts
// apps/api/src/http/middleware/security.ts
import { createMiddleware } from 'hono/factory';
import { AppError } from '@nerdose/core';

const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

// Mounted twice: originAndContentType(env.WEB_ORIGIN) on /api/* (player routes)
// and originAndContentType(env.ADMIN_ORIGIN) on /api/admin/*. Both env vars are required.
export const originAndContentType = (allowedOrigin: string) =>
  createMiddleware(async (c, next) => {
    if (MUTATING.has(c.req.method)) {
      if (c.req.header('origin') !== allowedOrigin) throw new AppError('forbidden_origin');
      if (!c.req.header('content-type')?.toLowerCase().startsWith('application/json')) {
        throw new AppError('unsupported_media_type');
      }
    }
    await next();
  });
```

```ts
// apps/api/src/http/middleware/rate-limit.ts
import { rateLimiter } from 'hono-rate-limiter';
import { AppError } from '@nerdose/core';

export const limit = (opts: { windowMs: number; limit: number; key: (c: Context) => string }) =>
  rateLimiter<AppEnv>({
    windowMs: opts.windowMs,
    limit: opts.limit,
    standardHeaders: 'draft-6',
    keyGenerator: opts.key,
    handler: (c) => {
      c.header('Retry-After', String(Math.ceil(opts.windowMs / 1000)));
      throw new AppError('rate_limited');
    },
  });

// IP de la conexión; undefined sin socket (app.request en tests)
const socketIp = (c: Context) => { try { return getConnInfo(c).remote.address || undefined; } catch { return undefined; } };

export const clientIp =
  ({ TRUST_PROXY_HEADER: header, TRUST_PROXY_HOPS: hops = 1 }: ClientIpConfig) =>
  (c: Context): string => {
    const raw = header ? c.req.header(header)?.trim() : undefined;
    if (raw) {
      if (header?.toLowerCase() !== 'x-forwarded-for') return raw; // X-Real-IP, CF-Connecting-IP…: the proxy overwrites it
      const entries = raw.split(',').map((e) => e.trim()).filter(Boolean);
      const ip = entries[Math.max(0, entries.length - hops)];     // read from the RIGHT: the left entries are client-written
      if (ip) return ip;
    }
    return socketIp(c) ?? 'unknown'; // header missing (request that skipped the proxy) -> connection IP
  };
```

## How to use

### Limits (exact values)

| Route | Key | Limit |
|---|---|---|
| `POST /api/session` | IP | 20 / 10 min |
| `POST /api/games/{game_id}/today/move` | `player_id` | 60 / min |
| `POST /api/games/{game_id}/today/move` | IP | 300 / min |
| `POST .../start`, `POST .../acknowledge-void`, `PATCH /api/me/preferences` | `player_id` | 30 / min |
| `POST /api/games/{game_id}/today/report` | IP | 10 / hour |
| `GET /api/*` | IP | 600 / min |
| `POST /api/admin/login` | IP | 5 / 15 min |
| `/api/admin/*` with a valid JWT | - | no limit |

```ts
route.post('/games/:game_id/today/move',
  limit({ windowMs: 60_000, limit: 300, key: clientIp(env) }),
  limit({ windowMs: 60_000, limit: 60, key: (c) => c.var.player.id }), // after player-session
  zValidator('json', moveBodySchema, validationHook), controller.move);
```

If there is no valid cookie, only the per-IP limit applies.

### Secure headers and payload size

```ts
import { secureHeaders } from 'hono/secure-headers';
import { bodyLimit } from 'hono/body-limit';

app.use(secureHeaders());
app.use(bodyLimit({ maxSize: 64 * 1024, onError: () => { throw new AppError('validation_error'); } }));
```

## Rules

- No CORS: the `api` never emits `Access-Control-*` headers and no CORS middleware is installed.
- Every mutation (`POST`, `PATCH`, `PUT`, `DELETE`) requires `Content-Type: application/json`, otherwise `415 unsupported_media_type`.
- Every mutation requires an `Origin` header equal to `WEB_ORIGIN` (player routes) or `ADMIN_ORIGIN` (`/api/admin/*`), otherwise `403 forbidden_origin`. Both variables are required in every environment (ADR-009); the check is never disabled by missing configuration.
- There is no CSRF token. Protection is same origin + `SameSite=Lax` + the two checks above.
- The limits are exactly those of the table, with `hono-rate-limiter` and the in-memory store. No captcha.
- A `429` carries `Retry-After` in seconds and the body `{ "error": { "code": "rate_limited", "message": ... } }`.
- The client IP comes only from the header named by `TRUST_PROXY_HEADER`. Never trust an arbitrary `X-Forwarded-For` that is not configured. With `X-Forwarded-For`, use the entry the trusted proxy appended, counting `TRUST_PROXY_HOPS` from the right (the left entries are client-controlled). Without the header, use the connection IP (`getConnInfo`).
- Per-`player_id` limits apply after the `nd_pid` cookie is resolved.
- In production the `api` logs a `warn` at startup if `TRUST_PROXY_HEADER` is not set: behind a proxy every client would share the proxy IP. Prefer a header the proxy overwrites (`X-Real-IP`, `CF-Connecting-IP`, `Fly-Client-IP`) over `X-Forwarded-For`. (Updated 2026-11-25, REQ-012/S-061: before, the first `X-Forwarded-For` entry was used and a missing header fell into one shared `'unknown'` bucket.)
- Payload size limits are set at the framework level (`bodyLimit`), not in application code.
- Stack traces and internal messages are never exposed (see `error-handling`).
- HTTPS is enforced by the infrastructure (deferred). The `api` does not terminate TLS.
- Moving to more than one `api` instance requires moving the limiter store to Postgres or Redis first (ADR-012).

## Integration with other conventions

- **http-server**: the middleware are registered in `buildApp` before the routes.
- **player-identity**: the `Secure; SameSite=Lax` cookie and the `player_id` rate-limit key.
- **auth-jwt**: the stricter limit on `POST /api/admin/login`.
- **env-config**: `TRUST_PROXY_HEADER`, `TRUST_PROXY_HOPS`, `WEB_ORIGIN`, `ADMIN_ORIGIN`.
- **error-handling**: `forbidden_origin`, `unsupported_media_type`, `rate_limited`.
