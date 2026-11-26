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
- **Signature:** `TextField({ label, error?, invalid?, describedBy?, inputRef?, ...inputProps })` (`invalid` marks the field and `describedBy` links an external alert, without own error text) (same for textarea/select with `textareaRef`/`selectRef`)
- **Description:** visible label, `aria-invalid`, `aria-describedby` to the error text, `aria-required`.

## Pagination / usePagination
- **Location:** apps/admin/src/components/pagination.tsx
- **Signature:** `Pagination({ page, totalPages, total, pageSize, noun, onChange, label? })`; `usePagination<T>(items, pageSize)` → `{ page, totalPages, total, pageSize, pageItems, setPage }`
- **Description:** «‹ Anterior · 1–25 de 4.863 términos · página 1 de 195 · Siguiente ›» inside a `nav` (`label` default «Paginado»); the range text is `aria-live="polite"`; the ends are `aria-disabled` `secondary` buttons; renders nothing when everything fits in one page. `usePagination` pages a list that arrived whole and clamps back when it shrinks (REQ-012/S-068).
- **Usage:** `const p = usePagination(rows, 20); <Pagination {...p} noun="desafíos" onChange={p.setPage} />`

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

## formatInstant / formatRelative / formatDay
- **Location:** apps/admin/src/lib/format-date.ts
- **Signature:** `formatInstant(iso)` → `YYYY-MM-DD HH:mm`; `formatRelative(iso, now?)` → `hace 2 h`, `ayer`; `formatDay('2026-12-03')` → `03/12/2026`; `formatDayShort('2026-12-03')` → `03/12` (string slicing, no timezone)

## TableRegion
- **Location:** apps/admin/src/components/table-region.tsx
- **Signature:** `TableRegion({ label, children })`
- **Description:** Keyboard-reachable scroll region (`role="region"`, `tabIndex={0}`, `aria-label`) around a data table; shared by `content-stock` and `metrics`.
- **Usage:** `<TableRegion label="Tabla de retención"><table className={dataTableClass().table}>…</table></TableRegion>`
