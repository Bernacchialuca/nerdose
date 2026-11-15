# Reusable Code Index - db

Package `@nerdose/db` (`packages/db`), entries `.` and `./testing`.

## Client (2 items) - see client.md
- **createDb** (packages/db/src/client.ts) - Creates a postgres.js connection plus Drizzle instance for a role URL
- **Db / Tx** (packages/db/src/client.ts) - Types of the Drizzle instance and of a transaction

## Schema (32 items) - see schema.md
- **players** (packages/db/src/schema/identity.ts) - Drizzle table of anonymous players (`id`, `locale`, `preferredCodeLanguage`, `userId`, `createdAt`, `lastSeenAt`)
- **localeEnum** (packages/db/src/schema/enums.ts) - PostgreSQL enum `locale`, built from `LOCALES` of `@nerdose/core`
- **codeLanguageEnum** (packages/db/src/schema/enums.ts) - PostgreSQL enum `code_language`, built from `CODE_LANGUAGES` of `@nerdose/core`
- **Player** (packages/db/src/schema/identity.ts) - Inferred select type of `players`
- **NewPlayer** (packages/db/src/schema/identity.ts) - Inferred insert type of `players`

- **gameIdEnum / termCategoryEnum** (packages/db/src/schema/enums.ts) - PostgreSQL enums `game_id` and `term_category`, built from `GAME_IDS` and `TERM_CATEGORIES` of `@nerdose/core`
- **challengeStatusEnum / playStatusEnum / bankItemStatusEnum / jobRunStatusEnum** (packages/db/src/schema/enums.ts) - Literal PostgreSQL enums `challenge_status`, `play_status`, `bank_item_status`, `job_run_status`
- **challenges** (packages/db/src/schema/publishing.ts) - Drizzle table of daily challenges (payload with solution, status lifecycle, seed); only the generator creates them
- **plays / rejectedGuesses** (packages/db/src/schema/gameplay.ts) - Drizzle tables of a player's play per challenge and of rejected Devdle words
- **playerGameStats / playerStats** (packages/db/src/schema/progress.ts) - Drizzle tables of per-game and global streak aggregates
- **terms** (packages/db/src/schema/banks.ts) - Drizzle table of the Devdle/Grep term bank (unique `term` and `wikidataId`)
- **timelineFacts / TimelineFact / NewTimelineFact** (packages/db/src/schema/banks.ts) - Drizzle table of the Tech Timeline fact bank (unique `wikidataId`, `rejected` terminal, `lastUsed` untouched by `sync_banks`)
- **timelineCategoryEnum / datePrecisionEnum** (packages/db/src/schema/enums.ts) - PostgreSQL enums `timeline_category` and `date_precision`, built from `TIMELINE_CATEGORIES` and `DATE_PRECISIONS` of `@nerdose/core`
- **challengeReports / ChallengeReport / NewChallengeReport** (packages/db/src/schema/quality.ts) - Drizzle table of player reports on a challenge (unique per player and challenge, `resolved`/`dismissed` terminal, `nerdose_api` only)
- **reportReasonEnum / reportStatusEnum** (packages/db/src/schema/enums.ts) - PostgreSQL enums `report_reason` and `report_status`, built from `REPORT_REASONS` and `REPORT_STATUSES` of `@nerdose/core`
- **generationRequests / GenerationRequest / NewGenerationRequest** (packages/db/src/schema/generation.ts) - Drizzle table of the regeneration queue (one `pending` per challenge via partial unique index, `done` needs `newChallengeId`, closed needs `processedAt`)
- **generationFailures / GenerationFailure / NewGenerationFailure** (packages/db/src/schema/generation.ts) - Drizzle table of dates where a game failed to generate (PK `(gameId, date)` for the `fill` UPSERT, `nerdose_api` read-only)
- **generationRequestStatusEnum** (packages/db/src/schema/enums.ts) - PostgreSQL enum `generation_request_status`, built from `GENERATION_REQUEST_STATUSES` of `@nerdose/core`
- **jobRuns** (packages/db/src/schema/jobs.ts) - Drizzle table of generator job executions (`fill`, `sync_banks`)
- **Challenge / NewChallenge, Play / NewPlay, RejectedGuess / NewRejectedGuess, PlayerGameStats / NewPlayerGameStats, PlayerStats / NewPlayerStats, Term / NewTerm, JobRun / NewJobRun** (packages/db/src/schema/*.ts) - Inferred select and insert types of the new tables

## Metrics views (4 items) - DB objects, raw SQL (migration `0008_metrics_views`)
No Drizzle objects exist for these views; read them with raw SQL, casting `date` to text (`date::text`) or using `mode: 'string'`. Only `nerdose_api` has `SELECT`; `nerdose_generator` has no access. No view reads the clock.
- **metrics_daily_players** (`date` date, `game_id` game_id nullable = total, `players` int4) - Distinct players with any Play per date, total and per game
- **metrics_retention** (`cohort_date` date, `cohort_size` int4, `d1_players` int4, `d7_players` int4) - Cohort by first completed Play; the `api` computes `d1`/`d7` from `d1_players`/`d7_players` and returns null when the day has not ended
- **metrics_streak_distribution** (`bucket` text, `last_active_date` date nullable, `players` int4) - Players per bucket of the stored `global_streak`; the `api` moves rows whose streak is not alive to `'0'` using `last_active_date` and `isStreakAlive` of core
- **metrics_challenge_quality** (`challenge_id` uuid, `game_id`, `date`, `number` int4, `started`/`finished`/`reports` int4, `completion_rate`/`win_rate` float8 nullable, `status`) - Per published or voided challenge; voided plays count in `started` only

## Migrations (2 items) - see client.md
- **runMigrations / MIGRATIONS_FOLDER** (packages/db/src/migrations/run-migrations.ts) - Applies the versioned migrations with the Drizzle migrator
- **syncRolePasswords** (packages/db/src/migrations/sync-role-passwords.ts) - Validates role URLs and runs `ALTER ROLE ... PASSWORD`

## Testing utils, entry `@nerdose/db/testing` (5 items) - see client.md
- **createRoles** (packages/db/src/testing/index.ts) - Creates the owner and service roles on a fresh container, returns the three URLs
- **migrateAsOwner** (packages/db/src/testing/index.ts) - Applies migrations with the owner URL
- **truncateAll** (packages/db/src/testing/index.ts) - Truncates every table in `public` restarting identities
- **makePlayer** (packages/db/src/testing/index.ts) - Seeds a player with the owner connection
- **makeChallenge** (packages/db/src/testing/index.ts) - Seeds a challenge (default `published`) with the owner connection
