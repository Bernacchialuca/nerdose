---
id: memory-cache
display_name: Caches en memoria de la api
language: node
description: In-process caches of today's challenges and of the Devdle valid word list, reloaded on startup, day change and void
applies_to: [api]
required_by: []
package: null
---

# In-Memory Caches (Node)

The `api` keeps two process-local caches (ADR-012): today's challenges and the valid word list of Devdle. There is no Redis and no cache library. This is valid only because there is a single `api` instance in v1. Replaces the catalog `cache` convention (ioredis), which is not used.

## When to use

- The hot path of player routes: serving today's challenge and validating Devdle guesses without a query per request.
- Not for per-player data: that is read from the database.

## Package

No package is prescribed. Plain `Map` and `Set` owned by a service class.

## Structure

```
apps/api/src/infra/cache/
├── today-cache.ts       # Map<game_id, Challenge>
└── word-list.ts         # Set<string>
packages/games/devdle/wordlist/words.txt   # base list (build artifact, committed)
```

## Configuration

```ts
// apps/api/src/infra/cache/today-cache.ts
export class TodayCache {
  private map = new Map<GameId, Challenge>();
  constructor(private readonly repo: ChallengesReadRepository, private readonly clock: Clock) {}

  async reload() {
    const rows = await this.repo.findTodayVisible(today(this.clock.now())); // published or voided
    this.map = new Map(rows.map((c) => [c.game_id, c]));
  }
  get(gameId: GameId) {
    const c = this.map.get(gameId);
    if (!c) throw new AppError('no_challenge_today');
    return c;
  }
}
```

```ts
// apps/api/src/infra/cache/word-list.ts
import baseWords from '@nerdose/game-devdle/wordlist';   // words.txt as string[] (base list)

export class WordList {
  private set = new Set<string>(baseWords);
  async reload(repo: TermsReadRepository) {
    const terms = await repo.findApprovedTerms();
    this.set = new Set([...baseWords, ...terms.map((t) => t.term.toUpperCase())]);
  }
  has(word: string) { return this.set.has(word.toUpperCase()); }
}
```

## How to use

| Cache | Content | Reloaded |
|---|---|---|
| Today's challenges | `Map<game_id, challenge>` (`published` or `voided` of `today`) | On startup, on day change, after `POST /api/admin/challenges/{challenge_id}/void` |
| Valid word list | `Set<string>` = base file of `devdle` UNION `terms.term` with `status='approved'` | On startup and on day change |

```ts
// after voiding, inside the void service, once the transaction committed
await this.todayCache.reload();
```

## Rules

- The caches are reloaded on startup, on day change (see `platform-day`) and, for challenges, after a void.
- The valid word list is the union of the base file and the approved `terms`, so every possible answer is a valid guess. It is never sent to the client nor exposed by any route.
- Cached challenges contain the full `payload`: they are never serialized to a player response (see `game-registry`).
- Cache loading failures at startup make the process fail; failures on reload keep the previous content and log at `error`.
- Caches are read-only for handlers; only the publishing and void services trigger reloads.
- Keys and values are plain domain data. No cache of per-player data in memory.
- Moving to more than one instance requires replacing these caches and the rate limiter store first (ADR-012).
- Rate limit counters live in the limiter store of `security`, not here.

## Integration with other conventions

- **platform-day**: reloads on day change.
- **game-registry**: reads today's challenge through the cache.
- **security**: separate in-memory store for rate limiting.
- **orm**: reads through read repositories (`challenges`, `terms`).
