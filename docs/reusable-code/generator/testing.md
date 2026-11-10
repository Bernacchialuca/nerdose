# Testing utils

Vitest with `@/` alias. Integration tests need Docker (Testcontainers).

## captureLogger
- **Location:** apps/generator/test/helpers/logger.ts
- **Signature:** `captureLogger(overrides?: Partial<LoggerEnv>): { logger: Logger; lines(): Array<Record<string, unknown>> }`
- **Usage:** `const { logger, lines } = captureLogger(); startScheduler({ logger }); expect(lines()[0]).toMatchObject({ msg: 'Scheduler started' })`

## freePort / silentServer
- **Location:** apps/generator/test/helpers/net.ts
- **Signature:** `freePort(): Promise<number>`; `silentServer(): Promise<{ port: number; close(): Promise<void> }>`
- **Usage:** unreachable DB URL with `freePort()`; hung DB with `silentServer()`

## startGenerator
- **Location:** apps/generator/test/helpers/process.ts
- **Signature:** `startGenerator(env: Record<string, string>): { lines(); parsed(); waitForLog(predicate, timeoutMs = 30000); exited: Promise<number | null>; kill(signal = 'SIGTERM'): boolean; stop(signal = 'SIGTERM') }`
- **Description:** runs `node --import tsx src/index.ts` with a clean env (`PATH`, `NODE_ENV=test`, `LOG_LEVEL=info` + given vars). `kill` sends a signal without waiting (useful for double-signal tests).
- **Usage:** `const p = startGenerator({ DATABASE_URL: inject('generatorUrl') }); await p.waitForLog((l) => l.msg === 'Scheduler started'); expect(await p.stop()).toBe(0)`

## global-setup (ownerUrl / generatorUrl)
- **Location:** apps/generator/test/global-setup.ts
- **Description:** starts `postgres:16-alpine`, runs `createRoles` + `migrateAsOwner` from `@nerdose/db/testing`, provides `ownerUrl` and `generatorUrl`
- **Usage:** `import { inject } from 'vitest'; const url = inject('generatorUrl')`

## setupTestDb
- **Location:** apps/generator/test/helpers/db.ts
- **Signature:** `setupTestDb(): { owner, svc, reset(), cleanup() }`
- **Description:** owner-role and `nerdose_generator`-role connections to the shared container; `reset()` truncates every table.
- **Usage:** `const t = setupTestDb(); beforeEach(() => t.reset()); afterAll(() => t.cleanup())`

## insertTerms / BANK16
- **Location:** apps/generator/test/helpers/bank.ts
- **Signature:** `insertTerms(ownerDb, specs: TermSpec[])`; `BANK16: TermSpec[]`
- **Description:** inserts approved `terms` fixtures (`dataset_version: 'test'`); `BANK16` has 2 terms per category. `TermSpec` accepts `lastUsedDevdle` and `lastUsedGrep`.

## devdleOnlyRegistry
- **Location:** apps/generator/test/helpers/registry.ts
- **Signature:** `devdleOnlyRegistry: GeneratorRegistry`
- **Description:** registry with only Devdle, for tests that validate Devdle behavior independently of the other registered games.
- **Usage:** `registry: devdleOnlyRegistry`
- **Usage:** `await insertTerms(t.owner.db, BANK16)`

## Dataset fixtures
- **Location:** apps/generator/test/fixtures/datasets/{v1,v2,invalid,dup-rejected,conflict}
- **Description:** valid `manifest.json` + `terms.json` pairs for `sync_banks` scenarios, loadable with `loadDataset(dir)`.
- **Usage:** `loadDataset(fileURLToPath(new URL('../fixtures/datasets/v1/', import.meta.url)))`
