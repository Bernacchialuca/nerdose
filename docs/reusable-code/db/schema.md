# Schema

## players / Player / NewPlayer
- **Location:** packages/db/src/schema/identity.ts
- **Signature:** `players = pgTable('players', ...)`; `type Player = typeof players.$inferSelect`; `type NewPlayer = typeof players.$inferInsert`
- **Usage:** `await db.insert(players).values({ locale: 'en' }).returning()`; `nerdose_api` has SELECT, INSERT and UPDATE only

## localeEnum / codeLanguageEnum
- **Location:** packages/db/src/schema/enums.ts
- **Signature:** `localeEnum = pgEnum('locale', LOCALES)`; `codeLanguageEnum = pgEnum('code_language', CODE_LANGUAGES)`
- **Usage:** `localeEnum('locale').notNull().default('es')` when declaring a column that holds a locale
