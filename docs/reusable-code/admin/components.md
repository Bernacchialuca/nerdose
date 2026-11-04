# Components

Styled with Tailwind utilities from the design tokens (`bg-bg`, `text-text`, `text-accent`, `border-border-strong`, `font-mono`).

## Shell
- **Location:** apps/admin/src/app/shell.tsx
- **Props:** none
- **Description:** root layout for `/`. Header with `<span aria-hidden>&gt; </span>nerdose` in accent; `<main>` holds the only `<h1>` ("Admin") followed by `<Outlet />`. Sets `document.title = 'Admin · nerdose'` on mount.
- **Usage:** add admin screens as children of the `/` route so they render inside the `<Outlet />`

## RouteError
- **Location:** apps/admin/src/app/route-error.tsx
- **Props:** none (reads `useRouteError()`)
- **Description:** logs the error to `console.error`, renders `role="alert"` with h1 "Algo salió mal" and a "Reintentar" button (`min-h-11`, visible focus) that calls `location.reload()`. Never renders the error message or stack.
- **Usage:** `{ path: '/x', element: <X />, errorElement: <RouteError /> }`

## routes / router
- **Location:** apps/admin/src/app/router.tsx
- **Signature:** `routes: RouteObject[]`; `router = createBrowserRouter(routes)`
- **Description:** `routes` is exported so tests render the real tree via `renderWithProviders`
- **Usage:** `{ path: '/', element: <Shell />, errorElement: <RouteError />, children: [{ path: 'reports', element: <Reports /> }] }`

## Providers
- **Location:** apps/admin/src/app/providers.tsx
- **Signature:** `Providers({ children }: PropsWithChildren)`
- **Description:** wraps with `QueryClientProvider client={queryClient}`; add future app-wide providers (auth) here
