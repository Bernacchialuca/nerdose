---
id: error-handling
display_name: Manejo de errores
language: react
description: "Error boundaries, typed ApiError codes and user-facing recovery for the web SPA"
applies_to: [frontend]
required_by: [data-fetching, routing]
package: null
---

# Error Handling (React)

Errors fall into two classes: **expected** ones, which the `api` returns as `{ "error": { "code", "message" } }` and the UI recovers from by `code`, and **unexpected** ones (bugs, network), which end in an error boundary. This is the `web` variant, where the player's session is a cookie; the `admin` app has its own variant.

## When to use

- Every query, mutation and route in the app.
- Any component that can fail while rendering.

## Two classes of errors

| Class | Examples | Handling |
|---|---|---|
| Expected (`ApiError`) | `challenge_expired`, `challenge_voided`, `game_finished`, `not_in_word_list`, `rate_limited`, `no_session` | Handled in the module with a specific recovery or message |
| Unexpected | `internal_error`, network failure, render exception | Route `errorElement` / error boundary with a retry action |

## Recovery by error code

| `code` | Recovery in `web` |
|---|---|
| `challenge_expired` | Invalidate `today` and the game query and reload the challenge; show a short "new challenge" notice |
| `challenge_voided` | Refetch; the game view switches to the voided state and offers `acknowledge-void` |
| `game_finished` | Refetch the play state and show the result |
| `no_challenge_today` | Show the "no challenge today" state for that game |
| `no_session` | Call `POST /api/session` once and retry; if still without session, show the blocked-cookies notice and disable play |
| `not_in_word_list` (Devdle) | Inline field message; the attempt is not consumed |
| `invalid_move`, `validation_error`, `invalid_report` | Inline message on the control; no navigation |
| `rate_limited` | Message with the `Retry-After` wait; disable the action until then |
| `already_reported` | Show the "already reported" state |
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
  if (isApiError(err, 'challenge_expired')) return qc.invalidateQueries({ queryKey: todayKeys.all });
  if (isApiError(err, 'rate_limited')) return setWait(err.retryAfter ?? 5);
  throw err;                                    // unexpected: reaches the boundary
}
```

### Route error screen

```tsx
// src/app/route-error.tsx — it replaces the whole shell (it is its errorElement)
export function RouteError() {
  const error = useRouteError();
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader brand={<a href="/"><BrandMark label={t('shell.brand')} /></a>} />  {/* no session, no queries */}
      <main><div role="alert">
        <ErrorTerminal command="nerdose --play" output={describeError(error, t('errors.terminalOutput'))}
          exitCode={1} title={t('errors.title')} message={t('errors.message')}
          actions={<>
            <button onClick={() => location.reload()} className={buttonClass({ fullWidth: true })}>{t('errors.retry')}</button>
            <a href="/" className={buttonClass({ variant: 'secondary', fullWidth: true })}>← {t('errors.back')}</a>
          </>} />
      </div></main>
      <SiteFooter />
    </div>
  );
}
// describeError: the real `Name: message` only when import.meta.env.MODE === 'development'; otherwise the i18n fallback
```

- `RouteError` builds its own minimal header (brand only) and footer: whatever broke may be the session or a query, so it depends on neither. Its links are plain `<a>` (not `<Link>`) to force a clean reload of the app.
- `ErrorTerminal` (`src/components/error-terminal.tsx`) is shared with the 404 (`NotFound`, command `cd <path>`): a decorative terminal transcript (`aria-hidden`) above the `h1`, the message and the actions, so the prose says the same as the transcript (REQ-012/S-060, UX screens `error-inesperado` and `no-encontrado`).

### Query errors in a section

- Use the query's `error` state to render an inline message with a retry button for failures local to one section (e.g. stats failed but the page is usable).
- For a view that cannot render without its data, let the error propagate to the route `errorElement` (`throwOnError: true` on that query).

### Messages

- Show `ApiError.message` for expected errors that need no custom text: it already arrives in the player's locale.
- UI-only messages (network down, generic failure) come from i18n resources (see `i18n`).

## Rules

- Branch on `ApiError.code`, never on `message` text.
- Every route has an `errorElement`; a render error never leaves a blank page.
- Never show stack traces, raw JSON or internal details to the player.
- Every error state has a way forward: retry, go home, or an explanatory message.
- Error messages are announced to assistive tech (`role="alert"` or an `aria-live` region) and do not rely only on color.
- Expected errors are handled where they occur; only unexpected ones propagate to boundaries.
- Do not swallow errors silently: either recover, show a message or rethrow.
- Network failures (`TypeError` from `fetch`) are treated as unexpected, with a retry action.
- No client-side error tracking service in v1; errors reach the browser console only (error tracking is deferred).

## Integration with other conventions

- **data-fetching**: `ApiError` is thrown by the client wrapper and consumed here.
- **routing**: `errorElement` per route tree.
- **i18n**: UI-only error texts live in the translation resources.
- **accessibility**: announcement and non-color feedback requirements.
