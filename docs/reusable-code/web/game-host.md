# Game host module

## clientRegistry / hasGameClient
- **Location:** apps/web/src/modules/game-host/registry.ts
- **Description:** The only place that lists games: `game_id` to a dynamic `import()` of the package `./client`. The five games have a client (Devdle, Grep Grid, Tech Timeline, Big O and Bug Hunt); it stays `Partial` for future games.
- **Signature:** `clientRegistry: Partial<Record<GameId, () => Promise<GameClient>>>`; `hasGameClient(id: GameId): boolean`
- **Usage:** `hasGameClient('bug-hunt') // true`

## loadGameClient / gameScreens / useLoadedGameClient
- **Location:** apps/web/src/modules/game-host/load-game-client.ts, lazy-game-screens.tsx, use-loaded-game-client.ts
- **Description:** `loadGameClient` memoizes the client promise and registers its i18n namespace in the app instance; `gameScreens[gameId]` is the `React.lazy` component created once per game; `useLoadedGameClient` reads the same promise with `use()` (inside `<Suspense>`).
- **Signature:** `loadGameClient(gameId: GameId): Promise<GameClient>`; `useLoadedGameClient(gameId): GameClient`
- **Usage:** `const client = useLoadedGameClient('devdle'); client.share(result, number, locale)`

## GameClient and props
- **Location:** apps/web/src/modules/game-host/types.ts
- **Description:** Structural copy of the `./client` contract of a game package: `GameClient` (`share(result, number, locale)`), `ClientBaseProps`, `InstructionsProps`, `GameProps`, `ResultProps`, `Translate`, `MoveErrorInfo`, `GameStatsView`. `GameProps.feedback` is the last `MoveResponse.feedback` (`null` until the first move; forwarded untouched, never interpreted by `web`) and `ResultProps.publicView` is `GameToday.public_view` for clients that draw the final board. `ClientBaseProps.codeLanguage: CodeLanguage` is `session.preferred_code_language ?? 'js'` (resolved by `GameScreens`, `DEFAULT_CODE_LANGUAGE`); Big O reads it when mounting the `Game`, the other clients ignore it. `MoveResponse.play` is a full `PlayView` (with `code_language`).

## gameTodayKeys / fetchGameToday / useGameToday / useStartPlay / useSubmitMove / withSessionRetry
- **Location:** apps/web/src/modules/game-host/api/
- **Description:** TanStack Query layer for `GET .../today`, `POST .../start` and `POST .../move`. `useGameToday` keeps the previous data when the locale changes; the mutations write the response into the cache and `useSubmitMove` copies `res.play` (with `code_language`) into the `GameToday` cache, calls `useSession().rememberCodeLanguage` when `code_language` is not null (no `PATCH`) and invalidates `todayKeys.all` only when the move closed the game. `withSessionRetry` recreates the session once on `no_session`.
- **Signature:** `useGameToday(gameId, { enabled? })`; `useStartPlay(gameId).mutate({ challengeNumber })`; `useSubmitMove(gameId).mutate({ challengeNumber, move })`; `withSessionRetry<T>(fn: () => Promise<T>): Promise<T>`
- **Usage:** `const query = useGameToday('devdle', { enabled: hasGameClient('devdle') })`

## deriveGameView / toMoveError
- **Location:** apps/web/src/modules/game-host/game-view.ts
- **Description:** Pure function that picks the screen (`noClient | loading | loadError | noChallenge | voided | voidedResult | instructions | playing | result`; `result` also carries `publicView`) from the query, session status and ephemeral state. `toMoveError` maps inline move errors (memoized by error identity).
- **Signature:** `deriveGameView({ hasClient, query, sessionStatus, dayChanged, voidedDuringPlay, actionError }): GameView`

## GameHostHeader
- **Location:** apps/web/src/modules/game-host/components/game-host-header.tsx
- **Description:** `GameHeader` of the game screens (help, stats, share, language, global streak). Mounted by the `Shell` through the route `handle`.
- **Signature:** `GameHostHeader({ gameId })`

