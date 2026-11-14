# Domain

## generatorRegistry / createGeneratorRegistry / GeneratorEntry
- **Location:** apps/generator/src/games/registry.ts
- **Signature:** `createGeneratorRegistry(entries: GeneratorEntry[])` -> `{ ids(), get(id) }`; `GeneratorEntry = { gameId, generator, payloadSchema, version }`
- **Description:** `get` throws `AppError('not_found')` for unknown games; duplicate or unknown ids throw `Error`. `generatorRegistry` holds Devdle (`devdle@1`), Grep Grid (`grep-grid@1`) and Timeline (`timeline@1`).
- **Usage:** `generatorRegistry.get('devdle').generator.generate({ date, seed, history })`

## seedFor / seedToHex
- **Location:** apps/generator/src/domain/challenge-publishing/seed.ts
- **Signature:** `seedFor(secret, gameId, date, attempt): Uint8Array`; `seedToHex(seed): string`
- **Description:** `HMAC-SHA256(secret, "{game_id}:{date}:{attempt}")`, 32 bytes; hex is stored in `challenges.seed`.
- **Usage:** `seedToHex(seedFor(env.GENERATOR_SECRET, 'devdle', '2026-12-02', 0))`

## historyWindow
- **Location:** apps/generator/src/domain/challenge-publishing/generate.ts
- **Signature:** `historyWindow(date: string, spec: HistorySpec): { from: string; to: string; exclude: string }`
- **Description:** pure; `from = D - recentDays`, `to = D + (aheadDays ?? 0)`, `exclude = D`. Without `aheadDays` it equals `[D - recentDays, D - 1]`. Excluding D keeps the old approved row of D from counting against its replacement.
- **Usage:** `historyWindow('2027-01-10', { ..., recentDays: 30, aheadDays: 30 }) // { from: '2026-12-11', to: '2027-02-09', exclude: '2027-01-10' }`

## generateForDate
- **Location:** apps/generator/src/domain/challenge-publishing/generate.ts
- **Signature:** `generateForDate({ entry, date, firstAttempt = 0, mode = 'fill' }, { repo, env, log, signal }): Promise<{ outcome: 'approved' | 'verified' | 'covered' | 'missing' | 'aborted'; generated; approved; rejected; lastReason: string | null; candidate?: VerifiedCandidate }>`
- **Description:** builds the history once (`[D - recentDays, D + (historySpec.aheadDays ?? 0)]` without the row of D, `status IN ('approved','published','voided')`), then per attempt: generate, insert draft, `await` verify (sync or async generators), approve (with `last_used_*` in one transaction) or reject. A unique-index collision on approve yields `covered`. Attempts run from `firstAttempt` to `firstAttempt + GENERATION_MAX_ATTEMPTS - 1`. In `'regenerate'` mode a verified candidate is NOT approved: it stays `draft` and is returned as `outcome: 'verified'` with `candidate = { id, verification, itemIds, bank, lastUsedField }`. `lastReason` is the last rejection `verification.reason`. Exhausted attempts log `ChallengeGenerationFailed` only in `'fill'` mode.
- **Usage:** `await generateForDate({ entry: registry.get('devdle'), date, firstAttempt: 5, mode: 'regenerate' }, deps)`

## fillRange / runFill
- **Location:** apps/generator/src/domain/challenge-publishing/fill.service.ts
- **Signature:** `fillRange(now, launchDate): string[]`; `runFill({ now, log, signal }, { db, env, registry, repo? }): Promise<{ summary: { generated, approved, rejected, missing }; failed: boolean }>`
- **Description:** range is `[max(today+1, LAUNCH_DATE), today+14]`; fills uncovered dates ascending; a gap error is logged and marks `failed` without stopping the rest. When `today+1` ends `missing` it UPSERTs `generation_failures` (`attempts = GENERATION_MAX_ATTEMPTS`, `last_reason`); rows are never deleted.
- **Usage:** `fillRange(new Date(), env.LAUNCH_DATE)`

