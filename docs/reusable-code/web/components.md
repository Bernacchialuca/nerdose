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
- **Signature:** `NotFound()` - element of the `*` route; renders `ErrorTerminal` with `cd <pathname>` and the bash "no such file" line

## ErrorTerminal
- **Location:** apps/web/src/components/error-terminal.tsx
- **Signature:** `ErrorTerminal({ command, output, exitCode, title, titleRef?, message, actions, className? })`
- **Description:** terminal-window error screen (title bar, decorative `aria-hidden` transcript `$ command` / red output / `exit N▌`, then `h1`, message and actions). Shared by `NotFound` and `RouteError` (REQ-012/S-060).
- **Usage:** `<ErrorTerminal command="nerdose --play" output={t('errors.terminalOutput')} exitCode={1} title={t('errors.title')} message={t('errors.message')} actions={<button …/>} />`

## RouteError
- **Location:** apps/web/src/app/route-error.tsx
- **Signature:** `RouteError()` - `errorElement` of the root route; own minimal header (brand only) and `SiteFooter`, «Reintentar» (`location.reload()`) and «Volver a los juegos» (`<a href="/">`); the real error text only in `vite dev`

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
