---
id: error-handling
display_name: Manejo de errores
language: react
description: "Error boundaries, typed ApiError codes and Spanish recovery messages for the admin SPA, with 401 handling"
applies_to: [frontend]
required_by: [data-fetching, routing]
package: null
---

# Error Handling (React)

Errors fall into two classes: **expected** ones, which the `api` returns as `{ "error": { "code", "message" } }` and the UI recovers from by `code`, and **unexpected** ones, which end in an error boundary. This is the `admin` variant: it adds the `401` session rule and the operational error codes of the responsable. The UI is Spanish-only.

## When to use

- Every query, mutation and route in `admin`.

## Two classes of errors

| Class | Examples | Handling |
|---|---|---|
| Expected (`ApiError`) | `unauthorized`, `invalid_credentials`, `not_voidable`, `not_regenerable`, `report_not_open`, `rate_limited` | Handled in the module with a specific message or recovery |
| Unexpected | `internal_error`, network failure, render exception | Route `errorElement` / error boundary with a retry action |

## Recovery by error code

| `code` | Recovery in `admin` |
|---|---|
| `unauthorized` (401) | Global: clear the token and Query cache, go to `/login` (see `auth`) |
| `invalid_credentials` | Inline error in the login form |
| `rate_limited` | Show the `Retry-After` wait; disable the action until then |
| `not_voidable` | Refetch the challenge/report; the status changed. Show "ya no se puede anular" |
| `not_regenerable` | Refetch upcoming challenges; show "ya no se puede regenerar" |
| `report_not_open` | Refetch the reports list; show that it was already handled |
| `not_found` | Refetch the list; show that the item no longer exists |
| `validation_error` | Inline message on the control |
| `internal_error`, network | Inline retry, or the route error screen if the whole view failed |

## How to use

### Reading the code

```ts
// src/lib/api-errors.ts
export const isApiError = (e: unknown, code?: string): e is ApiError =>
  e instanceof ApiError && (code === undefined || e.code === code);
```

```tsx
onError: (err) => {
  if (isApiError(err, 'not_voidable')) { setNotice('El desafío ya no se puede anular.'); return qc.invalidateQueries({ queryKey: reportKeys.all }); }
  throw err;                                   // unexpected: reaches the boundary
}
```

### The 401 rule

- The global `onError` hook (registered by `auth`) handles `401 unauthorized` for every request, so modules do not handle it individually and do not retry the request.

### Route error screen

```tsx
// src/app/route-error.tsx
export function RouteError() {
  return (
    <main role="alert">
      <h1>Algo salió mal</h1>
      <button onClick={() => location.reload()}>Reintentar</button>
    </main>
  );
}
```

### Query errors in a section

- Local failures (one table failed) render an inline message with a retry button; views that cannot render without data let the error reach `errorElement` (`throwOnError: true`).

### Messages

- `ApiError.message` already arrives in the response locale; show it for expected errors that need no custom text. Custom texts are written in Spanish directly in the component.

## Rules

- Branch on `ApiError.code`, never on `message` text.
- A `401 unauthorized` always ends the session; modules never swallow it or retry it.
- Every route has an `errorElement`; a render error never leaves a blank page.
- Never show stack traces, raw JSON or internal details.
- Every error state has a way forward: retry, go back or an explanatory message.
- Error messages are announced to assistive tech (`role="alert"` or `aria-live`) and do not rely only on color.
- After a destructive operation fails with a state conflict (`not_voidable`, `not_regenerable`, `report_not_open`), refetch before showing anything else.
- Do not swallow errors silently: recover, show a message or rethrow.
- No client-side error tracking service in v1 (deferred).

## Integration with other conventions

- **auth**: owns the `401` handler.
- **data-fetching**: `ApiError` is thrown by the client wrapper and consumed here.
- **routing**: `errorElement` per route tree.
- **accessibility**: announcement and non-color feedback requirements.
