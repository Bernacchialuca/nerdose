---
id: error-handling
display_name: Manejo de errores (catalogo cerrado)
language: node
description: 'Error modeling and canonical { error: { code, message } } shape with a closed code catalog exported by @nerdose/core'
applies_to: [api, worker, library]
required_by: [http-server, validation, auth-jwt]
package: null
---

# Error Handling (Node)

Defines how errors are modeled, propagated and translated. The response shape is `{ "error": { "code", "message" } }` and the `code` values belong to a **closed catalog** exported by `@nerdose/core` (ADR-015). Service-local replacement of the catalog default: no `details` field, lower `snake_case` codes, and the catalog lives in a shared package. Auto-included when `http-server`, `validation` or `auth-jwt` are active.

## When to use

- `api`: translation of errors to HTTP responses.
- `generator`: no HTTP, but the same `AppError` model is used for domain failures, and job runners log and record them (no error reaches a client).

## Error catalog

The catalog is a constant in `@nerdose/core`; `AppError` is the only error class for expected failures.

```ts
// packages/core/src/errors.ts
export const ERROR_CATALOG = {
  no_session:               { status: 401 },
  unauthorized:             { status: 401 },
  invalid_credentials:      { status: 401 },
  forbidden_origin:         { status: 403 },
  no_challenge_today:       { status: 404 },
  not_found:                { status: 404 },
  challenge_expired:        { status: 409 },
  challenge_voided:         { status: 409 },
  game_finished:            { status: 409 },
  already_reported:         { status: 409 },
  not_voidable:             { status: 409 },
  not_regenerable:          { status: 409 },
  not_voided:               { status: 409 },
  report_not_open:          { status: 409 },
  unsupported_media_type:   { status: 415 },
  invalid_move:             { status: 422 },
  not_in_word_list:         { status: 422 },
  invalid_report:           { status: 422 },
  validation_error:         { status: 422 },
  rate_limited:             { status: 429 },
  internal_error:           { status: 500 },
} as const;

export type ErrorCode = keyof typeof ERROR_CATALOG;

export class AppError extends Error {
  readonly status: number;
  constructor(readonly code: ErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'AppError';
    this.status = ERROR_CATALOG[code].status;
  }
}
```

## When to use each one

| Error | When |
|---|---|
| `no_session` / `unauthorized` / `invalid_credentials` | Missing player cookie / missing or invalid admin JWT / wrong admin password. |
| `forbidden_origin` / `unsupported_media_type` | Mutation with a disallowed `Origin` / without `Content-Type: application/json`. |
| `no_challenge_today` / `not_found` | No published or voided challenge today for a game / unknown `game_id`, `challenge_id` or `report_id`. |
| `challenge_expired` / `challenge_voided` / `game_finished` | `challenge_number` is not today's / move on a voided challenge / move on a Play that is not `in_progress`. |
| `already_reported` / `report_not_open` | Second report by the same player / resolving a report that is no longer `open`. |
| `not_voidable` / `not_regenerable` / `not_voided` | Void a challenge that is not `published` / regenerate one that is not `approved` or has `date <= today` / acknowledge a challenge that is not voided. |
| `invalid_move` / `not_in_word_list` / `invalid_report` / `validation_error` | Move fails `moveSchema` or the game state / Devdle word outside the valid list / bad report / any other invalid body, query or param. |
| `rate_limited` | Rate limit exceeded (with `Retry-After`). |
| `internal_error` | Unexpected error (never thrown on purpose). |

Adding a code is a change to `@nerdose/core` **and** to ADR-015 and `docs/apis/api.yaml`. Never throw a plain `Error` for an expected failure.

## Canonical error shape

```json
{ "error": { "code": "challenge_expired", "message": "Este desafío ya no es el de hoy." } }
```

- `code`: one value of the catalog, stable, part of the public contract.
- `message`: text in the locale resolved for the request (`?lang` → `players.locale` → `Accept-Language` → `es`). No stack traces, SQL or internal details.
- No extra fields. Clients branch on `code` only.

## Translation at the system boundary

The global handler (see `http-server`):

1. Catches every exception.
2. `AppError`: responds with `status` from the catalog, `code` and the localized message; logs at `warn` without stack (`rate_limited` and `no_session` may log at `info`).
3. Anything else (including unexpected driver errors): logs at `error` with stack and responds `500 internal_error` with a generic message.

In the `generator`, job runners catch errors per candidate and per job, log them with the `logging` convention and record the outcome in `job_runs` / `generation_failures`; an error never kills the process.

## Rules

- Throw `AppError` with a catalog code for every expected failure. Never `throw new Error(...)` in domain code.
- The error codes are part of the public contract. Changing or removing one is a breaking change; the catalog is closed.
- Error responses have exactly the shape `{ "error": { "code", "message" } }`. No `details`, no stack, no SQL.
- `message` is localized to the request locale and never contains sensitive data (cookies, tokens, other players' data, internals).
- 5xx errors are never remapped to 4xx. They are logged with stack and answered `500 internal_error`.
- Never answer `200` with an error body.
- Each failure has one canonical place where it is thrown. If the same error can arise in N places, extract a helper.
- Unique-constraint violations are translated by the service layer into the right code (`already_reported`); repositories do not throw `AppError`.
- A failed alert delivery (`notify()`) is logged and never changes the HTTP response or fails a job run.

## Integration with other conventions

- **http-server**: registers the global handler that implements this translation.
- **validation**: failed parses become `validation_error` or `invalid_move`.
- **auth-jwt** / **security**: `unauthorized`, `invalid_credentials`, `forbidden_origin`, `unsupported_media_type`, `rate_limited`.
- **logging**: the handler logs per the levels above.
