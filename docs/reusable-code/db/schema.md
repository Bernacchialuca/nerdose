# Schema

## players / Player / NewPlayer
- **Location:** packages/db/src/schema/identity.ts
- **Signature:** `players = pgTable('players', ...)`; `type Player = typeof players.$inferSelect`; `type NewPlayer = typeof players.$inferInsert`
- **Usage:** `await db.insert(players).values({ locale: 'en' }).returning()`; `nerdose_api` has SELECT, INSERT and UPDATE only

## localeEnum / codeLanguageEnum
- **Location:** packages/db/src/schema/enums.ts
- **Signature:** `localeEnum = pgEnum('locale', LOCALES)`; `codeLanguageEnum = pgEnum('code_language', CODE_LANGUAGES)`
- **Usage:** `localeEnum('locale').notNull().default('es')` when declaring a column that holds a locale

## gameIdEnum / termCategoryEnum / challengeStatusEnum / playStatusEnum / bankItemStatusEnum / jobRunStatusEnum
- **Location:** packages/db/src/schema/enums.ts
- **Signature:** `gameIdEnum = pgEnum('game_id', GAME_IDS)`; `termCategoryEnum = pgEnum('term_category', TERM_CATEGORIES)`; the other four are literal tuples
- **Usage:** `playStatusEnum('status').notNull().default('in_progress')`

## challenges / Challenge / NewChallenge
- **Location:** packages/db/src/schema/publishing.ts
- **Signature:** `challenges = pgTable('challenges', ...)`; `date` is a `YYYY-MM-DD` string; unique partial index on `(gameId, date)` for `approved|published|voided`
- **Usage:** `await generatorDb.insert(challenges).values({ gameId: 'devdle', date, number, payload, generatorVersion, seed, attempt }).returning()`; `nerdose_api` can only update `status`, `voidReason`, `voidedAt`, `alertSentAt`

## plays / rejectedGuesses (Play, NewPlay, RejectedGuess, NewRejectedGuess)
- **Location:** packages/db/src/schema/gameplay.ts
- **Signature:** `plays` unique on `(playerId, challengeId)`; `rejectedGuesses` PK `(word, playerId)`
- **Usage:** `await apiDb.insert(plays).values({ playerId, challengeId, gameId, date, state }).onConflictDoNothing()`

## playerGameStats / playerStats (PlayerGameStats, NewPlayerGameStats, PlayerStats, NewPlayerStats)
- **Location:** packages/db/src/schema/progress.ts
- **Signature:** PK `(playerId, gameId)` and `playerId` respectively; `extra` is `jsonb` parsed by the game package
- **Usage:** `insert(playerGameStats).values(...).onConflictDoUpdate({ target: [playerGameStats.playerId, playerGameStats.gameId], set })`

## terms / Term / NewTerm
- **Location:** packages/db/src/schema/banks.ts
- **Signature:** `terms = pgTable('terms', ...)`; `wikidataId` is the upsert key of `sync_banks`; `rejected` is terminal (trigger)
- **Usage:** `insert(terms).values(...).onConflictDoUpdate({ target: terms.wikidataId, set })`

## jobRuns / JobRun / NewJobRun
- **Location:** packages/db/src/schema/jobs.ts
- **Signature:** `jobRuns = pgTable('job_runs', ...)`; `summary` is `jsonb`
- **Usage:** `insert(jobRuns).values({ job: 'fill' }).returning()` (generator); `nerdose_api` only reads
