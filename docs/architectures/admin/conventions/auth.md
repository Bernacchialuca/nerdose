---
id: auth
display_name: Autenticación del admin (JWT)
language: react
description: "Admin login with a JWT kept in sessionStorage and sent as a Bearer token; 401 clears it"
applies_to: [frontend]
required_by: []
package: null
---

# Auth (React, JWT in sessionStorage)

The admin has a single user and a single password (ADR-010). Login returns a JWT (HS256, 8 h, no refresh) that the app stores in `sessionStorage` and sends as `Authorization: Bearer <token>`. Any `401` clears the token and returns to the login screen. No auth library is used.

## When to use

- Login, logout, the route guard and every request to `/api/admin/*`.

## Structure

```
src/modules/auth/
├── token-store.ts        # sessionStorage read/write/clear
├── auth-context.tsx      # AuthProvider + useAuth()
├── api/login.ts          # useLogin() mutation
└── routes/login.tsx      # login screen
```

## Configuration

```ts
// src/modules/auth/token-store.ts
const KEY = 'nerdose_admin_session';
type Session = { token: string; expires_at: string };

export function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    const s = raw ? (JSON.parse(raw) as Session) : null;
    return s && new Date(s.expires_at) > new Date() ? s : null;
  } catch { return null; }
}
export const writeSession = (s: Session) => { try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch {} };
export const clearSession = () => { try { sessionStorage.removeItem(KEY); } catch {} };
```

```ts
// src/app/main wiring: register hooks once
configureApi({
  getHeaders: () => {
    const s = readSession();
    return s ? { Authorization: `Bearer ${s.token}` } : {};
  },
  onError: (err) => {
    if (err.status === 401 && err.code === 'unauthorized') {
      clearSession();
      queryClient.clear();
      router.navigate('/login', { replace: true });
    }
  },
});
```

## How to use

### Login

```ts
export function useLogin() {
  return useMutation({
    mutationFn: (password: string) =>
      api<{ token: string; expires_at: string }>('/api/admin/login', { method: 'POST', json: { password } }),
    onSuccess: (s) => writeSession(s),
  });
}
```

- `invalid_credentials` (401 from login) shows an inline error in the form and does **not** trigger the global 401 redirect.
- `rate_limited` (429) shows the wait from `Retry-After` and disables the submit button until then.

### Logout

- A "Cerrar sesión" button calls `clearSession()`, clears the Query cache and navigates to `/login`.

### Expiry

- `readSession()` discards an expired token (`expires_at`), so the guard sends the user to `/login` without a wasted request. The `api` remains the authority and may still answer `401`.

## Rules

- The token lives only in `sessionStorage`; never in `localStorage`, cookies, memory-persisted stores or the URL.
- The token is sent only as `Authorization: Bearer` by the `getHeaders` hook; feature code never sets it.
- Any `401` with `code: unauthorized` clears the token, clears the Query cache and redirects to `/login`; the failed request is not retried.
- `401 invalid_credentials` from `/api/admin/login` is a form error, not a session expiry.
- No refresh logic, no "remember me", no multiple users.
- Never log or display the token or the password; the password field is `type="password"` with `autocomplete="current-password"`.
- The admin never reads or sends the `nd_pid` cookie.
- Render report texts and any player-provided content as plain text, never as HTML (no `dangerouslySetInnerHTML`).
- Logout and expiry both leave no admin data in the Query cache.

## Integration with other conventions

- **data-fetching**: `configureApi` hooks inject the header and react to `401`.
- **routing**: `RequireAuth` reads `useAuth()`.
- **error-handling**: the 401 behavior is defined here and referenced there.
- **state-management**: `AuthProvider` is the one app-wide context of the admin.
