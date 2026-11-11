# Import script

## runImport / InsufficientApprovedError / InsufficientTimelineFactsError
- **Location:** packages/content/scripts/import-banks/run.ts
- **Description:** Imports `terms`, `timeline` facts or both (`bank`, default `all`). Queries every class, merges by `wikidata_id`, requests `page/summary` (es, en) only for candidates passing the cheap rules, evaluates, builds the manifest and writes the three dataset files atomically. All minimums are validated before touching disk: `InsufficientApprovedError` (`approved`, `minimum`, `byCategory`) for terms and `InsufficientTimelineFactsError` for facts. With `bank: 'timeline'`, `terms.json` and the previous `manifest.json` are re-read and re-validated before any request (`DatasetError` otherwise) and the terms parameters are copied from the manifest. With `bank: 'terms'` the existing facts and `parameters.timeline` are kept. Defaults: `minSitelinks` from the previous manifest, else 10; `minSitelinksTimeline` from the previous `parameters.timeline.min_sitelinks`, else 10.
- **Signature:** `runImport(options: { dataDir; bank?; classes?; timelineClasses?; minSitelinks?; minSitelinksTimeline?; minApproved?; minApprovedPerCategory?; minCategories?; now?; client?; clientFactory?(datasetVersion); exclusionsPath?; inclusionsPath?; log? }): Promise<{ manifest; terms; timelineFacts; candidates; factCandidates; suggestedMinSitelinks: number | null; suggestedMinSitelinksTimeline: number | null }>`
- **Usage:** `pnpm --filter @nerdose/content import:banks [--bank=terms|timeline|all] [--min-sitelinks N] [--min-sitelinks-timeline N] [--cache-dir <dir>]`

## evaluateTerms and rules
- **Location:** packages/content/scripts/import-banks/rules.ts
- **Description:** Pure functions. Reason precedence: `invalid_chars`, `invalid_length`, `missing_translation`, `missing_article`, `low_sitelinks`, `excluded`, `duplicate`. `precheck` says which candidates need a summary; `highestMinSitelinks` returns the highest threshold keeping `minApproved` approved (or `null`); `parseExclusions` reads `data/exclusions.txt` (terms or `Q` ids, `#` comments). `mergeByWikidataId` is generic over any candidate with `wikidata_id`.
- **Signature:** `evaluateTerms(candidates: readonly Candidate[], { minSitelinks, exclusions }): TermItem[]`; `precheck(candidate)`; `mergeByWikidataId<T>(candidates)`; `parseExclusions(text)`; `highestMinSitelinks(candidates, { exclusions, minApproved })`

## Timeline fact rules
- **Location:** packages/content/scripts/import-banks/rules.ts
- **Description:** Pure rules of the fact importer (REQ-006). `selectStatements` picks the date statements of the class property (or its fallback, never mixed); `resolveDate` drops `deprecated` values, rejects uncertain ones (`disputed_date`), lets one `preferred` win, compares values pairwise at the lower precision, validates precision and 1800..current year (`imprecise_date`) and normalizes `event_date` without inventing month or day. `firstSentence` cuts the Wikipedia extract to its first sentence (max 240 characters). `precheckFact` says which candidates need summaries. `evaluateFacts` applies, in order: `disputed_date`, `imprecise_date`, `missing_article`, `low_sitelinks`, `missing_note`/`note_year_mismatch` (falls back to the Wikidata short description when the note mentions another year), `excluded`, `duplicate`. `highestMinSitelinksTimeline` returns the highest threshold keeping the minimum approved facts in every category (or `null`).
- **Signature:** `selectStatements(dates, cls)`; `resolveDate(dates, { currentYear }): ResolvedDate`; `firstSentence(text): string`; `precheckFact(candidate, { currentYear })`; `evaluateFacts(candidates, { minSitelinks, exclusions, currentYear }): TimelineFactItem[]`; `highestMinSitelinksTimeline(candidates, { exclusions, currentYear, minApprovedPerCategory, categories }): number | null`

