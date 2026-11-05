# Components, hooks and test helpers

## MainNav
- **Location:** apps/web/src/components/main-nav.tsx
- **Signature:** `MainNav({ className?: string })`
- **Usage:** `{isDesktop ? <MainNav /> : null}`

## SiteFooter
- **Location:** apps/web/src/components/site-footer.tsx
- **Signature:** `SiteFooter()`

## CTA classes (Button del DS)
- **Location:** apps/web/src/components/cta.ts
- **Signature:** `CTA_PRIMARY`, `CTA_SECONDARY`, `CTA_DISABLED`, `FOCUS` (Tailwind class strings)
- **Usage:** `<Link to="/" className={`${CTA_PRIMARY} w-full lg:w-auto`}>`; disabled CTA is a `<button aria-disabled="true" className={CTA_DISABLED}>`. Spec: docs/design-system/web/components/button.md

## NotFound
- **Location:** apps/web/src/app/not-found.tsx
- **Signature:** `NotFound()` - element of the `*` route

## useMediaQuery / DESKTOP_MEDIA_QUERY
- **Location:** apps/web/src/hooks/use-media-query.ts, apps/web/src/lib/breakpoints.ts
- **Signature:** `useMediaQuery(query: string): boolean`; `DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'`
- **Usage:** `const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);`

## useDocumentTitle
- **Location:** apps/web/src/hooks/use-document-title.ts
- **Signature:** `useDocumentTitle(title: string): void`

## MSW server, fixtures, mockViewport
- **Location:** apps/web/src/test/msw.ts, fixtures/, viewport.ts
- **Usage:** `server.use(http.get('/api/today', () => HttpResponse.json(todayNoSessionFixture)))`; `mockViewport('desktop')`; `renderWithProviders({ route, strict? })`
