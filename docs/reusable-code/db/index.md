# Reusable Code Index - db

Package `@nerdose/db` (`packages/db`), entries `.` and `./testing`.

## Client (2 items) - see client.md
- **createDb** (packages/db/src/client.ts) - Creates a postgres.js connection plus Drizzle instance for a role URL
- **Db / Tx** (packages/db/src/client.ts) - Types of the Drizzle instance and of a transaction

## Schema (5 items) - see schema.md
- **players** (packages/db/src/schema/identity.ts) - Drizzle table of anonymous players (`id`, `locale`, `preferredCodeLanguage`, `userId`, `createdAt`, `lastSeenAt`)
- **localeEnum** (packages/db/src/schema/enums.ts) - PostgreSQL enum `locale`, built from `LOCALES` of `@nerdose/core`
- **codeLanguageEnum** (packages/db/src/schema/enums.ts) - PostgreSQL enum `code_language`, built from `CODE_LANGUAGES` of `@nerdose/core`
- **Player** (packages/db/src/schema/identity.ts) - Inferred select type of `players`
- **NewPlayer** (packages/db/src/schema/identity.ts) - Inferred insert type of `players`

## Migrations (2 items) - see client.md
- **runMigrations / MIGRATIONS_FOLDER** (packages/db/src/migrations/run-migrations.ts) - Applies the versioned migrations with the Drizzle migrator
- **syncRolePasswords** (packages/db/src/migrations/sync-role-passwords.ts) - Validates role URLs and runs `ALTER ROLE ... PASSWORD`

## Testing utils, entry `@nerdose/db/testing` (3 items) - see client.md
- **createRoles** (packages/db/src/testing/index.ts) - Creates the owner and service roles on a fresh container, returns the three URLs
- **migrateAsOwner** (packages/db/src/testing/index.ts) - Applies migrations with the owner URL
- **truncateAll** (packages/db/src/testing/index.ts) - Truncates every table in `public` restarting identities
