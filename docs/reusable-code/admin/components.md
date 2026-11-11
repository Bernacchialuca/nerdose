# Components

Styled with Tailwind utilities from the design tokens (`bg-bg`, `text-text`, `text-accent`, `border-border-strong`, `font-mono`).

## Shell
- **Location:** apps/admin/src/app/shell.tsx
- **Props:** none
- **Description:** layout of the protected area. `AppHeader` with `BrandMark`, nav "Reportes (N)" (open groups count) and "Cerrar sesión"; `<main>` with `<Outlet />`. Each route owns its `<h1>` and title.
- **Usage:** add admin screens as children of the protected layout route

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
- **Description:** wraps with `QueryClientProvider client={queryClient}` and `AuthProvider`; also mounts `AuthProvider`

## Dialog
- **Location:** apps/admin/src/components/dialog.tsx
- **Signature:** `Dialog({ variant: 'modal' | 'drawer', title, onClose, closeDisabled?, initialFocusRef?, titleRef?, children })`
- **Description:** `role="dialog" aria-modal`, focus trap, Escape and overlay click close (unless `closeDisabled`), returns focus to the previously focused element on unmount.

## TextField / TextAreaField / SelectField
- **Location:** apps/admin/src/components/form-field.tsx
- **Signature:** `TextField({ label, error?, inputRef?, ...inputProps })` (same for textarea/select with `textareaRef`/`selectRef`)
- **Description:** visible label, `aria-invalid`, `aria-describedby` to the error text, `aria-required`.

## Tabs
- **Location:** apps/admin/src/components/tabs.tsx
- **Signature:** `Tabs({ label, tabs, value, onChange, children })`
- **Description:** `tablist` with automatic activation; arrows, Home and End move between tabs.

## dangerButtonClass
- **Location:** apps/admin/src/components/danger-button.ts
- **Signature:** `dangerButtonClass({ disabled? })`

## usePageTitle
- **Location:** apps/admin/src/hooks/use-page-title.ts
- **Signature:** `usePageTitle(title, { focusHeading? }) => RefObject<HTMLHeadingElement>`
- **Usage:** `<h1 ref={usePageTitle('Reportes · Admin · nerdose')} tabIndex={-1}>`

## formatInstant / formatRelative
- **Location:** apps/admin/src/lib/format-date.ts
- **Signature:** `formatInstant(iso)` → `YYYY-MM-DD HH:mm`; `formatRelative(iso, now?)` → `hace 2 h`, `ayer`
