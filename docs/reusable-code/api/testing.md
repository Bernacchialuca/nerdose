# Testing utils

Vitest with `@/` alias. Integration tests need Docker (Testcontainers).

## captureLogger
- **Location:** apps/api/test/helpers/logger.ts
- **Signature:** `captureLogger(overrides?: Partial<LoggerEnv>): { logger: Logger; lines(): Array<Record<string, unknown>> }`
- **Usage:** `const { logger, lines } = captureLogger(); ...; expect(lines()).toContainEqual(expect.objectContaining({ msg: 'Application error' }))`

## freePort / silentServer
- **Location:** apps/api/test/helpers/net.ts
- **Signature:** `freePort(): Promise<number>`; `silentServer(): Promise<{ port: number; close(): Promise<void> }>`
- **Usage:** `DATABASE_URL: \`postgres://u:p@127.0.0.1:${await freePort()}/x\`` for "DB down"; `silentServer()` for "DB hangs" (timeout paths)

## startApi
- **Location:** apps/api/test/helpers/process.ts
- **Signature:** `startApi(env: Record<string, string>): { lines(); parsed(); waitForLog(predicate, timeoutMs = 30000); exited: Promise<number | null>; stop(signal = 'SIGTERM') }`
- **Description:** runs `node --import tsx src/index.ts` with a clean env (`PATH`, `NODE_ENV=test`, `LOG_LEVEL=info` + given vars), collects stdout JSON lines
- **Usage:** `const p = startApi({ PORT: String(port), DATABASE_URL: inject('apiUrl') }); await p.waitForLog((l) => l.msg === 'Server started'); expect(await p.stop()).toBe(0)`

## global-setup (ownerUrl / apiUrl)
- **Location:** apps/api/test/global-setup.ts
- **Description:** starts `postgres:16-alpine`, runs `createRoles` + `migrateAsOwner` from `@nerdose/db/testing`, provides `ownerUrl` and `apiUrl`
- **Usage:** `import { inject } from 'vitest'; const url = inject('apiUrl')`

## buildTestApp / TEST_CONFIG / MUTATION_HEADERS / TEST_ENV / stubIdentity
- **Location:** apps/api/test/helpers/app.ts
- **Signature:** `buildTestApp({ logger?, health?, identity?, config? }): { app, lines }`
- **Usage:** `app.request('/api/session', { method: 'POST', headers: MUTATION_HEADERS, body: '{}' })`; `TEST_ENV` for `startApi`

## useDatabases / parseSetCookie / COOKIE_ATTRS
- **Location:** apps/api/test/helpers/db.ts
- **Signature:** `useDatabases(): { owner, api, identity(), reset(), close(), insertPlayer(values?) }`
- **Usage:** `const dbs = useDatabases(); beforeAll(dbs.reset); afterAll(dbs.close)`

## GG_PAYLOAD / GG_ID / cellsOf / selectWord / found / SEVEN / INITIAL_EXTRA / seedGrepGrid / seedGrepGridPlay
- **Location:** apps/api/test/helpers/grep-grid.ts
- **Signature:** `GG_PAYLOAD: GrepGridPayload`; `cellsOf(w)`, `selectWord(w)`, `found(...words): GrepGridState`; `seedGrepGrid(dbs, opts?)`, `seedGrepGridPlay(dbs, challengeId, playerId, state, extra?)`; `ggGet/ggPost/ggMove(app, ..., player?, query?)`
- **Description:** fixed Grep Grid fixture for 2026-12-01 (challenge number 8), copied from the S-022 package fixtures (which the package does not export); `SEVEN` = all words except `PYTHON`, so the eighth word is always the same
- **Usage:** `const c = await seedGrepGrid(dbs); await seedGrepGridPlay(dbs, c.id, player.id, found(...SEVEN)); await ggMove(app, selectWord('PYTHON'), player)`

## TL_PAYLOAD / TL_ID / TL_OID / CORRECT / SWAP / REVERSED / ROTATED / TL_PUBLIC_ES / TL_PUBLIC_EN / tlChrono / tlResult / TL_FORBIDDEN / seedTimeline / seedTimelinePlay / tlGet / tlPost / tlMove
- **Location:** apps/api/test/helpers/timeline.ts
- **Signature:** `TL_PAYLOAD: TimelinePayload`; orders `CORRECT` (5/5), `SWAP` (3/5), `REVERSED` (1/5), `ROTATED` (0/5); `tlChrono(locale)`, `tlResult(order, locale)`; `seedTimeline(dbs, opts?)`, `seedTimelinePlay(dbs, challengeId, playerId, state, extra?)`; `tlGet/tlPost/tlMove(app, ..., player?, query?)`
- **Description:** fixed Tech Timeline fixture for 2026-12-01 (challenge number 8), copied from the S-027 package fixtures (not exported by the package); `TL_FORBIDDEN` lists the keys and values that must never appear in a response or log before the Play closes
- **Usage:** `const c = await seedTimeline(dbs); await seedTimelinePlay(dbs, c.id, player.id, {}); await tlMove(app, SWAP, player)`