## ShareButton / ClientShareButton
- **Location:** apps/web/src/modules/game-host/components/share-button.tsx
- **Description:** Web Share API with clipboard fallback, `✓ Copiado` for 3 s (`role="status"`) and `track('share:<game_id>')` only after success; `AbortError` is ignored. The text always comes from the game's `share()`.
- **Signature:** `ShareButton({ gameId, getText, variant: 'body' | 'header' })`; `ClientShareButton({ gameId, result, number, locale, variant })`; `GameHostHeader` passes `useSession().locale` and the text is built on click, so it follows the active language (only Bug Hunt's share has words; the others ignore the third argument)

## ResultExits / Confetti
- **Location:** apps/web/src/modules/game-host/components/{result-exits,confetti}.tsx
- **Signature:** `ResultExits({ gameId, gameStats? })` — card de cierre del resultado: rachas en una línea (juego, global, récord) con link a estadísticas, y debajo la cuenta regresiva que recarga el día y el juego, «Siguiente juego» y «Volver». Va en el slot `footer` del client (el `aside` lleva el `ReportLink`). `Confetti({ gameId })` — festejo decorativo con el color del juego; `GameRoute` lo monta solo si la jugada recién enviada cerró la partida ganando (`submitMove.data.play.status === 'won'`).

## ShellHandle / focusMainHeading
- **Location:** apps/web/src/lib/route-handle.ts, focus-main-heading.ts
- **Description:** `ShellHandle` lets a route provide its own header to the `Shell` without `app/` importing modules; `focusMainHeading()` focuses `main h1` (adds `tabindex="-1"`).
- **Usage:** `export const handle: ShellHandle = { header: (params) => <MyHeader /> }`

## env / parseEnv / initAnalytics
- **Location:** apps/web/src/lib/env.ts, analytics.ts
- **Description:** Zod-validated `VITE_PLAUSIBLE_*` (script URL required when there is a domain); `initAnalytics()` calls `injectAnalytics` once from `main.tsx`.
- **Signature:** `parseEnv(raw: Record<string, unknown>): Env`; `initAnalytics(e?: Env): void`

## gameHandlersFor / grepGridHandlers / timelineHandlers / bigOHandlers / bugHuntHandlers / game fixtures / game-route-helpers / buildWeb (tests)
- **Location:** apps/web/src/test/msw.ts, apps/web/src/test/fixtures/grep-grid-today.ts, apps/web/src/test/fixtures/timeline-today.ts, apps/web/src/test/fixtures/big-o-today.ts, apps/web/src/test/fixtures/bug-hunt-today.ts, apps/web/src/test/vite-build.ts, apps/web/src/test/dnd-rects.ts, apps/web/src/test/game-route-helpers.ts
- **Description:** `gameHandlersFor(gameId)` builds the MSW `today` / `start` / `move` handlers of one game (`gameHandlers` = Devdle, `grepGridHandlers` = Grep Grid, `timelineHandlers` = Tech Timeline, `bigOHandlers` = Big O, `bugHuntHandlers` = Bug Hunt). The Bug Hunt fixtures (`bug-hunt-today.ts`: `bhResult`, `bhMove`, `bugHuntInProgress`, `bugHuntWonJava`, `bugHuntLostGo`, `todayWithBugHunt`, ...) follow the same shape. The Big O fixtures (`big-o-today.ts`: `boResult`, `boMove`, `bigOInProgress`, `bigOWonJava`, `bigOLostGo`, `todayWithBigO`, ...) follow the same shape. `buildWeb()` (`vite-build.ts`) runs one in-memory Vite build per test file and `compiledCss()` joins its CSS assets (CSS and chunk guards in `styles.test.ts`). The Grep Grid fixtures are the API payloads in `snake_case` (grid, words, played states, results, moves, `todayWithGrepGrid`); the Timeline fixtures (`timeline-today.ts`) follow the same shape (`tlResult`, `timelineInProgress`, `timelineLost3`, `todayWithTimeline`, ...). `stubSortableRects()` (`dnd-rects.ts`) gives `<li>` children of an `<ol>` measurable rects in jsdom so dnd-kit's keyboard sensor works; it returns a `restore()` function. `game-route-helpers` shares `recordCalls`, `countOf`, `errorResponse`, `settle`, `setShare` and `h1` between the route suites.
- **Usage:** `server.use(grepGridHandlers.today(grepGridInProgress3), grepGridHandlers.move(ggMoveDocker))`

## useReport / useAcknowledgeVoid
- **Location:** apps/web/src/modules/game-host/api/use-report.ts, use-acknowledge-void.ts
- **Description:** `useReport` posts `/today/report` (omits an empty `message`, invalidates `['game-today', gameId]` on success and on `already_reported`); `useAcknowledgeVoid` posts `/today/acknowledge-void` and its `onSuccess` returns the invalidation of `today` and `game-today`, so the mutation stays pending until the new `GameToday` arrives. Both use `withSessionRetry`.
- **Signature:** `useReport(gameId).mutate({ challengeNumber, reason, message })`; `useAcknowledgeVoid(gameId).mutate({ challengeNumber })`

## ReportDialog / ReportLink
- **Location:** apps/web/src/modules/game-host/components/report-dialog.tsx, report-link.tsx
- **Description:** O-01 inside `Dialog variant="sheet"` from `@nerdose/ui` (described by the spoiler notice via `describedBy` when `from === 'game'`; select + textarea with counter, success / already-reported phases, system and rate-limit alerts). `GameRoute` mounts it outside the view `switch` with a snapshot of the challenge number. `ReportLink` is the trigger; `reported` makes it `aria-disabled`.
- **Signature:** `ReportDialog({ gameId, number, from: 'game' | 'result', onClose(reported) })`; `ReportLink({ reported, onOpen })`

## VoidedNoticeDialog
- **Location:** apps/web/src/modules/game-host/components/voided-notice-dialog.tsx
- **Description:** O-02 `alertdialog` (`variant="modal"`, described by its text via `describedBy`); `challenge_expired` calls `onExpired`, `not_voided` / `no_challenge_today` call `onStale`, any other error shows an inline alert.
- **Signature:** `VoidedNoticeDialog({ gameId, number, onClose, onExpired, onStale })`
