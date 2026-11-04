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
