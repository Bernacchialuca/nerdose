# Client, migrations and testing utils

## createDb
- **Location:** packages/db/src/client.ts
- **Signature:** `createDb(url: string, options?: { max?: number }): { db: Db; sql: Sql }`
- **Usage:** `const { db, sql } = createDb(process.env.DATABASE_URL_API!)`

## runMigrations
- **Location:** packages/db/src/migrations/run-migrations.ts
- **Signature:** `runMigrations(db: Db): Promise<void>`; `MIGRATIONS_FOLDER` is the absolute path of `packages/db/migrations`

## syncRolePasswords
- **Location:** packages/db/src/migrations/sync-role-passwords.ts
- **Signature:** `syncRolePasswords(sql, { api?, generator? }): Promise<Array<'nerdose_api' | 'nerdose_generator'>>`; throws `AppError('validation_error')` on wrong user or empty password

## createRoles / migrateAsOwner / truncateAll
- **Location:** packages/db/src/testing/index.ts (`@nerdose/db/testing`)
- **Signature:** `createRoles(adminUri): Promise<{ owner; api; generator }>`, `migrateAsOwner(url): Promise<void>`, `truncateAll({ sql }): Promise<void>`
- **Usage:** call `createRoles` then `migrateAsOwner` in a Vitest `globalSetup` with a shared Testcontainers PostgreSQL 16

## makePlayer / makeChallenge
- **Location:** packages/db/src/testing/index.ts (`@nerdose/db/testing`)
- **Signature:** `makePlayer(db: Db, overrides?: Partial<NewPlayer>): Promise<Player>`; `makeChallenge(db: Db, values: Pick<NewChallenge, 'gameId' | 'date'> & Partial<NewChallenge>): Promise<Challenge>` (defaults: `published`, `number: 1`, `payload: {}`, `generatorVersion/seed: 'test'`, `attempt: 0`)
- **Usage:** `const c = await makeChallenge(ownerDb, { gameId: 'devdle', date: '2026-12-21' })`; for `voided` pass `voidReason` and `voidedAt`
