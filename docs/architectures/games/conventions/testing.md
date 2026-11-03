---
id: testing
display_name: Testing (Vitest + Testcontainers, contenedor compartido)
language: node
description: Unit and integration testing with Vitest; one shared PostgreSQL 16 Testcontainers instance per suite via globalSetup, sequential files, per-file reset, fake clocks for dates and streaks
applies_to: [api, worker, cli, library]
required_by: []
package: vitest
---

# Testing (Node, Vitest)

Unit and integration tests with [Vitest](https://vitest.dev). Integration tests run against a **real PostgreSQL 16** started with [Testcontainers](https://testcontainers.com); infrastructure is never mocked. Hono routes are exercised in process with `app.request()`. Service-local replacement of the catalog default (Fastify `inject()`, NATS and catalog seeds do not apply here). The defining rule is kept: **one shared container for the whole suite, started once in `globalSetup`**.

## When to use

- Every service with logic worth testing (`api`, `generator`).
- **Unit tests** for pure logic (streaks, seeds, day calculation, move reducers): no I/O, no containers.
- **Integration tests** for repositories, transactions, routes, jobs and the `LISTEN`/queue flow: against the real database.
- **Contract tests** for each game: anti-spoiler (ADR-006) and `recomputeStats` equivalence (ADR-011).

## Package

```
vitest                          # runner, fake timers
@testcontainers/postgresql      # real PostgreSQL 16 (dev only)
```

## Architecture: one shared container, started once

- `globalSetup` runs once in the main process: starts **one** `postgres:16-alpine`, creates the three roles (`nerdose_owner`, `nerdose_api`, `nerdose_generator`), applies the migrations of `@nerdose/db` as owner, and `provide()`s the URLs of each role.
- Test files read them with `inject()` and connect; they never start containers.
- `fileParallelism: false`: sequential files over a shared database, deterministic and cheap.

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    environment: 'node',
    globalSetup: ['./test/global-setup.ts'],
    fileParallelism: false,
  },
});
```

```ts
// test/global-setup.ts  (runs once)
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { GlobalSetupContext } from 'vitest/node';
import { migrateAsOwner, createRoles } from '@nerdose/db/testing';

declare module 'vitest' {
  export interface ProvidedContext { ownerUrl: string; apiUrl: string; generatorUrl: string }
}

let container: Awaited<ReturnType<PostgreSqlContainer['start']>>;

export async function setup({ provide }: GlobalSetupContext) {
  container = await new PostgreSqlContainer('postgres:16-alpine').start();
  const urls = await createRoles(container.getConnectionUri());
  await migrateAsOwner(urls.owner);
  provide('ownerUrl', urls.owner);
  provide('apiUrl', urls.api);
  provide('generatorUrl', urls.generator);
}
export async function teardown() { await container?.stop(); }
```

## Data isolation: reset per file

```ts
// test/db/helpers.ts
import { inject } from 'vitest';
import { createDb } from '@nerdose/db';

export function setupTestDb(role: 'api' | 'generator') {
  const owner = createDb(inject('ownerUrl'), { max: 2 });          // for resets and fixtures
  const svc = createDb(inject(role === 'api' ? 'apiUrl' : 'generatorUrl'), { max: 5 });
  return { owner, svc, cleanup: async () => { await owner.sql.end(); await svc.sql.end(); } };
}
// truncateAll(owner): TRUNCATE every table RESTART IDENTITY CASCADE (as owner)
```

1. Every file calls `truncateAll()` in `beforeAll` (starts from empty, regardless of the previous file) and builds its own fixtures with factories (`makeChallenge`, `makePlayer`, `makePlay`).
2. Fixtures are inserted with the **owner** connection; the code under test uses the **service role** connection, so permission errors show up in tests.
3. UNIQUE columns use unique values per test (`randomUUID()`, distinct `(game_id, date)` pairs).
4. Assert on content (a specific row exists), not on global counts.

## Fake clocks

Dates, day changes and streaks MUST be tested with a fake clock, never with the real one.

```ts
import { vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-12-01T23:59:58Z')); });
afterEach(() => vi.useRealTimers());

it('publishes lazily on the first request after 00:00 UTC', async () => {
  vi.setSystemTime(new Date('2026-12-02T00:00:05Z'));
  await app.request('/api/today');
  // expect the approved challenge of 2026-12-02 to be published
});
```

Code under test receives `now` as a parameter or from a single `clock` helper of `@nerdose/core`; it never calls `new Date()` in domain logic.

## Unit tests

```ts
import { describe, it, expect } from 'vitest';
import { nextStreak } from '@nerdose/core';

describe('nextStreak', () => {
  it('keeps the streak across a neutral day', () => {
    expect(nextStreak({ current: 3, lastCompleted: '2026-12-01', prevActiveDay: '2026-12-01' }, '2026-12-03')).toBe(4);
  });
});
```

## HTTP integration tests (api)

```ts
const res = await app.request('/api/games/devdle/today', { headers: { cookie: `nd_pid=${player.id}` } });
expect(res.status).toBe(200);
expect(JSON.stringify(await res.json())).not.toContain(secretWord); // anti-spoiler
```

Mutations in tests send `Content-Type: application/json` and a valid `Origin`. The app is built by a factory that receives the `db` and the config, so each file builds it with the shared container URL.

## Job and queue tests (generator)

Jobs are exercised through their run function with a real `Db` and fake clock; the croner schedule is not waited on (test the expression separately). `LISTEN` flows use a second connection and await the observable row state, never a sleep.

## Rules

- One shared container per suite, started in `globalSetup`. Never start a container in `beforeAll` per file or inside an `it`.
- Do not mock the database or `postgres.js` in integration tests. Real PostgreSQL 16 only.
- Unit tests are for pure functions. If it does I/O, write an integration test.
- Every file resets the database in `beforeAll` and owns its fixtures. No test depends on data left by another file.
- Fixtures use the owner role; the code under test uses `nerdose_api` or `nerdose_generator`.
- Every game has an anti-spoiler contract test: `toPublic(payload)` and every pre-result response must not contain any solution value.
- Streak and day logic is tested with fake clocks, including neutral days, voids and the day change. `recomputeStats` has a property test with random histories against the incremental result.
- A test runs the expected operations (and the forbidden ones) with each database role to catch missing or excessive `GRANT`s.
- No wall-clock sleeps to wait for a condition. Await the observable condition or use `Wait.*` strategies.
- Tests do not touch the network, SMTP or Wikimedia. `notify()` is replaced by a stub that records calls.
- Test files are co-located or under `test/`, suffixed `.test.ts`; `describe` names the unit and `it` the scenario.
- Reset mocks and timers between tests (`vi.clearAllMocks()`, `vi.useRealTimers()`).
- Keep log output quiet with `LOG_LEVEL=silent`.

## Integration with other conventions

- **http-server**: routes are exercised through `app.request()`; the app factory receives its dependencies.
- **orm**: migrations and roles are applied once in `globalSetup`; repositories run against the shared real DB.
- **logging**: silent logger in tests.
- **env-config**: tests build a config object instead of reading `.env` files.
- **alerts-mail**: `notify()` is stubbed; claim and release are verified in the database.
