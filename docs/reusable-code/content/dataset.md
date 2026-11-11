# Dataset

## loadDataset / Dataset / DatasetError
- **Location:** packages/content/src/index.ts
- **Description:** Reads `terms.json`, `timeline_facts.json` and `manifest.json` (all required, in that order), validates them with Zod and throws `DatasetError` (`file` + Spanish message with the Zod issues) on any problem. No network.
- **Signature:** `loadDataset(dataDir: string | URL = <package>/data/): Dataset`; `Dataset { terms: TermItem[]; timelineFacts: TimelineFactItem[]; manifest: DatasetManifest }`; `DatasetError extends Error { file: string }`
- **Usage:** `const ds = loadDataset(); ds.manifest.dataset_version`

## Schemas, types and constants
- **Location:** packages/content/src/schema.ts
- **Description:** `termItemSchema` (exactly the 8 ADR-016 fields; `approved` requires `^[A-Z]{4,12}$`, four non-empty texts and `rejection_reason: null`; `rejected` requires a reason), `termsFileSchema` (unique `wikidata_id`, unique `term` among approved), `timelineFactItemSchema` (`rejection_reason` is `TIMELINE_REJECTION_REASONS` or null; `approved` requires non-empty `note.es`/`note.en` and a real `event_date` coherent with `date_precision`: `year` ends in `-01-01`, `month` in `-01`), `timelineFactsFileSchema` (unique `wikidata_id`), `manifestSchema` (`counts.terms` + `counts.timeline_facts`, `parameters.timeline { min_sitelinks, min_approved_per_category, min_categories, categories_v1, classes[{ wikidata_class, category, date_property }] }`). Types `TermItem`, `TimelineFactItem`, `DatasetManifest`, `RejectionReason`, `TimelineRejectionReason`, `TimelineCategory`, `DatePrecision`; constants `REJECTION_REASONS`, `TIMELINE_REJECTION_REASONS`, and `TIMELINE_CATEGORIES` / `DATE_PRECISIONS` (re-exported from `@nerdose/core`).
- **Usage:** `termsFileSchema.parse(json)`

## serializeItems / serializeManifest / sortByWikidataId / compareWikidataId
- **Location:** packages/content/src/serialize.ts
- **Description:** Canonical file format: items ordered numerically by `wikidata_id` (`Q9` < `Q10`), `JSON.stringify(..., null, 2) + "\n"`. `sortByWikidataId` does not mutate.
- **Signature:** `serializeItems<T extends { wikidata_id: string }>(items: readonly T[]): string`; `serializeManifest(manifest: DatasetManifest): string`
- **Usage:** `writeFileSync(path, serializeItems(terms))`
