---
id: challenge-generation
display_name: Generacion y verificacion de desafios
language: node
description: Deterministic seed with HMAC-SHA256 and pure-rand, per-candidate pipeline, GameGenerator registry, attempts and generation failure alerts
applies_to: [worker]
required_by: []
package: pure-rand
---

# Challenge Generation (Node, pure-rand)

How the `generator` produces challenges (ADR-006, ADR-007): a deterministic seed derived from a secret, the `GameGenerator` of each game package, verification before approval and an alert if tomorrow's challenge cannot be produced. The `generator` is the only process that inserts into `challenges`, `terms` and `timeline_facts`.

## When to use

- The `fill` job and the regeneration queue; both use the same pipeline.
- Any logic that creates or approves challenges.

## Package

```
pure-rand          # xoroshiro128+ PRNG
node:crypto        # createHmac (built in)
```

## Structure

```
apps/generator/src/
├── games/registry.ts                          # game_id -> GameGenerator (./generator entry only)
└── domain/challenge-publishing/
    ├── generate.ts                            # pipeline per candidate
    ├── seed.ts                                # HMAC seed + PRNG factory
    ├── fill.service.ts                        # dates and games to fill
    └── challenge-publishing.repository.ts
```

## Configuration

```ts
// apps/generator/src/domain/challenge-publishing/seed.ts
import { createHmac } from 'node:crypto';
import { xoroshiro128plus } from 'pure-rand';

export function seedFor(secret: string, gameId: string, date: string, attempt: number): Uint8Array {
  return createHmac('sha256', secret).update(`${gameId}:${date}:${attempt}`).digest();
}

export function rngFrom(seed: Uint8Array) {
  const n = new DataView(seed.buffer, seed.byteOffset).getInt32(0);
  return xoroshiro128plus(n);
}
```

## How to use

### Pipeline per candidate

```ts
const spec = generator.historySpec;
const window = historyWindow(date, spec);                               // [D - recentDays, D + aheadDays], excluding D
const history = {
  bankItems: await repo.bankItems(spec),                                // [] when spec.bank is null (big-o, bug-hunt)
  recentChallenges: await repo.recentChallenges(gameId, window.from, window.to, payloadSchema, window.exclude),
};
for (let attempt = 0; attempt < env.GENERATION_MAX_ATTEMPTS; attempt++) {
  const seed = seedFor(env.GENERATOR_SECRET, gameId, date, attempt);
  const payload = payloadSchema.parse(generator.generate({ date, seed, history }));   // deterministic
  const id = await repo.insertDraft({ gameId, date, number: challengeNumber(date, env.LAUNCH_DATE), payload, seed, generator_version });
  const log = await generator.verify(payload, history);                 // may be async: runs code via polyglot in big-o and bug-hunt
  if (log.ok) { await repo.approve(id, log); await banks.touchLastUsed(payload); return id; }
  await repo.reject(id, log);
}
await failures.upsert({ gameId, date, attempts, lastReason });          // the row IS the alert (ADR-017)
return null;
```

### `fill` body

For each `game_id` and each date in `[max(today+1, LAUNCH_DATE), today+14]` that has no challenge with `status IN ('approved','published','voided')`, run the pipeline. If tomorrow's date stays empty after all attempts, `UPSERT generation_failures` (the row is the alert, ADR-017; nothing is sent).

> REQ-004: if `approve` collides with `uq_challenges_active_game_date`, the candidate becomes `rejected` (`verification.reason = 'duplicate_active'`) and the date counts as covered, with no error. `generation_failures` and the alert (C-49) arrive in FG-7: until then an exhausted date logs `ChallengeGenerationFailed` and counts in `job_runs.summary.missing`.

### Registry

```ts
// apps/generator/src/games/registry.ts
import { generator as devdle } from '@nerdose/game-devdle/generator';
// ... one import per game; only the ./generator entry (and ./definition if needed to validate)
```

## Rules

- The seed is `HMAC-SHA256(GENERATOR_SECRET, "{game_id}:{date}:{attempt}")` with `date` as `YYYY-MM-DD`, feeding `pure-rand` (xoroshiro128+). `Math.random()` and the current time are never used for generation.
- `GENERATOR_SECRET` exists only in the `generator` environment and is never logged.
- `GENERATION_MAX_ATTEMPTS` defaults to 20 and is configurable by env; `attempt` goes from 0 to `GENERATION_MAX_ATTEMPTS - 1`.
- `generateForDate` accepts `firstAttempt` and a `regenerate` mode (REQ-008). Regeneration starts at `max(challenges.attempt)` for the (`game_id`, `date`) + 1, tries up to `GENERATION_MAX_ATTEMPTS` candidates (never repeating a seed) and returns the verified candidate as `draft` instead of approving it; the queue worker performs the atomic replacement.
- `generate` is deterministic: same `{ date, seed, history }` gives the same payload. A game package never reads clock or randomness by itself.
- A candidate is inserted as `draft` first, then `verify()` runs. It becomes `approved` only if `verify()` returns `ok: true`; the full log is stored in `challenges.verification`. Otherwise it becomes `rejected`.
- `verify` fails if any text is missing a language (`{ es, en }`).
- `verify` may return `VerificationLog` or `Promise<VerificationLog>`; `generateForDate` always `await`s it. A failure of the code runner (timeout, compile error, missing toolchain) is a failed check of the candidate, never an exception of the job.
- The history of a date `D` is read once, before the attempts: `recentChallenges` are the challenges of the game with `status IN ('approved','published','voided')` and `date` in `[D - recentDays, D + aheadDays]`, **excluding the row of `D`** (`historyWindow` in `generate.ts`). `aheadDays` is optional (default 0). Excluding `D` keeps the old `approved` challenge of a regeneration from counting against its replacement.
- `challenges.number` is computed with `@nerdose/core` (`date - LAUNCH_DATE + 1`) at insert time. `generator_version` is stored with every challenge.
- A challenge is never regenerated from its seed: the stored `payload` is the source of truth.
- Never generate for `today` or past dates. If a day arrives without a challenge the day is neutral.
- On approval the `last_used_*` of the used bank items are updated in the same transaction with `GREATEST(last_used_*, date)`, so filling an earlier gap never moves a date backwards.
- If tomorrow's challenge for a game is missing after all attempts: `UPSERT generation_failures` (one row per game and date, with `attempts` and `last_reason`). That row is the alert: the admin shows it in Próximos desafíos; nothing is sent (ADR-017).
- The `generator` imports only `./generator` (and `./definition` if needed) of the game packages, and makes no HTTP requests to external services.
- At startup, before the first jobs, the `generator` calls `checkToolchains()` of `@nerdose/polyglot` and logs a `warn` (`Toolchain missing at startup`, with `toolchain` and `required`) for each missing toolchain among Go >= 1.25 and JDK 21. It never refuses to start: a missing toolchain shows up as `run_<lang>: toolchain_missing` in the rejected candidates.

