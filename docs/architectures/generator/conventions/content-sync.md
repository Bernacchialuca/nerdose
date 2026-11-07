---
id: content-sync
display_name: Carga de bancos desde el dataset (sync_banks)
language: node
description: Idempotent UPSERT of the versioned dataset of @nerdose/content into terms and timeline_facts, without any external request
applies_to: [worker]
required_by: []
package: "@nerdose/content"
---

# Content Sync (Node, @nerdose/content)

The content banks (`terms`, `timeline_facts`) come from a dataset versioned in the repo and loaded by the `generator` at startup with the `sync_banks` job (ADR-016). No deployed service queries Wikimedia; the dataset is generated offline by the `import:banks` script and committed.

## Update (REQ-004)

- Only `terms` is loaded until FG-5; `timeline_facts.json` missing is an empty list.
- A new `rejected` item whose `term` does not match `^[A-Z]{4,12}$` or already exists is not inserted and counts in `summary.skipped`. If the `wikidata_id` is already in the database, the `approved -> rejected` rule still applies.
- Exclusion list: `packages/content/data/exclusions.txt`.

## When to use

- The `sync_banks` job of the `generator`.
- Never in `api`, and never from the offline scripts at runtime.

## Package

```
@nerdose/content      # data/terms.json, data/timeline_facts.json, data/manifest.json, import:banks script
```

## Structure

```
packages/content/
├── data/{terms.json, timeline_facts.json, manifest.json}
├── src/schema.ts                 # Zod schemas of the dataset files
└── scripts/import-banks.ts       # offline only, never imported by runtime code
apps/generator/src/domain/content-banks/
├── content-banks.repository.ts
└── sync-banks.service.ts
```

## How to use

```ts
// apps/generator/src/domain/content-banks/sync-banks.service.ts
import { loadDataset } from '@nerdose/content';     // parses with Zod, throws on invalid

export async function syncBanks(deps: Deps) {
  const ds = loadDataset();
  const summary = await deps.db.transaction(async (tx) => {
    return banks.upsertAll(tx, ds);                  // INSERT ... ON CONFLICT (wikidata_id) DO UPDATE
  });
  return { dataset_version: ds.manifest.dataset_version, ...summary }; // inserted, updated, unchanged, kept_rejected
}
```

### UPSERT rules

| Case | Result |
|---|---|
| New `wikidata_id` | Inserted with the dataset status |
| In database `rejected` | Unchanged (stays `rejected`) |
| In database `approved`, dataset `rejected` | Becomes `rejected` with its `rejection_reason` |
| In database but not in dataset | Not deleted |
| Any case | `last_used_devdle`, `last_used_grep` and `last_used` are never touched |

## Rules

- `sync_banks` runs at startup (before `fill`) under advisory lock `sync_banks` and records `job_runs` with `summary` `{ dataset_version, inserted, updated, unchanged, kept_rejected }`.
- The load is `INSERT ... ON CONFLICT (wikidata_id) DO UPDATE` with the table above and is idempotent.
- The dataset is validated with Zod on load; an invalid file fails the job, not a partial load.
- `api` and `generator` never request `*.wikidata.org`, `*.wikipedia.org` or `*.wiktionary.org`. Only the offline scripts `import:banks` and `build:wordlist` may, and runtime code never imports them.
- The `generator` is the only process that writes `terms` and `timeline_facts` (the `api` can only update `status` and `rejection_reason` through its role).
- Bank items rejected by the `api` after a void stay `rejected` across syncs.
- Deploying a new dataset means a commit and a deploy; there is no automatic expansion of banks.
- Dataset files stay ordered by `wikidata_id` with 2-space indentation (diff-friendly); this is verified by the content package tests.

## Integration with other conventions

- **scheduler-jobs**: job registration, lock and `job_runs`.
- **orm**: UPSERT written with Drizzle `onConflictDoUpdate` or raw SQL where needed.
- **validation**: dataset schemas with Zod.
- **testing**: idempotency test (two runs, same state) and `rejected` precedence.
