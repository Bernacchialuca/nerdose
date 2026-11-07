# Import script

## runImport / InsufficientApprovedError
- **Location:** packages/content/scripts/import-banks/run.ts
- **Description:** Queries every class, merges by `wikidata_id`, requests `page/summary` (es, en) only for candidates passing the cheap rules, evaluates, builds the manifest and writes `terms.json` and `manifest.json` atomically. Throws `InsufficientApprovedError` (`approved`, `minimum`, `byCategory`) before touching disk when approved terms are below `minApproved`. Default `minSitelinks`: previous manifest, else `DEFAULT_MIN_SITELINKS` (10).
- **Signature:** `runImport(options: { dataDir; classes?; minSitelinks?; minApproved?; now?; client?; clientFactory?(datasetVersion); exclusionsPath?; log? }): Promise<{ manifest; terms; suggestedMinSitelinks: number | null }>`
- **Usage:** `pnpm --filter @nerdose/content import:banks [--min-sitelinks N] [--cache-dir <dir>]`

## evaluateTerms and rules
- **Location:** packages/content/scripts/import-banks/rules.ts
- **Description:** Pure functions. Reason precedence: `invalid_chars`, `invalid_length`, `missing_translation`, `missing_article`, `low_sitelinks`, `excluded`, `duplicate`. `precheck` says which candidates need a summary; `highestMinSitelinks` returns the highest threshold keeping `minApproved` approved (or `null`); `parseExclusions` reads `data/exclusions.txt` (terms or `Q` ids, `#` comments).
- **Signature:** `evaluateTerms(candidates: readonly Candidate[], { minSitelinks, exclusions }): TermItem[]`; `precheck(candidate)`; `mergeByWikidataId(candidates)`; `parseExclusions(text)`; `highestMinSitelinks(candidates, { exclusions, minApproved })`

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
- **Description:** `TERM_CLASSES` maps verified Wikidata classes to the eight `TermCategory` values (first class wins when an item appears in several). `buildClassQuery`/`parseClassResults`/`fetchClassCandidates` handle SPARQL; `summaryUrl`/`parseSummary`/`fetchSummary` handle `page/summary` (404, disambiguation or empty extract give `null`).
