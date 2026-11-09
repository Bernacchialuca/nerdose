# Components, hooks and test helpers

## MainNav
- **Location:** apps/web/src/components/main-nav.tsx
- **Signature:** `MainNav({ className?: string })`
- **Usage:** `<AppHeader nav={<MainNav />} … />` (single nav, styled with `navItemClass`)

## SiteFooter
- **Location:** apps/web/src/components/site-footer.tsx
- **Signature:** `SiteFooter()` - tagline + `exit 0`, privacy notice, `Acerca de →` link

## NotFound
- **Location:** apps/web/src/components/not-found.tsx
- **Signature:** `NotFound()` - element of the `*` route

## useDocumentTitle
- **Location:** apps/web/src/hooks/use-document-title.ts
- **Signature:** `useDocumentTitle(title: string): void`

## MSW server, fixtures
- **Location:** apps/web/src/test/msw.ts, fixtures/
- **Usage:** `server.use(http.get('/api/today', () => HttpResponse.json(todayNoSessionFixture)))`; `server.use(gameHandlers.today(gameTodayWon))` for the game endpoints (fixtures in fixtures/game-today.ts); `renderWithProviders({ route, strict? })`

## fontOf
- **Location:** apps/web/src/test/font-family.ts
- **Signature:** `fontOf(el: Element | null): 'mono' | 'sans' | null`
- **Usage:** `expect(fontOf(screen.getByRole('heading', { level: 1 }))).toBe('mono');` (jsdom runs with `css: false`, so inheritance is checked through classes)
