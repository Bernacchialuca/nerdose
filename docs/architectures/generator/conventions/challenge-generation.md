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
for (let attempt = 0; attempt < env.GENERATION_MAX_ATTEMPTS; attempt++) {
  const seed = seedFor(env.GENERATOR_SECRET, gameId, date, attempt);
  const gen = generators.get(gameId);
  const payload = gen.generate({ date, seed, history });                // deterministic
  const id = await repo.insertDraft({ gameId, date, number: challengeNumber(date, env.LAUNCH_DATE), payload, seed, generator_version });
  const log = gen.verify(payload, verifyContext);                       // may run code via polyglot
  if (log.ok) { await repo.approve(id, log); await banks.touchLastUsed(payload); return id; }
  await repo.reject(id, log);
}
await failures.upsert({ gameId, date, attempts, lastReason });          // then alert once (alerts-mail)
return null;
```

### `fill` body

For each `game_id` and each date in `[max(today+1, LAUNCH_DATE), today+14]` that has no challenge with `status IN ('approved','published','voided')`, run the pipeline. If tomorrow's date stays empty after all attempts, `UPSERT generation_failures` and claim + send the alert once.

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
- `generate` is deterministic: same `{ date, seed, history }` gives the same payload. A game package never reads clock or randomness by itself.
- A candidate is inserted as `draft` first, then `verify()` runs. It becomes `approved` only if `verify()` returns `ok: true`; the full log is stored in `challenges.verification`. Otherwise it becomes `rejected`.
- `verify` fails if any text is missing a language (`{ es, en }`).
- `challenges.number` is computed with `@nerdose/core` (`date - LAUNCH_DATE + 1`) at insert time. `generator_version` is stored with every challenge.
- A challenge is never regenerated from its seed: the stored `payload` is the source of truth.
- Never generate for `today` or past dates. If a day arrives without a challenge the day is neutral.
- On approval the `last_used_*` of the used bank items are updated in the same transaction.
- If tomorrow's challenge for a game is missing after all attempts: `UPSERT generation_failures` and send the alert once (see `alerts-mail`).
- The `generator` imports only `./generator` (and `./definition` if needed) of the game packages, and makes no HTTP requests to external services.

## Integration with other conventions

- **scheduler-jobs**: `fill` job body.
- **generation-queue**: regeneration uses the same pipeline.
- **code-runner**: `verify` executes code through `@nerdose/polyglot`.
- **alerts-mail**: generation failure alert.
- **orm**: inserts into `challenges` through the repository with `nerdose_generator`.
- **testing**: determinism test per game (same input, same payload).

## Update (REQ-005)

- Optional, generic improvement in `ChallengePublishingRepository.approve`: write `last_used = GREATEST(last_used, date)` instead of `last_used = date`, so that filling an earlier gap does not move the date of a bank item backwards. It does not change Devdle's behavior. Adopted or not in S-023.
- Grep Grid registers as `{ gameId: 'grep-grid', generator, payloadSchema, version: 'grep-grid@1' }`; its `verify` checks are listed in the flow `generacion-diaria`.
