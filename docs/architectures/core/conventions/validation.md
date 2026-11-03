---
id: validation
display_name: Validacion de inputs (Zod + @hono/zod-validator)
language: node
description: Input validation with Zod, wired to Hono routes through @hono/zod-validator, with game move schemas imported from game packages
applies_to: [api, worker, library]
required_by: []
package: zod
---

# Validation (Node, Zod)

Validation of every external input (HTTP body, query, params, `jsonb` columns, env vars) with [Zod](https://zod.dev). In `api` the schemas are attached to routes with `@hono/zod-validator`. Service-local replacement of the catalog default because the HTTP binding is Hono (ADR-002) and the move schemas come from the game packages (ADR-006).

## When to use

- `api`: every route that receives body, query or params.
- `generator`: payloads read from `jsonb` columns, the `generation_requests` row and the content dataset files.
- Env vars are validated with Zod too (see `env-config`).

## Package

```
zod                      # runtime
@hono/zod-validator      # runtime, api only
```

## Where schemas live

```
apps/api/src/domain/{module}/
├── {module}.schema.ts        # Zod schemas for the module routes
├── {module}.types.ts         # types inferred from the schemas
└── ...
packages/games/{game_id}/     # moveSchema and payload/state/result schemas live here
```

One `*.schema.ts` per module. Schemas for the moves, payloads, states, results and stats of a game are owned by that game package and imported from it. They are never redefined in `apps/`.

## How to use

### Define and infer

```ts
// apps/api/src/domain/quality/quality.schema.ts
import { z } from 'zod';

export const reportBodySchema = z.object({
  challenge_number: z.number().int().min(1),
  reason: z.enum(['wrong_answer', 'ambiguous', 'wrong_explanation', 'translation', 'display_bug', 'other']),
  message: z.string().max(1000).optional(),
});
export type ReportBody = z.infer<typeof reportBodySchema>;
```

### Validate at the route

```ts
// apps/api/src/domain/quality/quality.routes.ts
import { zValidator } from '@hono/zod-validator';
import { validationHook } from '@/http/validation-hook';

app.post('/games/:game_id/today/report', zValidator('json', reportBodySchema, validationHook), handler);
```

The shared hook converts a failed parse into the closed error catalog instead of letting the library answer:

```ts
// apps/api/src/http/validation-hook.ts
import type { Hook } from '@hono/zod-validator';
import { AppError } from '@/shared/errors';

export const validationHook: Hook<any, any, any> = (result) => {
  if (!result.success) throw new AppError('validation_error');
};
```

### Game moves

`moveSchema` of the game is used by the route through the registry; a failed parse answers `422 invalid_move`:

```ts
const game = games.get(gameId);                       // registry, see game-registry
const parsed = game.moveSchema.safeParse(body.move);
if (!parsed.success) throw new AppError('invalid_move');
```

### Stored `jsonb`

```ts
const payload = game.payloadSchema.parse(challenge.payload); // fail loudly: corrupted content is a bug
```

## Rules

- Never trust `unknown` data from outside without a schema: body, query, params, headers, `jsonb`, dataset files, env vars.
- Every route that receives external input validates it with `@hono/zod-validator`. No route is "open" without validation.
- `moveSchema`, payload, state, result and stats schemas MUST be imported from the game package. Never redefined in `apps/`.
- Types are inferred from schemas (`z.infer`). No hand-written types that duplicate a schema.
- Validation failures reach the client as the closed error catalog: `422 validation_error`, or `422 invalid_move` for game moves. The raw Zod error is never returned.
- Use `safeParse` at boundaries where the error code is chosen by the caller; use `parse` only for data that must already be valid (stored `jsonb`).
- Use composition (`.partial()`, `.omit()`, `.pick()`, `.extend()`) instead of duplicating schemas.
- JSON property names in schemas are `snake_case` and match `docs/apis/api.yaml` (ADR-015). No `camelCase` aliases or transforms.
- Day dates are validated as `YYYY-MM-DD` strings and instants as ISO 8601 UTC; the server never accepts a date from the client on player routes (ADR-008).
- Response validation is done only in tests and anti-spoiler contract tests, not on every response.

## Integration with other conventions

- **http-server**: validators are registered per route; the hook throws errors handled by the global handler.
- **error-handling**: validation failures map to `validation_error` (422) and `invalid_move` (422).
- **game-registry** (api): provides `moveSchema` per game.
- **orm**: `jsonb` columns are parsed with the schemas of the owner package on read and write.
