# Auth module

## token-store
- **Location:** apps/admin/src/modules/auth/token-store.ts
- **Signature:** `readSession(): Session | null`, `writeSession(s)`, `clearSession(reason?: 'expired' | 'logout')`, `subscribe(fn)`, `getSessionSnapshot()`, `getEndReason()`
- **Description:** session `{ token, expires_at }` under `nerdose_admin_session` in `sessionStorage` only; every access wrapped in try/catch; `readSession` returns null when expired or corrupt. Writes/clears notify subscribers.

## AuthProvider / useAuth
- **Location:** apps/admin/src/modules/auth/auth-context.tsx
- **Signature:** `useAuth(): { isAuthenticated; endReason; signIn(session); signOut() }`
- **Description:** reads the token store with `useSyncExternalStore`; `signOut` clears the session and the Query cache. Throws outside the provider.

## RequireAuth
- **Location:** apps/admin/src/modules/auth/require-auth.tsx
- **Usage:** `<RequireAuth><Shell /></RequireAuth>` as the layout element of protected routes

## useLogin
- **Location:** apps/admin/src/modules/auth/api/login.ts
- **Description:** `POST /api/admin/login` with `{ password }`; stores the returned session on success.
