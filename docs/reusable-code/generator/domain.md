# Domain

## generatorRegistry / createGeneratorRegistry / GeneratorEntry
- **Location:** apps/generator/src/games/registry.ts
- **Signature:** `createGeneratorRegistry(entries: GeneratorEntry[])` -> `{ ids(), get(id) }`; `GeneratorEntry = { gameId, generator, payloadSchema, version }`
- **Description:** `get` throws `AppError('not_found')` for unknown games; duplicate or unknown ids throw `Error`. `generatorRegistry` holds Devdle (`devdle@1`) and Grep Grid (`grep-grid@1`).
- **Usage:** `generatorRegistry.get('devdle').generator.generate({ date, seed, history })`

## seedFor / seedToHex
- **Location:** apps/generator/src/domain/challenge-publishing/seed.ts
- **Signature:** `seedFor(secret, gameId, date, attempt): Uint8Array`; `seedToHex(seed): string`
- **Description:** `HMAC-SHA256(secret, "{game_id}:{date}:{attempt}")`, 32 bytes; hex is stored in `challenges.seed`.
- **Usage:** `seedToHex(seedFor(env.GENERATOR_SECRET, 'devdle', '2026-12-02', 0))`

## generateForDate
- **Location:** apps/generator/src/domain/challenge-publishing/generate.ts
- **Signature:** `generateForDate({ entry, date }, { repo, env, log, signal }): Promise<{ outcome: 'approved' | 'covered' | 'missing' | 'aborted'; generated; approved; rejected }>`
- **Description:** builds the history once, then per attempt: generate, insert draft, verify, approve (with `last_used_*` in one transaction) or reject. A unique-index collision on approve yields `covered`. Exhausted attempts log `ChallengeGenerationFailed`.
- **Usage:** `await generateForDate({ entry: registry.get('devdle'), date }, deps)`

## fillRange / runFill
- **Location:** apps/generator/src/domain/challenge-publishing/fill.service.ts
- **Signature:** `fillRange(now, launchDate): string[]`; `runFill({ now, log, signal }, { db, env, registry, repo? }): Promise<{ summary: { generated, approved, rejected, missing }; failed: boolean }>`
- **Description:** range is `[max(today+1, LAUNCH_DATE), today+14]`; fills uncovered dates ascending; a gap error is logged and marks `failed` without stopping the rest.
- **Usage:** `fillRange(new Date(), env.LAUNCH_DATE)`

## ChallengePublishingRepository
- **Location:** apps/generator/src/domain/challenge-publishing/challenge-publishing.repository.ts
- **Signature:** `coveredDates`, `bankItems(spec)`, `recentChallenges(gameId, from, to, payloadSchema)`, `insertDraft`, `approve(id, log, { lastUsedField, itemIds, date }): 'approved' | 'duplicate'`, `reject(id, log)`
- **Description:** `lastUsedField` is mapped through a closed table; `approve` writes `last_used_* = GREATEST(last_used_*, date)` in the same transaction as `status = 'approved'`; it turns `uq_challenges_active_game_date` collisions into a `rejected` row with `reason: 'duplicate_active'`.
- **Usage:** `new ChallengePublishingRepository(db).coveredDates('devdle', from, to)`

## syncBanks
- **Location:** apps/generator/src/domain/content-banks/sync-banks.service.ts
- **Signature:** `syncBanks({ db, log, loadDataset? }): Promise<{ dataset_version, inserted, updated, unchanged, kept_rejected, skipped }>`
- **Description:** classifies dataset items in memory inside one transaction (approved first) and writes only what changes. Never deletes, never touches `rejected` rows or `last_used_*`.
- **Usage:** `await syncBanks({ db, log })`

## ContentBanksRepository
- **Location:** apps/generator/src/domain/content-banks/content-banks.repository.ts
- **Signature:** `listTerms()`; `upsertTerm(item, datasetVersion, mode: 'approved' | 'to_rejected' | 'insert_rejected')`
- **Description:** `INSERT ... ON CONFLICT (wikidata_id) DO UPDATE ... WHERE terms.status <> 'rejected'`.
- **Usage:** `await repo.upsertTerm(item, '2026.12.01', 'approved')`