## Integration with other conventions

- **scheduler-jobs**: `fill` job body.
- **generation-queue**: regeneration uses the same pipeline.
- **code-runner**: `verify` executes code through `@nerdose/polyglot`.
- **Alerts (ADR-017)**: the `generation_failures` row is the generation failure alert.
- **orm**: inserts into `challenges` through the repository with `nerdose_generator`.
- **testing**: determinism test per game (same input, same payload).

## Update (REQ-005)

- Optional, generic improvement in `ChallengePublishingRepository.approve`: write `last_used = GREATEST(last_used, date)` instead of `last_used = date`, so that filling an earlier gap does not move the date of a bank item backwards. It does not change Devdle's behavior. **Adopted in S-023.**
- Grep Grid registers as `{ gameId: 'grep-grid', generator, payloadSchema, version: 'grep-grid@1' }`; its `verify` checks are listed in the flow `generacion-diaria`.

## Update (REQ-006)

- `ChallengePublishingRepository` is multi-bank: a `BANKS` map (`terms`, `timeline_facts`) replaces `LAST_USED_COLUMNS`. `bankItems(spec)` selects the `approved` items of the spec's bank, and `approve` receives `ApproveOptions.bank` and updates `last_used = GREATEST(last_used, D)` only in that bank's table. Approving a Timeline challenge never touches `terms`. **Adopted in S-028.**
- Timeline: `historySpec = { bank: 'timeline_facts', lastUsedField: 'last_used', recentDays: 90 }`, `version: 'timeline@1'`.

## Update (REQ-009)

- `GameGenerator.verify` may be asynchronous: `generateForDate` does `await generator.verify(payload, history)`. Synchronous generators (Devdle, Grep Grid, Timeline) do not change. **Adopted in S-042.**
- `HistorySpec.aheadDays?: number` (default 0). `historyWindow(date, spec)` returns `{ from: D - recentDays, to: D + aheadDays, exclude: D }` and `ChallengePublishingRepository.recentChallenges(gameId, from, to, payloadSchema, excludeDate)` applies it. Games with a bank do not need `aheadDays` (`GREATEST(last_used_*, D)` already reflects approved challenges in the future); Big O has no bank and uses it so that filling an intermediate gap or regenerating cannot repeat a recipe approved for a later day. **Adopted in S-042.**
- Big O registers as `{ gameId: 'big-o', generator, payloadSchema, version: 'big-o@1' }` with `historySpec = { bank: null, lastUsedField: '', recentDays: 30, aheadDays: 30 }` and `usedBankItems = () => []`; `approve` touches no bank. Its payload carries `date` (optional in the schema, always set by `generate`) because `verify` has no date argument and the variety checks need it. The `verify` checks (`texts_bilingual`, `code_shape`, `variety_recipe`, `variety_answer`, `run_js`, `run_go`, `run_java`, `counts_agree`, `counts_in_range`, `example_matches_run`, `fit_quality`, `fit_unambiguous`, `fit_matches_answer`) are listed in the flow `generacion-diaria`. **Adopted in S-045.**
- Startup `warn` for missing toolchains (`apps/generator/src/infra/toolchains/warn-missing-toolchains.ts`). **Adopted in S-045.**

## Update (REQ-010)

- Bug Hunt registers as `{ gameId: 'bug-hunt', generator, payloadSchema, version: 'bug-hunt@1' }` with `historySpec = { bank: null, lastUsedField: '', recentDays: 60, aheadDays: 60 }` and `usedBankItems = () => []`; `approve` touches no bank. Its payload carries `date` (first key) because `verify` has no date argument and `variety_combo` needs it. **Adopted in S-050.**
- `verify` runs 5 checks in memory (`texts_bilingual`, `code_shape`, `lines_consistent`, `tests_consistent`, `variety_combo`) and, only if all pass, 6 executions: the correct version (`bug_line` replaced by `fix[lang]`) and the mutant in JS, Go and Java, languages in parallel and the two variants of each language in sequence (at most 3 subprocesses per candidate). Then `correct_agrees` and `mutant_agrees`. The checks are listed in the flow `generacion-diaria`. **Adopted in S-050.**
- `verification.reason` is the `name` of the first failing check, except `run_<variant>_<lang>: <kind>` (`run_mutant_go: timeout`) and `tests_consistent: equivalent_mutant | not_enough_passing`. When `generate` finds no valid candidate it still returns one so that `verify` rejects it with its reason; after `GENERATION_MAX_ATTEMPTS` the failure is recorded as for any game (ADR-017).
