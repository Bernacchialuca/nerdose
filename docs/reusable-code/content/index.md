# Reusable Code Index - content

Package `@nerdose/content` (`packages/content`), runtime entry `.` (no network). The import script lives in `scripts/` and is never importable from other packages.

## Dataset (5 items) - see dataset.md
- **loadDataset / Dataset / DatasetError** (packages/content/src/index.ts) - Synchronous, Zod-validated loader of `data/` (`{ terms, timelineFacts, manifest }`); a missing `timeline_facts.json` is an empty list
- **termItemSchema / termsFileSchema / timelineFactItemSchema / timelineFactsFileSchema / manifestSchema** (packages/content/src/schema.ts) - Strict Zod schemas of the dataset files
- **TermItem / TimelineFactItem / DatasetManifest / RejectionReason** (packages/content/src/schema.ts) - Inferred types
- **REJECTION_REASONS / TIMELINE_CATEGORIES / DATE_PRECISIONS** (packages/content/src/schema.ts) - Closed value lists aligned with the DB enums
- **serializeItems / serializeManifest / sortByWikidataId / compareWikidataId** (packages/content/src/serialize.ts) - Canonical ordering (numeric by `wikidata_id`) and JSON format (2 spaces, trailing newline)

## Import script (6 items) - see import-script.md
- **runImport / InsufficientApprovedError / MIN_APPROVED_TERMS / DEFAULT_MIN_SITELINKS** (packages/content/scripts/import-banks/run.ts) - Orchestration of `import:banks`; fails before writing when approved terms are below the minimum
- **evaluateTerms / precheck / mergeByWikidataId / parseExclusions / highestMinSitelinks / normalizeTerm** (packages/content/scripts/import-banks/rules.ts) - Pure acceptance rules (C-50) with a single rejection reason per item
- **createWikimediaClient / buildUserAgent / WikimediaRequestError** (packages/content/scripts/import-banks/http.ts) - Polite HTTP client: User-Agent, pause, retries with backoff
- **createFileCache / resolveCacheDir** (packages/content/scripts/import-banks/cache.ts) - Resumable on-disk cache outside the repo
- **TERM_CLASSES / buildClassQuery / parseClassResults / fetchClassCandidates** (packages/content/scripts/import-banks/classes.ts, wikidata.ts) - Class to category table and SPARQL access
- **summaryUrl / parseSummary / fetchSummary** (packages/content/scripts/import-banks/wikipedia.ts) - Wikipedia REST `page/summary` access
