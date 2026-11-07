---
id: dataset-format
display_name: Dataset de bancos y script de importacion
language: node
description: Versioned banks dataset format in packages/content/data and the offline import:banks script, with acceptance rules, minimums and Wikimedia usage limits
applies_to: [library]
required_by: []
package: "@nerdose/content"
---

# Dataset Format and Import Script (Node, @nerdose/content)

The contents of the banks `terms` and `timeline_facts` are imported **offline** and versioned in the repo (ADR-016). No deployed service queries Wikimedia. This convention defines the dataset files and the `import:banks` script (and the base word list of Devdle produced by `build:wordlist`); loading the dataset into the database is `content-sync`.

## When to use

- Changing the dataset schema or the import script.
- Regenerating the dataset (manual, in development).

## Package

```
zod                  # dataset schemas, validated on load and by the script
tsx                  # runs the scripts
```

Wikidata SPARQL and the Wikipedia REST summary API are consumed with the built-in `fetch`, only from the scripts.

## Structure

```
packages/content/
├── package.json              # @nerdose/content; scripts: import:banks
├── LICENSE-DATA.md           # CC BY-SA 4.0 (Wikipedia texts) and CC0 (Wikidata) attribution
├── data/
│   ├── terms.json
│   ├── timeline_facts.json
│   └── manifest.json
├── src/
│   ├── index.ts              # loadDataset() - runtime entry (no network)
│   └── schema.ts             # Zod schemas of the three files
└── scripts/
    └── import-banks.ts       # offline only, never imported by runtime code
packages/games/devdle/
├── scripts/build-wordlist.ts # offline only
└── wordlist/words.txt        # committed artifact
```

## Configuration

### Item formats

`terms.json` items have exactly: `wikidata_id`, `term`, `category`, `definition` (`{es,en}`), `summary` (`{es,en}`), `sitelinks`, `status` (`approved` | `rejected`), `rejection_reason` (string or `null`).

`timeline_facts.json` items have exactly: `wikidata_id`, `label`, `category`, `event_date` (`YYYY-MM-DD`), `date_precision`, `note` (`{es,en}`), `sitelinks`, `status`, `rejection_reason`.

`manifest.json`: `dataset_version` (`YYYY.MM.DD`, plus `-N` when several are generated the same day), `generated_at` (ISO 8601), `min_sitelinks`, counts per bank and category, and the parameters used.

### Environment

`WIKIMEDIA_CONTACT` (development only) goes in the `User-Agent` header: `nerdose-content/<dataset_version> (<WIKIMEDIA_CONTACT>)`.

## How to use

```bash
pnpm --filter @nerdose/content import:banks
```

1. Query Wikidata SPARQL according to the class-to-category mapping (a table in code).
2. Fetch the first paragraph of Wikipedia (`/api/rest_v1/page/summary/{title}`) in `es` and `en`.
3. Apply the acceptance rules (C-50, C-51) and mark each item `approved` or `rejected` with a `rejection_reason`.
4. Validate with the Zod schemas, check the minimums and write the three files.
5. Review the diff and commit; deploying a new dataset is a commit plus a deploy.

`build:wordlist` (in the `devdle` package) produces `wordlist/words.txt` as ENABLE filtered (A-Z, 4-12 letters) united with English A-Z labels of computing concepts from Wikidata.

## Rules

- Only `import:banks` and `build:wordlist` may request `*.wikidata.org`, `*.wikipedia.org` or `*.wiktionary.org`, and runtime code never imports them. `api` and `generator` never request those domains.
- Every request sends the `User-Agent` above.
- JSON files are written ordered by `wikidata_id`, 2-space indentation, one item per block (diff-friendly); package tests verify it.
- `import:banks` exits with an error if there are fewer than 500 `approved` `terms` in total (not per category; `TermCategory` is the Devdle set) and prints the counts. `timeline_facts` is optional until FG-5 (its minimum of 100 applies from then); a missing `timeline_facts.json` is read as an empty list.
- The exclusion list lives in `packages/content/data/exclusions.txt`.
- `words.txt` has one word per line, uppercase, A-Z, 4-12 letters, alphabetically sorted, no duplicates.
- `LICENSE-DATA.md` is always present with the CC BY-SA 4.0 and CC0 attribution.
- Items are never curated by hand; sorting is by rule. A wrong text is handled by report, void and `rejected`, and `sync_banks` never revives it.
- The runtime entry `loadDataset()` parses with Zod and throws on invalid input; it makes no network calls.

## Integration with other conventions

- **content-sync**: the `generator` loads the dataset into the database.
- **testing**: schema, ordering, minimum-count and manifest tests; the script is tested with recorded fixtures, not live requests.
- **validation**: Zod schemas.