## buildManifest / countTimelineFacts / buildTimelineParameters / assertTimelineMinimums / writeDataset
- **Location:** packages/content/scripts/import-banks/manifest.ts, `write.ts`
- **Description:** `buildManifest` builds the manifest with term and fact counts; `buildTimelineParameters` derives `parameters.timeline` (including `categories_v1`) from the class mapping; `assertTimelineMinimums` throws `InsufficientTimelineFactsError` (`shortfalls`, `minimum`, `categoriesV1Count`, `minCategories`, `byCategory`, `suggestedMinSitelinksTimeline`) when a v1 category has fewer approved facts than the minimum (100) or there are fewer than 3 v1 categories. `writeDataset` validates the three files with Zod, then writes `.tmp` files and renames them.
- **Signature:** `buildManifest(terms, { datasetVersion, generatedAt, minSitelinks, minApproved, classes, timelineFacts?, timeline? }): DatasetManifest`; `countTimelineFacts(facts)`; `buildTimelineParameters(classes, { minSitelinks, minApprovedPerCategory, minCategories })`; `assertTimelineMinimums(counts, { categoriesV1, minApprovedPerCategory, minCategories }): void`; `writeDataset(dataDir, { terms, timelineFacts, manifest }): void`
- **Usage:** `writeDataset(dir, { terms, timelineFacts, manifest: buildManifest(terms, opts) })`

## createWikimediaClient / buildUserAgent
- **Location:** packages/content/scripts/import-banks/http.ts
- **Description:** `getJson(url, { accept?, cacheable404? })` sends `User-Agent` on every request, pauses `delayMs` (250) between uncached requests, retries 429/5xx/network errors up to 5 times (Retry-After or 1 s x 2^n) and throws `WikimediaRequestError` when exhausted. `fetch` and `sleep` are injectable for tests.
- **Signature:** `createWikimediaClient({ userAgent, cache?, fetch?, sleep?, delayMs?, maxRetries?, baseBackoffMs? }): WikimediaClient`; `buildUserAgent(datasetVersion, contact): string`

## createFileCache / resolveCacheDir
- **Location:** packages/content/scripts/import-banks/cache.ts
- **Description:** One JSON file per URL (`<sha256(url)>.json`); `resolveCacheDir` defaults to `~/.cache/nerdose-content` and rejects directories inside the repo.
- **Signature:** `createFileCache(dir): { get(url); set(url, entry) }`; `resolveCacheDir(option: string | undefined, repoRoot: string): string`

## Wikidata and Wikipedia access
- **Location:** packages/content/scripts/import-banks/{classes,wikidata,wikipedia}.ts
- **Description:** `TERM_CLASSES` maps verified Wikidata classes to the eight `TermCategory` values (first class wins when an item appears in several). `TIMELINE_CLASSES` maps classes to timeline categories plus the date property (`P571` or `P577` with `P571` fallback); a deferred category is removed from it. `buildTimelineClassQuery`/`parseTimelineResults`/`fetchTimelineCandidates` fetch every date statement with precision, rank and uncertainty qualifiers. `buildClassQuery`/`parseClassResults`/`fetchClassCandidates` handle SPARQL; `summaryUrl`/`parseSummary`/`fetchSummary` handle `page/summary` (404, disambiguation or empty extract give `null`).

## buildManifest / countTimelineFacts / DEFAULT_TIMELINE_PARAMETERS / writeDataset
- **Location:** `packages/content/scripts/import-banks/manifest.ts`, `write.ts`
- **Description:** Bridge until the facts importer exists: `runImport` re-reads the existing `timeline_facts.json` (invalid file throws `DatasetError` before any request) and the previous `parameters.timeline`, and writes them back unchanged. `writeDataset` validates the three files with Zod, then writes `.tmp` files and renames them.
- **Signature:** `buildManifest(terms, { datasetVersion, generatedAt, minSitelinks, minApproved, classes, timelineFacts?, timeline? }): DatasetManifest`; `countTimelineFacts(facts): DatasetManifest['counts']['timeline_facts']`; `writeDataset(dataDir, { terms, timelineFacts, manifest }): void`
- **Usage:** `writeDataset(dir, { terms, timelineFacts, manifest: buildManifest(terms, opts) })`
