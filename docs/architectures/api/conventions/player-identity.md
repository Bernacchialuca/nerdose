---
id: player-identity
display_name: Identidad del jugador anonimo (cookie nd_pid)
language: node
description: Anonymous player identity through the nd_pid cookie, session endpoint, middleware and locale resolution
applies_to: [api]
required_by: []
package: null
---

# Player Identity (Node, Hono cookies)

Players are anonymous and identified by the functional cookie `nd_pid`, whose value is `players.id` (UUID v4) (ADR-009). No PII is stored. The locale of every response is resolved from the request, the player and the browser (ADR-015). Uses `hono/cookie`; no additional package.

## When to use

- Every player route of the `api` (`/api/*` except `/api/admin/*`).
- Not used by admin routes, which never read or emit `nd_pid`.

## Package

No package is prescribed: `hono/cookie` (built in) and `node:crypto` (`randomUUID`).

## Structure

```
apps/api/src/
├── http/middleware/
│   ├── player-session.ts     # resolves nd_pid -> c.var.player (optional or required)
│   └── locale.ts             # resolves c.var.locale
└── domain/identity/
    ├── identity.routes.ts    # POST /api/session, PATCH /api/me/preferences
    ├── identity.service.ts
    └── identity.repository.ts
```

## Configuration

```ts
// apps/api/src/domain/identity/session-cookie.ts
import { setCookie } from 'hono/cookie';

export function issuePlayerCookie(c: Context, playerId: string) {
  setCookie(c, 'nd_pid', playerId, {
    httpOnly: true, secure: true, sameSite: 'Lax', path: '/',
    maxAge: 34_560_000,            // 400 days, renewed on every POST /api/session
    // no `domain`: host-only on nerdose.dev
  });
}
```

## How to use

### Session endpoint (idempotent)

```ts
// POST /api/session -> 200 { locale, preferred_code_language, created }
const pid = getCookie(c, 'nd_pid');
const existing = pid && isUuid(pid) ? await repo.findById(pid) : null;   // an unknown pid is treated as absent
const player = existing
  ? await repo.touch(existing.id)                                         // last_seen_at = now
  : await repo.create({ locale: pickLocale(c.req.header('accept-language')), preferred_code_language: 'js' });
issuePlayerCookie(c, player.id);
return c.json({ locale: player.locale, preferred_code_language: player.preferred_code_language, created: !existing });
```

### Middleware

```ts
// required: 401 no_session if missing or unknown; optional: used by GET /api/today (has_session: false)
export const playerSession = (mode: 'required' | 'optional') => createMiddleware<AppEnv>(async (c, next) => {
  const pid = getCookie(c, 'nd_pid');
  const player = pid && isUuid(pid) ? await c.var.deps.identity.find(pid) : null;
  if (!player && mode === 'required') throw new AppError('no_session');
  c.set('player', player);
  if (player) c.set('logger', c.var.logger.child({ player_ref: playerRef(player.id) }));
  await next();
});
```

### Locale resolution

Order: query `?lang=es|en` -> `players.locale` -> `Accept-Language` -> `es`. All `{ es, en }` content is resolved before responding; `message` of errors uses the same locale.

## Rules

- The cookie name is `nd_pid` and its value is `players.id` as is.
- Cookie attributes are exactly `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=34560000`, with no `Domain`.
- `POST /api/session` is idempotent: it renews the cookie and `last_seen_at` for an existing player, creates one otherwise, and answers `200 { locale, preferred_code_language, created }`.
- A new player gets `locale` from `Accept-Language` if it is `es` or `en`, else `es`; `preferred_code_language` is `js`.
- A `nd_pid` that does not match an existing player is treated as absent (a new player is created and the cookie replaced).
- Player routes that require identity answer `401 no_session` without a valid cookie. `GET /api/today` works without a cookie and returns `has_session: false`.
- No PII is stored in `players` (no IP, email or fingerprint). The `user_agent` is stored only in the `context` of a report.
- The `api` never trusts a `player_id` from the body, query or headers. The only source is the cookie.
- The `player_id` is the cookie credential: it is never logged raw. Logs carry `player_ref` (first 8 hex of its sha256, `@/shared/player-ref`), the same reference the admin shows.
- `players.user_id` is reserved for a future `User` and is never set in v1.
- Admin routes never read or emit `nd_pid`.

## Integration with other conventions

- **http-server**: `playerSession` and `locale` are mounted per route group.
- **security**: Origin / Content-Type checks protect the cookie-authenticated mutations; per-`player_id` rate limits.
- **error-handling**: `no_session`.
- **orm**: `identity.repository.ts`.
