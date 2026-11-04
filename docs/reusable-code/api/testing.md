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
