# Reusable Code Index - content

Package `@nerdose/content` (`packages/content`), runtime entry `.` (no network). The import script lives in `scripts/` and is never importable from other packages.

## Dataset (6 items) - see dataset.md
- **loadDataset / Dataset / DatasetError** (packages/content/src/index.ts) - Synchronous, Zod-validated loader of `data/` (`{ terms, timelineFacts, manifest }`); the three files are required (a missing `timeline_facts.json` throws `DatasetError`)
- **termItemSchema / termsFileSchema / timelineFactItemSchema / timelineFactsFileSchema / manifestSchema** (packages/content/src/schema.ts) - Strict Zod schemas of the dataset files
- **TermItem / TimelineFactItem / DatasetManifest / RejectionReason / TimelineRejectionReason / TimelineCategory / DatePrecision** (packages/content/src/schema.ts) - Inferred types
- **REJECTION_REASONS / TIMELINE_REJECTION_REASONS** (packages/content/src/schema.ts) - Closed lists of rejection codes (7 for terms, 8 for facts)
- **TIMELINE_CATEGORIES / DATE_PRECISIONS** (packages/content/src/schema.ts) - Re-exported from `@nerdose/core` (same reference), aligned with the DB enums
- **serializeItems / serializeManifest / sortByWikidataId / compareWikidataId** (packages/content/src/serialize.ts) - Canonical ordering (numeric by `wikidata_id`) and JSON format (2 spaces, trailing newline)

## Import script (9 items) - see import-script.md
- **runImport / InsufficientApprovedError / MIN_APPROVED_TERMS / DEFAULT_MIN_SITELINKS** (packages/content/scripts/import-banks/run.ts) - Orchestration of `import:banks` with `bank` (`terms`, `timeline`, `all`); validates every minimum (terms and facts) before writing
- **buildManifest / countTimelineFacts / buildTimelineParameters / assertTimelineMinimums / InsufficientTimelineFactsError / DEFAULT_TIMELINE_PARAMETERS / writeDataset** (packages/content/scripts/import-banks/manifest.ts, write.ts) - Manifest construction, timeline parameters and minimums (100 approved per v1 category, 3 categories), validated atomic write of the three dataset files
- **evaluateTerms / precheck / mergeByWikidataId / parseExclusions / highestMinSitelinks / normalizeTerm** (packages/content/scripts/import-banks/rules.ts) - Pure acceptance rules (C-50) with a single rejection reason per item
- **selectStatements / resolveDate / firstSentence / precheckFact / evaluateFacts / highestMinSitelinksTimeline** (packages/content/scripts/import-banks/rules.ts) - Pure fact rules (C-51): date resolution without inventing month or day, note from the first Wikipedia sentence, eight rejection codes in fixed order
- **createWikimediaClient / buildUserAgent / WikimediaRequestError** (packages/content/scripts/import-banks/http.ts) - Polite HTTP client: User-Agent, pause, retries with backoff
- **createFileCache / resolveCacheDir** (packages/content/scripts/import-banks/cache.ts) - Resumable on-disk cache outside the repo
- **TERM_CLASSES / buildClassQuery / parseClassResults / fetchClassCandidates** (packages/content/scripts/import-banks/classes.ts, wikidata.ts) - Class to category table and SPARQL access
- **TIMELINE_CLASSES / buildTimelineClassQuery / parseTimelineResults / fetchTimelineCandidates** (packages/content/scripts/import-banks/classes.ts, wikidata.ts) - Class to timeline category and date property table; SPARQL with every date statement, precision, rank and uncertainty
- **summaryUrl / parseSummary / fetchSummary** (packages/content/scripts/import-banks/wikipedia.ts) - Wikipedia REST `page/summary` access
