---
id: routing
display_name: Routing (React Router)
language: react
description: "Client-side routing for the admin SPA with React Router, a login route and a protected area"
applies_to: [frontend]
required_by: []
package: react-router
---

# Routing (React, React Router)

Client-side routing with **React Router** in data-router mode (`createBrowserRouter`). The admin has one public route (`/login`) and a protected area for the five operational sections. There is no server routing: the host serves `index.html` for every path (deferred hosting requirement).

## When to use

- Any navigation between screens of `admin`.
- Any code split by section.

## Package

```
react-router      # createBrowserRouter, Link, Navigate, useNavigate
```

## Structure

```
src/
├── app/
│   ├── router.tsx                    # the route table
│   ├── shell.tsx                     # layout: nav, logout, <Outlet />
│   └── require-auth.tsx              # guard for the protected area
└── modules/
    ├── auth/routes/login.tsx                 # /login
    ├── reports/routes/reports.tsx            # /reports
    ├── upcoming/routes/upcoming.tsx          # /upcoming
    ├── content-stock/routes/content.tsx      # /content
    └── metrics/routes/metrics.tsx            # /metrics
```

## Route table

| Path | Module | Access | Notes |
|---|---|---|---|
| `/login` | `auth` | public | Password form. If a valid token exists, redirects to `/reports` |
| `/` | `shell` | protected | Redirects to `/reports` |
| `/reports` | `reports` | protected | Player reports; resolve, dismiss and void challenges |
| `/upcoming` | `upcoming` | protected | Next 14 days: solution preview and regenerate, with polling |
| `/content` | `content-stock` | protected | Stock of the content banks |
| `/metrics` | `metrics` | protected | Metrics as HTML tables |
| `*` | `shell` | protected | Not found |

## Configuration

```tsx
// src/app/router.tsx
export const router = createBrowserRouter([
  { path: '/login', lazy: () => import('@/modules/auth/routes/login') },
  {
    element: <RequireAuth><Shell /></RequireAuth>,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/reports" replace /> },
      { path: 'reports', lazy: () => import('@/modules/reports/routes/reports') },
      { path: 'upcoming', lazy: () => import('@/modules/upcoming/routes/upcoming') },
      { path: 'content', lazy: () => import('@/modules/content-stock/routes/content') },
      { path: 'metrics', lazy: () => import('@/modules/metrics/routes/metrics') },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
```

## How to use

### Protected area

```tsx
// src/app/require-auth.tsx
export function RequireAuth({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return isAuthenticated ? children : <Navigate to="/login" replace state={{ from: location }} />;
}
```

- The guard only reads the auth state (see `auth`); it does not decide validity. The `api` does, and a `401` clears the session and returns to `/login`.

### Heavy sections

- The `upcoming` route loads the game `client` packages lazily for the preview (see `game-clients`); `metrics`, `reports` and `content` do not import any game code.

### Navigation and focus

- Use `<Link>` / `useNavigate`. On route change, move focus to the page `<h1>` and update `document.title`.

## Rules

- All routes are declared in `src/app/router.tsx`.
- Every route outside the shell is lazy-loaded.
- Every route except `/login` sits under `RequireAuth`; never rely on hiding links.
- The nav links and labels are in Spanish; the `lang` of the document is `es`.
- Route components are thin; logic lives in module hooks.
- Route errors render through `errorElement` (see `error-handling`).
- After login, return the user to the route they came from (`state.from`) or `/reports`.
- Each route sets a meaningful `document.title` and moves focus on navigation.

## Integration with other conventions

- **auth**: provides `useAuth()` and the 401 behavior that the guard depends on.
- **game-clients**: the preview in `/upcoming` lazy-loads game clients.
- **error-handling**: `errorElement` and the not-found screen.
- **accessibility**: focus management and page titles on navigation.