## ChallengePublishingRepository
- **Location:** apps/generator/src/domain/challenge-publishing/challenge-publishing.repository.ts
- **Signature:** `coveredDates`, `bankItems(spec)` (per bank: `terms` rows, or `TimelineFact` shape with snake_case keys for `timeline_facts`), `recentChallenges(gameId, from, to, payloadSchema, excludeDate?)`, `insertDraft`, `approve(id, log, { bank, lastUsedField, itemIds, date }): 'approved' | 'duplicate'`, `reject(id, log)`, `maxAttempt(gameId, date): number | null`, `upsertGenerationFailure({ gameId, date, attempts, lastReason })`, queue methods `takePendingRequest()` (`FOR UPDATE SKIP LOCKED`), `findChallenge(id)`, `lockChallenge(id)` (`FOR UPDATE`), `finishRequest(id, { status: 'failed' | 'cancelled', error? })`, `replaceChallenge({ requestId, oldId, candidate, date })` and `cancelCandidate(requestId, candidate)`. The constructor takes `Db | Tx`.
- **Description:** The `BANKS` map (`terms` -> `last_used_devdle`/`last_used_grep`; `timeline_facts` -> `last_used`) is the only source of allowed `(bank, lastUsedField)` pairs; others throw `Unknown last_used field` before any write. `bank: null` approves without touching any bank. `approve` writes `last_used_* = GREATEST(last_used_*, date)` only in the spec's bank table, in the same transaction as `status = 'approved'`; it turns `uq_challenges_active_game_date` collisions into a `rejected` row with `reason: 'duplicate_active'`.
- **Usage:** `new ChallengePublishingRepository(db).coveredDates('devdle', from, to)`

## processNextRequest
- **Location:** apps/generator/src/domain/challenge-publishing/queue/process-request.ts
- **Signature:** `processNextRequest({ db, env, registry, clock, log, signal, repoFactory? }): Promise<'idle' | 'done' | 'failed' | 'cancelled' | 'aborted' | 'error'>`
- **Description:** takes one pending `generation_requests` row inside Tx A (`SKIP LOCKED`), cancels it if the old challenge is not `approved` or its date arrived, generates candidates in `'regenerate'` mode on the pool (each commits on its own), and replaces old -> new atomically (old `rejected`/`regenerated`, new `approved`, request `done`). No verified candidate -> `failed` with `error`; a DB error in the replacement rolls back, returns `'error'` and leaves the request `pending`. Never throws.
- **Usage:** `const result = await processNextRequest({ db, env, registry, clock, log, signal })`

## startQueueListener / QueueListener
- **Location:** apps/generator/src/domain/challenge-publishing/queue/queue-listener.ts
- **Signature:** `startQueueListener({ sql, db, env, registry, clock, logger, signal, tracker?, pollMs = 60_000 }): Promise<{ stop(): Promise<void> }>`
- **Description:** `LISTEN generation_requests` on a dedicated connection, 60 s backup poll and a drain at startup. The drain is single-flight and loops `processNextRequest` while it returns `done | failed | cancelled`. `stop()` clears the poll, unlistens and waits for the running drain.
- **Usage:** `const queue = await startQueueListener(deps); await queue.stop()`

## syncBanks
- **Location:** apps/generator/src/domain/content-banks/sync-banks.service.ts
- **Signature:** `syncBanks({ db, log, loadDataset? }): Promise<SyncBanksSummary>` where `SyncBanksSummary = BankCounts & { dataset_version, by_bank: { terms: BankCounts; timeline_facts: BankCounts } }` and `BankCounts = { inserted, updated, unchanged, kept_rejected, skipped }`; also exports pure `sameFactContent(row, item)` and `isStorableDate(value)`
- **Description:** classifies `terms` (approved first) and then `timeline_facts` in memory inside one transaction and writes only what changes. Never deletes, never touches `rejected` rows or `last_used_*`.
- **Usage:** `await syncBanks({ db, log })`

## ContentBanksRepository
- **Location:** apps/generator/src/domain/content-banks/content-banks.repository.ts
- **Signature:** `listTerms()`; `upsertTerm(item, datasetVersion, mode: 'approved' | 'to_rejected' | 'insert_rejected')`; `listTimelineFacts(): TimelineFactRow[]`; `upsertTimelineFact(item: TimelineFactItem, datasetVersion, mode)`
- **Description:** `INSERT ... ON CONFLICT (wikidata_id) DO UPDATE ... WHERE terms.status <> 'rejected'`; same rule for `timeline_facts` (never writes `last_used`).
- **Usage:** `await repo.upsertTerm(item, '2026.12.01', 'approved')`
