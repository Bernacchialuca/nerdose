---
id: game-registry
display_name: Registro de juegos (GameDefinition)
language: node
description: Generic game routes over a registry of GameDefinition implementations, with anti-spoiler guarantees
applies_to: [api, library]
required_by: []
package: null
---

# Game Registry (Node)

The `api` serves every game through the `GameDefinition` contract of `@nerdose/core` (ADR-006). Each game is a package `@nerdose/game-<game_id>` and the `api` imports only its `./definition` entry. Routes are generic over a registry; there is no per-game code in `apps/api`. The solution never leaves the server before the Play ends.

## When to use

- Every route and service of `gameplay`, `progress` and `quality` that depends on game logic (`toPublic`, `applyMove`, `result`, `score`, `reduceStats`).
- Adding a game means creating its package and registering it; nothing else in the `api` changes.

## Package

No package is prescribed. The contract and the types come from `@nerdose/core`; the games from `@nerdose/game-*` (`./definition` entry only).

## Structure

```
apps/api/src/
├── games/
│   └── registry.ts                  # game_id -> GameDefinition
└── domain/gameplay/
    ├── gameplay.routes.ts           # /api/games/{game_id}/today/*, generic over the registry
    ├── gameplay.service.ts
    ├── gameplay.repository.ts
    └── gameplay.schema.ts
```

## Configuration

```ts
// apps/api/src/games/registry.ts
import type { GameDefinition, GameId } from '@nerdose/core';
import { devdle } from '@nerdose/game-devdle/definition';
import { grepGrid } from '@nerdose/game-grep-grid/definition';
import { timeline } from '@nerdose/game-timeline/definition';
import { bigO } from '@nerdose/game-big-o/definition';
import { bugHunt } from '@nerdose/game-bug-hunt/definition';

const definitions = [devdle, grepGrid, timeline, bigO, bugHunt] as const;
const byId = new Map<GameId, GameDefinition<any, any, any, any, any, any, any>>(definitions.map((d) => [d.id, d]));

export const games = {
  ids: () => [...byId.keys()],
  get(id: string) {
    const game = byId.get(id as GameId);
    if (!game) throw new AppError('not_found');
    return game;
  },
};
```

## How to use

### Public view and moves

```ts
// apps/api/src/domain/gameplay/gameplay.service.ts
async getToday(gameId: string, player: Player, locale: Locale) {
  const game = games.get(gameId);
  const challenge = this.todayCache.get(game.id);           // see memory-cache
  const play = await this.repo.findPlay(player.id, challenge.id);
  if (play?.status && play.status !== 'in_progress') {
    return game.result(challenge.payload, play.state, locale);   // after the end: solution allowed
  }
  return game.toPublic(challenge.payload, locale);               // before: public view only
}

async move(gameId: string, player: Player, input: { challenge_number: number; move: unknown }) {
  const game = games.get(gameId);
  const parsed = game.moveSchema.safeParse(input.move);
  if (!parsed.success) throw new AppError('invalid_move');
  // inside one transaction: applyMove(p, s, m, now, { isValidWord: wordList.has }) -> isFinished -> result/score -> close Play + stats (see platform-day)
}
```

### Anti-spoiler contract test

Each game has a test that serializes `toPublic(payload)` and every pre-result response and asserts that no value of the solution appears (see `testing`).

## Rules

- The `api` imports only `@nerdose/game-<game_id>/definition`. Never `./client` or `./generator`, and never `@nerdose/polyglot`.
- Routes resolve the game through the registry. No `if (game_id === ...)` or `switch` by game in `apps/api` (ADR-006).
- The `api` never serializes `challenges.payload` in a player response. Before the Play ends it answers `toPublic(payload, locale)`; after, `result(payload, state, locale)`.
- `moveSchema` of the game validates the move; a failed parse answers `422 invalid_move`. A move invalid for the state also answers `invalid_move`; a Devdle word outside the valid list answers `422 not_in_word_list` and does not consume an attempt.
- Win, score, stats and history label come only from the game definition (`isWin`, `score`, `reduceStats`, `historyLabel`); the shell never branches by game.
- `Feedback` returned for a move never contains a solution value that the game has not already revealed by design.
- Adding a game requires only the package and one line in the registry (the `web`/`admin` and `generator` have their own registries).
- A registry entry is validated at startup: unknown or duplicated ids make the process fail to start.
- The `api` never executes code and never imports anything that does.
- Every game has an anti-spoiler contract test; the build fails without it.

## Integration with other conventions

- **validation**: `moveSchema` comes from the game package.
- **http-server**: the gameplay routes are generic over the registry.
- **memory-cache**: today's challenges are served from cache.
- **platform-day**: closing a Play and updating stats share one transaction.
- **testing**: anti-spoiler contract tests per game.

## Update (REQ-004)

- `applyMove(p, s, m, now, ctx: MoveContext)`: `ctx = { isValidWord(word) }` is built by the `api` from `WordList.has`; games that do not need it ignore it.
- `GameGenerator` declares `historySpec = { bank, lastUsedField, recentDays }` and `usedBankItems(payload)`; the `generator` builds a generic history `{ bankItems, recentChallenges }`, with no per-game logic.

## Update (REQ-005)

- `MoveContext = { isValidWord(word): boolean; locale: Locale }`: the `api` adds the locale it already resolved for `result`. A game uses it to localize `Feedback` (Grep Grid: `feedback.definition`); `Feedback` never carries `{ es, en }` (ADR-015). Devdle ignores it.
- `toPublic(p, locale, state?)`: the `api` passes `play.state` only when the Play is `in_progress` (`game.toPublic(challenge.payload, locale, play?.status === 'in_progress' ? play.state : undefined)`); with no Play or a finished Play it passes nothing. With a state, `toPublic` may reveal only what the player already discovered in that Play (Grep Grid: `words[].definition` for the `term_id`s in `found_words`) and never anything about what is still hidden.
- Both changes are additive: games that do not need them keep compiling and behave the same.
- A move may be valid and leave the state unchanged (Grep Grid: `not_a_word`, `already_found`): `applyMove` returns the same state with a `feedback`, the `api` answers `200` and the idempotent `UPDATE plays SET state` still runs.
- The anti-spoiler contract test of a game that uses `state` covers `toPublic` with no state, with the initial state and with intermediate states.

## Update (REQ-007)

- `GameDefinition.culprits(p): Culprit[]` (`Culprit = { kind: 'term' | 'timeline_fact'; id; label }`) lists the bank items a challenge references, so the admin can pick the culprit when voiding it. Games with no bank return `[]`. The `api` calls it generically through the registry.

## Update (REQ-008)

- `GameDefinition.bankUsage: BankUsage | null`, with `BankUsage = { bank: 'terms' | 'timeline_facts'; lastUsedField: string; windowDays: number; itemsPerChallenge: number }`. Values: Devdle `terms`/`last_used_devdle`/365/1, Grep Grid `terms`/`last_used_grep`/30/8, Timeline `timeline_facts`/`last_used`/90/5, Big O and Bug Hunt `null`.
- The `api` builds the content stock (`GET /api/admin/content/stock`) from `bankUsage` through the registry, with no per-game constants. A test in each game package asserts that `bankUsage` matches the generator's `historySpec`.
